import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Test Route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // LINE Proxy Route
  app.post("/api/line-notify", async (req, res) => {
    const body = req.body || {};
    const { message, flexMessage, token: bodyToken, userId: bodyUserId } = body;
    
    // Use values from body if provided (from constants.ts), otherwise fallback to environment variables
    const token = bodyToken || process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const userId = bodyUserId || process.env.LINE_USER_ID;

    if (!token || !userId) {
      console.error('LINE Config Missing in .env');
      return res.status(500).json({ error: 'LINE configuration missing on server' });
    }
    
    try {
      const messages = flexMessage ? [flexMessage] : [
        {
          type: 'text',
          text: message
        }
      ];

      const response = await fetch('https://api.line.me/v2/bot/message/push', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to: userId,
          messages: messages
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('LINE API Error:', errorData);
        return res.status(response.status).json(errorData);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Server LINE Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  if (process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
