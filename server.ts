import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// API route to proxy WinGo 1 Min history requests to prevent CORS issues
app.get("/api/wingo/history", async (req, res) => {
  try {
    const targetUrl = "https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json";
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://bdgwinmy.cc/"
      }
    });

    if (!response.ok) {
      throw new Error(`Upstream API status: ${response.status}`);
    }

    const data = await response.json();
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching WinGo history:", error.message);
    // Return fallback structured response if upstream fails or is blocked
    return res.json({
      success: false,
      error: error.message,
      fallback: true
    });
  }
});

// Calculate calculated server state for WinGo 1 Min
app.get("/api/wingo/live-state", async (req, res) => {
  const now = new Date();
  const secondsLeft = 59 - now.getUTCSeconds();
  
  // WinGo 1Min period format generator: YYYYMMDD + total minutes since 00:00 UTC
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  const currentMinuteOfDay = now.getUTCHours() * 60 + now.getUTCMinutes() + 1;
  const periodFull = `${year}${month}${day}10001${String(currentMinuteOfDay).padStart(4, '0')}`;
  const periodShort = String(currentMinuteOfDay).padStart(3, '0');

  // Try fetching upstream data
  let upstreamList: any[] = [];
  try {
    const resp = await fetch("https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json"
      }
    });
    if (resp.ok) {
      const json = await resp.json();
      if (json && json.data && Array.isArray(json.data.list)) {
        upstreamList = json.data.list;
      } else if (Array.isArray(json.list)) {
        upstreamList = json.list;
      } else if (Array.isArray(json.data)) {
        upstreamList = json.data;
      }
    }
  } catch (err) {
    // ignore upstream errors for live fallback
  }

  return res.json({
    periodFull,
    periodShort,
    secondsLeft,
    timestamp: now.toISOString(),
    upstreamList
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
