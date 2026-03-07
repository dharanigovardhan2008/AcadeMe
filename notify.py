import firebase_admin
from firebase_admin import credentials, firestore, messaging
import time
from datetime import datetime

# Initialize Firebase Admin
cred = credentials.Certificate('serviceAccount.json')
firebase_admin.initialize_app(cred)

db = firestore.client()

print("🚀 AcadeMe Notification Service Started!")
print("👂 Watching for new announcements...")

last_announcement_id = None

def send_notifications(title, body):
    try:
        # Get all FCM tokens from users
        users = db.collection('users').where('notificationsEnabled', '==', True).stream()
        tokens = []
        for user in users:
            data = user.to_dict()
            token = data.get('fcmToken')
            if token:
                tokens.append(token)

        if not tokens:
            print("⚠️ No users with notifications enabled")
            return

        print(f"📤 Sending to {len(tokens)} users...")

        # Send in batches of 500
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
            print(f"✅ Sent: {response.success_count} | Failed: {response.failure_count}")

    except Exception as e:
        print(f"❌ Error sending notifications: {e}")

def watch_announcements():
    global last_announcement_id
    
    while True:
        try:
            # Get latest announcement
            announcements = db.collection('announcements')\
                .order_by('timestamp', direction=firestore.Query.DESCENDING)\
                .limit(1)\
                .stream()

            for announcement in announcements:
                if announcement.id != last_announcement_id:
                    last_announcement_id = announcement.id
                    data = announcement.to_dict()
                    
                    title = data.get('title', 'New Update from AcadeMe')
                    body = data.get('message', 'Check the app for latest updates')
                    
                    print(f"\n🔔 New announcement: {title}")
                    print(f"📝 Message: {body}")
                    print(f"⏰ Time: {datetime.now().strftime('%H:%M:%S')}")
                    
                    send_notifications(title, body)

        except Exception as e:
            print(f"❌ Error watching announcements: {e}")

        time.sleep(30)

if __name__ == '__main__':
    watch_announcements()
```

Commit ✅

---

**Then create `requirements.txt` → paste this:**
```
firebase-admin==6.4.0
