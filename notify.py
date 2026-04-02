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

last_update_id = None
service_stats = {
    "started_at": time.strftime('%Y-%m-%d %H:%M:%S'),
    "notifications_sent": 0,
    "last_check": None,
    "last_notification": None,
    "total_tokens": 0
}

# ══════════════════════════════════════════════════════════════
# 📤 SEND NOTIFICATIONS
# ══════════════════════════════════════════════════════════════

def send_notifications(title, body):
    global service_stats
    try:
        tokens = []

        # Read from fcm_tokens collection
        print("📂 Reading fcm_tokens collection...")
        for doc in db.collection('fcm_tokens').stream():
            token = doc.to_dict().get('token')
            if token and token not in tokens:
                tokens.append(token)
        
        print(f"   Found {len(tokens)} tokens in fcm_tokens")

        # Also read from users collection (fallback)
        print("📂 Reading users collection...")
        users_tokens = 0
        for user in db.collection('users').stream():
            data = user.to_dict()
            token = data.get('fcmToken')
            enabled = data.get('notificationsEnabled', True)
            if token and enabled and token not in tokens:
                tokens.append(token)
                users_tokens += 1
        
        print(f"   Found {users_tokens} additional tokens in users")

        service_stats["total_tokens"] = len(tokens)

        if not tokens:
            print("⚠️  No FCM tokens found! Users need to enable notifications.")
            return

        print(f"📤 Sending notification to {len(tokens)} devices...")
        print(f"   Title: {title}")
        print(f"   Body: {body[:50]}...")

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
                        tag='acade-me-update',
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
            
            if response.failure_count > 0:
                for idx, resp in enumerate(response.responses):
                    if not resp.success:
                        print(f"   ❌ Token failed: {resp.exception}")

        print(f"✅ Sent! Success: {success_total} | Failed: {failure_total}")
        
        service_stats["notifications_sent"] += 1
        service_stats["last_notification"] = time.strftime('%Y-%m-%d %H:%M:%S')

    except Exception as e:
        print(f"❌ Error sending notifications: {e}")
        import traceback
        traceback.print_exc()


# ══════════════════════════════════════════════════════════════
# 👀 WATCH FOR NEW UPDATES
# ══════════════════════════════════════════════════════════════

def watch_updates():
    global last_update_id, service_stats
    print("👀 Watcher thread started!")

    try:
        all_updates = list(db.collection('updates').stream())
        if all_updates:
            all_updates.sort(
                key=lambda x: x.to_dict().get('date', ''),
                reverse=True
            )
            last_update_id = all_updates[0].id
            print(f"📌 Found {len(all_updates)} existing updates")
            print(f"📌 Latest update ID: {last_update_id}")
    except Exception as e:
        print(f"❌ Startup error: {e}")

    check_count = 0
    
    while True:
        try:
            check_count += 1
            service_stats["last_check"] = time.strftime('%Y-%m-%d %H:%M:%S')
            
            if check_count % 10 == 0:
                print(f"🔄 Check #{check_count} at {service_stats['last_check']}")

            all_updates = list(db.collection('updates').stream())

            if all_updates:
                all_updates.sort(
                    key=lambda x: x.to_dict().get('date', ''),
                    reverse=True
                )
                latest = all_updates[0]

                if latest.id != last_update_id:
                    print(f"🆕 ═══════════════════════════════════════")
                    print(f"🆕 NEW UPDATE DETECTED!")
                    print(f"🆕 ═══════════════════════════════════════")
                    
                    last_update_id = latest.id
                    data = latest.to_dict()
                    
                    title = data.get('title', 'New Update!')
                    body = data.get('message', 'Check AcadeMe for updates!')
                    
                    print(f"📋 Title: {title}")
                    print(f"📋 Message: {body}")
                    
                    send_notifications(title, body)

        except Exception as e:
            print(f"❌ Watch error: {e}")
            import traceback
            traceback.print_exc()

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
            <style>
                body {{
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    color: white;
                    min-height: 100vh;
                    margin: 0;
                    padding: 20px;
                    box-sizing: border-box;
                }}
                .container {{ max-width: 600px; margin: 0 auto; }}
                .card {{
                    background: rgba(255,255,255,0.1);
                    border-radius: 16px;
                    padding: 24px;
                    margin-bottom: 20px;
                    backdrop-filter: blur(10px);
                }}
                .status {{
                    display: inline-block;
                    padding: 6px 16px;
                    background: #10B981;
                    border-radius: 20px;
                    font-weight: bold;
                    font-size: 14px;
                }}
                h1 {{ margin: 0 0 10px; }}
                .stat {{
                    display: flex;
                    justify-content: space-between;
                    padding: 12px 0;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
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
                    <h1>AcadeMe Notifier</h1>
                    <p style="color: #aaa; margin: 0;">Push Notification Service</p>
                </div>
                <div class="card">
                    <h3 style="margin-top:0;">📊 Service Stats</h3>
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
                        <span class="label">Total FCM Tokens</span>
                        <span class="value">{service_stats['total_tokens']}</span>
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
    server = HTTPServer(('0.0.0.0', port), Handler)
    print(f"🌐 Web server running on port {port}")
    print(f"═══════════════════════════════════════════")
    server.serve_forever()


# ══════════════════════════════════════════════════════════════
# 🚀 MAIN
# ══════════════════════════════════════════════════════════════

if __name__ == '__main__':
    print("═══════════════════════════════════════════")
    print("   🎓 AcadeMe Notification Service")
    print("═══════════════════════════════════════════")
    
    watcher = threading.Thread(target=watch_updates, daemon=True, name="UpdateWatcher")
    watcher.start()
    print("✅ Update watcher thread started")
    
    keeper = threading.Thread(target=keep_alive, daemon=True, name="KeepAlive")
    keeper.start()
    print("✅ Keep-alive thread started")
    
    run_server()
