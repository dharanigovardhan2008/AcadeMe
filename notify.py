import firebase_admin
from firebase_admin import credentials, firestore, messaging
import time
import os
import json
import random
import threading
import urllib.request
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime, timedelta, timezone
import sys
import traceback

# IST is UTC+5:30, fixed offset (no DST) — safe to hardcode
IST = timezone(timedelta(hours=5, minutes=30))

print("=" * 50)
print("🚀 AcadeMe Notification Service Starting...")
print("=" * 50)

# ══════════════════════════════════════════════════════════════
# 🔥 FIREBASE INITIALIZATION WITH ERROR HANDLING
# ══════════════════════════════════════════════════════════════

try:
    print("\n1️⃣ Checking environment variables...")
    cred_json = os.environ.get('GOOGLE_CREDENTIALS_JSON')

    if not cred_json:
        print("❌ ERROR: GOOGLE_CREDENTIALS_JSON not found!")
        print("Available env vars:", list(os.environ.keys()))
        sys.exit(1)

    print("✅ GOOGLE_CREDENTIALS_JSON found")
    print(f"   Length: {len(cred_json)} characters")

    print("\n2️⃣ Parsing JSON credentials...")
    try:
        cred_dict = json.loads(cred_json)
        print("✅ JSON parsed successfully")
        print(f"   Project ID: {cred_dict.get('project_id', 'N/A')}")
    except json.JSONDecodeError as e:
        print(f"❌ ERROR: Invalid JSON format!")
        print(f"   Error: {e}")
        print(f"   First 100 chars: {cred_json[:100]}")
        sys.exit(1)

    print("\n3️⃣ Initializing Firebase...")
    cred = credentials.Certificate(cred_dict)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ Firebase initialized successfully")

except Exception as e:
    print(f"\n❌ FATAL ERROR during initialization:")
    print(f"   {type(e).__name__}: {e}")
    traceback.print_exc()
    sys.exit(1)

print(f"\n✅ Server Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")

# ══════════════════════════════════════════════════════════════
# 📊 TRACKING STATE
# ══════════════════════════════════════════════════════════════

service_stats = {
    "started_at": time.strftime('%Y-%m-%d %H:%M:%S'),
    "notifications_sent": 0,
    "last_check": None,
    "last_notification": None,
    "total_tokens": 0,
}

# Set the instant a listener attaches (Firestore replays every existing doc
# as an "ADDED" change on first attach — this timestamp lets us ignore that
# initial replay and only react to documents created AFTER the service booted).
SERVICE_START_TIME = datetime.now(IST)

# ══════════════════════════════════════════════════════════════
# 📇 TOKEN CACHE (refreshed by its OWN listener, not by polling)
# ══════════════════════════════════════════════════════════════
# This is the single biggest cost saver: instead of re-reading the entire
# `users` + `fcm_tokens` collections every time a notification is sent,
# two lightweight listeners keep an in-memory token list up to date in real
# time. Sending a notification then costs ZERO extra Firestore reads — it
# just uses whatever is already cached in memory.

token_cache_lock = threading.Lock()
token_cache = {
    "fcm_tokens_collection": {},   # doc_id -> token
    "users_collection": {},        # doc_id -> token (only if notificationsEnabled != False)
}


def get_all_tokens():
    """Return the current cached token list (no Firestore read here at all)."""
    with token_cache_lock:
        tokens = set(token_cache["fcm_tokens_collection"].values()) | set(token_cache["users_collection"].values())
    tokens.discard(None)
    tokens.discard('')
    service_stats["total_tokens"] = len(tokens)
    return list(tokens)


def _on_fcm_tokens_snapshot(col_snapshot, changes, read_time):
    with token_cache_lock:
        for change in changes:
            doc = change.document
            if change.type.name == 'REMOVED':
                token_cache["fcm_tokens_collection"].pop(doc.id, None)
            else:
                data = doc.to_dict() or {}
                token_cache["fcm_tokens_collection"][doc.id] = data.get('token')
    print(f"📇 fcm_tokens cache updated ({len(token_cache['fcm_tokens_collection'])} entries)")


def _on_users_snapshot(col_snapshot, changes, read_time):
    with token_cache_lock:
        for change in changes:
            doc = change.document
            if change.type.name == 'REMOVED':
                token_cache["users_collection"].pop(doc.id, None)
            else:
                data = doc.to_dict() or {}
                token = data.get('fcmToken')
                enabled = data.get('notificationsEnabled', True)
                if token and enabled:
                    token_cache["users_collection"][doc.id] = token
                else:
                    token_cache["users_collection"].pop(doc.id, None)
    print(f"📇 users token cache updated ({len(token_cache['users_collection'])} entries)")


# ══════════════════════════════════════════════════════════════
# 📤 SEND NOTIFICATIONS
# ══════════════════════════════════════════════════════════════

def send_to_all(title, body, url='https://acade-me.vercel.app', notif_type='general'):
    """Send notification to ALL users. `url` controls where the click lands
    (e.g. the attendance tracker page), `notif_type` is passed through in the
    data payload so the client / service worker can branch on it."""
    global service_stats
    try:
        tokens = get_all_tokens()

        if not tokens:
            print("⚠️  No FCM tokens found!")
            return

        print(f"📤 Sending to {len(tokens)} devices...")
        print(f"   📌 Title: {title}")
        print(f"   📌 Body: {body[:80]}")

        success_total = 0
        failure_total = 0

        for i in range(0, len(tokens), 500):
            batch = tokens[i:i+500]

            message = messaging.MulticastMessage(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data={
                    'type': notif_type,
                    'url': url,
                },
                android=messaging.AndroidConfig(
                    priority='high',
                    notification=messaging.AndroidNotification(
                        color='#1a73e8',
                        sound='default',
                    ),
                ),
                webpush=messaging.WebpushConfig(
                    headers={'Urgency': 'high'},
                    notification=messaging.WebpushNotification(
                        title=title,
                        body=body,
                        icon='/icon-192.png',
                        badge='/badge-96.png',
                        tag='acade-me-' + str(int(time.time())),
                        renotify=True,
                        data={'type': notif_type, 'url': url},
                    ),
                    fcm_options=messaging.WebpushFCMOptions(
                        link=url
                    )
                ),
                tokens=batch,
            )

            response = messaging.send_each_for_multicast(message)
            success_total += response.success_count
            failure_total += response.failure_count

        print(f"✅ Done! Success: {success_total} | Failed: {failure_total}")

        service_stats["notifications_sent"] += 1
        service_stats["last_notification"] = time.strftime('%Y-%m-%d %H:%M:%S')

    except Exception as e:
        print(f"❌ Send error: {e}")
        traceback.print_exc()


def send_to_user(user_id, title, body, url='https://acade-me.vercel.app', notif_type='general'):
    """Send notification to specific user (uses the cache first, falls back
    to a direct single-doc read only if the user isn't cached yet — a single
    doc get() is negligible cost, unlike streaming a whole collection)."""
    try:
        tokens = []

        with token_cache_lock:
            cached_fcm = token_cache["fcm_tokens_collection"].get(user_id)
            cached_user = token_cache["users_collection"].get(user_id)

        if cached_fcm:
            tokens.append(cached_fcm)
        if cached_user and cached_user not in tokens:
            tokens.append(cached_user)

        if not tokens:
            # Fallback: single-document reads are cheap (2 reads), unlike
            # streaming a whole collection, so this is safe even if it
            # happens occasionally for a user not yet in cache.
            try:
                doc = db.collection('fcm_tokens').document(user_id).get()
                if doc.exists:
                    token = doc.to_dict().get('token')
                    if token:
                        tokens.append(token)
            except Exception:
                pass
            try:
                doc = db.collection('users').document(user_id).get()
                if doc.exists:
                    token = doc.to_dict().get('fcmToken')
                    if token and token not in tokens:
                        tokens.append(token)
            except Exception:
                pass

        if not tokens:
            print(f"⚠️  No token for user {user_id}")
            return

        for token in tokens:
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data={
                    'type': notif_type,
                    'url': url,
                },
                webpush=messaging.WebpushConfig(
                    notification=messaging.WebpushNotification(
                        title=title,
                        body=body,
                        icon='/icon-192.png',
                        badge='/badge-96.png',
                        data={'type': notif_type, 'url': url},
                    ),
                    fcm_options=messaging.WebpushFCMOptions(
                        link=url
                    )
                ),
                token=token,
            )
            messaging.send(message)

        print(f"✅ Sent to user {user_id}")

    except Exception as e:
        print(f"❌ Error: {e}")


# ══════════════════════════════════════════════════════════════
# 🎒 ATTENDANCE REMINDERS (funny, nudgy, Mon–Sat @ 12:00 & 16:30 IST)
# ══════════════════════════════════════════════════════════════

ATTENDANCE_REMINDER_TITLES = [
    "👀 Did you go to class today?",
    "🎒 Bunk check-in!",
    "🚨 Attendance alert (the fun kind)",
    "📚 Class detective here",
    "🕵️ Someone's asking about your attendance...",
]

ATTENDANCE_REMINDER_BODIES = [
    "No judgment, just curious 👀 Tap to update your attendance in AcadeMe.",
    "Be honest... did you actually attend or is this a 'mental health day'? Update your attendance either way 😄",
    "Your attendance % is waiting for the truth. Tap to update it now!",
    "Professor took attendance. Did YOU take note of it? Update here 📝",
    "Quick vibe check: did you sit in class or in bed? Log it in AcadeMe 🛌📖",
    "Your attendance tracker is feeling neglected. Give it some love — update now!",
    "Plot twist: even skipping class needs to be logged. Tap to update 😅",
    "This is your friendly reminder (not your mom) to update today's attendance.",
]


def send_attendance_reminder(manual=False, custom_title=None, custom_body=None):
    """Send the attendance nudge to everyone. If custom_title/custom_body are
    provided (admin edited the message in the Admin Panel before sending),
    those are used verbatim instead of picking randomly from the default pool."""
    title = custom_title or random.choice(ATTENDANCE_REMINDER_TITLES)
    body = custom_body or random.choice(ATTENDANCE_REMINDER_BODIES)
    if manual and not custom_body:
        body = "(Test ping from Admin Panel) " + body
    tag = '(MANUAL' + (' CUSTOM' if custom_title or custom_body else '') + ')' if manual else ''
    print(f"\n🆕 ═══ ATTENDANCE REMINDER {tag} ═══")
    send_to_all(
        title,
        body,
        url='https://acade-me.vercel.app/attendance',
        notif_type='attendance_reminder',
    )


def _on_attendance_reminder_snapshot(col_snapshot, changes, read_time):
    for change in changes:
        if change.type.name != 'ADDED':
            continue
        doc = change.document
        # Ignore the initial replay of pre-existing docs when the listener
        # first attaches — only react to genuinely NEW documents.
        create_time = doc.create_time
        if create_time and create_time.timestamp() < SERVICE_START_TIME.timestamp():
            continue

        data = doc.to_dict() or {}
        custom_title = (data.get('title') or '').strip() or None
        custom_body = (data.get('body') or '').strip() or None
        print(f"\n🆕 ═══ MANUAL ATTENDANCE REMINDER TRIGGER ═══")
        send_attendance_reminder(manual=True, custom_title=custom_title, custom_body=custom_body)


# ══════════════════════════════════════════════════════════════
# 📣 CUSTOM ADMIN BROADCASTS (fully custom notification, any content)
# ══════════════════════════════════════════════════════════════

def _on_admin_broadcast_snapshot(col_snapshot, changes, read_time):
    for change in changes:
        if change.type.name != 'ADDED':
            continue
        doc = change.document
        create_time = doc.create_time
        if create_time and create_time.timestamp() < SERVICE_START_TIME.timestamp():
            continue

        data = doc.to_dict() or {}
        title = (data.get('title') or 'AcadeMe').strip()
        body = (data.get('body') or '').strip()
        url = (data.get('url') or '').strip() or 'https://acade-me.vercel.app'

        if body:
            print(f"\n🆕 ═══ CUSTOM ADMIN BROADCAST ═══")
            print(f"📣 {title}")
            send_to_all(title, body, url=url, notif_type='admin_broadcast')


def attendance_reminder_scheduler():
    """Fires the attendance nudge automatically at 12:00 and 16:30 IST,
    Monday through Saturday. This is a clock check only — it never touches
    Firestore in the loop, so it costs nothing regardless of interval."""
    SLOTS = [(12, 0), (16, 30)]
    already_sent_today = set()  # e.g. {"2026-09-01-12:00"}

    while True:
        now = datetime.now(IST)
        weekday = now.weekday()  # Monday=0 ... Sunday=6

        if weekday <= 5:  # Monday(0) .. Saturday(5) — Sunday(6) skipped
            for hh, mm in SLOTS:
                slot_key = f"{now.strftime('%Y-%m-%d')}-{hh:02d}:{mm:02d}"
                slot_time = now.replace(hour=hh, minute=mm, second=0, microsecond=0)
                if 0 <= (now - slot_time).total_seconds() < 60 and slot_key not in already_sent_today:
                    send_attendance_reminder(manual=False)
                    already_sent_today.add(slot_key)

        if len(already_sent_today) > 20:
            already_sent_today = set(list(already_sent_today)[-10:])

        time.sleep(20)


# ══════════════════════════════════════════════════════════════
# 👀 UPDATES / RESOURCES / ADMIN MESSAGES — real-time listeners
# ══════════════════════════════════════════════════════════════

def _on_updates_snapshot(col_snapshot, changes, read_time):
    for change in changes:
        if change.type.name != 'ADDED':
            continue
        doc = change.document
        create_time = doc.create_time
        if create_time and create_time.timestamp() < SERVICE_START_TIME.timestamp():
            continue

        data = doc.to_dict() or {}
        title = data.get('title', 'New Update!')
        body = data.get('message', 'Check AcadeMe!')

        print(f"\n🆕 ═══ NEW UPDATE ═══")
        print(f"📢 {title}")
        send_to_all(f"📢 {title}", body)


def _on_resources_snapshot(col_snapshot, changes, read_time):
    for change in changes:
        if change.type.name != 'ADDED':
            continue
        doc = change.document
        create_time = doc.create_time
        if create_time and create_time.timestamp() < SERVICE_START_TIME.timestamp():
            continue

        data = doc.to_dict() or {}
        title = data.get('title', 'New Resource')
        res_type = data.get('type', 'resource')
        branches = data.get('branches', [])

        branch_text = ', '.join(branches[:2])
        if len(branches) > 2:
            branch_text += f' +{len(branches)-2} more'

        print(f"\n🆕 ═══ NEW RESOURCE ═══")
        print(f"📚 {title}")

        send_to_all(
            f"📚 New {res_type.replace('-', ' ').title()}!",
            f"{title}" + (f" • {branch_text}" if branch_text else "")
        )


def _on_notifications_snapshot(col_snapshot, changes, read_time):
    for change in changes:
        if change.type.name != 'ADDED':
            continue
        doc = change.document
        create_time = doc.create_time
        if create_time and create_time.timestamp() < SERVICE_START_TIME.timestamp():
            continue

        data = doc.to_dict() or {}
        user_id = data.get('userId', '')
        message = data.get('message', '')
        msg_type = data.get('type', '')

        if msg_type == 'admin_message' and user_id:
            print(f"\n🆕 ═══ ADMIN MESSAGE ═══")
            print(f"💬 To: {data.get('userName', user_id)}")
            send_to_user(
                user_id,
                "💬 Message from Admin",
                message[:100]
            )


# ══════════════════════════════════════════════════════════════
# 💓 KEEP ALIVE
# ══════════════════════════════════════════════════════════════

def keep_alive():
    """Self-ping to prevent Render sleep"""
    render_url = os.environ.get('RENDER_EXTERNAL_URL')

    if not render_url:
        print("⚠️  RENDER_EXTERNAL_URL not set!")
        return

    print(f"💓 Keep-alive: {render_url}")
    ping_count = 0

    while True:
        time.sleep(10 * 60)  # 10 minutes
        ping_count += 1

        try:
            req = urllib.request.Request(
                render_url,
                headers={'User-Agent': 'AcadeMe-KeepAlive'}
            )
            response = urllib.request.urlopen(req, timeout=30)
            print(f"💓 Ping #{ping_count}: OK")
        except Exception as e:
            print(f"💔 Ping #{ping_count} failed: {e}")


# ══════════════════════════════════════════════════════════════
# 🌐 WEB SERVER
# ══════════════════════════════════════════════════════════════

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>AcadeMe Notifier</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta http-equiv="refresh" content="30">
            <style>
                body {{
                    font-family: -apple-system, system-ui, sans-serif;
                    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
                    color: white; min-height: 100vh; margin: 0; padding: 20px;
                }}
                .container {{ max-width: 600px; margin: 0 auto; }}
                .card {{
                    background: rgba(255,255,255,0.08);
                    border-radius: 16px; padding: 24px; margin-bottom: 20px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                }}
                .status {{
                    display: inline-block; padding: 6px 16px;
                    background: #10B981; border-radius: 20px;
                    font-weight: bold; animation: pulse 2s infinite;
                }}
                @keyframes pulse {{ 0%, 100% {{ opacity: 1; }} 50% {{ opacity: 0.7; }} }}
                .stat {{
                    display: flex; justify-content: space-between;
                    padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08);
                }}
                .stat:last-child {{ border: none; }}
                .label {{ color: #aaa; }}
                .value {{ font-weight: bold; color: #60A5FA; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="card">
                    <span class="status">🟢 RUNNING</span>
                    <h1>🎓 AcadeMe Notifier</h1>
                    <p style="color: #aaa;">Real-time Push Notification Service (listener-based, low read usage)</p>
                </div>
                <div class="card">
                    <h3 style="margin-top:0;">📊 Stats</h3>
                    <div class="stat">
                        <span class="label">Started</span>
                        <span class="value">{service_stats['started_at']}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Notifications Sent</span>
                        <span class="value">{service_stats['notifications_sent']}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Cached FCM Tokens</span>
                        <span class="value">{service_stats['total_tokens']}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Last Notification</span>
                        <span class="value">{service_stats['last_notification'] or 'None yet'}</span>
                    </div>
                </div>
                <div class="card">
                    <h3 style="margin-top:0;">🔔 Triggers</h3>
                    <div style="color: #aaa; font-size: 0.9rem;">
                        <p>📢 New Updates → All users</p>
                        <p>📚 New Resources → All users</p>
                        <p>💬 Admin Messages → Specific user</p>
                        <p>🎒 Attendance Reminders → All users (Mon–Sat, 12:00 & 16:30 IST)</p>
                        <p>📣 Custom Admin Broadcasts → All users (on demand)</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        """
        self.wfile.write(html.encode())

    def do_HEAD(self):
        self.send_response(200)
        self.end_headers()

    def log_message(self, format, *args):
        pass


def run_server():
    port = int(os.environ.get('PORT', 8080))

    try:
        print(f"\n4️⃣ Starting web server on port {port}...")
        server = HTTPServer(('0.0.0.0', port), Handler)
        print(f"✅ Server listening on 0.0.0.0:{port}")
        print("=" * 50)
        server.serve_forever()
    except Exception as e:
        print(f"\n❌ FATAL ERROR starting server:")
        print(f"   {type(e).__name__}: {e}")
        traceback.print_exc()
        sys.exit(1)


# ══════════════════════════════════════════════════════════════
# 🚀 MAIN
# ══════════════════════════════════════════════════════════════

if __name__ == '__main__':
    try:
        print("\n📂 Attaching real-time listeners (no polling — reads only happen on actual changes)...")

        # Token cache listeners — keep the in-memory token list fresh
        db.collection('fcm_tokens').on_snapshot(_on_fcm_tokens_snapshot)
        print("👀 Listening: fcm_tokens (token cache)")

        db.collection('users').on_snapshot(_on_users_snapshot)
        print("👀 Listening: users (token cache)")

        # Give the token-cache listeners a moment to receive their initial
        # snapshot before anything tries to send a notification.
        time.sleep(3)

        # Content listeners — trigger a push the instant a new doc appears
        db.collection('updates').on_snapshot(_on_updates_snapshot)
        print("👀 Listening: updates")

        db.collection('resources').on_snapshot(_on_resources_snapshot)
        print("👀 Listening: resources")

        db.collection('notifications').on_snapshot(_on_notifications_snapshot)
        print("👀 Listening: notifications (admin messages)")

        db.collection('attendance_reminders').on_snapshot(_on_attendance_reminder_snapshot)
        print("👀 Listening: attendance_reminders (manual triggers)")

        db.collection('admin_broadcasts').on_snapshot(_on_admin_broadcast_snapshot)
        print("👀 Listening: admin_broadcasts (custom notifications)")

        scheduler = threading.Thread(target=attendance_reminder_scheduler, daemon=True, name="AttendanceScheduler")
        scheduler.start()
        print("⏰ Attendance reminder scheduler started (Mon–Sat, 12:00 & 16:30 IST)")

        keeper = threading.Thread(target=keep_alive, daemon=True)
        keeper.start()
        print("💓 Keep-alive started\n")

        print("🔔 Notifications enabled for:")
        print("   📢 Updates")
        print("   📚 Resources")
        print("   💬 Admin Messages")
        print("   🎒 Attendance Reminders (Mon–Sat, 12:00 & 16:30 IST)")
        print("   📣 Custom Admin Broadcasts\n")
        print("💡 This version uses Firestore real-time listeners instead of")
        print("   polling loops — reads only happen when data actually changes,")
        print("   which should keep you comfortably within the free quota.\n")

        run_server()

    except Exception as e:
        print(f"\n❌ FATAL ERROR in main:")
        print(f"   {type(e).__name__}: {e}")
        traceback.print_exc()
        sys.exit(1)