const express = require("express");
const http = require("http");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const socketIo = require("socket.io");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: "*" } });
const db = new sqlite3.Database("./chat.db");

app.use(express.json());
app.use(cors());

// Create tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT
    )`);
  db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender TEXT,
        message TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

const SECRET_KEY = "your_secret_key";

// Register user
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) return res.status(500).json({ error: err.message });
    db.run(
      "INSERT INTO users (email, password) VALUES (?, ?)",
      [email, hash],
      (err) => {
        if (err) return res.status(400).json({ error: "Email already exists" });
        res.json({ message: "User registered successfully" });
      }
    );
  });
});

// Login user
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, user) => {
    if (!user) return res.status(400).json({ error: "Invalid credentials" });
    bcrypt.compare(password, user.password, (err, result) => {
      if (!result)
        return res.status(400).json({ error: "Invalid credentials" });
      const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: "1h" });
      res.json({ token });
    });
  });
});

// Fetch previous messages
app.get("/messages", (req, res) => {
  db.all("SELECT * FROM messages ORDER BY timestamp ASC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Socket.io chat functionality
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("sendMessage", (data) => {
    const { sender, message } = data;
    db.run(
      "INSERT INTO messages (sender, message) VALUES (?, ?)",
      [sender, message],
      (err) => {
        if (!err) {
          io.emit("receiveMessage", { sender, message, timestamp: new Date() });
        }
      }
    );
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
