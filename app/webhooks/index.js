require("dotenv").config({ path: "../api/.env" });
const express = require("express");
const mongoose = require("mongoose");
const Job = require("../api/models/Job");

const app = express();
const PORT = 4002;

app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Webhook connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.post("/vendor-webhook/async", async (req, res) => {
  const { request_id, result } = req.body;

  try {
    const updated = await Job.findOneAndUpdate(
      { request_id },
      { status: "complete", result },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "Job not found" });
    }

    console.log(`Webhook updated job ${request_id}`);
    res.json({ status: "updated" });
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.status(500).json({ error: "Internal error" });
  }
});

app.listen(PORT, () => {
  console.log(`Webhook service running on port ${PORT}`);
});
