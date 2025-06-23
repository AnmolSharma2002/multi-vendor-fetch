const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    request_id: { type: String, required: true },
    payload: { type: Object },
    status: {
      type: String,
      enum: ["pending", "processing", "complete", "failed"],
      default: "pending",
    },
    result: { type: Object },
    vendor: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", JobSchema);
