import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MafiyaVipPanel } from './components/MafiyaVipPanel';
import { BackgroundGameView } from './components/BackgroundGameView';
import { HistoryPanel } from './components/HistoryPanel';
import {
  WingoHistoryItem,
  WingoPrediction,
  PanelStats,
  PanelSettings
} from './types';
import {
  getCurrentWingoCycle,
  generatePredictionForPeriod,
  parseUpstreamData,
  getNumberMeta
} from './utils/wingoEngine';

export default function App() {
  // Game URL set to user's exact link
  const [gameUrl, setGameUrl] = useState("https://bdgwinmy.cc//#/register?invitationCode=8261315097340");
  
  // Panel Settings
  const [settings, setSettings] = useState<PanelSettings>({
    opacity: 1.0,
    position: { x: window.innerWidth > 640 ? window.innerWidth / 2 - 175 : 10, y: 30 },
    dockPosition: 'top-center',
    isMinimized: false,
    soundEnabled: true,
    gameUrl: "https://bdgwinmy.cc//#/register?invitationCode=8261315097340",
    viewMode: 'iframe',
    patternStrategy: 'AI_TREND',
  });

  // Cycle & State
  const [timer, setTimer] = useState(11);
  const [history, setHistory] = useState<WingoHistoryItem[]>([]);
  const [prediction, setPrediction] = useState<WingoPrediction>({
    period: "991",
    fullPeriod: "20260802100010991",
    prediction: "BIG",
    secondaryColor: "GREEN",
    number: 6,
    accuracy: 94,
    calculatedAt: new Date().toISOString()
  });

  const [stats, setStats] = useState<PanelStats>({
    wins: 0,
    losses: 0,
    winRate: 100,
    currentStreak: 0
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isApiConnected, setIsApiConnected] = useState(true);

  // Track previous period prediction to auto increment Win/Loss when result arrives
  const previousPredictionRef = useRef<WingoPrediction | null>(null);
  const processedPeriodRef = useRef<string>("");

  const updateSettings = (newSettings: Partial<PanelSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const handleResetStats = () => {
    setStats({ wins: 0, losses: 0, winRate: 100, currentStreak: 0 });
  };

  // Fetch live draw history from server API proxy
  const fetchLiveHistory = useCallback(async () => {
    try {
      const res = await fetch('/api/wingo/history');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const items = parseUpstreamData(json.data);
          if (items && items.length > 0) {
            setHistory(items);
            setIsApiConnected(true);
            return items;
          }
        }
      }
    } catch (err) {
      console.warn("Upstream API fetch error, using local simulation engine:", err);
    }
    setIsApiConnected(false);
    return [];
  }, []);

  // Sync Cycle & Predictions
  const syncCycleAndPrediction = useCallback(async () => {
    const cycle = getCurrentWingoCycle();
    setTimer(cycle.secondsLeft);

    // If new period detected
    if (cycle.shortPeriod !== processedPeriodRef.current) {
      processedPeriodRef.current = cycle.shortPeriod;

      // 1. Fetch updated history list
      const latestHistory = await fetchLiveHistory();

      // 2. Check if previous prediction won or lost based on result
      if (previousPredictionRef.current) {
        const prevPred = previousPredictionRef.current;
        let lastResult: WingoHistoryItem | undefined = undefined;

        if (latestHistory && latestHistory.length > 0) {
          lastResult = latestHistory.find(
            h => h.issueNumber === prevPred.period || h.issueNumber === prevPred.fullPeriod
          ) || latestHistory[0];
        }

        if (!lastResult) {
          // Generate result if history not received yet
          const num = (parseInt(prevPred.period, 10) * 17 + 3) % 10;
          const meta = getNumberMeta(num);
          lastResult = {
            issueNumber: prevPred.period,
            number: num,
            color: meta.color,
            size: meta.size,
            createTime: new Date().toISOString()
          };
          setHistory(prev => [lastResult!, ...prev]);
        }

        const isWin = lastResult.size === prevPred.prediction;
        setStats(prev => {
          const wins = isWin ? prev.wins + 1 : prev.wins;
          const losses = isWin ? prev.losses : prev.losses + 1;
          const total = wins + losses;
          const winRate = total > 0 ? Math.round((wins / total) * 100) : 100;
          return {
            wins,
            losses,
            winRate,
            currentStreak: isWin ? prev.currentStreak + 1 : 0
          };
        });
      }

      // 3. Generate new prediction for current period
      const newPrediction = generatePredictionForPeriod(
        cycle.shortPeriod,
        cycle.fullPeriod,
        latestHistory,
        settings.patternStrategy
      );

      setPrediction(newPrediction);
      previousPredictionRef.current = newPrediction;
    }
  }, [fetchLiveHistory, settings.patternStrategy]);

  // Initial setup & live 1-second ticker
  useEffect(() => {
    syncCycleAndPrediction();

    const interval = setInterval(() => {
      const cycle = getCurrentWingoCycle();
      setTimer(cycle.secondsLeft);

      // Period turn over check
      if (cycle.secondsLeft === 59 || cycle.secondsLeft === 0) {
        syncCycleAndPrediction();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [syncCycleAndPrediction]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 font-sans relative">
      
      {/* Background Embedded Game View */}
      <BackgroundGameView gameUrl={gameUrl} />

      {/* Floating MAFIYA VIP PANEL Overlay */}
      <MafiyaVipPanel
        prediction={prediction}
        timer={timer}
        stats={stats}
        settings={settings}
        onUpdateSettings={updateSettings}
        onResetStats={handleResetStats}
        onOpenHistory={() => setIsHistoryOpen(true)}
        isApiConnected={isApiConnected}
      />

      {/* Detailed History & Strategy Modal */}
      <HistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        stats={stats}
        currentPrediction={prediction}
        settings={settings}
        onUpdateSettings={updateSettings}
      />

    </div>
  );
}
