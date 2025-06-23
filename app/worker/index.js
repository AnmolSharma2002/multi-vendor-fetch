require("dotenv").config({ path: "../api/.env" });
const mongoose = require("mongoose");
const axios = require("axios");
const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const Job = require("../api/models/Job");

console.log("=== Worker Starting ===");
console.log("Environment check:");
console.log("REDIS_HOST:", process.env.REDIS_HOST || "NOT SET");
console.log("REDIS_URL:", process.env.REDIS_URL || "NOT SET");

// MongoDB connection
const connectMongo = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Worker connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    console.log("Retrying MongoDB connection in 5 seconds...");
    setTimeout(connectMongo, 5000);
  }
};

// Start MongoDB connection
connectMongo();

// Redis connection configuration
const redisConfig = {
  host: "redis",
  port: 6379,
  maxRetriesPerRequest: null,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  lazyConnect: true,
  reconnectOnError: (err) => {
    console.log("Redis reconnect on error:", err.message);
    return true;
  },
};

console.log("Redis config:", redisConfig);

// Wait for Redis to be ready before starting worker
const startWorker = async () => {
  console.log("Attempting to start worker...");

  // Test Redis connection first
  const testRedis = new IORedis(redisConfig);

  try {
    console.log("Testing Redis connection...");
    await testRedis.connect();
    console.log("Redis connection test successful");

    const pingResult = await testRedis.ping();
    console.log("Redis ping successful:", pingResult);

    await testRedis.disconnect();
    console.log(" Test connection closed");
  } catch (err) {
    console.error("Redis connection test failed:", err.message);
    console.log("Retrying in 5 seconds...");
    setTimeout(startWorker, 5000);
    return;
  }

  try {
    console.log("Creating BullMQ Worker...");

    // Create worker with the same Redis config
    const worker = new Worker(
      "jobQueue",
      async (job) => {
        const { request_id, payload, vendor } = job.data;

        console.log(`Processing job ${request_id} via ${vendor} vendor`);

        await Job.findOneAndUpdate({ request_id }, { status: "processing" });

        try {
          if (vendor === "sync") {
            const res = await axios.post(
              "http://sync-vendor:5001/vendor",
              payload
            );
            const cleanedResult = res.data;

            await Job.findOneAndUpdate(
              { request_id },
              { status: "complete", result: cleanedResult }
            );

            console.log(`Job ${request_id} completed via sync`);
          } else {
            await axios.post("http://async-vendor:5002/vendor", {
              request_id,
              data: payload,
            });

            console.log(`Job ${request_id} sent to async vendor`);
          }
        } catch (err) {
          console.error(`Error processing job ${request_id}:`, err.message);
          await Job.findOneAndUpdate({ request_id }, { status: "failed" });
        }
      },
      {
        connection: redisConfig, // Pass config directly instead of RedisConnection
      }
    );

    worker.on("ready", () => {
      console.log(" Worker is ready and listening for jobs");
    });

    worker.on("error", (err) => {
      console.error(" Worker error:", err.message);
    });

    worker.on("failed", (job, err) => {
      console.error(`Job ${job?.id} failed:`, err.message);
    });

    worker.on("completed", (job) => {
      console.log(`Job ${job.id} completed`);
    });

    console.log(" Worker started successfully");
  } catch (err) {
    console.error("Failed to start worker:", err.message);
    console.log("Retrying in 5 seconds...");
    setTimeout(startWorker, 5000);
  }
};

// Add delay to ensure Redis container is ready
setTimeout(() => {
  console.log("Starting worker initialization...");
  startWorker();
}, 3000);
