import React, { useState, useEffect } from "react";

const DownloadAppBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const alreadyDismissed = sessionStorage.getItem("install_banner_dismissed");
    if (alreadyDismissed) return;

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 1500);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    const isAndroid = /Android/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isAndroid && !isStandalone) {
      setTimeout(() => setShowBanner(true), 2000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setInstalled(true);
        setTimeout(() => setShowBanner(false), 1500);
      } else {
        setInstalling(false);
      }
      setDeferredPrompt(null);
    } else {
      window.open(
        "https://github.com/dharanigovardhan2008/AcadeMe/releases/download/v1/AcadeMe.apk",
        "_blank"
      );
      setInstalled(true);
      setTimeout(() => setShowBanner(false), 1500);
    }
  };

  const handleLater = () => {
    setDismissed(true);
    setShowBanner(false);
    sessionStorage.setItem("install_banner_dismissed", "true");
  };

  if (!showBanner || dismissed) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap');

        @keyframes playstore-slide {
          0%   { transform: translateY(120px); opacity: 0; }
          60%  { transform: translateY(-6px);  opacity: 1; }
          100% { transform: translateY(0px);   opacity: 1; }
        }

        @keyframes ripple {
          0%   { transform: scale(0); opacity: 0.4; }
          100% { transform: scale(4); opacity: 0; }
        }

        @keyframes checkmark-pop {
          0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
          60%  { transform: scale(1.2) rotate(3deg);  opacity: 1; }
          100% { transform: scale(1) rotate(0deg);    opacity: 1; }
        }

        .ps-banner-wrap {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          z-index: 99999;
          animation: playstore-slide 0.5s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
          font-family: 'Google Sans', 'Roboto', sans-serif;
        }

        .ps-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 99998;
          animation: fadeIn 0.3s ease forwards;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .ps-sheet {
          background: #1f1f1f;
          border-radius: 28px 28px 0 0;
          padding: 12px 0 0 0;
          box-shadow: 0 -4px 32px rgba(0,0,0,0.6);
          overflow: hidden;
          position: relative;
        }

        .ps-handle {
          width: 36px; height: 4px;
          background: rgba(255,255,255,0.2);
          border-radius: 2px;
          margin: 0 auto 16px;
        }

        .ps-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 0 20px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }

        .ps-icon-wrap {
          width: 64px; height: 64px;
          border-radius: 16px;
          overflow: hidden;
          flex-shrink: 0;
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 16px rgba(79,70,229,0.45);
          position: relative;
        }

        .ps-icon-wrap img {
          width: 100%; height: 100%; object-fit: cover;
        }

        .ps-app-info { flex: 1; min-width: 0; }

        .ps-app-name {
          font-size: 17px;
          font-weight: 700;
          color: #fff;
          letter-spacing: 0.1px;
          margin-bottom: 2px;
        }

        .ps-app-dev {
          font-size: 12px;
          color: rgba(255,255,255,0.45);
          margin-bottom: 6px;
        }

        .ps-badges {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .ps-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(255,255,255,0.07);
          border-radius: 20px;
          padding: 3px 8px;
          font-size: 11px;
          color: rgba(255,255,255,0.6);
          font-weight: 500;
        }

        .ps-badge-star { color: #fbbc04; }
        .ps-badge-dot  { width: 3px; height: 3px; border-radius: 50%; background: rgba(255,255,255,0.3); }

        .ps-stats {
          display: flex;
          padding: 14px 20px;
          gap: 0;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }

        .ps-stat {
          flex: 1;
          text-align: center;
          position: relative;
        }

        .ps-stat + .ps-stat::before {
          content: '';
          position: absolute;
          left: 0; top: 15%; bottom: 15%;
          width: 1px;
          background: rgba(255,255,255,0.1);
        }

        .ps-stat-value {
          font-size: 15px;
          font-weight: 700;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
        }

        .ps-stat-label {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          margin-top: 2px;
          font-weight: 400;
        }

        .ps-description {
          padding: 14px 20px;
          font-size: 13px;
          color: rgba(255,255,255,0.5);
          line-height: 1.5;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }

        .ps-actions {
          display: flex;
          gap: 12px;
          padding: 16px 20px 28px;
          align-items: center;
        }

        .ps-btn-install {
          flex: 1;
          height: 48px;
          background: #01875f;
          border: none;
          border-radius: 24px;
          color: #fff;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          position: relative;
          overflow: hidden;
          transition: background 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          letter-spacing: 0.3px;
        }

        .ps-btn-install:hover  { background: #017a56; }
        .ps-btn-install:active { transform: scale(0.98); }

        .ps-btn-install.installing {
          background: #017a56;
        }

        .ps-btn-install.installed {
          background: #01875f;
        }

        .ps-ripple {
          position: absolute;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          animation: ripple 0.6s ease-out forwards;
          pointer-events: none;
        }

        .ps-btn-later {
          height: 48px;
          padding: 0 20px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 24px;
          color: rgba(255,255,255,0.7);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: background 0.2s, color 0.2s;
          white-space: nowrap;
        }

        .ps-btn-later:hover {
          background: rgba(255,255,255,0.1);
          color: #fff;
        }

        .ps-checkmark {
          display: inline-flex;
          animation: checkmark-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }

        .ps-progress {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Backdrop */}
      <div className="ps-backdrop" onClick={handleLater} />

      {/* Bottom Sheet */}
      <div className="ps-banner-wrap">
        <div className="ps-sheet">

          {/* Drag Handle */}
          <div className="ps-handle" />

          {/* App Header */}
          <div className="ps-header">
            <div className="ps-icon-wrap">
              <img
                src="/icon-192.png"
                alt="AcadeMe"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentNode.innerHTML = `<span style="font-size:28px">🎓</span>`;
                }}
              />
            </div>
            <div className="ps-app-info">
              <div className="ps-app-name">AcadeMe</div>
              <div className="ps-app-dev">SIMATS Engineering</div>
              <div className="ps-badges">
                <div className="ps-badge">
                  <span className="ps-badge-star">★</span> 4.8
                </div>
                <div className="ps-badge-dot" />
                <div className="ps-badge">Free</div>
                <div className="ps-badge-dot" />
                <div className="ps-badge">🔒 Safe</div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="ps-stats">
            <div className="ps-stat">
              <div className="ps-stat-value">
                <span className="ps-badge-star">★</span> 4.8
              </div>
              <div className="ps-stat-label">Rating</div>
            </div>
            <div className="ps-stat">
              <div className="ps-stat-value">500+</div>
              <div className="ps-stat-label">Students</div>
            </div>
            <div className="ps-stat">
              <div className="ps-stat-value">5 MB</div>
              <div className="ps-stat-label">Size</div>
            </div>
            <div className="ps-stat">
              <div className="ps-stat-value">Free</div>
              <div className="ps-stat-label">Price</div>
            </div>
          </div>

          {/* Description */}
          <div className="ps-description">
            Track CGPA, attendance, faculty reviews & resources — all in one place for SIMATS students.
          </div>

          {/* Action Buttons */}
          <div className="ps-actions">
            <button
              className={`ps-btn-install ${installing ? "installing" : ""} ${installed ? "installed" : ""}`}
              onClick={handleInstall}
              disabled={installing || installed}
            >
              {installed ? (
                <span className="ps-checkmark">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              ) : installing ? (
                <div className="ps-progress" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
              )}
              {installed ? "Installed!" : installing ? "Installing..." : "Install"}
            </button>

            <button className="ps-btn-later" onClick={handleLater}>
              Not now
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default DownloadAppBanner;
