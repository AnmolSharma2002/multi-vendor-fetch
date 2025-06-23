const { Queue } = require("bullmq");
const { createClient } = require("redis");

const redisOptions = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
};

const connection = createClient(redisOptions);

const jobQueue = new Queue("jobQueue", { connection });

module.exports = jobQueue;
