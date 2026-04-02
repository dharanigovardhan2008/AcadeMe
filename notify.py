import firebase_admin
from firebase_admin import credentials, firestore, messaging
import time
import os
import json
import threading
import urllib.request
from http.server import HTTPServer, BaseHTTPRequestHandler

# ══════════════════════════════════════════════════════════════
# 🔥 FIREBASE INITIALIZATION
# ══════════════════════════════════════════════════════════════

cred_json = os.environ.get('GOOGLE_CREDENTIALS_JSON')
if not cred_json:
    raise Exception("GOOGLE_CREDENTIALS_JSON env var is missing!")

cred_dict = json.loads(cred_json)
cred = credentials.Certificate(cred_dict)
firebase_admin.initialize_app(cred)
db = firestore.client()

print("🚀 AcadeMe Notification Service Started!")
print(f"⏰ Server Time: {time.strftime('%Y-%m-%d %H:%M:%S')}")

# ══════════════════════════════════════════════════════════════
# 📊 TRACKING STATE
# ══════════════════════════════════════════════════════════════

# Track last known IDs for each collection
last_ids = {
    "updates": None,
    "resources": None,
    "faculty": None,
    "courses": None,
    "notifications": None,
}

# Track all known IDs (to detect new ones)
known_ids = {
    "updates": set(),
    "resources": set(),
    "faculty": set(),
    "courses": set(),
    "notifications": set(),
}

service_stats = {
    "started_at": time.strftime('%Y-%m-%d %H:%M:%S'),
    "notifications_sent": 0,
    "last_check": None,
    "last_notification": None,
    "total_tokens": 0,
    "collections_watched": 5,
}

# ══════════════════════════════════════════════════════════════
# 📤 SEND NOTIFICATIONS (To All Users)
# ══════════════════════════════════════════════════════════════

def get_all_tokens():
    """Get all FCM tokens from both collections"""
    tokens = []

    # Read from fcm_tokens collection
    try:
        for doc in db.collection('fcm_tokens').stream():
            token = doc.to_dict().get('token')
            if token and token not in tokens:
                tokens.append(token)
    except Exception as e:
        print(f"   ⚠️ Error reading fcm_tokens: {e}")

    # Also read from users collection (fallback)
    try:
        for user in db.collection('users').stream():
            data = user.to_dict()
            token = data.get('fcmToken')
            enabled = data.get('notificationsEnabled', True)
            if token and enabled and token not in tokens:
                tokens.append(token)
    except Exception as e:
        print(f"   ⚠️ Error reading users: {e}")

    return tokens


def send_to_all(title, body):
    """Send notification to ALL users"""
    global service_stats
    try:
        tokens = get_all_tokens()
        service_stats["total_tokens"] = len(tokens)

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
                android=messaging.AndroidConfig(
                    priority='high',
                    notification=messaging.AndroidNotification(
                        color='#1a73e8',
                        sound='default',
                        channel_id='acade_me_updates',
                    ),
                ),
                webpush=messaging.WebpushConfig(
                    headers={
                        'Urgency': 'high',
                        'TTL': '86400'
                    },
                    notification=messaging.WebpushNotification(
                        title=title,
                        body=body,
                        icon='/icon-192.png',
                        badge='/badge-96.png',
                        tag='acade-me-' + str(int(time.time())),
                        renotify=True,
                    ),
                    fcm_options=messaging.WebpushFCMOptions(
                        link='https://acade-me.vercel.app'
                    )
                ),
                tokens=batch,
            )

            response = messaging.send_each_for_multicast(message)
            success_total += response.success_count
            failure_total += response.failure_count

            # Log failures
            if response.failure_count > 0:
                for idx, resp in enumerate(response.responses):
                    if not resp.success:
                        print(f"   ❌ Failed: {resp.exception}")

        print(f"✅ Done! Success: {success_total} | Failed: {failure_total}")

        service_stats["notifications_sent"] += 1
        service_stats["last_notification"] = time.strftime('%Y-%m-%d %H:%M:%S')

    except Exception as e:
        print(f"❌ Send error: {e}")
        import traceback
        traceback.print_exc()


def send_to_user(user_id, title, body):
    """Send notification to a SPECIFIC user"""
    try:
        tokens = []

        # Check fcm_tokens collection
        try:
            doc = db.collection('fcm_tokens').document(user_id).get()
            if doc.exists:
                token = doc.to_dict().get('token')
                if token:
                    tokens.append(token)
        except:
            pass

        # Check users collection
        try:
            doc = db.collection('users').document(user_id).get()
            if doc.exists:
                token = doc.to_dict().get('fcmToken')
                if token and token not in tokens:
                    tokens.append(token)
        except:
            pass

        if not tokens:
            print(f"⚠️  No token found for user {user_id}")
            return

        for token in tokens:
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                webpush=messaging.WebpushConfig(
                    notification=messaging.WebpushNotification(
                        title=title,
                        body=body,
                        icon='/icon-192.png',
                        badge='/badge-96.png',
                        tag='acade-me-msg',
                        renotify=True,
                    ),
                    fcm_options=messaging.WebpushFCMOptions(
                        link='https://acade-me.vercel.app'
                    )
                ),
                token=token,
            )
            messaging.send(message)

        print(f"✅ Sent personal notification to user {user_id}")

    except Exception as e:
        print(f"❌ Error sending to user: {e}")


# ══════════════════════════════════════════════════════════════
# 👀 WATCHERS FOR EACH COLLECTION
# ══════════════════════════════════════════════════════════════

def load_existing_ids(collection_name):
    """Load all existing document IDs on startup"""
    try:
        docs = list(db.collection(collection_name).stream())
        ids = set(doc.id for doc in docs)
        known_ids[collection_name] = ids
        print(f"   📂 {collection_name}: {len(ids)} existing docs")
        return docs
    except Exception as e:
        print(f"   ❌ Error loading {collection_name}: {e}")
        return []


def watch_updates():
    """Watch 'updates' collection for new admin updates"""
    while True:
        try:
            docs = list(db.collection('updates').stream())
            current_ids = set(doc.id for doc in docs)

            # Find new documents
            new_ids = current_ids - known_ids["updates"]

            if new_ids:
                for doc in docs:
                    if doc.id in new_ids:
                        data = doc.to_dict()
                        title = data.get('title', 'New Update!')
                        body = data.get('message', 'Check AcadeMe for details!')

                        print(f"\n🆕 ═══ NEW UPDATE ═══")
                        print(f"📢 {title}")
                        send_to_all(
                            f"📢 {title}",
                            body
                        )

                known_ids["updates"] = current_ids

        except Exception as e:
            print(f"❌ Updates watch error: {e}")

        time.sleep(30)


def watch_resources():
    """Watch 'resources' collection for new resources"""
    while True:
        try:
            docs = list(db.collection('resources').stream())
            current_ids = set(doc.id for doc in docs)

            new_ids = current_ids - known_ids["resources"]

            if new_ids:
                for doc in docs:
                    if doc.id in new_ids:
                        data = doc.to_dict()
                        title = data.get('title', 'New Resource')
                        res_type = data.get('type', 'resource')
                        branches = data.get('branches', [])
                        branch_text = ', '.join(branches[:3])
                        if len(branches) > 3:
                            branch_text += f' +{len(branches)-3} more'

                        print(f"\n🆕 ═══ NEW RESOURCE ═══")
                        print(f"📚 {title} ({res_type})")
                        send_to_all(
                            f"📚 New {res_type.replace('-', ' ').title()} Added!",
                            f"{title}" + (f" • For: {branch_text}" if branch_text else "")
                        )

                known_ids["resources"] = current_ids

        except Exception as e:
            print(f"❌ Resources watch error: {e}")

        time.sleep(30)


def watch_faculty():
    """Watch 'faculty' collection for new faculty"""
    while True:
        try:
            docs = list(db.collection('faculty').stream())
            current_ids = set(doc.id for doc in docs)

            new_ids = current_ids - known_ids["faculty"]

            if new_ids:
                for doc in docs:
                    if doc.id in new_ids:
                        data = doc.to_dict()
                        name = data.get('name', 'New Faculty')
                        branch = data.get('branch', '')
                        designation = data.get('designation', '')

                        print(f"\n🆕 ═══ NEW FACULTY ═══")
                        print(f"👨‍🏫 {name} - {branch}")
                        send_to_all(
                            f"👨‍🏫 New Faculty Added!",
                            f"{name} ({designation}) - {branch} Department"
                        )

                known_ids["faculty"] = current_ids

        except Exception as e:
            print(f"❌ Faculty watch error: {e}")

        time.sleep(30)


def watch_courses():
    """Watch 'courses' collection for new courses"""
    while True:
        try:
            docs = list(db.collection('courses').stream())
            current_ids = set(doc.id for doc in docs)

            new_ids = current_ids - known_ids["courses"]

            if new_ids:
                for doc in docs:
                    if doc.id in new_ids:
                        data = doc.to_dict()
                        name = data.get('name', 'New Course')
                        code = data.get('code', '')
                        branch = data.get('branch', '')

                        print(f"\n🆕 ═══ NEW COURSE ═══")
                        print(f"📖 {name} ({code})")
                        send_to_all(
                            f"📖 New Course Added!",
                            f"{name} ({code}) - {branch} Branch"
                        )

                known_ids["courses"] = current_ids

        except Exception as e:
            print(f"❌ Courses watch error: {e}")

        time.sleep(30)


def watch_notifications():
    """Watch 'notifications' collection for admin messages to users"""
    while True:
        try:
            docs = list(db.collection('notifications').stream())
            current_ids = set(doc.id for doc in docs)

            new_ids = current_ids - known_ids["notifications"]

            if new_ids:
                for doc in docs:
                    if doc.id in new_ids:
                        data = doc.to_dict()
                        user_id = data.get('userId', '')
                        message = data.get('message', '')
                        msg_type = data.get('type', '')

                        if msg_type == 'admin_message' and user_id:
                            print(f"\n🆕 ═══ NEW ADMIN MESSAGE ═══")
                            print(f"💬 To: {data.get('userName', user_id)}")
                            send_to_user(
                                user_id,
                                f"💬 Message from Admin",
                                message[:100]
                            )

                known_ids["notifications"] = current_ids

        except Exception as e:
            print(f"❌ Notifications watch error: {e}")

        time.sleep(30)


# ══════════════════════════════════════════════════════════════
# 💓 KEEP ALIVE
# ══════════════════════════════════════════════════════════════

def keep_alive():
    render_url = os.environ.get('RENDER_EXTERNAL_URL')

    if not render_url:
        print("⚠️  RENDER_EXTERNAL_URL not set! Self-ping disabled.")
        return

    print(f"💓 Keep-alive started for: {render_url}")

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
            print(f"💓 Keep-alive ping #{ping_count}: OK ({response.status})")
        except Exception as e:
            print(f"💔 Keep-alive ping #{ping_count} failed: {e}")


# ══════════════════════════════════════════════════════════════
# 🌐 WEB SERVER WITH STATUS PAGE
# ══════════════════════════════════════════════════════════════

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()

        collections_info = ""
        for name, ids in known_ids.items():
            emoji = {"updates":"📢","resources":"📚","faculty":"👨‍🏫","courses":"📖","notifications":"💬"}.get(name,"📄")
            collections_info += f"""
                    <div class="stat">
                        <span class="label">{emoji} {name.title()}</span>
                        <span class="value">{len(ids)} docs</span>
                    </div>"""

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>AcadeMe Notifier</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta http-equiv="refresh" content="30">
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
                    color: white; min-height: 100vh; margin: 0;
                    padding: 20px; box-sizing: border-box;
                }}
                .container {{ max-width: 600px; margin: 0 auto; }}
                .card {{
                    background: rgba(255,255,255,0.08);
                    border-radius: 16px; padding: 24px;
                    margin-bottom: 20px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                }}
                .status {{
                    display: inline-block; padding: 6px 16px;
                    background: #10B981; border-radius: 20px;
                    font-weight: bold; font-size: 14px;
                    animation: pulse 2s infinite;
                }}
                @keyframes pulse {{
                    0%, 100% {{ opacity: 1; }}
                    50% {{ opacity: 0.7; }}
                }}
                h1 {{ margin: 0 0 10px; }}
                .stat {{
                    display: flex; justify-content: space-between;
                    padding: 12px 0;
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                }}
                .stat:last-child {{ border: none; }}
                .label {{ color: #aaa; }}
                .value {{ font-weight: bold; color: #60A5FA; }}
                .section-title {{
                    margin: 0 0 12px; font-size: 1.1rem;
                    color: #c7d2fe;
                }}
                .footer {{ text-align: center; color: #555; font-size: 12px; padding: 10px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="card">
                    <span class="status">🟢 RUNNING</span>
                    <h1>🎓 AcadeMe Notifier</h1>
                    <p style="color: #aaa; margin: 0;">Complete Push Notification Service</p>
                </div>

                <div class="card">
                    <h3 class="section-title">📊 Service Stats</h3>
                    <div class="stat">
                        <span class="label">Started At</span>
                        <span class="value">{service_stats['started_at']}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Last Check</span>
                        <span class="value">{service_stats['last_check'] or 'Starting...'}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Notifications Sent</span>
                        <span class="value">{service_stats['notifications_sent']}</span>
                    </div>
                    <div class="stat">
                        <span class="label">Last Notification</span>
                        <span class="value">{service_stats['last_notification'] or 'None yet'}</span>
                    </div>
                    <div class="stat">
                        <span class="label">FCM Tokens</span>
                        <span class="value">{service_stats['total_tokens']}</span>
                    </div>
                </div>

                <div class="card">
                    <h3 class="section-title">👀 Watching Collections</h3>
                    {collections_info}
                </div>

                <div class="footer">
                    <p>Auto-refreshes every 30 seconds</p>
                    <p>© AcadeMe {time.strftime('%Y')}</p>
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
    server = HTTPServer(('0.0.0.0', port), Handler)
    print(f"🌐 Web server running on port {port}")
    print(f"═══════════════════════════════════════════")
    server.serve_forever()


# ══════════════════════════════════════════════════════════════
# 🚀 MAIN - START EVERYTHING
# ══════════════════════════════════════════════════════════════

if __name__ == '__main__':
    print("═══════════════════════════════════════════")
    print("   🎓 AcadeMe Notification Service v2.0")
    print("   📡 Watching ALL Collections")
    print("═══════════════════════════════════════════")

    # ── Step 1: Load all existing data ──
    print("\n📂 Loading existing data...")
    load_existing_ids("updates")
    load_existing_ids("resources")
    load_existing_ids("faculty")
    load_existing_ids("courses")
    load_existing_ids("notifications")
    print(f"✅ Loaded all existing data\n")

    # ── Step 2: Start watcher threads ──
    watchers = [
        ("Updates",       watch_updates),
        ("Resources",     watch_resources),
        ("Faculty",       watch_faculty),
        ("Courses",       watch_courses),
        ("Notifications", watch_notifications),
    ]

    for name, func in watchers:
        t = threading.Thread(target=func, daemon=True, name=f"Watch-{name}")
        t.start()
        print(f"👀 Watching: {name}")

    # ── Step 3: Start keep-alive ──
    keeper = threading.Thread(target=keep_alive, daemon=True, name="KeepAlive")
    keeper.start()
    print("💓 Keep-alive started")

    print(f"\n🔔 Notification triggers:")
    print(f"   📢 New Updates     → All users")
    print(f"   📚 New Resources   → All users")
    print(f"   👨‍🏫 New Faculty     → All users")
    print(f"   📖 New Courses     → All users")
    print(f"   💬 Admin Messages  → Specific user")

    # ── Step 4: Start web server ──
    print(f"\n{'═' * 43}")
    run_server()
