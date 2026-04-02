import React, { useState, useEffect } from 'react';
import { Bell, X, Check } from 'lucide-react';
import { requestNotificationPermission } from '../firebase';
import { useAuth } from '../context/AuthContext';

const NotificationPrompt = () => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Only show if user is logged in and hasn't been asked before
    if (user?.uid) {
      const hasAsked = localStorage.getItem('notificationPromptShown');
      const permission = Notification.permission;

      // Show prompt if:
      // - User hasn't been asked before
      // - Permission is default (not granted or denied)
      if (!hasAsked && permission === 'default') {
        // Show after 3 seconds (let user settle in)
        const timer = setTimeout(() => {
          setShow(true);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }
  }, [user?.uid]);

  const handleEnable = async () => {
    setLoading(true);

    try {
      const token = await requestNotificationPermission(user.uid);

      if (token) {
        // Success!
        setShow(false);
        localStorage.setItem('notificationPromptShown', 'true'); // ✅ Never show again

        // Show success message
        showSuccessToast();
      } else {
        // User denied or error
        setShow(false);
        localStorage.setItem('notificationPromptShown', 'true'); // ✅ Never show again
      }
    } catch (error) {
      console.error('Notification error:', error);
      setShow(false);
      localStorage.setItem('notificationPromptShown', 'true'); // ✅ Never show again
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('notificationPromptShown', 'true'); // ✅ Never show again
  };

  const handleLater = () => {
    setShow(false);
    localStorage.setItem('notificationPromptShown', 'true'); // ✅ CHANGED: Now saves, so never shows again
  };

  // ✅ NEW: Also save when clicking outside
  const handleOverlayClick = () => {
    setShow(false);
    localStorage.setItem('notificationPromptShown', 'true'); // ✅ Never show again
  };

  const showSuccessToast = () => {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #10B981 0%, #059669 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 10001;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideInRight 0.3s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    toast.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span style="font-weight: 600;">Notifications Enabled!</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  };

  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideOutRight {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .notification-prompt-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .notification-prompt-card {
          background: linear-gradient(
            135deg,
            rgba(30, 30, 50, 0.95) 0%,
            rgba(20, 20, 40, 0.98) 100%
          );
          border-radius: 24px;
          padding: 32px;
          max-width: 440px;
          width: 100%;
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          animation: slideUp 0.4s ease;
          position: relative;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .bell-icon-wrapper {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          animation: pulse 2s infinite;
          box-shadow: 0 8px 32px rgba(59, 130, 246, 0.4);
        }

        .prompt-title {
          font-size: 24px;
          font-weight: 700;
          color: white;
          text-align: center;
          margin: 0 0 12px;
          background: linear-gradient(135deg, #fff 0%, #e0e7ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .prompt-description {
          font-size: 15px;
          color: rgba(255, 255, 255, 0.7);
          text-align: center;
          line-height: 1.6;
          margin: 0 0 28px;
        }

        .benefits-list {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 24px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 0;
          color: rgba(255, 255, 255, 0.85);
          font-size: 14px;
        }

        .benefit-icon {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(59, 130, 246, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .button-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn-enable {
          background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
        }

        .btn-enable:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(59, 130, 246, 0.4);
        }

        .btn-enable:active {
          transform: translateY(0);
        }

        .btn-enable:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .btn-secondary {
          background: transparent;
          color: rgba(255, 255, 255, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 12px 24px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.8);
          border-color: rgba(255, 255, 255, 0.25);
        }

        .close-button {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.1);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 500px) {
          .notification-prompt-card {
            padding: 24px;
          }

          .bell-icon-wrapper {
            width: 64px;
            height: 64px;
          }

          .prompt-title {
            font-size: 20px;
          }

          .prompt-description {
            font-size: 14px;
          }
        }
      `}</style>

      {/* ✅ CHANGED: onClick now saves to localStorage */}
      <div className="notification-prompt-overlay" onClick={handleOverlayClick}>
        <div className="notification-prompt-card" onClick={(e) => e.stopPropagation()}>
          
          {/* Close button */}
          <button className="close-button" onClick={handleDismiss} aria-label="Close">
            <X size={18} color="rgba(255,255,255,0.6)" />
          </button>

          {/* Bell icon */}
          <div className="bell-icon-wrapper">
            <Bell size={36} color="white" />
          </div>

          {/* Title */}
          <h2 className="prompt-title">Stay Updated!</h2>

          {/* Description */}
          <p className="prompt-description">
            Enable notifications to get instant updates about important announcements, new resources, and messages.
          </p>

          {/* Benefits */}
          <div className="benefits-list">
            <div className="benefit-item">
              <div className="benefit-icon">
                <Check size={12} color="#3B82F6" />
              </div>
              <span>📢 New updates & announcements</span>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">
                <Check size={12} color="#3B82F6" />
              </div>
              <span>📚 Fresh study resources</span>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">
                <Check size={12} color="#3B82F6" />
              </div>
              <span>💬 Personal messages from admin</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="button-group">
            <button
              className="btn-enable"
              onClick={handleEnable}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" />
                  <span>Enabling...</span>
                </>
              ) : (
                <>
                  <Bell size={20} />
                  <span>Enable Notifications</span>
                </>
              )}
            </button>

            <button className="btn-secondary" onClick={handleLater}>
              No Thanks
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationPrompt;
