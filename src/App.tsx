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
  // DG CLUB Game URL with HTTPS protocol to fix browser mixed-content blocking
  const DEFAULT_GAME_URL = "https://www.dgclub.fan/#/register?invitationCode=886571831313";
  const [gameUrl, setGameUrl] = useState(DEFAULT_GAME_URL);
  
  // Game UID activation state
  const [gameUid, setGameUid] = useState<string>(() => {
    return localStorage.getItem('mafiya_game_uid') || '';
  });

  const handleActivateUid = (uid: string) => {
    const cleanUid = uid.trim();
    setGameUid(cleanUid);
    if (cleanUid) {
      localStorage.setItem('mafiya_game_uid', cleanUid);
    } else {
      localStorage.removeItem('mafiya_game_uid');
    }
  };

  // Panel Settings
  const [settings, setSettings] = useState<PanelSettings>({
    opacity: 1.0,
    position: { x: window.innerWidth > 640 ? window.innerWidth / 2 - 180 : 10, y: 20 },
    dockPosition: 'top-center',
    isMinimized: false,
    soundEnabled: true,
    gameUrl: DEFAULT_GAME_URL,
    viewMode: 'iframe',
    patternStrategy: 'AI_TREND',
  });

  // Cycle & State
  const initialCycle = getCurrentWingoCycle();
  const [timer, setTimer] = useState(initialCycle.secondsLeft);
  const [history, setHistory] = useState<WingoHistoryItem[]>([]);
  const [prediction, setPrediction] = useState<WingoPrediction>(() => {
    return generatePredictionForPeriod(
      initialCycle.shortPeriod,
      initialCycle.fullPeriod,
      [],
      'AI_TREND'
    );
  });

  const [stats, setStats] = useState<PanelStats>({
    wins: 0,
    losses: 0,
    winRate: 100,
    currentStreak: 0
  });

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isApiConnected, setIsApiConnected] = useState(true);

  const processedPeriodRef = useRef<string>("");
  const currentLevelRef = useRef<number>(1);
  const previousPredictionRef = useRef<WingoPrediction | null>(null);

  const updateSettings = (newSettings: Partial<PanelSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
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

  // Sync Cycle & Server Predictions
  const syncCycleAndPrediction = useCallback(async () => {
    const cycle = getCurrentWingoCycle();
    setTimer(cycle.secondsLeft);

    // If new period detected
    if (cycle.shortPeriod !== processedPeriodRef.current) {
      const lastPeriod = processedPeriodRef.current;
      processedPeriodRef.current = cycle.shortPeriod;

      // Fetch updated history list
      const latestHistory = await fetchLiveHistory();

      // Check result of previous prediction if available
      if (lastPeriod && previousPredictionRef.current && latestHistory.length > 0) {
        const latestDraw = latestHistory[0];
        const actualNum = latestDraw.number;
        const actualSize = actualNum >= 5 || latestDraw.size === 'BIG' ? 'BIG' : 'SMALL';
        
        const prevPred = previousPredictionRef.current;
        const isWin = (prevPred.prediction === actualSize) || (prevPred.numbers && prevPred.numbers.includes(actualNum));

        if (isWin) {
          currentLevelRef.current = 1; // Reset to Level 1 on WIN
          setStats(prev => {
            const wins = prev.wins + 1;
            const total = wins + prev.losses;
            return {
              ...prev,
              wins,
              winRate: Math.round((wins / total) * 100),
              currentStreak: prev.currentStreak >= 0 ? prev.currentStreak + 1 : 1
            };
          });
        } else {
          // On LOSS, switch level
          if (currentLevelRef.current === 1) {
            currentLevelRef.current = 2; // High Accuracy Boost Level 2
          } else {
            currentLevelRef.current = 1; // Reset after Level 2
          }

          setStats(prev => {
            const losses = prev.losses + 1;
            const total = prev.wins + losses;
            return {
              ...prev,
              losses,
              winRate: Math.round((prev.wins / total) * 100),
              currentStreak: prev.currentStreak <= 0 ? prev.currentStreak - 1 : -1
            };
          });
        }
      }

      // Generate server-synchronized prediction for current period using 2-Level engine
      const newPrediction = generatePredictionForPeriod(
        cycle.shortPeriod,
        cycle.fullPeriod,
        latestHistory,
        settings.patternStrategy
      );

      previousPredictionRef.current = newPrediction;
      setPrediction(newPrediction);
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
      
      {/* Background Embedded Game View - Clean Full Screen */}
      <BackgroundGameView gameUrl={DEFAULT_GAME_URL} />

      {/* Floating MAFIYA VIP PANEL Overlay */}
      <MafiyaVipPanel
        prediction={prediction}
        timer={timer}
        settings={settings}
        gameUid={gameUid}
        onActivateUid={handleActivateUid}
        onUpdateSettings={updateSettings}
        onOpenHistory={() => setIsHistoryOpen(false)}
        isApiConnected={isApiConnected}
      />

    </div>
  );
}
