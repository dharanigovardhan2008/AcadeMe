
import React, { useEffect, useState } from "react";
import { Bell, X, Loader2 } from "lucide-react";
import { requestNotificationPermission } from "../firebase";
import { useAuth } from "../context/AuthContext";

const NotificationPrompt = () => {
  const { user } = useAuth();

  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;

    // Check browser support
    if (!("Notification" in window)) {
      console.warn("❌ Browser notifications are not supported.");
      return;
    }

    const permission = Notification.permission;

    /*
     * If notifications were already allowed:
     * silently refresh/register the FCM token.
     */
    if (permission === "granted") {
      console.log("🔔 Notification permission already granted.");

      requestNotificationPermission(user.uid)
        .then((token) => {
          if (token) {
            console.log(
              "✅ FCM token registered successfully."
            );
          } else {
            console.warn(
              "⚠️ Permission granted, but no FCM token was returned."
            );
          }
        })
        .catch((error) => {
          console.error(
            "❌ Failed to register FCM token:",
            error
          );
        });

      return;
    }

    /*
     * If permission was denied, browsers normally require
     * the user to manually enable notifications from settings.
     */
    if (permission === "denied") {
      console.warn(
        "⚠️ Notifications are blocked in browser settings."
      );
      return;
    }

    /*
     * Permission is "default".
     * Show our custom AcadeMe prompt once per session.
     */
    const dismissedThisSession =
      sessionStorage.getItem(
        "notificationPromptDismissed"
      );

    if (dismissedThisSession) return;

    const timer = setTimeout(() => {
      setShow(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, [user?.uid]);

  // ============================================================
  // ENABLE NOTIFICATIONS
  // ============================================================

  const handleEnable = async () => {
    if (!user?.uid || loading) return;

    setLoading(true);

    try {
      console.log(
        "🔔 Requesting AcadeMe notification permission..."
      );

      const token =
        await requestNotificationPermission(
          user.uid
        );

      if (token) {
        console.log(
          "✅ AcadeMe notifications successfully enabled."
        );

        sessionStorage.removeItem(
          "notificationPromptDismissed"
        );

        setShow(false);

        showSuccessToast();
      } else {
        console.warn(
          "⚠️ No FCM token received."
        );

        setShow(false);

        sessionStorage.setItem(
          "notificationPromptDismissed",
          "true"
        );
      }
    } catch (error) {
      console.error(
        "❌ Notification setup failed:",
        error
      );

      setShow(false);

      sessionStorage.setItem(
        "notificationPromptDismissed",
        "true"
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // LATER
  // ============================================================

  const handleLater = () => {
    setShow(false);

    sessionStorage.setItem(
      "notificationPromptDismissed",
      "true"
    );
  };

  // ============================================================
  // SUCCESS TOAST
  // ============================================================

  const showSuccessToast = () => {
    const toast = document.createElement("div");

    toast.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;

      background: rgba(255, 255, 255, 0.94);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);

      border: 1px solid rgba(255, 255, 255, 1);

      color: #111827;

      padding: 14px 20px;

      border-radius: 999px;

      box-shadow:
        0 10px 40px -10px rgba(0, 0, 0, 0.15);

      z-index: 10001;

      display: flex;
      align-items: center;
      gap: 12px;

      animation:
        acadeMeSlideIn
        0.4s
        cubic-bezier(0.16, 1, 0.3, 1);

      font-family:
        'DM Sans',
        -apple-system,
        BlinkMacSystemFont,
        sans-serif;
    `;

    toast.innerHTML = `
      <div
        style="
          background: #10B981;
          border-radius: 50%;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
        "
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          stroke-width="3"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>

      <span
        style="
          font-weight: 700;
          font-size: 0.95rem;
        "
      >
        Notifications Enabled
      </span>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation =
        "acadeMeSlideOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards";

      setTimeout(() => {
        toast.remove();
      }, 400);
    }, 3500);
  };

  // ============================================================
  // HIDDEN
  // ============================================================

  if (!show) return null;

  // ============================================================
  // UI
  // ============================================================

  return (
    <>
      <style>{`
        @keyframes acadeMeSlideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 30px);
          }

          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        @keyframes acadeMeSlideIn {
          from {
            opacity: 0;
            transform: translateX(50px);
          }

          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes acadeMeSlideOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }

          to {
            opacity: 0;
            transform: translateX(50px);
          }
        }

        @keyframes acadeMeBellSwing {
          0% {
            transform: rotate(0deg);
          }

          10% {
            transform: rotate(12deg);
          }

          20% {
            transform: rotate(-12deg);
          }

          30% {
            transform: rotate(8deg);
          }

          40% {
            transform: rotate(-8deg);
          }

          50% {
            transform: rotate(0deg);
          }

          100% {
            transform: rotate(0deg);
          }
        }

        .acadeMe-notification-container {
          position: fixed;

          bottom: 30px;
          left: 50%;

          transform: translateX(-50%);

          z-index: 9999;

          width: 90%;
          max-width: 400px;

          animation:
            acadeMeSlideUp
            0.5s
            cubic-bezier(0.16, 1, 0.3, 1);

          font-family:
            'DM Sans',
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            sans-serif;
        }

        .acadeMe-notification-card {
          background:
            linear-gradient(
              135deg,
              rgba(30, 30, 45, 0.90) 0%,
              rgba(20, 20, 35, 0.97) 100%
            );

          backdrop-filter:
            blur(20px) saturate(180%);

          -webkit-backdrop-filter:
            blur(20px) saturate(180%);

          border:
            1px solid rgba(255, 255, 255, 0.15);

          border-radius: 28px;

          padding: 16px 20px;

          display: flex;

          align-items: center;

          gap: 16px;

          box-shadow:
            0 20px 40px rgba(0, 0, 0, 0.2),
            0 0 0 1px
              rgba(255, 255, 255, 0.05) inset;
        }

        .acadeMe-notification-icon {
          width: 44px;
          height: 44px;

          border-radius: 50%;

          background:
            linear-gradient(
              135deg,
              #3B82F6 0%,
              #8B5CF6 100%
            );

          display: flex;

          align-items: center;
          justify-content: center;

          flex-shrink: 0;

          box-shadow:
            0 4px 12px
              rgba(59, 130, 246, 0.3);
        }

        .acadeMe-notification-icon svg {
          animation:
            acadeMeBellSwing
            2.5s
            infinite
            ease-in-out;
        }

        .acadeMe-notification-text {
          flex: 1;
          min-width: 0;
        }

        .acadeMe-notification-title {
          font-size: 0.95rem;

          font-weight: 700;

          color: #FFFFFF;

          margin: 0 0 4px 0;

          white-space: nowrap;
        }

        .acadeMe-notification-description {
          font-size: 0.8rem;

          color:
            rgba(255, 255, 255, 0.7);

          margin: 0;

          line-height: 1.4;

          white-space: nowrap;

          overflow: hidden;

          text-overflow: ellipsis;
        }

        .acadeMe-notification-actions {
          display: flex;

          align-items: center;

          gap: 8px;

          flex-shrink: 0;
        }

        .acadeMe-enable-button {
          background: #FFFFFF;

          color: #111827;

          border: none;

          padding: 8px 16px;

          border-radius: 999px;

          font-size: 0.85rem;

          font-weight: 700;

          cursor: pointer;

          display: flex;

          align-items: center;

          justify-content: center;

          gap: 6px;

          transition:
            transform 0.2s
              cubic-bezier(0.16, 1, 0.3, 1),
            background 0.2s,
            opacity 0.2s;
        }

        .acadeMe-enable-button:hover:not(:disabled) {
          transform: scale(1.05);

          background: #F9FAFB;
        }

        .acadeMe-enable-button:active:not(:disabled) {
          transform: scale(0.95);
        }

        .acadeMe-enable-button:disabled {
          opacity: 0.7;

          cursor: not-allowed;
        }

        .acadeMe-close-button {
          background:
            rgba(255, 255, 255, 0.1);

          border: none;

          width: 32px;
          height: 32px;

          border-radius: 50%;

          display: flex;

          align-items: center;
          justify-content: center;

          cursor: pointer;

          color:
            rgba(255, 255, 255, 0.7);

          transition:
            background 0.2s,
            color 0.2s;
        }

        .acadeMe-close-button:hover {
          background:
            rgba(255, 255, 255, 0.2);

          color: #FFFFFF;
        }

        @media (max-width: 480px) {
          .acadeMe-notification-container {
            bottom: 20px;

            width: 92%;
          }

          .acadeMe-notification-card {
            padding: 14px;

            gap: 12px;

            border-radius: 24px;
          }

          .acadeMe-notification-icon {
            width: 40px;
            height: 40px;
          }

          .acadeMe-notification-description {
            white-space: normal;

            display: -webkit-box;

            -webkit-line-clamp: 2;

            -webkit-box-orient: vertical;
          }

          .acadeMe-enable-button {
            padding: 8px 12px;
          }
        }
      `}</style>

      <div className="acadeMe-notification-container">

        <div className="acadeMe-notification-card">

          <div className="acadeMe-notification-icon">
            <Bell
              size={20}
              color="#FFFFFF"
            />
          </div>

          <div className="acadeMe-notification-text">

            <h4 className="acadeMe-notification-title">
              Stay Updated
            </h4>

            <p className="acadeMe-notification-description">
              Turn on alerts for important updates.
            </p>

          </div>

          <div className="acadeMe-notification-actions">

            <button
              type="button"
              className="acadeMe-enable-button"
              onClick={handleEnable}
              disabled={loading}
            >
              {loading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                "Turn On"
              )}
            </button>

            <button
              type="button"
              className="acadeMe-close-button"
              onClick={handleLater}
              aria-label="Not now"
            >
              <X size={16} />
            </button>

          </div>

        </div>

      </div>
    </>
  );
};

export default NotificationPrompt;

