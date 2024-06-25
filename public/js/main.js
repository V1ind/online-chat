const socket = io();
const roomSelect = document.getElementById("room");
const usernameInput = document.getElementById("username");
const chatInput = document.getElementById("chat-input");
const joinBtn = document.getElementById("join-btn");
const leaveBtn = document.getElementById("leave-btn");
const createRoomBtn = document.getElementById("create-room-btn");
const roomName = document.getElementById("room-name");
const usersList = document.getElementById("users");
const selectionForm = document.getElementById("selection-form");
const chatContainer = document.getElementById("chat-container");
const chatBox = document.getElementById("chat-box");
const sendBtn = document.getElementById("send-btn");

let username = "";
let room = "";

function addMessage(username, text) {
  const div = document.createElement("div");
  const timestamp = new Date().toLocaleTimeString();
  div.innerHTML = `<strong>${username}</strong>: ${text} <span class="timestamp">${timestamp}</span>`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

joinBtn.addEventListener("click", () => {
  username = usernameInput.value.trim();
  room = roomSelect.value;
  if (username) {
    socket.emit("joinRoom", { username, room });
    selectionForm.classList.add("hidden");
    chatContainer.classList.remove("hidden");
    roomName.textContent = `${room}`;
  } else {
    alert("Please enter a username");
  }
});

chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && chatInput.value.trim() !== "") {
    socket.emit("chatMessage", chatInput.value);
    chatInput.value = "";
  }
});

sendBtn.addEventListener("click", () => {
  if (chatInput.value.trim() !== "") {
    socket.emit("chatMessage", chatInput.value);
    chatInput.value = "";
  }
});

leaveBtn.addEventListener("click", () => {
  socket.emit("leaveRoom");
  chatBox.innerHTML = "";
  chatContainer.classList.add("hidden");
  selectionForm.classList.remove("hidden");
});

createRoomBtn.addEventListener("click", () => {
  const newRoom = document.getElementById("new-room").value.trim();
  if (newRoom) {
    socket.emit("createRoom", newRoom);
    document.getElementById("new-room").value = "";
  } else {
    alert("Please enter a room name");
  }
});

socket.on("message", ({ username, text }) => {
  addMessage(username, text);
});

socket.on("roomUsers", ({ users }) => {
  usersList.innerHTML = users
    .map((user) => `<li>${user.username}</li>`)
    .join("");
});

function updateUserList(users) {
  const userCount = users.length;
  const userCountElement = document.getElementById("user-count");
  const userListElement = document.getElementById("users");
  userListElement.innerHTML = "";

  users.forEach((user) => {
    const userItem = document.createElement("li");
    userItem.textContent = user.username;
    userListElement.appendChild(userItem);
  });

  userCountElement.textContent = userCount;
}

socket.on("updateRooms", (rooms) => {
  roomSelect.innerHTML = "";
  rooms.forEach((room) => {
    const option = document.createElement("option");
    option.value = room;
    option.textContent = room;
    roomSelect.appendChild(option);
  });
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
