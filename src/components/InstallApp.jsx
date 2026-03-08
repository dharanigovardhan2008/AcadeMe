import React, { useEffect, useState } from "react";

const InstallApp = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User installed the app");
    }

    setDeferredPrompt(null);
    setShowInstall(false);
  };

  if (!showInstall) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#1e293b",
        color: "white",
        padding: "12px 20px",
        borderRadius: "10px",
        boxShadow: "0 5px 20px rgba(0,0,0,0.3)",
        zIndex: 9999
      }}
    >
      Install AcadeMe App
      <button
        onClick={installApp}
        style={{
          marginLeft: "10px",
          padding: "6px 12px",
          borderRadius: "6px",
          border: "none",
          background: "#3b82f6",
          color: "white",
          cursor: "pointer"
        }}
      >
        Install
      </button>
    </div>
  );
};

export default InstallApp;
