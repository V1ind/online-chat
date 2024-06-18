const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(path.join(__dirname, "public")));

const users = {};
let rooms = ["Discord", "Skype", "TeamSpeak"];

io.on("connection", (socket) => {
  console.log("New user connected");

  socket.emit("updateRooms", rooms);

  socket.on("getRooms", () => {
    socket.emit("updateRooms", rooms);
  });

  socket.on("joinRoom", ({ username, room }) => {
    socket.join(room);

    users[socket.id] = { username, room };

    socket.emit("message", {
      username: "System",
      text: `Welcome to the ${room} chat!`,
    });
    socket.broadcast.to(room).emit("message", {
      username: "System",
      text: `${username} has joined the ${room} chat`,
    });

    io.to(room).emit("roomUsers", {
      room,
      users: Object.values(users).filter((user) => user.room === room),
    });

    socket.on("chatMessage", (msg) => {
      io.to(room).emit("message", { username, text: msg });
    });

    socket.on("typing", () => {
      socket.broadcast.to(room).emit("typing", { username });
    });

    socket.on("stopTyping", () => {
      socket.broadcast.to(room).emit("stopTyping");
    });

    socket.on("leaveRoom", () => {
      const user = users[socket.id];
      if (user) {
        socket.leave(user.room);
        delete users[socket.id];
        io.to(user.room).emit("message", {
          username: "System",
          text: `${user.username} has left the ${user.room} chat`,
        });
        io.to(user.room).emit("roomUsers", {
          room: user.room,
          users: Object.values(users).filter((user) => user.room === user.room),
        });
        socket.removeAllListeners("chatMessage");
        socket.removeAllListeners("typing");
        socket.removeAllListeners("stopTyping");
      }
    });

    socket.on("disconnect", () => {
      const user = users[socket.id];
      if (user) {
        io.to(user.room).emit("message", {
          username: "System",
          text: `${user.username} has disconnected from the ${user.room} chat`,
        });
        socket.leave(user.room);
        delete users[socket.id];
        io.to(user.room).emit("roomUsers", {
          room: user.room,
          users: Object.values(users).filter((user) => user.room === user.room),
        });
        socket.removeAllListeners("chatMessage");
        socket.removeAllListeners("typing");
        socket.removeAllListeners("stopTyping");
      }
    });
  });

  socket.on("createRoom", (newRoom) => {
    if (newRoom && !rooms.includes(newRoom)) {
      rooms.push(newRoom);
      io.emit("updateRooms", rooms);
    }
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
