import React, { useState, useEffect, useRef } from "react";
import logo from "../assets/logo.jpg";

const APK_URL = "https://github.com/dharanigovardhan2008/AcadeMe/releases/download/v1/AcadeMe.apk";

const DownloadAppBanner = () => {
  const [showBanner, setShowBanner]   = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [dismissed, setDismissed]     = useState(false);
  const [phase, setPhase]             = useState("idle");
  const [progress, setProgress]       = useState(0);
  const [received, setReceived]       = useState(0);
  const [total, setTotal]             = useState(0);
  const abortRef                      = useRef(null);

  useEffect(() => {
    const alreadyDismissed = sessionStorage.getItem("install_banner_dismissed");
    if (alreadyDismissed) return;

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 1500);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    const isAndroid    = /Android/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isAndroid && !isStandalone) {
      setTimeout(() => setShowBanner(true), 2000);
    }

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handlePWAInstall = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") {
      setPhase("done");
      setTimeout(() => setShowBanner(false), 2000);
      return true;
    }
    return false;
  };

  const downloadAPK = async () => {
    setPhase("downloading");
    setProgress(0);
    setReceived(0);
    setTotal(0);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch(APK_URL, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentLength = response.headers.get("Content-Length");
      const fileSize      = contentLength ? parseInt(contentLength, 10) : 0;
      setTotal(fileSize);

      const reader = response.body.getReader();
      const chunks = [];
      let bytesReceived = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        bytesReceived += value.length;
        setReceived(bytesReceived);

        if (fileSize > 0) {
          setProgress(Math.min(Math.round((bytesReceived / fileSize) * 100), 99));
        } else {
          setProgress(prev => prev < 90 ? prev + Math.random() * 3 : prev);
        }
      }

      // Assemble blob only after ALL chunks received
      const blob    = new Blob(chunks, { type: "application/vnd.android.package-archive" });
      const blobUrl = URL.createObjectURL(blob);

      // Download without leaving the page
      const a       = document.createElement("a");
      a.href        = blobUrl;
      a.download    = "AcadeMe.apk";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);

      // Only mark done AFTER blob is assembled and save dialog triggered
      setProgress(100);
      setPhase("done");
      setTimeout(() => setShowBanner(false), 2500);

    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("APK download failed:", err);
      setPhase("error");
      setProgress(0);
    }
  };

  const handleInstall = async () => {
    if (phase === "downloading") return;
    if (deferredPrompt) {
      const installed = await handlePWAInstall();
      if (installed) return;
    }
    await downloadAPK();
  };

  const handleLater = () => {
    if (abortRef.current) abortRef.current.abort();
    setDismissed(true);
    setShowBanner(false);
    sessionStorage.setItem("install_banner_dismissed", "true");
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "";
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!showBanner || dismissed) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&display=swap');

        @keyframes ps-slide {
          0%   { transform: translateY(120px); opacity: 0; }
          65%  { transform: translateY(-5px);  opacity: 1; }
          100% { transform: translateY(0);     opacity: 1; }
        }
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes pop {
          0%   { transform: scale(0) rotate(-15deg); opacity:0; }
          60%  { transform: scale(1.2) rotate(3deg); opacity:1; }
          100% { transform: scale(1)  rotate(0deg);  opacity:1; }
        }
        @keyframes progress-shine {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        .ps-backdrop {
          position:fixed; inset:0;
          background:rgba(0,0,0,0.5);
          z-index:99998;
          animation: fadeIn 0.3s ease forwards;
        }
        .ps-wrap {
          position:fixed; bottom:0; left:0; right:0;
          z-index:99999;
          font-family:'Google Sans','Roboto',sans-serif;
          animation: ps-slide 0.5s cubic-bezier(0.34,1.2,0.64,1) forwards;
        }
        .ps-sheet {
          background:#1f1f1f;
          border-radius:28px 28px 0 0;
          overflow:hidden;
          box-shadow:0 -4px 40px rgba(0,0,0,0.7);
        }
        .ps-handle {
          width:36px; height:4px;
          background:rgba(255,255,255,0.18);
          border-radius:2px;
          margin:12px auto 16px;
        }
        .ps-header {
          display:flex; align-items:center; gap:16px;
          padding:0 20px 16px;
          border-bottom:1px solid rgba(255,255,255,0.07);
        }
        .ps-icon {
          width:64px; height:64px;
          border-radius:16px; overflow:hidden;
          flex-shrink:0; background:transparent;
          display:flex; align-items:center; justify-content:center;
        }
        .ps-icon img {
          width:100%; height:100%;
          object-fit:cover; border-radius:16px;
        }
        .ps-name  { font-size:17px; font-weight:700; color:#fff; margin-bottom:2px; }
        .ps-dev   { font-size:12px; color:rgba(255,255,255,0.4); margin-bottom:6px; }
        .ps-chips { display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
        .ps-chip  {
          display:flex; align-items:center; gap:3px;
          background:rgba(255,255,255,0.07); border-radius:20px;
          padding:3px 9px; font-size:11px;
          color:rgba(255,255,255,0.6); font-weight:500;
        }
        .ps-dot { width:3px; height:3px; border-radius:50%; background:rgba(255,255,255,0.25); }

        .ps-stats {
          display:flex;
          border-bottom:1px solid rgba(255,255,255,0.07);
        }
        .ps-stat { flex:1; text-align:center; padding:12px 0; position:relative; }
        .ps-stat+.ps-stat::before {
          content:''; position:absolute; left:0; top:20%; bottom:20%;
          width:1px; background:rgba(255,255,255,0.09);
        }
        .ps-stat-v {
          font-size:14px; font-weight:700; color:#fff;
          display:flex; align-items:center; justify-content:center; gap:2px;
        }
        .ps-stat-l { font-size:11px; color:rgba(255,255,255,0.38); margin-top:2px; }

        .ps-desc {
          padding:13px 20px; font-size:13px;
          color:rgba(255,255,255,0.48); line-height:1.55;
          border-bottom:1px solid rgba(255,255,255,0.07);
        }

        .ps-progress-wrap { padding:14px 20px 4px; }
        .ps-progress-row  {
          display:flex; justify-content:space-between;
          font-size:12px; color:rgba(255,255,255,0.45); margin-bottom:8px;
        }
        .ps-progress-track {
          height:4px; background:rgba(255,255,255,0.1);
          border-radius:2px; overflow:hidden;
        }
        .ps-progress-fill {
          height:100%; border-radius:2px;
          background:linear-gradient(90deg,#01875f 0%,#34d399 50%,#01875f 100%);
          background-size:200% auto;
          animation:progress-shine 1.5s linear infinite;
          transition:width 0.3s ease;
        }

        .ps-actions {
          display:flex; gap:12px;
          padding:16px 20px 32px;
          align-items:center;
        }
        .ps-btn-install {
          flex:1; height:48px;
          background:#01875f; border:none; border-radius:24px;
          color:#fff; font-size:15px; font-weight:700;
          cursor:pointer; font-family:inherit;
          display:flex; align-items:center; justify-content:center; gap:8px;
          transition:background 0.2s, transform 0.1s, opacity 0.2s;
          letter-spacing:0.2px;
        }
        .ps-btn-install:hover:not(:disabled)  { background:#017a56; }
        .ps-btn-install:active:not(:disabled) { transform:scale(0.97); }
        .ps-btn-install:disabled { opacity:0.75; cursor:not-allowed; }
        .ps-btn-install.error    { background:#c0392b; }

        .ps-spinner {
          width:18px; height:18px;
          border:2px solid rgba(255,255,255,0.3);
          border-top-color:#fff; border-radius:50%;
          animation:spin 0.7s linear infinite;
        }
        .ps-check { animation:pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards; }

        .ps-btn-later {
          height:48px; padding:0 20px;
          background:rgba(255,255,255,0.05);
          border:1px solid rgba(255,255,255,0.1);
          border-radius:24px; color:rgba(255,255,255,0.65);
          font-size:14px; font-weight:600;
          cursor:pointer; font-family:inherit;
          transition:background 0.2s, color 0.2s;
          white-space:nowrap;
        }
        .ps-btn-later:hover { background:rgba(255,255,255,0.1); color:#fff; }
      `}</style>

      {/* Backdrop */}
      <div
        className="ps-backdrop"
        onClick={phase === "downloading" ? undefined : handleLater}
      />

      {/* Bottom Sheet */}
      <div className="ps-wrap">
        <div className="ps-sheet">

          {/* Drag Handle */}
          <div className="ps-handle" />

          {/* App Header */}
          <div className="ps-header">
            <div className="ps-icon">
              <img src={logo} alt="AcadeMe" />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div className="ps-name">AcadeMe</div>
              <div className="ps-dev">SIMATS Engineering</div>
              <div className="ps-chips">
                <div className="ps-chip">
                  <span style={{ color:"#fbbc04" }}>★</span> 4.8
                </div>
                <div className="ps-dot" />
                <div className="ps-chip">Free</div>
                <div className="ps-dot" />
                <div className="ps-chip">🔒 Safe</div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="ps-stats">
            {[
              { v: <><span style={{color:"#fbbc04"}}>★</span> 4.8</>, l: "Rating"   },
              { v: "500+",  l: "Students" },
              { v: "~5 MB", l: "Size"     },
              { v: "Free",  l: "Price"    },
            ].map((s, i) => (
              <div className="ps-stat" key={i}>
                <div className="ps-stat-v">{s.v}</div>
                <div className="ps-stat-l">{s.l}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="ps-desc">
            Track CGPA, attendance, faculty reviews &amp; resources — all in one place for SIMATS students.
          </div>

          {/* Progress Bar — only while downloading */}
          {phase === "downloading" && (
            <div className="ps-progress-wrap">
              <div className="ps-progress-row">
                <span>Downloading AcadeMe.apk</span>
                <span>
                  {total > 0
                    ? `${formatBytes(received)} / ${formatBytes(total)}`
                    : formatBytes(received)
                  } · {progress}%
                </span>
              </div>
              <div className="ps-progress-track">
                <div
                  className="ps-progress-fill"
                  style={{ width:`${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="ps-actions">
            <button
              className={`ps-btn-install ${phase === "error" ? "error" : ""}`}
              onClick={handleInstall}
              disabled={phase === "downloading" || phase === "done"}
            >
              {phase === "downloading" && (
                <><div className="ps-spinner" /> Downloading {progress}%</>
              )}
              {phase === "done" && (
                <span className="ps-check">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="3"
                    strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  &nbsp;Done!
                </span>
              )}
              {phase === "error" && <>⚠ Retry</>}
              {phase === "idle"  && (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2.5"
                    strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Install
                </>
              )}
            </button>

            <button
              className="ps-btn-later"
              onClick={handleLater}
              disabled={phase === "downloading"}
            >
              {phase === "downloading" ? "Cancel" : "Not now"}
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default DownloadAppBanner;
