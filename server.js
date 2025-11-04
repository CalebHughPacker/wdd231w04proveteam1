import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.static("public"));

app.get("/api/test", async (req, res) => {
  try {
    const response = await fetch("https://api.collegefootballdata.com/teams/fbs", {
      headers: { Authorization: `Bearer ${process.env.CFBD_API_KEY}` },
    });
    const data = await response.json();
    res.json(data.slice(0, 10)); // just send a few for now
  } catch (err) {
    console.error("Error fetching data:", err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.listen(3000, () => console.log("Server running → http://localhost:3000"));
