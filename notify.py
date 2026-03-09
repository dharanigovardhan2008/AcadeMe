import firebase_admin
from firebase_admin import credentials, firestore, messaging
import time
import os
import json
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

# Initialize Firebase
cred_json = os.environ.get('GOOGLE_CREDENTIALS_JSON')
if not cred_json:
    raise Exception("GOOGLE_CREDENTIALS_JSON env var is missing!")

cred_dict = json.loads(cred_json)
cred = credentials.Certificate(cred_dict)
firebase_admin.initialize_app(cred)
db = firestore.client()

print("AcadeMe Notification Service Started!")

last_update_id = None

def send_notifications(title, body):
    try:
        # ✅ Read from fcm_tokens collection (where firebase-messaging.js saves them)
        tokens_ref = db.collection('fcm_tokens')
        all_tokens = tokens_ref.stream()

        tokens = []
        for doc in all_tokens:
            data = doc.to_dict()
            token = data.get('token')
            if token:
                tokens.append(token)

        if not tokens:
            print("No FCM tokens found")
            return

        print(f"Sending to {len(tokens)} devices...")

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

    # ✅ Set last_update_id on startup without sending notification
    try:
        updates_ref = db.collection('updates')
        all_updates = list(updates_ref.stream())
        if all_updates:
            all_updates.sort(
                key=lambda x: x.to_dict().get('createdAt', ''),
                reverse=True
            )
            last_update_id = all_updates[0].id
            print(f"Startup: skipping existing update {last_update_id}")
    except Exception as e:
        print(f"Startup error: {e}")

    while True:
        try:
            updates_ref = db.collection('updates')
            all_updates = list(updates_ref.stream())

            if all_updates:
                all_updates.sort(
                    key=lambda x: x.to_dict().get('createdAt', ''),
                    reverse=True
                )
                latest = all_updates[0]

                if latest.id != last_update_id:
                    last_update_id = latest.id
                    data = latest.to_dict()

                    title = data.get('title', 'New Update!')
                    body = data.get('message', 'Check AcadeMe for updates!')

                    print(f"New update detected: {title}")
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
    print(f"Web server running on port {port}")
    server.serve_forever()

if __name__ == '__main__':
    thread = threading.Thread(target=watch_updates)
    thread.daemon = True
    thread.start()
    run_server()
