import React, { useState, useEffect } from "react";

const AppInstallPopup = () => {

  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {

    const dismissed = localStorage.getItem("academeInstallDismissed");

    if (!dismissed) {
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 4000);

      return () => clearTimeout(timer);
    }

  }, []);

  const handleInstall = () => {
    window.location.href = "/app/AcadeMe.apk";
  };

  const handleClose = () => {
    localStorage.setItem("academeInstallDismissed", "true");
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
        padding: "18px 20px",
        borderRadius: "14px",
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        zIndex: 9999,
        width: "340px",
        display: "flex",
        alignItems: "center",
        gap: "14px"
      }}
    >

      {/* APP ICON */}

      <img
        src="/icon-192.png"
        alt="AcadeMe"
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "10px"
        }}
      />

      {/* TEXT */}

      <div style={{ flex: 1 }}>

        <div style={{ fontWeight: "600", fontSize: "15px" }}>
          Install AcadeMe App
        </div>

        <div style={{ fontSize: "13px", opacity: 0.8 }}>
          Faster access & full screen experience
        </div>

        <div style={{ marginTop: "10px" }}>

          <button
            onClick={handleInstall}
            style={{
              background: "#3b82f6",
              border: "none",
              color: "white",
              padding: "6px 14px",
              borderRadius: "7px",
              marginRight: "8px",
              cursor: "pointer",
              fontSize: "13px"
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
              padding: "6px 14px",
              borderRadius: "7px",
              cursor: "pointer",
              fontSize: "13px"
            }}
          >
            Later
          </button>

        </div>

      </div>

    </div>

  );
};

export default AppInstallPopup;
