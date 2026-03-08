import React, { useState, useEffect } from "react";

const AppInstallCard = () => {

  const [visible, setVisible] = useState(false);

  useEffect(() => {

    const installed = localStorage.getItem("appInstalled");

    const isAndroid = /Android/i.test(navigator.userAgent);

    if (!installed && isAndroid) {
      setVisible(true);
    }

  }, []);

  const installApp = () => {

    window.location.href = "/app/AcadeMe.apk";

    localStorage.setItem("appInstalled", "true");

    setVisible(false);

  };

  const closeCard = () => {
    localStorage.setItem("appInstalled", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (

    <div style={{
      position:"fixed",
      bottom:"20px",
      left:"50%",
      transform:"translateX(-50%)",
      background:"#1a1b2e",
      padding:"16px",
      borderRadius:"16px",
      display:"flex",
      alignItems:"center",
      gap:"15px",
      boxShadow:"0 10px 40px rgba(0,0,0,0.5)",
      zIndex:9999
    }}>

      <img
        src="/icon-192.png"
        style={{
          width:"48px",
          height:"48px",
          borderRadius:"12px"
        }}
      />

      <div>

        <div style={{fontWeight:"600",color:"white"}}>
          AcadeMe
        </div>

        <div style={{fontSize:"12px",color:"#aaa"}}>
          Install the app for better experience
        </div>

      </div>

      <button
        onClick={installApp}
        style={{
          background:"#4f46e5",
          color:"white",
          border:"none",
          padding:"8px 14px",
          borderRadius:"8px",
          cursor:"pointer"
        }}
      >
        Install
      </button>

      <button
        onClick={closeCard}
        style={{
          background:"transparent",
          border:"none",
          color:"#aaa",
          fontSize:"16px",
          cursor:"pointer"
        }}
      >
        ✕
      </button>

    </div>
  );
};

export default AppInstallCard;
