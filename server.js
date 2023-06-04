const express = require("express");
const cors = require("cors");
const http = require("http");
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");
const authRouter = require("./authRouter");
const db = require("./database/db");
const Converstation = require("./database/models/conversation.model");
const io = new Server(server, {
  cors: {
    origins: "http://localhost:5173/",
  },
});

const activeUsers = {};
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());
app.use("/api", authRouter);
app.set("socketio", io);
app.set("activeUsers", activeUsers);

app.get("/", (req, res) => {
  res.send(`Node Server at port ${PORT}`);
});

io.on("connection", async (socket) => {
  const user = socket.handshake.query.user;
  activeUsers[user] = socket.id;
  socket.on("disconnect", async (reason) => {
    delete activeUsers[user];
  });
  socket.on("join-conversation", (room) => {
    const rooms = Array.from(socket.rooms).filter((s) => s !== socket.id);
    if (rooms.length > 0) {
      socket.leave(rooms[0]);
    }
    socket.join(room);
  });
  socket.on("send-message", async (data) => {
    const conv = await Converstation.findOne({ _id: data.room });
    conv.messages.push(data.message);
    conv.save();
    io.to(data.room).emit("recieve-message", { msg: data.message });
  });
});

server.listen(PORT, (err) => {
  if (!err) console.log(`Server started on http://localhost:${PORT}`);
  else throw err;
});
