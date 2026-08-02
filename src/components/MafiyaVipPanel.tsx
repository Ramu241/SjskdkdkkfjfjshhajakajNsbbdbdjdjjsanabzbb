import React, { useState, useRef, useEffect } from 'react';
import { WingoPrediction, PanelSettings } from '../types';
import { Move, Minus, Maximize2, Volume2, VolumeX, Sliders, ExternalLink, ShieldCheck, Key, CheckCircle, UserCheck } from 'lucide-react';

interface MafiyaVipPanelProps {
  prediction: WingoPrediction;
  timer: number;
  settings: PanelSettings;
  gameUid: string;
  onActivateUid: (uid: string) => void;
  onUpdateSettings: (newSettings: Partial<PanelSettings>) => void;
  onOpenHistory: () => void;
  isApiConnected: boolean;
}

export const MafiyaVipPanel: React.FC<MafiyaVipPanelProps> = ({
  prediction,
  timer,
  settings,
  gameUid,
  onActivateUid,
  onUpdateSettings,
  isApiConnected,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(false);
  const [inputUid, setInputUid] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [showUidModal, setShowUidModal] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const DG_CLUB_LINK = "https://www.dgclub.fan/#/register?invitationCode=886571831313";

  // Dragging functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = Math.max(10, Math.min(window.innerWidth - 360, e.clientX - dragOffset.x));
        const newY = Math.max(10, Math.min(window.innerHeight - 200, e.clientY - dragOffset.y));
        onUpdateSettings({
          position: { x: newX, y: newY },
          dockPosition: 'custom'
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, onUpdateSettings]);

  // Audio beep
  useEffect(() => {
    if (settings.soundEnabled && timer === 5) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch (e) {
        // browser autoplay policy
      }
    }
  }, [timer, settings.soundEnabled]);

  const handleUidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUid.trim()) {
      alert("कृपया अपनी गेम यूआईडी (Game UID) दर्ज करें!");
      return;
    }
    setIsActivating(true);
    setTimeout(() => {
      onActivateUid(inputUid.trim());
      setIsActivating(false);
      setShowUidModal(false);
    }, 600);
  };

  // Position calculation based on dock setting or custom position
  const getPositionStyles = (): React.CSSProperties => {
    if (settings.dockPosition === 'top-center') {
      return { top: '15px', left: '50%', transform: 'translateX(-50%)' };
    }
    if (settings.dockPosition === 'top-right') {
      return { top: '15px', right: '15px' };
    }
    if (settings.dockPosition === 'bottom-center') {
      return { bottom: '15px', left: '50%', transform: 'translateX(-50%)' };
    }
    return {
      top: `${settings.position.y}px`,
      left: `${settings.position.x}px`,
    };
  };

  // Calculate activation state
  const needsActivation = !gameUid || showUidModal;

  // Render Minimized Badge Mode
  if (settings.isMinimized) {
    return (
      <div
        style={{
          ...getPositionStyles(),
          position: 'fixed',
          zIndex: 9999,
          opacity: settings.opacity,
        }}
        className="flex items-center gap-2 bg-gradient-to-r from-purple-900/90 to-slate-900/90 border border-purple-500/80 rounded-full px-3 py-1.5 shadow-2xl backdrop-blur-md cursor-pointer select-none transition-all hover:scale-105"
        onClick={() => onUpdateSettings({ isMinimized: false })}
      >
        <span className="text-amber-400 font-extrabold text-xs animate-pulse">👑 MAFIYA</span>
        <div className="bg-amber-500/20 border border-amber-500/50 rounded-md px-2 py-0.5 text-xs font-bold text-white">
          #{prediction.period} : {needsActivation ? (
            <span className="text-amber-400 font-bold">🔒 LOCKED</span>
          ) : (
            <span className="text-yellow-300 font-black">{prediction.prediction}</span>
          )}
        </div>
        <div className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-1.5 py-0.5 rounded">
          {timer}s
        </div>
        <button
          className="text-purple-300 hover:text-white p-1"
          onClick={(e) => {
            e.stopPropagation();
            onUpdateSettings({ isMinimized: false });
          }}
          title="Expand Panel"
        >
          <Maximize2 size={12} />
        </button>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      style={{
        ...getPositionStyles(),
        position: 'fixed',
        zIndex: 9999,
        opacity: settings.opacity,
      }}
      className="select-none transition-shadow"
    >
      {/* VIP Panel Main Box */}
      <div className="vip-panel relative group">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-purple-500/20 text-[10px] text-purple-300">
          <div
            className="flex items-center gap-1 cursor-move font-semibold text-purple-200 hover:text-white"
            onMouseDown={handleMouseDown}
            title="Click & Drag to move panel"
          >
            <Move size={12} className="text-purple-400" />
            <span className="tracking-wider uppercase text-[9px]">MAFIYA VIP OVERLAY</span>
            {isApiConnected ? (
              <span className="flex items-center gap-1 text-[8px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> SERVER LIVE
              </span>
            ) : (
              <span className="text-[8px] text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded-full border border-amber-500/30">
                AUTO SYNC
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdateSettings({ soundEnabled: !settings.soundEnabled })}
              className="p-1 hover:bg-purple-900/50 rounded text-purple-300 hover:text-white transition-colors"
              title={settings.soundEnabled ? "Mute Timer Sound" : "Enable Timer Sound"}
            >
              {settings.soundEnabled ? <Volume2 size={11} /> : <VolumeX size={11} />}
            </button>

            <button
              onClick={() => setShowControls(!showControls)}
              className={`p-1 rounded transition-colors ${showControls ? 'bg-purple-600 text-white' : 'hover:bg-purple-900/50 text-purple-300'}`}
              title="Panel Settings"
            >
              <Sliders size={11} />
            </button>

            <button
              onClick={() => onUpdateSettings({ isMinimized: true })}
              className="p-1 hover:bg-purple-900/50 rounded text-purple-300 hover:text-white transition-colors"
              title="Minimize Panel"
            >
              <Minus size={11} />
            </button>
          </div>
        </div>

        {/* Settings Drawer */}
        {showControls && (
          <div className="mb-2 p-2 bg-slate-950/95 border border-purple-500/40 rounded-lg text-[10px] space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-purple-300">Opacity: {Math.round(settings.opacity * 100)}%</span>
              <input
                type="range"
                min="0.3"
                max="1"
                step="0.05"
                value={settings.opacity}
                onChange={(e) => onUpdateSettings({ opacity: parseFloat(e.target.value) })}
                className="w-24 accent-purple-500 h-1 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between gap-1">
              <span className="text-purple-300">Dock Preset:</span>
              <select
                value={settings.dockPosition}
                onChange={(e) => onUpdateSettings({ dockPosition: e.target.value as any })}
                className="bg-slate-900 border border-purple-500/30 text-white rounded px-1 py-0.5 text-[9px] focus:outline-none"
              >
                <option value="custom">Custom Drag</option>
                <option value="top-center">Top Center</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-center">Bottom Center</option>
              </select>
            </div>

            {gameUid && (
              <div className="pt-1 border-t border-purple-500/20 flex items-center justify-between">
                <span className="text-emerald-400 font-mono text-[9px]">STATUS: VIP VERIFIED</span>
                <button
                  onClick={() => setShowUidModal(true)}
                  className="text-amber-400 hover:text-amber-300 text-[9px] underline"
                >
                  Change Account
                </button>
              </div>
            )}
          </div>
        )}

        {/* Telegram Link Banner */}
        <a
          href="https://t.me/+cFIMYplJlMphMzRl"
          target="_blank"
          rel="noopener noreferrer"
          className="register-btn"
        >
          JOIN OFFICIAL TELEGRAM CHANNEL
        </a>

        {/* Title Header */}
        <div className="panel-title">
          🔥 𝗥𝗔𝗠𝗨 𝗕𝗛𝗔𝗜 𝗢𝗙𝗙𝗜𝗖𝗜𝗔𝗟 𝗔𝗥𝗠𝗬 👤
        </div>

        {needsActivation ? (
          /* Activation Screen */
          <div className="p-3 bg-slate-950/90 border border-amber-500/40 rounded-xl space-y-3 text-center my-2">
            <div className="flex items-center justify-center gap-1 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <Key size={14} /> VIP PANEL ACTIVATION REQUIRED
            </div>

            <p className="text-[10px] text-slate-300 leading-tight">
              पैनल इस्तेमाल करने के लिए सबसे पहले नीचे दिए गए बटन से नया DG CLUB अकाउंट बनाएं और अपनी <span className="text-amber-300 font-bold">Game UID</span> दर्ज करें:
            </p>

            <a
              href={DG_CLUB_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black py-2 px-3 rounded-lg text-xs hover:brightness-110 shadow transition-all"
            >
              <ExternalLink size={13} /> REGISTER GAME ACCOUNT (DG CLUB)
            </a>

            <form onSubmit={handleUidSubmit} className="space-y-2 pt-1">
              <input
                type="text"
                value={inputUid}
                onChange={(e) => setInputUid(e.target.value)}
                placeholder="Enter Game UID (eg: 88657183)"
                className="w-full bg-slate-900 border border-purple-500/50 text-white text-center py-1.5 px-3 rounded-lg text-xs font-mono focus:outline-none focus:border-amber-400"
              />

              <button
                type="submit"
                disabled={isActivating}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-1.5 rounded-lg text-xs shadow transition-all"
              >
                {isActivating ? "VERIFYING GAME UID..." : "ACTIVATE VIP PANEL"}
              </button>
            </form>
          </div>
        ) : (
          /* Active VIP Prediction View */
          <>
            {/* Active Status Badge - Cleaned without showing exact UID */}
            <div className="flex items-center justify-between bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[10px] mb-2 font-mono">
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle size={11} /> VIP ACTIVATED
              </span>
              <span className="text-amber-300 font-bold">RAMU BHAI OFFICIAL</span>
            </div>

            {/* Prediction Grid Container */}
            <div className="grid-container">
              
              {/* Period Box */}
              <div className="card">
                <span className="card-label">PERIOD</span>
                <span className="card-value">{prediction.period}</span>
              </div>

              {/* Main WINGO 1 MIN Prediction Box */}
              <div className="card card-main">
                <span className="card-label">WINGO 1 MIN</span>
                <span className="card-value">{prediction.prediction}</span>
              </div>

              {/* High Probability Number Box */}
              <div className="card card-right">
                <span className="card-label">NUMBER</span>
                <span className="card-value">{prediction.number}</span>
              </div>

            </div>

            {/* Timer Footer Bar Directly Synced with Game Server */}
            <div className="stats-bar justify-center gap-2">
              <span className="timer-text text-amber-300 font-extrabold text-xs">
                SERVER TIMER: <span className="text-white text-sm font-mono tracking-widest">{timer}</span> SECONDS
              </span>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
