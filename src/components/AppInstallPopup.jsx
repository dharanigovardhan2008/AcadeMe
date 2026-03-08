import React, { useState, useEffect } from "react";

const AppInstallPopup = () => {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const installed = localStorage.getItem("appInstallDismissed");

    if (!installed) {
      setTimeout(() => {
        setShowPopup(true);
      }, 4000);
    }
  }, []);

  const handleInstall = () => {
    window.location.href = "/app/academe.apk";
  };

  const handleClose = () => {
    localStorage.setItem("appInstallDismissed", "true");
    setShowPopup(false);
  };

  if (!showPopup) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#111827",
        color: "white",
        padding: "18px 22px",
        borderRadius: "12px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        zIndex: 9999,
        width: "320px",
        textAlign: "center"
      }}
    >
      <h3 style={{ marginBottom: "8px" }}>Install AcadeMe App</h3>

      <p style={{ fontSize: "14px", opacity: 0.8 }}>
        Get faster access and full screen experience.
      </p>

      <div style={{ marginTop: "14px" }}>
        <button
          onClick={handleInstall}
          style={{
            background: "#3b82f6",
            border: "none",
            color: "white",
            padding: "8px 16px",
            borderRadius: "8px",
            marginRight: "10px",
            cursor: "pointer"
          }}
        >
          Install
        </button>

        <button
          onClick={handleClose}
          style={{
            background: "transparent",
            border: "1px solid #374151",
            color: "white",
            padding: "8px 16px",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          Later
        </button>
      </div>
    </div>
  );
};

export default AppInstallPopup;
