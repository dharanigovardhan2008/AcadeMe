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

print("AcadeMe Notification Service Started!")
print("Watching for new updates...")

last_update_id = None

def send_notifications(title, body):
    try:
        users_ref = db.collection('users')
        all_users = users_ref.stream()
        
        tokens = []
        for user in all_users:
            data = user.to_dict()
            token = data.get('fcmToken')
            enabled = data.get('notificationsEnabled', False)
            if token and enabled:
                tokens.append(token)

        if not tokens:
            print("No users with notifications enabled")
            return

        print(f"Sending to {len(tokens)} users...")

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
                tokens=batch,
            )
            response = messaging.send_each_for_multicast(message)
            print(f"Success: {response.success_count} Failed: {response.failure_count}")

    except Exception as e:
        print(f"Error sending notifications: {e}")

def watch_updates():
    global last_update_id
    print("Watcher thread started!")
    while True:
        try:
            updates_ref = db.collection('updates')
            all_updates = list(updates_ref.stream())
            
            if all_updates:
                # Sort by date manually
                all_updates.sort(
                    key=lambda x: x.to_dict().get('date', ''),
                    reverse=True
                )
                latest = all_updates[0]
                
                if latest.id != last_update_id:
                    last_update_id = latest.id
                    data = latest.to_dict()
                    
                    title = data.get('title', 'New Update!')
                    body = data.get('message', 'Check AcadeMe for updates!')
                    
                    print(f"New update: {title}")
                    print(f"Message: {body}")
                    
                    send_notifications(title, body)

        except Exception as e:
            print(f"Watch error: {e}")

        time.sleep(30)

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
    print(f"Web server started on port {port}")
    server.serve_forever()

if __name__ == '__main__':
    thread = threading.Thread(target=watch_updates)
    thread.daemon = True
    thread.start()
    run_server()
```

Commit → Render auto deploys → watch logs for:
```
Watcher thread started!
