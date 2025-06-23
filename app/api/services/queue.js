const { Queue } = require("bullmq");
const IORedis = require("ioredis");

// Create Redis client with robust options
const redis = new IORedis({
  host: process.env.REDIS_HOST || "redis",
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  maxRetriesPerRequest: null,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true,
  reconnectOnError: (err) => {
    console.error("Redis reconnect on error:", err.message);
    return true;
  },
});

redis.on("connect", () => {
  console.log("Redis connected (jobQueue)");
});
redis.on("error", (err) => {
  console.error("Redis connection error (jobQueue):", err.message);
});

// Create BullMQ queue with the redis connection
const jobQueue = new Queue("jobQueue", {
  connection: redis,
});

module.exports = jobQueue;
