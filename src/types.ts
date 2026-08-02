export interface WingoHistoryItem {
  issueNumber: string;
  number: number;
  color: 'green' | 'red' | 'violet' | 'green-violet' | 'red-violet';
  size: 'BIG' | 'SMALL';
  amount?: string;
  createTime?: string;
}

export interface WingoPrediction {
  period: string;
  fullPeriod: string;
  prediction: 'BIG' | 'SMALL';
  secondaryColor?: 'GREEN' | 'RED' | 'VIOLET';
  number: number;
  accuracy: number;
  calculatedAt: string;
  reason?: string;
}

export interface PanelStats {
  wins: number;
  losses: number;
  winRate: number;
  currentStreak: number;
}

export interface PanelSettings {
  opacity: number; // 0.3 to 1.0
  position: { x: number; y: number };
  dockPosition: 'custom' | 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  isMinimized: boolean;
  soundEnabled: boolean;
  gameUrl: string;
  viewMode: 'iframe' | 'simulator';
  patternStrategy: 'AI_TREND' | 'FOLLOW_STREAK' | 'REVERSE_PATTERN' | 'SMART_NUMBER';
}
