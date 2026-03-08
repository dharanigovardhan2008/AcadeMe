import React from "react";

const DownloadAppBanner = () => {

  const downloadApp = () => {
    window.location.href = "/app/academe.apk";
  };

  return (
    <div style={{
      position: "fixed",
      bottom: "20px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#1a1b2e",
      color: "white",
      padding: "14px 20px",
      borderRadius: "12px",
      display: "flex",
      alignItems: "center",
      gap: "15px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      zIndex: 9999
    }}>

      <div style={{fontSize:"14px"}}>
        Install <b>AcadeMe App</b> for better experience
      </div>

      <button
        onClick={downloadApp}
        style={{
          background:"#4f46e5",
          border:"none",
          color:"white",
          padding:"8px 14px",
          borderRadius:"8px",
          cursor:"pointer",
          fontWeight:"600"
        }}
      >
        Download
      </button>

    </div>
  );
};

export default DownloadAppBanner;
