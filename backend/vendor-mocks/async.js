const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

app.post("/vendor", (req, res) => {
  const { request_id, data } = req.body;

  console.log(`Async vendor received job ${request_id}`);

  // Simulate delayed processing
  setTimeout(async () => {
    const cleaned = {
      name: (data.name || "").trim(),
      email: "REDACTED",
      timestamp: new Date().toISOString(),
    };

    try {
      await axios.post(`http://webhook:4002/vendor-webhook/async`, {
        request_id,
        result: cleaned,
      });

      console.log(`Async vendor sent result for ${request_id}`);
    } catch (err) {
      console.error("Failed to call webhook:", err.message);
    }
  }, 5000);

  res.json({ status: "received", vendor: "async" });
});

app.listen(5002, () => console.log("Async vendor running on port 5002"));
