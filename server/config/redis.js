const { Redis } = require("@upstash/redis");

// Singleton Redis client — connects via persistent TCP pool using rediss:// (TLS)
// Upstash REST SDK reads REDIS_URL automatically when using the format:
//   rediss://:password@host:port
// We parse the URL manually to support both redis:// and rediss:// schemes.

let redisClient = null;

function getRedisClient() {
  if (redisClient) return redisClient;

  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not set in environment variables");
  }

  // @upstash/redis accepts { url, token } format for REST API
  // For TCP connections via rediss://, we map the URL components
  // The REDIS_URL in .env is rediss://:password@host:port
  // Upstash REST endpoint is derived from the host
  const match = url.match(/^rediss?:\/\/(?:default:)?([^@]+)@([^:]+):(\d+)$/);
  if (!match) {
    throw new Error("Invalid REDIS_URL format. Expected: rediss://:password@host:port");
  }

  const [, token, host] = match;
  const restUrl = `https://${host}`;

  redisClient = new Redis({
    url: restUrl,
    token,
  });

  console.info(`[Redis] Connected to Upstash at ${host}`);
  return redisClient;
}

module.exports = { getRedisClient };
