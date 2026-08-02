import React from 'react';
import { WingoHistoryItem, WingoPrediction, PanelStats, PanelSettings } from '../types';
import { X, Trophy, AlertCircle, Sparkles, Sliders, CheckCircle2, XCircle } from 'lucide-react';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: WingoHistoryItem[];
  stats: PanelStats;
  currentPrediction: WingoPrediction;
  settings: PanelSettings;
  onUpdateSettings: (newSettings: Partial<PanelSettings>) => void;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  history,
  stats,
  currentPrediction,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-purple-500/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-scaleUp">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 to-slate-900 border-b border-purple-500/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-400" size={18} />
            <h3 className="font-extrabold text-sm text-amber-300 tracking-wide uppercase">
              MAFIYA VIP LOGS & STRATEGY
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-purple-300 hover:text-white bg-purple-900/40 hover:bg-purple-800/60 p-1.5 rounded-lg transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          
          {/* Performance Overview Cards */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5">
              <div className="text-[10px] text-emerald-400 font-bold uppercase">Total Wins</div>
              <div className="text-lg font-black text-emerald-300 font-mono">{stats.wins}</div>
            </div>

            <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-2.5">
              <div className="text-[10px] text-amber-400 font-bold uppercase">Win Rate</div>
              <div className="text-lg font-black text-amber-300 font-mono">{stats.winRate}%</div>
            </div>

            <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-2.5">
              <div className="text-[10px] text-rose-400 font-bold uppercase">Total Losses</div>
              <div className="text-lg font-black text-rose-300 font-mono">{stats.losses}</div>
            </div>
          </div>

          {/* AI Pattern Strategy Selector */}
          <div className="bg-slate-950 border border-purple-500/30 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-200 flex items-center gap-1.5">
                <Sliders size={13} className="text-purple-400" />
                VIP Prediction Engine Algorithm
              </span>
            </div>

            <select
              value={settings.patternStrategy}
              onChange={(e) => onUpdateSettings({ patternStrategy: e.target.value as any })}
              className="w-full bg-slate-900 border border-purple-500/40 text-purple-100 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-purple-400"
            >
              <option value="AI_TREND">AI Pattern Matrix v4.2 (Default - Recommended)</option>
              <option value="FOLLOW_STREAK">Follow Trend Streak Strategy</option>
              <option value="REVERSE_PATTERN">Reverse Streak Counter Strategy</option>
              <option value="SMART_NUMBER">Smart High Probability Number Focus</option>
            </select>
          </div>

          {/* History List */}
          <div>
            <h4 className="font-bold text-slate-300 mb-2 uppercase text-[11px] tracking-wider flex items-center gap-1">
              <Sparkles size={13} className="text-amber-400" />
              WinGo 1 Min Recent Results ({history.length})
            </h4>

            <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
              {history.length === 0 ? (
                <div className="text-center py-6 text-slate-500 italic">
                  Fetching live history logs from server...
                </div>
              ) : (
                history.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-slate-950/80 border border-slate-800 rounded-lg p-2 font-mono"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-bold">#{item.issueNumber}</span>
                      <span className={`px-2 py-0.5 rounded font-black text-xs ${
                        item.color === 'green' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                        item.color === 'red' ? 'bg-rose-950 text-rose-400 border border-rose-500/30' : 'bg-purple-950 text-purple-300 border border-purple-500/30'
                      }`}>
                        Number {item.number}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                        item.size === 'BIG' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        {item.size}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
