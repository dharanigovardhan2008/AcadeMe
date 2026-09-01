import React, { useState, useEffect } from 'react';
import { Bell, X, Loader2 } from 'lucide-react';
import { requestNotificationPermission } from '../firebase';
import { useAuth } from '../context/AuthContext';

const NotificationPrompt = () => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.uid) {
      const permission = Notification.permission;
      // Use sessionStorage so it resets every time they open the app afresh
      const dismissedThisSession = sessionStorage.getItem('notificationPromptDismissed');

      // Show prompt if:
      // - Permission is default (not granted or denied yet)
      // - They haven't dismissed it during this specific browsing session
      if (permission === 'default' && !dismissedThisSession) {
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
        setShow(false);
        showSuccessToast();
      } else {
        setShow(false);
        sessionStorage.setItem('notificationPromptDismissed', 'true');
      }
    } catch (error) {
      console.error('Notification error:', error);
      setShow(false);
      sessionStorage.setItem('notificationPromptDismissed', 'true');
    } finally {
      setLoading(false);
    }
  };

  const handleLater = () => {
    setShow(false);
    // Dismisses it for this session, but will ask again next time they open the app
    sessionStorage.setItem('notificationPromptDismissed', 'true'); 
  };

  const showSuccessToast = () => {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 24px;
      right: 24px;
      background: rgba(255, 255, 255, 0.9);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      border: 1px solid rgba(255,255,255,1);
      color: #111827;
      padding: 14px 20px;
      border-radius: 999px;
      box-shadow: 0 10px 40px -10px rgba(0,0,0,0.15);
      z-index: 10001;
      display: flex;
      align-items: center;
      gap: 12px;
      animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    `;
    toast.innerHTML = `
      <div style="background: #10B981; border-radius: 50%; padding: 4px; display: flex;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <span style="font-weight: 700; font-size: 0.95rem;">Notifications Enabled</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'slideOutRight 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards';
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  };

  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translate(-50%, 30px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes slideOutRight {
          from { opacity: 1; transform: translateX(0); }
          to { opacity: 0; transform: translateX(50px); }
        }

        .compact-prompt-container {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          width: 90%;
          max-width: 400px;
          animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
        }

        .compact-prompt-card {
          background: linear-gradient(135deg, rgba(30, 30, 45, 0.85) 0%, rgba(20, 20, 35, 0.95) 100%);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 28px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255,255,255,0.05) inset;
        }

        .prompt-icon-wrapper {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .prompt-text-content {
          flex: 1;
          min-width: 0;
        }

        .prompt-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0 0 4px 0;
          white-space: nowrap;
        }

        .prompt-desc {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .prompt-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .btn-prompt-enable {
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
          gap: 6px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .btn-prompt-enable:hover:not(:disabled) {
          transform: scale(1.05);
          background: #F9FAFB;
        }

        .btn-prompt-enable:active:not(:disabled) {
          transform: scale(0.95);
        }

        .btn-prompt-enable:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-prompt-close {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.2s;
        }

        .btn-prompt-close:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
        }

        @media (max-width: 480px) {
          .compact-prompt-container {
            bottom: 20px;
            width: 92%;
          }
          .compact-prompt-card {
            padding: 14px;
            gap: 12px;
            border-radius: 24px;
          }
          .prompt-desc {
            white-space: normal;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
          }
          .btn-prompt-enable {
            padding: 8px 12px;
          }
        }
      `}</style>

      <div className="compact-prompt-container">
        <div className="compact-prompt-card">
          
          <div className="prompt-icon-wrapper">
            <Bell size={20} color="#FFFFFF" style={{ animation: 'swing 2s infinite ease-in-out' }} />
          </div>
          
          <div className="prompt-text-content">
            <h4 className="prompt-title">Stay Updated</h4>
            <p className="prompt-desc">Turn on alerts for important updates.</p>
          </div>

          <div className="prompt-actions">
            <button 
              className="btn-prompt-enable" 
              onClick={handleEnable} 
              disabled={loading}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Turn On'}
            </button>
            <button 
              className="btn-prompt-close" 
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