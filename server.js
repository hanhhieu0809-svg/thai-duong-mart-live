import express from "express";
import cors from "cors";
import { TikTokLiveConnection, WebcastEvent } from "tiktok-live-connector";

const app = express();
app.use(cors());
app.use(express.json());

let connection;
const clients = [];

app.get("/", (req, res) => {
  res.send("Thai Duong Mart LIVE is running!");
});

app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients.push(res);

  req.on("close", () => {
    const index = clients.indexOf(res);
    if (index !== -1) clients.splice(index, 1);
  });
});

function sendToGame(data) {
  for (const client of clients) {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  }
}

async function startTikTok() {
  const username = process.env.TIKTOK_USERNAME;

  if (!username) {
    console.log("Chua cai TIKTOK_USERNAME");
    return;
  }

  connection = new TikTokLiveConnection(username);

  connection.on(WebcastEvent.CHAT, (event) => {
    const comment = event.comment || "";
    console.log(comment);

    sendToGame({
      nickname: event.user?.nickname || "Khach",
      comment
    });
  });

  connection.on("error", (err) => {
    console.log("TikTok error:", err.message);
  });

  try {
    await connection.connect();
    console.log("Da ket noi TikTok LIVE!");
  } catch (err) {
    console.log("Khong ket noi duoc:", err.message);
  }
}

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("Server started on port", port);
  startTikTok();
});
