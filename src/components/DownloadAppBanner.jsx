import React, { useState, useEffect } from "react";
import { X, Download, Check, Loader2 } from "lucide-react";
import logo from "../assets/logo.jpg";

const APK_URL = "https://drive.google.com/uc?export=download&confirm=t&id=1VLiFhunuvjc01BatpyqMs5V1SfKESE9Y";

const DownloadAppBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 1. Check if the user has ALREADY permanently installed it
    const isInstalledForever = localStorage.getItem("academe_app_installed") === "true";
    
    // 2. Check if currently running as an installed PWA (Standalone mode)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    
    // If it's already installed, sync the storage and NEVER show the banner
    if (isStandalone || isInstalledForever) {
      localStorage.setItem("academe_app_installed", "true");
      return;
    }

    // 3. Check if they just hit "X" during this specific browsing session
    const hiddenThisSession = sessionStorage.getItem("banner_hidden_this_session");
    if (hiddenThisSession) return;

    // 4. Capture native PWA install prompt if the browser offers it
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 5. Listen for actual native installation success
    const handleAppInstalled = () => {
      localStorage.setItem("academe_app_installed", "true");
      setShowBanner(false);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    // 6. FORCE show the banner after 1.5 seconds on the web (if not installed & not dismissed)
    const showTimer = setTimeout(() => {
      setShowBanner(true);
    }, 1500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      clearTimeout(showTimer);
    };
  }, []);

  const handlePWAInstall = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    
    if (outcome === "accepted") {
      // Mark as permanently installed
      localStorage.setItem("academe_app_installed", "true");
      setPhase("done");
      setTimeout(() => setShowBanner(false), 2000);
      return true;
    }
    return false;
  };

  const downloadAPK = () => {
    setPhase("downloading");
    setProgress(0);

    const link = document.createElement("a");
    link.href = APK_URL;
    link.download = "AcadeMe.apk";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    let current = 0;
    const interval = setInterval(() => {
      current += Math.random() * 8 + 3;
      if (current >= 95) {
        clearInterval(interval);
        setProgress(95);
      } else {
        setProgress(Math.round(current));
      }
    }, 300);

    setTimeout(() => {
      clearInterval(interval);
      setProgress(100);
      setPhase("done");
      
      // Mark as permanently installed once APK download finishes
      localStorage.setItem("academe_app_installed", "true");
      
      setTimeout(() => setShowBanner(false), 2500);
    }, 4000);
  };

  const handleInstall = async () => {
    if (phase === "downloading" || phase === "done") return;
    
    // Try PWA native install first
    if (deferredPrompt) {
      const installed = await handlePWAInstall();
      if (installed) return;
    }
    
    // Fallback to APK download
    downloadAPK();
  };

  const handleLater = () => {
    setDismissed(true);
    setShowBanner(false);
    // Hides for this session only. Will popup again on next website visit.
    sessionStorage.setItem("banner_hidden_this_session", "true");
  };

  if (!showBanner || dismissed) return null;

  return (
    <>
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translate(-50%, 30px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        .compact-app-banner {
          position: fixed;
          bottom: 30px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 99998;
          width: 90%;
          max-width: 420px;
          background: linear-gradient(135deg, rgba(30, 30, 45, 0.9) 0%, rgba(20, 20, 35, 0.98) 100%);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05) inset;
          border-radius: 28px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          animation: slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
        }

        .banner-app-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          overflow: hidden;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .banner-app-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .banner-text-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .banner-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #FFFFFF;
          margin: 0 0 2px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .banner-desc {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.65);
          margin: 0;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .banner-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .btn-banner-install {
          background: #FFFFFF;
          color: #111827;
          border: none;
          padding: 8px 18px;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          min-width: 80px;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .btn-banner-install:hover:not(:disabled) {
          transform: scale(1.05);
          background: #F9FAFB;
        }

        .btn-banner-install:active:not(:disabled) {
          transform: scale(0.95);
        }

        .btn-banner-install:disabled {
          background: rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
          cursor: default;
        }

        .btn-banner-close {
          background: rgba(255, 255, 255, 0.1);
          border: none;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: rgba(255, 255, 255, 0.7);
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .btn-banner-close:hover {
          background: rgba(255, 255, 255, 0.2);
          color: #FFFFFF;
        }

        @media (max-width: 480px) {
          .compact-app-banner {
            bottom: 20px;
            width: 92%;
            padding: 12px 14px;
          }
          .banner-app-icon {
            width: 42px;
            height: 42px;
          }
          .btn-banner-install {
            padding: 8px 14px;
            min-width: 70px;
          }
        }
      `}</style>

      <div className="compact-app-banner">
        
        <div className="banner-app-icon">
          <img src={logo} alt="AcadeMe Logo" />
        </div>
        
        <div className="banner-text-content">
          <h4 className="banner-title">AcadeMe App</h4>
          <p className="banner-desc">
            {phase === "downloading" ? "Downloading..." : "Track everything in one tap."}
          </p>
        </div>

        <div className="banner-actions">
          <button 
            className="btn-banner-install" 
            onClick={handleInstall} 
            disabled={phase === "downloading" || phase === "done"}
          >
            {phase === "idle" && (
              <>
                <Download size={14} /> Get
              </>
            )}
            {phase === "downloading" && (
              <>
                <Loader2 size={14} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} /> 
                {progress}%
              </>
            )}
            {phase === "done" && (
              <>
                <Check size={14} color="#10B981" /> Done
              </>
            )}
          </button>
          
          <button 
            className="btn-banner-close" 
            onClick={handleLater}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>

      </div>
    </>
  );
};

export default DownloadAppBanner;