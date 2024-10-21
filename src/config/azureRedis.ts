import Redis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6380', 10),
  password: process.env.REDIS_PASSWORD,
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
};

let redis: Redis | null = null;

if (typeof window === 'undefined') {
  redis = new Redis(redisConfig);
}

export default redis;