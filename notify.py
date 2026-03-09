import firebase_admin
from firebase_admin import credentials, firestore, messaging
import time
import os
import json
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler

# ----------------------------
# Initialize Firebase
# ----------------------------
cred_json = os.environ.get("GOOGLE_CREDENTIALS_JSON")

if not cred_json:
    raise Exception("GOOGLE_CREDENTIALS_JSON environment variable not found")

cred_dict = json.loads(cred_json)

cred = credentials.Certificate(cred_dict)
firebase_admin.initialize_app(cred)

db = firestore.client()

print("AcadeMe Notification Service Started!")
print("Watching Firestore for updates...")

last_update_id = None


# ----------------------------
# Send notifications
# ----------------------------
def send_notifications(title, body):
    try:
        users_ref = db.collection("users")
        users = users_ref.stream()

        tokens = []

        for user in users:
            data = user.to_dict()
            token = data.get("fcmToken")
            enabled = data.get("notificationsEnabled", False)

            if token and enabled:
                tokens.append(token)

        if not tokens:
            print("No users with notifications enabled")
            return

        print(f"Sending notifications to {len(tokens)} users")

        # Send in batches (FCM limit = 500)
        for i in range(0, len(tokens), 500):

            batch = tokens[i:i + 500]

            message = messaging.MulticastMessage(
                notification=messaging.Notification(
                    title=title,
                    body=body
                ),
                android=messaging.AndroidConfig(
                    priority="high",
                    notification=messaging.AndroidNotification(
                        sound="default",
                        color="#1a73e8"
                    )
                ),
                tokens=batch
            )

            response = messaging.send_each_for_multicast(message)

            print(
                f"Success: {response.success_count} | Failed: {response.failure_count}"
            )

    except Exception as e:
        print("Notification error:", e)


# ----------------------------
# Watch Firestore updates
# ----------------------------
def watch_updates():
    global last_update_id

    print("Watcher thread started")

    while True:

        try:
            updates_ref = db.collection("updates")
            updates = list(updates_ref.stream())

            if updates:

                updates.sort(
                    key=lambda x: x.to_dict().get("date", ""),
                    reverse=True
                )

                latest = updates[0]

                if latest.id != last_update_id:

                    last_update_id = latest.id
                    data = latest.to_dict()

                    title = data.get("title", "New Update!")
                    body = data.get("message", "Check AcadeMe for updates!")

                    print("New update detected")
                    print("Title:", title)

                    send_notifications(title, body)

        except Exception as e:
            print("Watcher error:", e)

        time.sleep(30)


# ----------------------------
# Web server for Render port binding
# ----------------------------
class Handler(BaseHTTPRequestHandler):

    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"AcadeMe Notification Service Running")

    def log_message(self, format, *args):
        return


def run_server():

    port = int(os.environ.get("PORT", 8080))

    server = HTTPServer(("0.0.0.0", port), Handler)

    print(f"Web server started on port {port}")

    server.serve_forever()


# ----------------------------
# Start application
# ----------------------------
if __name__ == "__main__":

    watcher_thread = threading.Thread(target=watch_updates)
    watcher_thread.daemon = True
    watcher_thread.start()

    run_server()
