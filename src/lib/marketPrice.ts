// Market price scraper — replaces Playwright entirely
// Uses plain HTTP + Cheerio HTML parsing
// eBay does not block plain HTTP requests with real browser headers
// Falls back gracefully — never throws, never fails the pipeline

import * as cheerio from 'cheerio';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
};

const PKR_RATE = 278.50; // Update this periodically or pull from a free currency API

function parsePrice(text: string): number | null {
  // Strip everything except digits and decimal point
  const cleaned = text.replace(/[^\d.]/g, '');
  // Handle ranges like "10.00 to 25.00" — take the lower bound
  const first = cleaned.split('to')[0].trim();
  const val = parseFloat(first);
  return isNaN(val) || val <= 0 ? null : val;
}

function trimmedMean(prices: number[]): number {
  if (prices.length === 0) return 0;
  const sorted = [...prices].sort((a, b) => a - b);
  const trim = Math.floor(sorted.length * 0.15);
  const trimmed = sorted.slice(trim, sorted.length - trim || undefined);
  return trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
}

export async function scrapeMarketPrice(itemName: string): Promise<number | null> {
  const query = encodeURIComponent(itemName);
  // _sop=12 = sort by best match, LH-BIN = Buy It Now only (more stable prices)
  const url = `https://www.ebay.com/sch/i.html?_nkw=${query}&_sop=12&LH_BIN=1`;

  try {
    const res = await fetch(url, {
      headers: HEADERS,
      signal: AbortSignal.timeout(8_000),
    });

    if (!res.ok) {
      console.warn(`[scraper] HTTP ${res.status} for "${itemName}"`);
      return null;
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const prices: number[] = [];

    // Primary selector — eBay's current class for listing prices
    $('.s-item__price').each((_, el) => {
      const raw = $(el).text().trim();
      const usdPrice = parsePrice(raw);
      if (usdPrice !== null && usdPrice > 0.5) { // filter out suspiciously low values
        prices.push(usdPrice * PKR_RATE);
      }
    });

    if (prices.length === 0) {
      console.warn(`[scraper] No prices found for "${itemName}"`);
      return null;
    }

    const result = Math.round(trimmedMean(prices));
    console.log(`[scraper] "${itemName}" → ${prices.length} prices → avg PKR ${result}`);
    return result;

  } catch (err: any) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      console.warn(`[scraper] Timeout for "${itemName}"`);
    } else {
      console.warn(`[scraper] Error for "${itemName}":`, err?.message);
    }
    return null;
  }
}
