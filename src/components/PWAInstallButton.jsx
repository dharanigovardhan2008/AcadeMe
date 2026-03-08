
import React, { useEffect, useState } from "react";

function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();          // stop browser auto prompt
      setDeferredPrompt(e);        // store event for later
      setShowButton(true);         // show our button
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async (e) => {
    e.preventDefault(); // prevent page reload

    // If native PWA install is available
    if (deferredPrompt) {
      deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        console.log("User installed the app");
      }

      setDeferredPrompt(null);
      setShowButton(false);
    } 
    // Fallback: download APK
    else {
      window.open("/app/AcadeMe.apk", "_blank");
    }
  };

  if (!showButton) return null;

  return (
    <button
      onClick={handleInstall}
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        padding: "12px 20px",
        background: "#4f46e5",
        color: "white",
        border: "none",
        borderRadius: "10px",
        cursor: "pointer",
        fontSize: "14px",
        zIndex: 9999
      }}
    >
      Install AcadeMe App
    </button>
  );
}

export default PWAInstallButton;

