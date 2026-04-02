import firebase_admin
from firebase_admin import credentials, firestore, messaging
import time
import os
import json
import threading
import urllib.request
from http.server import HTTPServer, BaseHTTPRequestHandler
import sys
import traceback

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

known_ids = {
    "updates": set(),
    "resources": set(),
    "notifications": set(),
}

service_stats = {
    "started_at": time.strftime('%Y-%m-%d %H:%M:%S'),
    "notifications_sent": 0,
    "last_check": None,
    "last_notification": None,
    "total_tokens": 0,
}

# ══════════════════════════════════════════════════════════════
# 📤 SEND NOTIFICATIONS
# ══════════════════════════════════════════════════════════════

def get_all_tokens():
    """Get all FCM tokens from both collections"""
    tokens = []

    try:
        for doc in db.collection('fcm_tokens').stream():
            token = doc.to_dict().get('token')
            if token and token not in tokens:
                tokens.append(token)
    except Exception as e:
        print(f"   ⚠️ Error reading fcm_tokens: {e}")

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

        print(f"✅ Done! Success: {success_total} | Failed: {failure_total}")

        service_stats["notifications_sent"] += 1
        service_stats["last_notification"] = time.strftime('%Y-%m-%d %H:%M:%S')

    except Exception as e:
        print(f"❌ Send error: {e}")
        traceback.print_exc()


def send_to_user(user_id, title, body):
    """Send notification to specific user"""
    try:
        tokens = []

        try:
            doc = db.collection('fcm_tokens').document(user_id).get()
            if doc.exists:
                token = doc.to_dict().get('token')
                if token:
                    tokens.append(token)
        except:
            pass

        try:
            doc = db.collection('users').document(user_id).get()
            if doc.exists:
                token = doc.to_dict().get('fcmToken')
                if token and token not in tokens:
                    tokens.append(token)
        except:
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
                webpush=messaging.WebpushConfig(
                    notification=messaging.WebpushNotification(
                        title=title,
                        body=body,
                        icon='/icon-192.png',
                        badge='/badge-96.png',
                    ),
                    fcm_options=messaging.WebpushFCMOptions(
                        link='https://acade-me.vercel.app'
                    )
                ),
                token=token,
            )
            messaging.send(message)

        print(f"✅ Sent to user {user_id}")

    except Exception as e:
        print(f"❌ Error: {e}")


# ══════════════════════════════════════════════════════════════
# 👀 WATCHERS
# ══════════════════════════════════════════════════════════════

def load_existing_ids(collection_name):
    """Load existing IDs on startup"""
    try:
        docs = list(db.collection(collection_name).stream())
        ids = set(doc.id for doc in docs)
        known_ids[collection_name] = ids
        print(f"   📂 {collection_name}: {len(ids)} existing")
        return docs
    except Exception as e:
        print(f"   ❌ Error loading {collection_name}: {e}")
        return []


def watch_updates():
    """Watch for new admin updates"""
    while True:
        try:
            docs = list(db.collection('updates').stream())
            current_ids = set(doc.id for doc in docs)
            new_ids = current_ids - known_ids["updates"]

            if new_ids:
                for doc in docs:
                    if doc.id in new_ids:
                        data = doc.to_dict()
                        title = data.get('title', 'New Update!')
                        body = data.get('message', 'Check AcadeMe!')

                        print(f"\n🆕 ═══ NEW UPDATE ═══")
                        print(f"📢 {title}")
                        send_to_all(f"📢 {title}", body)

                known_ids["updates"] = current_ids

        except Exception as e:
            print(f"❌ Updates watch error: {e}")

        time.sleep(30)


def watch_resources():
    """Watch for new resources"""
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
                        
                        branch_text = ', '.join(branches[:2])
                        if len(branches) > 2:
                            branch_text += f' +{len(branches)-2} more'

                        print(f"\n🆕 ═══ NEW RESOURCE ═══")
                        print(f"📚 {title}")
                        
                        send_to_all(
                            f"📚 New {res_type.replace('-', ' ').title()}!",
                            f"{title}" + (f" • {branch_text}" if branch_text else "")
                        )

                known_ids["resources"] = current_ids

        except Exception as e:
            print(f"❌ Resources watch error: {e}")

        time.sleep(30)


def watch_notifications():
    """Watch for admin messages to users"""
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
                            print(f"\n🆕 ═══ ADMIN MESSAGE ═══")
                            print(f"💬 To: {data.get('userName', user_id)}")
                            send_to_user(
                                user_id,
                                "💬 Message from Admin",
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
                    <p style="color: #aaa;">Free Push Notification Service</p>
                </div>
                <div class="card">
                    <h3 style="margin-top:0;">📊 Stats</h3>
                    <div class="stat">
                        <span class="label">Started</span>
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
                        <span class="label">FCM Tokens</span>
                        <span class="value">{service_stats['total_tokens']}</span>
                    </div>
                </div>
                <div class="card">
                    <h3 style="margin-top:0;">🔔 Triggers</h3>
                    <div style="color: #aaa; font-size: 0.9rem;">
                        <p>📢 New Updates → All users</p>
                        <p>📚 New Resources → All users</p>
                        <p>💬 Admin Messages → Specific user</p>
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
        print("\n📂 Loading existing data...")
        load_existing_ids("updates")
        load_existing_ids("resources")
        load_existing_ids("notifications")

        watchers = [
            ("Updates", watch_updates),
            ("Resources", watch_resources),
            ("Messages", watch_notifications),
        ]

        for name, func in watchers:
            t = threading.Thread(target=func, daemon=True, name=f"Watch-{name}")
            t.start()
            print(f"👀 Watching: {name}")

        keeper = threading.Thread(target=keep_alive, daemon=True)
        keeper.start()
        print("💓 Keep-alive started\n")

        print("🔔 Notifications enabled for:")
        print("   📢 Updates")
        print("   📚 Resources")
        print("   💬 Admin Messages\n")

        run_server()
        
    except Exception as e:
        print(f"\n❌ FATAL ERROR in main:")
        print(f"   {type(e).__name__}: {e}")
        traceback.print_exc()
        sys.exit(1)
