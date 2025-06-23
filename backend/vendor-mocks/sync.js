const express = require("express");
const app = express();
app.use(express.json());

app.post("/vendor", (req, res) => {
  const cleaned = {
    name: (req.body.name || "").trim(),
    email: "REDACTED",
    timestamp: new Date().toISOString(),
  };

  console.log("Sync vendor processed request");
  res.json(cleaned);
});

app.listen(5001, () => console.log("Sync vendor running on port 5001"));
