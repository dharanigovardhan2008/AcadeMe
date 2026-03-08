import React, { useState, useEffect } from "react";

const DownloadAppBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed or dismissed before
    const alreadyDismissed = sessionStorage.getItem("install_banner_dismissed");
    if (alreadyDismissed) return;

    // Listen for native PWA install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Fallback: show banner on Android even without PWA prompt
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isAndroid && !isStandalone) {
      setTimeout(() => setShowBanner(true), 2000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Trigger native PWA install
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback — download APK directly
      window.open(
        "https://github.com/dharanigovardhan2008/AcadeMe/releases/download/v1/AcadeMe.apk",
        "_blank"
      );
      setShowBanner(false);
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
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(100px); opacity: 0; }
          to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
        }
        .install-banner-btn-install {
          background: #4f46e5;
          border: none;
          color: white;
          padding: 8px 20px;
          border-radius: 20px;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
          transition: background 0.2s;
        }
        .install-banner-btn-install:hover { background: #4338ca; }
        .install-banner-btn-later {
          background: transparent;
          border: none;
          color: rgba(255,255,255,0.55);
          padding: 8px 14px;
          border-radius: 20px;
          cursor: pointer;
          font-weight: 600;
          font-size: 14px;
          transition: color 0.2s;
        }
        .install-banner-btn-later:hover { color: rgba(255,255,255,0.9); }
      `}</style>

      <div style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#1e1f35",
        border: "1px solid rgba(255,255,255,0.08)",
        color: "white",
        padding: "12px 16px",
        borderRadius: "16px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        zIndex: 9999,
        animation: "slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        minWidth: 300,
        maxWidth: "90vw",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}>

        {/* App Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 10, overflow: "hidden",
          flexShrink: 0, background: "#4f46e5",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(79,70,229,0.5)"
        }}>
          <img
            src="/icon-192.png"
            alt="AcadeMe"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentNode.innerHTML = `<span style="font-size:22px">🎓</span>`;
            }}
          />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>
            Install AcadeMe App
          </div>
          <div style={{
            fontSize: 12, color: "rgba(255,255,255,0.5)",
            marginTop: 2, whiteSpace: "nowrap",
            overflow: "hidden", textOverflow: "ellipsis"
          }}>
            Faster access & full screen experience
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          <button className="install-banner-btn-install" onClick={handleInstall}>
            Install
          </button>
          <button className="install-banner-btn-later" onClick={handleLater}>
            Later
          </button>
        </div>

      </div>
    </>
  );
};

export default DownloadAppBanner;
