import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// For __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load .env manually (optional but matches your old dotenv behavior)
function loadEnv() {
  try {
    const content = fs.readFileSync(".env", "utf8");
    content.split("\n").forEach(line => {
      const [key, value] = line.split("=");
      if (key && value) process.env[key.trim()] = value.trim();
    });
  } catch {}
}
loadEnv();

// ✅ Serve static files from ./public
function serveStatic(req, res) {
  const filePath =
    req.url === "/" ? "/index.html" : req.url;

  const absPath = path.join(__dirname, "public", filePath);

  if (fs.existsSync(absPath) && fs.statSync(absPath).isFile()) {
    fs.createReadStream(absPath).pipe(res);
    return true;
  }
  return false;
}

const server = http.createServer(async (req, res) => {
  if (req.url === "/api/search") {
    try {
      const apiRes = await fetch(
        "https://api.collegefootballdata.com/teams/fbs",
        {
          headers: {
            Authorization: `Bearer ${process.env.CFBD_API_KEY}`
          }
        }
      );
      const data = await apiRes.json();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    } catch (err) {
      console.error("Error fetching data:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Failed to fetch data" }));
    }
    return;
  }

  if (req.url.startsWith("/api/games")) {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const team = urlObj.searchParams.get("team");
  const conference = urlObj.searchParams.get("conference");
  let week = urlObj.searchParams.get("week");
  if (!week){
    week = 11;
  }

  // Build CFBD query params
  const cfbdParams = new URLSearchParams({
    year: "2025",
    seasonType: "regular",
    classification: "fbs",
  });

  if (team) cfbdParams.append("team", team);
  if (conference) cfbdParams.append("conference", conference);
  if (week) cfbdParams.append("week", week);

  const apiURL = `https://api.collegefootballdata.com/games?${cfbdParams.toString()}`;
  console.log(apiURL);

  try {
    const apiRes = await fetch(apiURL, {
      headers: {
        Authorization: `Bearer ${process.env.CFBD_API_KEY}`
      }
    });

    const data = await apiRes.json();

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
  } catch (err) {
    console.error("Error fetching games:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Failed to fetch games" }));
  }
  return;
}
if (serveStatic(req, res)) return;

res.writeHead(404, { "Content-Type": "text/plain" });
res.end("Not found");
});
server.listen(3000, () =>
  console.log("Server running → http://localhost:3000")
);