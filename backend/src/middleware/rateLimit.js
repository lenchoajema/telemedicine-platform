// Very lightweight in-memory rate limiter (per user + key)
// For production replace with Redis-backed token bucket.

let RedisLib; let redis; const memoryBuckets = new Map(); const redisUrl = process.env.REDIS_URL;
async function initRedis(){
  if (!redisUrl) return;
  try {
    ({ default: RedisLib } = await import('ioredis'));
    redis = new RedisLib(redisUrl, { lazyConnect:true, maxRetriesPerRequest:1 });
    redis.on('error', ()=>{});
  } catch { /* fallback */ }
}
initRedis();

function key(userId, bucket){ return `rl:${bucket}:${userId}`; }

export function rateLimit({ bucket, windowMs=60000, max=10 }){
  return async function(req,res,next){
    const userId = (req.user?._id) || req.ip;
    const k = key(userId, bucket);
    try {
      if (redis) {
        const count = await redis.incr(k);
        if (count === 1) await redis.pexpire(k, windowMs);
        if (count > max){
          const ttlMs = await redis.pttl(k);
          const retryAfter = Math.ceil(ttlMs/1000);
          res.setHeader('Retry-After', retryAfter);
          return res.status(429).json({ success:false, message:'Rate limit exceeded', retryAfter });
        }
        return next();
      }
    } catch {/* fall back to memory */ }

    const now = Date.now();
    let entry = memoryBuckets.get(k);
    if (!entry || entry.reset < now){
      entry = { count:0, reset: now + windowMs };
      memoryBuckets.set(k, entry);
    }
    if (entry.count >= max){
      const retryAfter = Math.ceil((entry.reset - now)/1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({ success:false, message:'Rate limit exceeded', retryAfter });
    }
    entry.count++;
    next();
  };
}

export function cleanupRateBuckets(){
  const now = Date.now();
  for (const [k,v] of memoryBuckets.entries()) if (v.reset < now) memoryBuckets.delete(k);
}
globalThis.setInterval(cleanupRateBuckets, 60000);
