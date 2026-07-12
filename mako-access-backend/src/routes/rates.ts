import { Router } from 'express';

const router = Router();

const CACHE_TTL_MS = 60 * 60 * 1000;
const FALLBACK_USD_TO_NGN = 1400;

let cachedRate: number | null = null;
let cachedAt = 0;

router.get('/usd-ngn', async (req, res) => {
  const now = Date.now();
  if (cachedRate && now - cachedAt < CACHE_TTL_MS) {
    return res.json({ usdToNgn: cachedRate, cached: true });
  }

  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json() as { rates?: Record<string, number> };
    const rate = data?.rates?.NGN;
    if (typeof rate !== 'number') throw new Error('NGN rate missing from response');

    cachedRate = rate;
    cachedAt = now;
    res.json({ usdToNgn: rate, cached: false });
  } catch (error: any) {
    if (cachedRate) return res.json({ usdToNgn: cachedRate, cached: true, stale: true });
    res.json({ usdToNgn: FALLBACK_USD_TO_NGN, cached: false, fallback: true });
  }
});

export default router;
