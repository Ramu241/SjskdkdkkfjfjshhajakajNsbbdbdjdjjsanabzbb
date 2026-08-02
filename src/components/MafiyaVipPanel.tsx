import React, { useState, useRef, useEffect } from 'react';
import { WingoPrediction, PanelStats, PanelSettings } from '../types';
import { Move, Minus, Maximize2, Volume2, VolumeX, RefreshCw, Sliders, ExternalLink, ShieldCheck, Sparkles, History } from 'lucide-react';

interface MafiyaVipPanelProps {
  prediction: WingoPrediction;
  timer: number;
  stats: PanelStats;
  settings: PanelSettings;
  onUpdateSettings: (newSettings: Partial<PanelSettings>) => void;
  onResetStats: () => void;
  onOpenHistory: () => void;
  isApiConnected: boolean;
}

export const MafiyaVipPanel: React.FC<MafiyaVipPanelProps> = ({
  prediction,
  timer,
  stats,
  settings,
  onUpdateSettings,
  onResetStats,
  onOpenHistory,
  isApiConnected,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showControls, setShowControls] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

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

  // Play audio pulse on prediction update or low timer
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
        // audio context blocked by browser gesture policy if no click yet
      }
    }
  }, [timer, settings.soundEnabled]);

  // Position calculation based on dock setting or custom position
  const getPositionStyles = (): React.CSSProperties => {
    if (settings.dockPosition === 'top-center') {
      return { top: '20px', left: '50%', transform: 'translateX(-50%)' };
    }
    if (settings.dockPosition === 'top-right') {
      return { top: '20px', right: '20px' };
    }
    if (settings.dockPosition === 'bottom-center') {
      return { bottom: '20px', left: '50%', transform: 'translateX(-50%)' };
    }
    return {
      top: `${settings.position.y}px`,
      left: `${settings.position.x}px`,
    };
  };

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
          #{prediction.period} : <span className="text-yellow-300 font-black">{prediction.prediction}</span>
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
      {/* Exact VIP Panel Container with provided CSS styling */}
      <div className="vip-panel relative group">
        
        {/* Floating Controls Bar (Drag Handle, Settings, Minimize) */}
        <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-purple-500/20 text-[10px] text-purple-300">
          <div
            className="flex items-center gap-1 cursor-move font-semibold text-purple-200 hover:text-white"
            onMouseDown={handleMouseDown}
            title="Click & Drag to move panel"
          >
            <Move size={12} className="text-purple-400" />
            <span className="tracking-wider uppercase text-[9px]">MAFIYA OVERLAY</span>
            {isApiConnected ? (
              <span className="flex items-center gap-1 text-[8px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.2 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> LIVE API
              </span>
            ) : (
              <span className="text-[8px] text-amber-400 bg-amber-950/80 px-1.5 py-0.2 rounded-full border border-amber-500/30">
                AI AUTO
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
              onClick={onOpenHistory}
              className="p-1 hover:bg-purple-900/50 rounded text-purple-300 hover:text-white transition-colors"
              title="View History Logs"
            >
              <History size={11} />
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
              title="Minimize to Floating Badge"
            >
              <Minus size={11} />
            </button>
          </div>
        </div>

        {/* Quick Settings Drawer */}
        {showControls && (
          <div className="mb-2 p-2 bg-slate-950/90 border border-purple-500/40 rounded-lg text-[10px] space-y-2 animate-fadeIn">
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

            <div className="flex items-center justify-between pt-1 border-t border-purple-500/20">
              <button
                onClick={onResetStats}
                className="text-amber-400 hover:text-amber-300 text-[9px] flex items-center gap-1"
              >
                <RefreshCw size={10} /> Reset Win/Loss Counter
              </button>
            </div>
          </div>
        )}

        {/* Top Button Banner with Telegram Link */}
        <a
          href="https://t.me/+cFIMYplJlMphMzRl"
          target="_blank"
          rel="noopener noreferrer"
          className="register-btn"
        >
          <i className="fa-brands fa-telegram"></i> JOIN VIP TELEGRAM CHANNEL
        </a>

        {/* Panel Title */}
        <div className="panel-title">
          🔥 𝗥𝗔𝗠𝗨 𝗕𝗛𝗔𝗜 𝗢𝗙𝗙𝗜𝗖𝗜𝗔𝗟 𝗔𝗥𝗠𝗬 👤
        </div>

        {/* Prediction Section - Grid Container */}
        <div className="grid-container">
          
          {/* Period Box */}
          <div className="card">
            <span className="card-label">
              <i className="fa-regular fa-clock"></i> PERIOD
            </span>
            <span className="card-value" id="period">
              {prediction.period}
            </span>
          </div>

          {/* Main Prediction Result Box */}
          <div className="card card-main">
            <span className="card-label">WINGO 1 MIN</span>
            <span className="card-value" id="prediction">
              {prediction.prediction}
            </span>
          </div>

          {/* High Probability Number Box */}
          <div className="card card-right">
            <span className="card-label">
              <i className="fa-solid fa-chart-line"></i> NUMBER
            </span>
            <span className="card-value" id="number">
              {prediction.number}
            </span>
          </div>

        </div>

        {/* Footer Stats Bar */}
        <div className="stats-bar">
          <span className="win-text">
            WIN : <span id="win-count">{stats.wins}</span>
          </span>

          <span className="timer-text">
            <span id="timer">{timer}</span> Seconds Left
          </span>

          <span className="loss-text">
            LOSS : <span id="loss-count">{stats.losses}</span>
          </span>
        </div>

      </div>
    </div>
  );
};
