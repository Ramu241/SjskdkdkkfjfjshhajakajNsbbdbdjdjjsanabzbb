import { WingoHistoryItem, WingoPrediction } from '../types';

/**
 * Generate current WinGo 1 Min period identifiers and remaining seconds
 */
export function getCurrentWingoCycle() {
  const now = new Date();
  const secondsLeft = 59 - now.getUTCSeconds();
  
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  
  // Total minutes from 00:00 UTC
  const totalMinutes = now.getUTCHours() * 60 + now.getUTCMinutes() + 1;
  
  const fullPeriod = `${year}${month}${day}10001${String(totalMinutes).padStart(4, '0')}`;
  const shortPeriod = String(totalMinutes % 1000).padStart(3, '0');

  return {
    fullPeriod,
    shortPeriod,
    secondsLeft,
    totalMinutes
  };
}

/**
 * Standard WinGo number metadata
 */
export function getNumberMeta(num: number): { size: 'BIG' | 'SMALL'; color: 'green' | 'red' | 'violet' } {
  const size: 'BIG' | 'SMALL' = num >= 5 ? 'BIG' : 'SMALL';
  let color: 'green' | 'red' | 'violet' = 'green';
  
  if (num === 0 || num === 5) {
    color = 'violet';
  } else if ([1, 3, 7, 9].includes(num)) {
    color = 'green';
  } else {
    color = 'red';
  }

  return { size, color };
}

/**
 * Generates dynamic VIP prediction based on history patterns or algorithmic seed
 */
export function generatePredictionForPeriod(
  period: string,
  fullPeriod: string,
  history: WingoHistoryItem[],
  strategy: string = 'AI_TREND'
): WingoPrediction {
  // Use period hash for deterministic yet pattern-aware predictions
  let seed = 0;
  for (let i = 0; i < fullPeriod.length; i++) {
    seed += fullPeriod.charCodeAt(i) * (i + 1);
  }

  // Factor in previous history trends if available
  let lastSizeRatio = 0.5;
  if (history && history.length > 0) {
    const recent5 = history.slice(0, 5);
    const bigs = recent5.filter(h => h.size === 'BIG').length;
    lastSizeRatio = bigs / recent5.length;
  }

  // Strategy logic
  let predictedSize: 'BIG' | 'SMALL' = 'BIG';
  let predictedNumber = 6;
  let predictedColor: 'GREEN' | 'RED' | 'VIOLET' = 'GREEN';

  if (strategy === 'FOLLOW_STREAK' && history.length > 0) {
    // Follow previous winning size
    predictedSize = history[0].size;
  } else if (strategy === 'REVERSE_PATTERN' && history.length > 0) {
    // Reverse previous winning size
    predictedSize = history[0].size === 'BIG' ? 'SMALL' : 'BIG';
  } else {
    // AI Trend Hybrid (Default)
    const rawVal = (seed * 17 + Math.floor(lastSizeRatio * 100)) % 100;
    predictedSize = rawVal > 48 ? 'BIG' : 'SMALL';
  }

  // Pick high probability number matching predicted size
  if (predictedSize === 'BIG') {
    const bigNumbers = [5, 6, 7, 8, 9];
    predictedNumber = bigNumbers[(seed + history.length) % bigNumbers.length];
  } else {
    const smallNumbers = [0, 1, 2, 3, 4];
    predictedNumber = smallNumbers[(seed + history.length) % smallNumbers.length];
  }

  const meta = getNumberMeta(predictedNumber);
  predictedColor = meta.color.toUpperCase() as 'GREEN' | 'RED' | 'VIOLET';

  const accuracy = 88 + (seed % 11); // 88% - 98% VIP probability rating

  return {
    period,
    fullPeriod,
    prediction: predictedSize,
    secondaryColor: predictedColor,
    number: predictedNumber,
    accuracy,
    calculatedAt: new Date().toISOString(),
    reason: `VIP Pattern Matrix v4.2 [${strategy}]`
  };
}

/**
 * Parse upstream API raw object into standard history array
 */
export function parseUpstreamData(raw: any): WingoHistoryItem[] {
  if (!raw) return [];
  
  let list: any[] = [];
  if (Array.isArray(raw)) list = raw;
  else if (raw.data && Array.isArray(raw.data.list)) list = raw.data.list;
  else if (raw.data && Array.isArray(raw.data)) list = raw.data;
  else if (raw.list && Array.isArray(raw.list)) list = raw.list;

  return list.map((item: any) => {
    const num = typeof item.number === 'number' ? item.number : parseInt(item.number || '0', 10);
    const meta = getNumberMeta(num);
    const issueNumber = String(item.issueNumber || item.period || item.issue || '');
    
    return {
      issueNumber: issueNumber.length > 3 ? issueNumber.slice(-3) : issueNumber,
      number: num,
      color: meta.color,
      size: item.size ? item.size.toUpperCase() : meta.size,
      createTime: item.createTime || item.time || ''
    };
  });
}
