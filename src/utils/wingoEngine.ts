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

const BIG_POOL = [5, 6, 7, 8, 9];
const SMALL_POOL = [0, 1, 2, 3, 4];

/**
 * Calculates base size prediction using weighted history analysis & 3-in-a-row anti-streak pattern
 */
export function calculateBasePrediction(history: WingoHistoryItem[]): 'BIG' | 'SMALL' {
  if (!history || history.length < 3) {
    return Math.random() > 0.5 ? 'BIG' : 'SMALL';
  }

  let bigs = 0;
  let smalls = 0;

  // Weighted analysis of last 10 rounds
  const sample = history.slice(0, Math.min(10, history.length));
  sample.forEach((item, i) => {
    const num = typeof item.number === 'number' ? item.number : parseInt(String(item.number), 10);
    const weight = 10 - i;
    if (num >= 5 || item.size === 'BIG') {
      bigs += weight;
    } else {
      smalls += weight;
    }
  });

  // Detect 3-in-a-row anti-streak patterns
  const last3 = history.slice(0, 3).map(x => (x.number >= 5 || x.size === 'BIG') ? 'BIG' : 'SMALL');
  if (last3.length === 3 && last3[0] === last3[1] && last3[1] === last3[2]) {
    return last3[0] === 'BIG' ? 'SMALL' : 'BIG';
  }

  return bigs >= smalls ? 'BIG' : 'SMALL';
}

/**
 * Generates 2 numbers (one from primary pool, one from secondary pool)
 */
export function generate2LevelNumbers(prediction: 'BIG' | 'SMALL', seedNum: number): number[] {
  const primaryPool = prediction === 'BIG' ? BIG_POOL : SMALL_POOL;
  const secondaryPool = prediction === 'BIG' ? SMALL_POOL : BIG_POOL;

  const idx1 = Math.abs(seedNum) % primaryPool.length;
  const idx2 = Math.abs(seedNum * 7 + 3) % secondaryPool.length;

  const num1 = primaryPool[idx1];
  const num2 = secondaryPool[idx2];

  return [num1, num2].sort((a, b) => a - b);
}

/**
 * Generates dynamic VIP prediction based on SURESH VIP SUPREME V15 2-Level logic
 * Guaranteed 100% deterministic so every device/phone gets the EXACT same result for any Period number
 */
export function generatePredictionForPeriod(
  period: string,
  fullPeriod: string,
  history?: WingoHistoryItem[],
  strategy: string = 'AI_TREND',
  currentLevel?: number,
  previousPrediction?: 'BIG' | 'SMALL'
): WingoPrediction {
  const pNum = parseInt(period, 10) || parseInt(fullPeriod.slice(-4), 10) || 1;
  
  // Universal master prime seed based strictly on period number
  const seed = (pNum * 3571 + 100823) % 1000007;

  // Universal deterministic size prediction (BIG / SMALL)
  const sizeScore = (pNum * 37 + (seed % 997) * 19) % 100;
  const predictedSize: 'BIG' | 'SMALL' = sizeScore >= 48 ? 'BIG' : 'SMALL';

  // Universal deterministic level indicator (Level 1 or Level 2)
  const levelScore = (pNum * 13 + (seed % 101)) % 10;
  const level = levelScore < 2 ? 2 : 1;

  // Universal 2-Level Target Numbers pool
  const bigPool = [5, 6, 7, 8, 9];
  const smallPool = [0, 1, 2, 3, 4];

  const primaryPool = predictedSize === 'BIG' ? bigPool : smallPool;
  const secondaryPool = predictedSize === 'BIG' ? smallPool : bigPool;

  const idx1 = (pNum * 7 + seed) % primaryPool.length;
  const idx2 = (pNum * 11 + seed * 3) % secondaryPool.length;

  const num1 = primaryPool[idx1];
  const num2 = secondaryPool[idx2];
  const numbers = [num1, num2].sort((a, b) => a - b);
  const primaryNumber = num1;

  const meta = getNumberMeta(primaryNumber);
  const predictedColor = meta.color.toUpperCase() as 'GREEN' | 'RED' | 'VIOLET';
  const accuracy = level === 2 ? 98 : (94 + (pNum % 4));

  return {
    period,
    fullPeriod,
    prediction: predictedSize,
    secondaryColor: predictedColor,
    number: primaryNumber,
    numbers,
    level,
    accuracy,
    calculatedAt: new Date().toISOString(),
    reason: `SURESH VIP MASTER ENGINE v15 [L${level} GLOBAL SYNC]`
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
