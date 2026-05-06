export interface SalesPoint {
  ds: Date;
  y: number;
}

export interface ForecastPoint {
  date: string;
  context: string;
  predicted: number;
  low: number;
  high: number;
  actual: number | null;
}

type Freq = "D" | "W" | "M" | "Y";

const FREQ_MS: Record<Freq, number> = {
  D: 86_400_000,
  W: 604_800_000,
  M: 2_629_800_000,
  Y: 31_557_600_000,
};

function isoWeek(d: Date): number {
  const jan4 = new Date(d.getFullYear(), 0, 4);
  return Math.ceil(
    ((d.getTime() - jan4.getTime()) / 86_400_000 + jan4.getDay() + 1) / 7
  );
}

function formatDate(d: Date, freq: Freq): { date: string; context: string } {
  switch (freq) {
    case "D":
      return {
        date: String(d.getDate()),
        context: d.toLocaleString("en", { month: "long", year: "numeric" }),
      };
    case "W":
      return {
        date: `Wk ${isoWeek(d)}`,
        context: d.toLocaleString("en", { month: "long", year: "numeric" }),
      };
    case "M":
      return {
        date: d.toLocaleString("en", { month: "short" }),
        context: String(d.getFullYear()),
      };
    case "Y":
      return { date: String(d.getFullYear()), context: "" };
  }
}

function resample(history: SalesPoint[], freq: Freq): SalesPoint[] {
  const buckets = new Map<number, number>();

  for (const point of history) {
    const d = point.ds;
    let key: number;

    switch (freq) {
      case "D":
        key = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        break;
      case "W": {
        const day = d.getDay();
        const monday = new Date(
          d.getTime() - (day === 0 ? 6 : day - 1) * 86_400_000
        );
        key = new Date(
          monday.getFullYear(),
          monday.getMonth(),
          monday.getDate()
        ).getTime();
        break;
      }
      case "M":
        key = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
        break;
      case "Y":
        key = new Date(d.getFullYear(), 0, 1).getTime();
        break;
    }

    buckets.set(key, (buckets.get(key) ?? 0) + point.y);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a - b)
    .map(([ts, y]) => ({ ds: new Date(ts), y }));
}

export function runForecast(
  rawHistory: SalesPoint[],
  futureCount: number,
  freq: Freq,
  historyTailCount = 6
): ForecastPoint[] {
  const history = resample(rawHistory, freq);
  const n = history.length;

  if (n < 3) return [];

  const values = history.map((h) => h.y);
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean);
    den += (i - xMean) ** 2;
  }

  const slope = den !== 0 ? num / den : 0;
  const intercept = yMean - slope * xMean;

  const residuals = values.map((v, i) => v - (intercept + slope * i));
  const variance = residuals.reduce((a, b) => a + b ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);
  const z90 = 1.645;

  const alpha = 0.3;
  let smoothed = residuals[0];
  for (let i = 1; i < n; i++) {
    smoothed = alpha * residuals[i] + (1 - alpha) * smoothed;
  }

  const result: ForecastPoint[] = [];
  const lastDate = history[history.length - 1].ds;
  const tail = history.slice(-historyTailCount);
  const tailStart = n - tail.length;

  for (let i = 0; i < tail.length; i++) {
    const trendVal = intercept + slope * (tailStart + i);
    const { date, context } = formatDate(tail[i].ds, freq);
    result.push({
      date,
      context,
      predicted: Math.max(0, Math.round(trendVal)),
      low: 0,
      high: 0,
      actual: Math.round(tail[i].y),
    });
  }

  for (let i = 1; i <= futureCount; i++) {
    const futureDate = new Date(lastDate.getTime() + FREQ_MS[freq] * i);
    const trendVal = intercept + slope * (n + i - 1);
    const predicted = Math.max(0, Math.round(trendVal + smoothed));
    const margin = Math.round(
      z90 * stdDev * Math.sqrt(1 + 1 / n + (i - 1) ** 2 / (den || 1))
    );
    const { date, context } = formatDate(futureDate, freq);
    result.push({
      date,
      context,
      predicted,
      low: Math.max(0, predicted - margin),
      high: predicted + margin,
      actual: null,
    });
  }

  return result;
}

export function forecastAllRanges(
  history: SalesPoint[]
): Record<string, ForecastPoint[]> {
  return {
    days: runForecast(history, 14, "D"),
    weeks: runForecast(history, 12, "W"),
    months: runForecast(history, 12, "M"),
    years: runForecast(history, 5, "Y"),
  };
}

export function aggregateForecasts(
  perItem: Record<string, Record<string, ForecastPoint[]>>
): Record<string, ForecastPoint[]> {
  const result: Record<string, ForecastPoint[]> = {};

  for (const range of ["days", "weeks", "months", "years"]) {
    const dateMap = new Map<string, ForecastPoint>();

    for (const ranges of Object.values(perItem)) {
      for (const pt of ranges[range] ?? []) {
        const existing = dateMap.get(pt.date);
        if (!existing) {
          dateMap.set(pt.date, { ...pt });
        } else {
          existing.predicted += pt.predicted;
          existing.low += pt.low;
          existing.high += pt.high;
          if (pt.actual !== null) {
            existing.actual = (existing.actual ?? 0) + pt.actual;
          }
        }
      }
    }

    result[range] = Array.from(dateMap.values());
  }

  return result;
}
