require("dotenv").config({ path: "../api/.env" });
const mongoose = require("mongoose");
const axios = require("axios");
const { Worker } = require("bullmq");
const { createClient } = require("redis");
const Job = require("../api/models/Job");

// Redis connection
const redisConnection = createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});
redisConnection.connect();

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Worker connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Create worker
const worker = new Worker(
  "jobQueue",
  async (job) => {
    const { request_id, payload, vendor } = job.data;

    console.log(`Processing job ${request_id} via ${vendor} vendor`);

    await Job.findOneAndUpdate({ request_id }, { status: "processing" });

    try {
      if (vendor === "sync") {
        const res = await axios.post("http://sync-vendor:5001/vendor", payload);
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
    connection: redisConnection,
  }
);
