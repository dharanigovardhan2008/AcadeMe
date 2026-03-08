import firebase_admin
from firebase_admin import credentials, firestore, messaging
import time
import os
import json
import threading
from datetime import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler

# Initialize Firebase
cred_json = os.environ.get('GOOGLE_CREDENTIALS_JSON')
cred_dict = json.loads(cred_json)
cred = credentials.Certificate(cred_dict)
firebase_admin.initialize_app(cred)
db = firestore.client()

print("🚀 AcadeMe Notification Service Started!")
print("👂 Watching for new updates...")

last_update_id = None

def send_notifications(title, body):
    try:
        users = db.collection('users').where(
            'notificationsEnabled', '==', True
        ).stream()
        
        tokens = []
        for user in users:
            data = user.to_dict()
            token = data.get('fcmToken')
            if token:
                tokens.append(token)

        if not tokens:
            print("⚠️ No users with notifications enabled yet")
            return

        print(f"📤 Sending to {len(tokens)} users...")

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
                        icon='icon-192.png',
                        color='#1a73e8',
                        sound='default',
                    ),
                ),
                tokens=batch,
            )
            response = messaging.send_each_for_multicast(message)
            print(f"✅ Success: {response.success_count} | Failed: {response.failure_count}")

    except Exception as e:
        print(f"❌ Error sending notifications: {e}")

def watch_updates():
    global last_update_id
    while True:
        try:
            updates = db.collection('updates')\
                .order_by('date', direction=firestore.Query.DESCENDING)\
                .limit(1)\
                .stream()

            for update in updates:
                if update.id != last_update_id:
                    last_update_id = update.id
                    data = update.to_dict()
                    
                    title = data.get('title', 'New Update from AcadeMe!')
                    body = data.get('message', 'Check AcadeMe for latest updates!')
                    
                    print(f"\n🔔 New update detected: {title}")
                    print(f"📝 Message: {body}")
                    print(f"⏰ Time: {datetime.now().strftime('%H:%M:%S')}")
                    
                    send_notifications(title, body)

        except Exception as e:
            print(f"❌ Watch error: {e}")

        time.sleep(30)

# Simple web server to keep Render free tier alive
class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'AcadeMe Notifier is Running!')
    def log_message(self, format, *args):
        pass

def run_server():
    port = int(os.environ.get('PORT', 8080))
    server = HTTPServer(('0.0.0.0', port), Handler)
    print(f"🌐 Web server started on port {port}")
    server.serve_forever()

if __name__ == '__main__':
    # Run notification watcher in background thread
    thread = threading.Thread(target=watch_updates)
    thread.daemon = True
    thread.start()
    
    # Run web server to keep Render free tier alive
    run_server()
