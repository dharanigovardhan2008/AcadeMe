
import React, { useEffect, useState } from "react";

function PWAInstallButton() {

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {

    const handleBeforeInstallPrompt = (e) => {

      e.preventDefault();

      setDeferredPrompt(e);

      setShowButton(true);

    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () =>
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

  }, []);

  const handleInstallClick = async () => {

    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const choiceResult = await deferredPrompt.userChoice;

    if (choiceResult.outcome === "accepted") {
      console.log("User accepted the install prompt");
    }

    setDeferredPrompt(null);
    setShowButton(false);

  };

  if (!showButton) return null;

  return (
    <button
      onClick={handleInstallClick}
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
