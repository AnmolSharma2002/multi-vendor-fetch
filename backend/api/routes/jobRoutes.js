const express = require("express");
const { v4: uuidv4 } = require("uuid");
const Job = require("../models/Job");
const jobQueue = require("../services/queue");

const router = express.Router();

// POST /jobs
router.post("/", async (req, res) => {
  const request_id = uuidv4();
  const payload = req.body;
  const vendor = Math.random() < 0.5 ? "sync" : "async";

  try {
    await Job.create({ request_id, payload, status: "pending", vendor });

    await jobQueue.add("newJob", { request_id, payload, vendor });

    res.json({ request_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Job creation failed" });
  }
});

// GET /jobs/:id
router.get("/:id", async (req, res) => {
  const job = await Job.findOne({ request_id: req.params.id });

  if (!job) return res.status(404).json({ error: "Job not found" });

  if (job.status === "complete") {
    return res.json({ status: job.status, result: job.result });
  }

  res.json({ status: job.status });
});

module.exports = router;
