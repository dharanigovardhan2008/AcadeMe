import os
import sys
import json
import time
import random
import threading
import traceback
import urllib.request

from datetime import datetime, timedelta, timezone
from http.server import HTTPServer, BaseHTTPRequestHandler

import firebase_admin
from firebase_admin import credentials, firestore, messaging


# ============================================================
# ACADeMe NOTIFICATION SERVICE
# ============================================================

APP_NAME = "AcadeMe"
APP_URL = "https://acade-me.vercel.app"
ATTENDANCE_URL = f"{APP_URL}/attendance"

IST = timezone(timedelta(hours=5, minutes=30))

POLL_INTERVAL = 15
HEALTH_PORT = int(os.environ.get("PORT", "8080"))

print("=" * 60)
print("🚀 AcadeMe Notification Service")
print("=" * 60)


# ============================================================
# FIREBASE INITIALIZATION
# ============================================================

def initialize_firebase():
    print("\n🔥 Initializing Firebase...")

    raw_credentials = os.environ.get("GOOGLE_CREDENTIALS_JSON")

    if not raw_credentials:
        print("❌ GOOGLE_CREDENTIALS_JSON is missing.")
        sys.exit(1)

    try:
        credentials_dict = json.loads(raw_credentials)
    except json.JSONDecodeError as exc:
        print("❌ GOOGLE_CREDENTIALS_JSON contains invalid JSON.")
        print(exc)
        sys.exit(1)

    try:
        firebase_credential = credentials.Certificate(credentials_dict)

        firebase_admin.initialize_app(
            firebase_credential
        )

        database = firestore.client()

        print("✅ Firebase initialized")
        print(
            f"   Project: "
            f"{credentials_dict.get('project_id', 'unknown')}"
        )

        return database

    except Exception as exc:
        print("❌ Firebase initialization failed:")
        print(type(exc).__name__, exc)
        traceback.print_exc()
        sys.exit(1)


db = initialize_firebase()


# ============================================================
# SERVICE STATE
# ============================================================

state_lock = threading.Lock()

service_stats = {
    "started_at": datetime.now(IST).strftime(
        "%Y-%m-%d %H:%M:%S"
    ),
    "last_check": None,
    "last_notification": None,
    "notifications_sent": 0,
    "successful_deliveries": 0,
    "failed_deliveries": 0,
    "invalid_tokens_removed": 0,
    "total_tokens": 0,
}


# ============================================================
# PROCESSED DOCUMENT TRACKING
# ============================================================

known_ids = {
    "updates": set(),
    "resources": set(),
    "notifications": set(),
    "attendance_reminders": set(),
    "admin_broadcasts": set(),
}

known_ids_lock = threading.Lock()


# ============================================================
# ATTENDANCE REMINDER CONTENT
# ============================================================

ATTENDANCE_REMINDER_TITLES = [
    "👀 Did you go to class today?",
    "🎒 Bunk check-in!",
    "🚨 Attendance alert",
    "📚 Class detective here",
    "🕵️ Attendance check!",
]

ATTENDANCE_REMINDER_BODIES = [
    "Update today's attendance in AcadeMe.",
    "Be honest 😄 Did you attend class? Update your attendance.",
    "Your attendance percentage is waiting. Update it now!",
    "Professor took attendance. Don't forget to log it 📝",
    "Quick check: update today's attendance in AcadeMe.",
    "Your attendance tracker needs some love ❤️",
    "Even bunking needs to be recorded 😅 Update your attendance.",
    "This is your friendly reminder to update today's attendance.",
]


# ============================================================
# TOKEN HELPERS
# ============================================================

def get_all_tokens():
    """
    Collect FCM tokens from:
      1. fcm_tokens collection
      2. users.fcmToken

    Duplicate tokens are removed.
    """

    tokens = set()

    # --------------------------------------------------------
    # fcm_tokens collection
    # --------------------------------------------------------

    try:
        documents = db.collection("fcm_tokens").stream()

        for document in documents:
            data = document.to_dict() or {}

            token = data.get("token")

            if token and isinstance(token, str):
                token = token.strip()

                if token:
                    tokens.add(token)

    except Exception as exc:
        print(
            f"⚠️ Error reading fcm_tokens: "
            f"{type(exc).__name__}: {exc}"
        )

    # --------------------------------------------------------
    # users collection
    # --------------------------------------------------------

    try:
        documents = db.collection("users").stream()

        for document in documents:
            data = document.to_dict() or {}

            token = data.get("fcmToken")
            notifications_enabled = data.get(
                "notificationsEnabled",
                True
            )

            if (
                token
                and isinstance(token, str)
                and notifications_enabled is not False
            ):
                token = token.strip()

                if token:
                    tokens.add(token)

    except Exception as exc:
        print(
            f"⚠️ Error reading users: "
            f"{type(exc).__name__}: {exc}"
        )

    with state_lock:
        service_stats["total_tokens"] = len(tokens)

    return list(tokens)


# ============================================================
# INVALID TOKEN CLEANUP
# ============================================================

def remove_invalid_token(token):
    """
    Remove an expired/unregistered FCM token from Firestore.
    """

    removed = False

    # --------------------------------------------------------
    # fcm_tokens
    # --------------------------------------------------------

    try:
        query = (
            db.collection("fcm_tokens")
            .where("token", "==", token)
            .stream()
        )

        for document in query:
            try:
                document.reference.delete()
                removed = True
                print(
                    f"🧹 Removed invalid token "
                    f"from fcm_tokens: {document.id}"
                )
            except Exception as exc:
                print(
                    f"⚠️ Could not delete token document "
                    f"{document.id}: {exc}"
                )

    except Exception as exc:
        print(
            f"⚠️ Invalid-token cleanup error "
            f"(fcm_tokens): {exc}"
        )

    # --------------------------------------------------------
    # users
    # --------------------------------------------------------

    try:
        query = (
            db.collection("users")
            .where("fcmToken", "==", token)
            .stream()
        )

        for document in query:
            try:
                document.reference.update({
                    "fcmToken": firestore.DELETE_FIELD
                })

                removed = True

                print(
                    f"🧹 Removed invalid fcmToken "
                    f"from user: {document.id}"
                )

            except Exception as exc:
                print(
                    f"⚠️ Could not clean user "
                    f"{document.id}: {exc}"
                )

    except Exception as exc:
        print(
            f"⚠️ Invalid-token cleanup error "
            f"(users): {exc}"
        )

    if removed:
        with state_lock:
            service_stats[
                "invalid_tokens_removed"
            ] += 1


# ============================================================
# CHECK FCM ERROR
# ============================================================

def is_invalid_token_error(error):
    """
    Detect errors that mean the FCM registration token
    is no longer usable.
    """

    error_text = str(error).lower()

    invalid_messages = [
        "registration-token-not-registered",
        "unregistered",
        "invalid-argument",
        "not-found",
        "registration token is not a valid",
    ]

    return any(
        message in error_text
        for message in invalid_messages
    )


# ============================================================
# BUILD WEB PUSH MESSAGE
# ============================================================

def build_web_message(
    title,
    body,
    token,
    url=APP_URL,
    notification_type="general",
):
    return messaging.Message(

        notification=messaging.Notification(
            title=title,
            body=body,
        ),

        data={
            "type": notification_type,
            "url": url,
        },

        webpush=messaging.WebpushConfig(

            headers={
                "Urgency": "high",
            },

            notification=messaging.WebpushNotification(
                title=title,
                body=body,

                icon="/icon-192.png",
                badge="/badge-96.png",

                tag=(
                    "acade-me-"
                    + notification_type
                    + "-"
                    + str(int(time.time()))
                ),

                renotify=True,

                data={
                    "type": notification_type,
                    "url": url,
                },
            ),

            fcm_options=messaging.WebpushFCMOptions(
                link=url
            ),
        ),

        token=token,
    )


# ============================================================
# SEND TO ALL USERS
# ============================================================

def send_to_all(
    title,
    body,
    url=APP_URL,
    notification_type="general",
):
    """
    Broadcast notification to every registered FCM device.
    """

    print("\n" + "=" * 60)
    print("📤 BROADCAST NOTIFICATION")
    print("=" * 60)
    print(f"Title : {title}")
    print(f"Body  : {body}")
    print(f"URL   : {url}")
    print(f"Type  : {notification_type}")

    tokens = get_all_tokens()

    if not tokens:
        print("⚠️ No FCM tokens found.")
        print(
            "   Make sure users have allowed "
            "browser notifications."
        )
        return False

    print(f"📱 Devices: {len(tokens)}")

    successful = 0
    failed = 0

    # FCM multicast maximum is 500 tokens.
    for start in range(0, len(tokens), 500):

        batch = tokens[start:start + 500]

        message = messaging.MulticastMessage(

            notification=messaging.Notification(
                title=title,
                body=body,
            ),

            data={
                "type": notification_type,
                "url": url,
            },

            android=messaging.AndroidConfig(
                priority="high",

                notification=messaging.AndroidNotification(
                    sound="default",
                ),
            ),

            webpush=messaging.WebpushConfig(

                headers={
                    "Urgency": "high",
                },

                notification=messaging.WebpushNotification(
                    title=title,
                    body=body,

                    icon="/icon-192.png",
                    badge="/badge-96.png",

                    tag=(
                        "acade-me-"
                        + notification_type
                        + "-"
                        + str(int(time.time()))
                    ),

                    renotify=True,

                    data={
                        "type": notification_type,
                        "url": url,
                    },
                ),

                fcm_options=messaging.WebpushFCMOptions(
                    link=url
                ),
            ),

            tokens=batch,
        )

        try:
            response = (
                messaging
                .send_each_for_multicast(message)
            )

            successful += response.success_count
            failed += response.failure_count

            # ------------------------------------------------
            # Inspect individual failures
            # ------------------------------------------------

            for index, send_response in enumerate(
                response.responses
            ):

                if send_response.success:
                    continue

                token = batch[index]
                error = send_response.exception

                print(
                    f"❌ Token failed: "
                    f"{type(error).__name__}: {error}"
                )

                if is_invalid_token_error(error):
                    remove_invalid_token(token)

        except Exception as exc:
            print(
                "❌ FCM multicast request failed:"
            )
            print(
                f"   {type(exc).__name__}: {exc}"
            )
            traceback.print_exc()

            failed += len(batch)

    with state_lock:

        service_stats[
            "notifications_sent"
        ] += 1

        service_stats[
            "successful_deliveries"
        ] += successful

        service_stats[
            "failed_deliveries"
        ] += failed

        service_stats[
            "last_notification"
        ] = datetime.now(IST).strftime(
            "%Y-%m-%d %H:%M:%S"
        )

    print("\n" + "-" * 60)
    print(
        f"✅ Successful: {successful}"
    )
    print(
        f"❌ Failed:     {failed}"
    )
    print("-" * 60)

    return successful > 0


# ============================================================
# SEND TO ONE USER
# ============================================================

def get_user_tokens(user_id):
    tokens = set()

    # fcm_tokens/{user_id}
    try:
        document = (
            db.collection("fcm_tokens")
            .document(user_id)
            .get()
        )

        if document.exists:

            data = document.to_dict() or {}

            token = data.get("token")

            if token:
                tokens.add(token)

    except Exception as exc:
        print(
            f"⚠️ Error reading fcm_tokens/{user_id}: "
            f"{exc}"
        )

    # users/{user_id}
    try:
        document = (
            db.collection("users")
            .document(user_id)
            .get()
        )

        if document.exists:

            data = document.to_dict() or {}

            token = data.get("fcmToken")

            if token:
                tokens.add(token)

    except Exception as exc:
        print(
            f"⚠️ Error reading users/{user_id}: "
            f"{exc}"
        )

    return list(tokens)


def send_to_user(
    user_id,
    title,
    body,
    url=APP_URL,
    notification_type="general",
):
    """
    Send notification to one user.
    """

    print("\n" + "=" * 60)
    print("📤 USER NOTIFICATION")
    print("=" * 60)
    print(f"User: {user_id}")
    print(f"Title: {title}")

    tokens = get_user_tokens(user_id)

    if not tokens:
        print(
            f"⚠️ No FCM token for user {user_id}"
        )
        return False

    success = False

    for token in tokens:

        try:

            message = build_web_message(
                title=title,
                body=body,
                token=token,
                url=url,
                notification_type=notification_type,
            )

            messaging.send(message)

            print(
                f"✅ Notification sent to "
                f"{user_id}"
            )

            success = True

        except Exception as exc:

            print(
                f"❌ Notification failed: "
                f"{type(exc).__name__}: {exc}"
            )

            if is_invalid_token_error(exc):
                remove_invalid_token(token)

    if success:

        with state_lock:
            service_stats[
                "notifications_sent"
            ] += 1

            service_stats[
                "successful_deliveries"
            ] += 1

            service_stats[
                "last_notification"
            ] = datetime.now(IST).strftime(
                "%Y-%m-%d %H:%M:%S"
            )

    else:

        with state_lock:
            service_stats[
                "failed_deliveries"
            ] += 1

    return success


# ============================================================
# INITIAL LOAD
# ============================================================

def load_existing_ids(collection_name):

    try:

        documents = list(
            db.collection(collection_name).stream()
        )

        ids = {
            document.id
            for document in documents
        }

        with known_ids_lock:
            known_ids[collection_name] = ids

        print(
            f"📂 {collection_name}: "
            f"{len(ids)} existing documents"
        )

    except Exception as exc:

        print(
            f"❌ Could not load "
            f"{collection_name}: {exc}"
        )


# ============================================================
# UPDATE WATCHER
# ============================================================

def watch_updates():

    print("👀 Updates watcher started")

    while True:

        try:

            documents = list(
                db.collection("updates").stream()
            )

            current_ids = {
                document.id
                for document in documents
            }

            with known_ids_lock:
                old_ids = set(
                    known_ids["updates"]
                )

            new_ids = current_ids - old_ids

            for document in documents:

                if document.id not in new_ids:
                    continue

                data = document.to_dict() or {}

                title = (
                    data.get("title")
                    or "New Update!"
                )

                body = (
                    data.get("message")
                    or data.get("body")
                    or "Check AcadeMe!"
                )

                print("\n🆕 NEW UPDATE")
                print(f"📢 {title}")

                send_to_all(
                    title=f"📢 {title}",
                    body=body,
                    url=APP_URL,
                    notification_type="update",
                )

            with known_ids_lock:
                known_ids["updates"] = current_ids

            with state_lock:
                service_stats["last_check"] = (
                    datetime.now(IST).strftime(
                        "%Y-%m-%d %H:%M:%S"
                    )
                )

        except Exception as exc:

            print(
                f"❌ Updates watcher error: {exc}"
            )

        time.sleep(30)


# ============================================================
# RESOURCE WATCHER
# ============================================================

def watch_resources():

    print("👀 Resources watcher started")

    while True:

        try:

            documents = list(
                db.collection("resources").stream()
            )

            current_ids = {
                document.id
                for document in documents
            }

            with known_ids_lock:
                old_ids = set(
                    known_ids["resources"]
                )

            new_ids = current_ids - old_ids

            for document in documents:

                if document.id not in new_ids:
                    continue

                data = document.to_dict() or {}

                title = (
                    data.get("title")
                    or "New Resource"
                )

                resource_type = (
                    data.get("type")
                    or "resource"
                )

                branches = data.get(
                    "branches",
                    []
                )

                if not isinstance(
                    branches,
                    list
                ):
                    branches = []

                branch_text = ", ".join(
                    str(branch)
                    for branch in branches[:2]
                )

                if len(branches) > 2:
                    branch_text += (
                        f" +{len(branches) - 2} more"
                    )

                body = title

                if branch_text:
                    body += (
                        f" • {branch_text}"
                    )

                print("\n🆕 NEW RESOURCE")
                print(f"📚 {title}")

                send_to_all(
                    title=(
                        "📚 New "
                        + str(resource_type)
                        .replace("-", " ")
                        .title()
                        + "!"
                    ),
                    body=body,
                    url=APP_URL,
                    notification_type="resource",
                )

            with known_ids_lock:
                known_ids["resources"] = current_ids

            with state_lock:
                service_stats["last_check"] = (
                    datetime.now(IST).strftime(
                        "%Y-%m-%d %H:%M:%S"
                    )
                )

        except Exception as exc:

            print(
                f"❌ Resources watcher error: "
                f"{exc}"
            )

        time.sleep(30)


# ============================================================
# ADMIN MESSAGE WATCHER
# ============================================================

def watch_notifications():

    print("👀 Admin message watcher started")

    while True:

        try:

            documents = list(
                db.collection("notifications").stream()
            )

            current_ids = {
                document.id
                for document in documents
            }

            with known_ids_lock:
                old_ids = set(
                    known_ids["notifications"]
                )

            new_ids = current_ids - old_ids

            for document in documents:

                if document.id not in new_ids:
                    continue

                data = document.to_dict() or {}

                user_id = (
                    data.get("userId")
                    or ""
                )

                message = (
                    data.get("message")
                    or data.get("body")
                    or ""
                )

                notification_type = (
                    data.get("type")
                    or ""
                )

                if (
                    notification_type
                    == "admin_message"
                    and user_id
                    and message
                ):

                    print("\n🆕 ADMIN MESSAGE")
                    print(
                        f"💬 User: {user_id}"
                    )

                    send_to_user(
                        user_id=user_id,
                        title="💬 Message from Admin",
                        body=str(message)[:500],
                        url=APP_URL,
                        notification_type="admin_message",
                    )

            with known_ids_lock:
                known_ids["notifications"] = current_ids

        except Exception as exc:

            print(
                f"❌ Notifications watcher error: "
                f"{exc}"
            )

        time.sleep(30)


# ============================================================
# MANUAL ATTENDANCE REMINDER
# ============================================================

def send_attendance_reminder(
    manual=False,
    custom_title=None,
    custom_body=None,
):

    title = (
        custom_title
        or random.choice(
            ATTENDANCE_REMINDER_TITLES
        )
    )

    body = (
        custom_body
        or random.choice(
            ATTENDANCE_REMINDER_BODIES
        )
    )

    if manual and not custom_body:
        body = (
            "🧪 Test notification: "
            + body
        )

    print("\n🎒 ATTENDANCE REMINDER")

    send_to_all(
        title=title,
        body=body,
        url=ATTENDANCE_URL,
        notification_type="attendance_reminder",
    )


# ============================================================
# MANUAL ATTENDANCE TRIGGER WATCHER
# ============================================================

def watch_attendance_reminders():

    print(
        "👀 Attendance trigger watcher started"
    )

    while True:

        try:

            documents = list(
                db.collection(
                    "attendance_reminders"
                ).stream()
            )

            current_ids = {
                document.id
                for document in documents
            }

            with known_ids_lock:
                old_ids = set(
                    known_ids[
                        "attendance_reminders"
                    ]
                )

            new_ids = current_ids - old_ids

            for document in documents:

                if document.id not in new_ids:
                    continue

                data = document.to_dict() or {}

                title = (
                    data.get("title")
                    or None
                )

                body = (
                    data.get("body")
                    or None
                )

                print(
                    "\n🆕 MANUAL ATTENDANCE "
                    "TRIGGER"
                )

                send_attendance_reminder(
                    manual=True,
                    custom_title=title,
                    custom_body=body,
                )

            with known_ids_lock:
                known_ids[
                    "attendance_reminders"
                ] = current_ids

        except Exception as exc:

            print(
                "❌ Attendance trigger "
                f"watcher error: {exc}"
            )

        time.sleep(POLL_INTERVAL)


# ============================================================
# CUSTOM ADMIN BROADCAST WATCHER
# ============================================================

def watch_admin_broadcasts():

    print(
        "👀 Admin broadcast watcher started"
    )

    while True:

        try:

            documents = list(
                db.collection(
                    "admin_broadcasts"
                ).stream()
            )

            current_ids = {
                document.id
                for document in documents
            }

            with known_ids_lock:
                old_ids = set(
                    known_ids[
                        "admin_broadcasts"
                    ]
                )

            new_ids = current_ids - old_ids

            for document in documents:

                if document.id not in new_ids:
                    continue

                data = document.to_dict() or {}

                title = (
                    data.get("title")
                    or "AcadeMe"
                )

                body = (
                    data.get("body")
                    or data.get("message")
                    or ""
                )

                url = (
                    data.get("url")
                    or APP_URL
                )

                if not body:
                    print(
                        "⚠️ Admin broadcast "
                        "has no body."
                    )
                    continue

                print(
                    "\n🆕 CUSTOM ADMIN "
                    "BROADCAST"
                )

                print(
                    f"📣 {title}"
                )

                send_to_all(
                    title=title,
                    body=body,
                    url=url,
                    notification_type=(
                        "admin_broadcast"
                    ),
                )

            with known_ids_lock:
                known_ids[
                    "admin_broadcasts"
                ] = current_ids

        except Exception as exc:

            print(
                "❌ Admin broadcast "
                f"watcher error: {exc}"
            )

        time.sleep(POLL_INTERVAL)


# ============================================================
# SCHEDULED ATTENDANCE REMINDER
# ============================================================

def attendance_scheduler():

    print(
        "⏰ Attendance scheduler started"
    )

    # Monday = 0
    # Saturday = 5
    # Sunday = 6

    scheduled_slots = [
        (12, 0),
        (16, 30),
    ]

    sent_slots = set()

    while True:

        try:

            now = datetime.now(IST)

            if now.weekday() <= 5:

                for hour, minute in scheduled_slots:

                    slot_key = (
                        f"{now.strftime('%Y-%m-%d')}"
                        f"-{hour:02d}:{minute:02d}"
                    )

                    slot_time = now.replace(
                        hour=hour,
                        minute=minute,
                        second=0,
                        microsecond=0,
                    )

                    seconds_after = (
                        now - slot_time
                    ).total_seconds()

                    # Give the service a 5-minute
                    # tolerance window.
                    if (
                        0 <= seconds_after < 300
                        and slot_key
                        not in sent_slots
                    ):

                        print(
                            "\n⏰ Scheduled "
                            "attendance reminder"
                        )

                        send_attendance_reminder()

                        sent_slots.add(slot_key)

            # Keep memory small
            if len(sent_slots) > 20:

                sorted_slots = sorted(
                    sent_slots
                )

                sent_slots = set(
                    sorted_slots[-10:]
                )

        except Exception as exc:

            print(
                "❌ Attendance scheduler "
                f"error: {exc}"
            )

            traceback.print_exc()

        time.sleep(20)


# ============================================================
# KEEP ALIVE
# ============================================================

def keep_alive():

    render_url = os.environ.get(
        "RENDER_EXTERNAL_URL"
    )

    if not render_url:

        print(
            "ℹ️ RENDER_EXTERNAL_URL not set."
        )

        return

    print(
        f"💓 Internal keep-alive: "
        f"{render_url}"
    )

    while True:

        time.sleep(10 * 60)

        try:

            request = urllib.request.Request(
                render_url,
                headers={
                    "User-Agent":
                        "AcadeMe-KeepAlive/1.0"
                },
            )

            with urllib.request.urlopen(
                request,
                timeout=30
            ) as response:

                print(
                    "💓 Keep-alive OK "
                    f"({response.status})"
                )

        except Exception as exc:

            print(
                f"⚠️ Keep-alive failed: "
                f"{exc}"
            )


# ============================================================
# HEALTH SERVER
# ============================================================

class HealthHandler(
    BaseHTTPRequestHandler
):

    def send_json(
        self,
        status_code,
        data
    ):

        payload = json.dumps(
            data,
            ensure_ascii=False
        ).encode("utf-8")

        self.send_response(status_code)

        self.send_header(
            "Content-Type",
            "application/json; charset=utf-8"
        )

        self.send_header(
            "Content-Length",
            str(len(payload))
        )

        self.send_header(
            "Cache-Control",
            "no-cache"
        )

        self.end_headers()

        self.wfile.write(payload)

    def do_GET(self):

        path = self.path.split("?")[0]

        if path in ["/", "/health", "/ping"]:

            with state_lock:
                stats = dict(service_stats)

            response = {
                "status": "ok",
                "service": "AcadeMe Notification Service",
                "time_ist": datetime.now(
                    IST
                ).strftime(
                    "%Y-%m-%d %H:%M:%S"
                ),
                "stats": stats,
            }

            self.send_json(
                200,
                response
            )

            return

        self.send_json(
            404,
            {
                "status": "not_found"
            }
        )

    def do_HEAD(self):

        self.send_response(200)

        self.send_header(
            "Content-Type",
            "text/plain"
        )

        self.end_headers()

    def log_message(
        self,
        format,
        *args
    ):
        # Keep Render logs clean.
        return


def run_health_server():

    print(
        f"🌐 Health server starting "
        f"on port {HEALTH_PORT}"
    )

    server = HTTPServer(
        ("0.0.0.0", HEALTH_PORT),
        HealthHandler,
    )

    print(
        f"✅ Health server listening "
        f"on 0.0.0.0:{HEALTH_PORT}"
    )

    server.serve_forever()


# ============================================================
# STARTUP
# ============================================================

def main():

    print("\n📂 Loading Firestore state...")

    collections = [
        "updates",
        "resources",
        "notifications",
        "attendance_reminders",
        "admin_broadcasts",
    ]

    for collection_name in collections:
        load_existing_ids(
            collection_name
        )

    print("\n🚀 Starting watchers...")

    watcher_threads = [

        (
            "Updates",
            watch_updates
        ),

        (
            "Resources",
            watch_resources
        ),

        (
            "AdminMessages",
            watch_notifications
        ),

        (
            "AttendanceTriggers",
            watch_attendance_reminders
        ),

        (
            "AdminBroadcasts",
            watch_admin_broadcasts
        ),

        (
            "AttendanceScheduler",
            attendance_scheduler
        ),

        (
            "KeepAlive",
            keep_alive
        ),
    ]

    for name, target in watcher_threads:

        thread = threading.Thread(
            target=target,
            daemon=True,
            name=name,
        )

        thread.start()

        print(
            f"   ✅ {name}"
        )

    print("\n" + "=" * 60)
    print(
        "🔔 ACADeMe NOTIFICATIONS ENABLED"
    )
    print("=" * 60)

    print(
        "📢 Updates"
    )

    print(
        "📚 Resources"
    )

    print(
        "💬 Admin Messages"
    )

    print(
        "🎒 Attendance Reminders"
        " — Mon-Sat 12:00 & 16:30 IST"
    )

    print(
        "📣 Custom Admin Broadcasts"
    )

    print("=" * 60)

    # This MUST stay in the main process.
    run_health_server()


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":

    try:

        main()

    except KeyboardInterrupt:

        print(
            "\n🛑 Service stopped."
        )

    except Exception as exc:

        print(
            "\n❌ FATAL SERVICE ERROR"
        )

        print(
            f"{type(exc).__name__}: {exc}"
        )

        traceback.print_exc()

        sys.exit(1)