const config = require('./config');

if (config.cacheDriver === 'redis') {
    const { createClient } = require('redis');
    const redisClient = createClient({ url: config.redisUrl });
    redisClient.connect().catch(err => console.error('Redis connect error', err));

    module.exports = {
        async get(key) {
            const val = await redisClient.get(key);
            return val ? JSON.parse(val) : undefined;
        },
        async set(key, value, ttlSeconds) {
            const s = JSON.stringify(value);
            if (ttlSeconds) await redisClient.set(key, s, { EX: ttlSeconds });
            else await redisClient.set(key, s);
        },
        async del(key) { await redisClient.del(key); }
    };
} else {
    const NodeCache = require('node-cache');
    const cache = new NodeCache();
    module.exports = {
        get(key) { return cache.get(key); },
        set(key, value, ttlSeconds) { cache.set(key, value, ttlSeconds); },
        del(key) { cache.del(key); }
    };
}