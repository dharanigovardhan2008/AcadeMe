```javascript
import React, { useState, useEffect } from "react";

const PWAInstallButton = () => {

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
      console.log("App installed");
    }

    setDeferredPrompt(null);
    setShowInstall(false);

  };

  if (!showInstall) return null;

  return (

    <button
      onClick={installApp}
      style={{
        position:"fixed",
        bottom:"20px",
        left:"50%",
        transform:"translateX(-50%)",
        background:"#4f46e5",
        color:"white",
        border:"none",
        padding:"12px 20px",
        borderRadius:"10px",
        fontSize:"14px",
        cursor:"pointer",
        zIndex:9999
      }}
    >
      Install AcadeMe App
    </button>

  );

};

export default PWAInstallButton;
```
