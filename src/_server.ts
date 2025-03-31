import { createServer } from "http";
import { Server } from "socket.io";
import { randomBytes } from "crypto";

const server = createServer();
const io = new Server(server, { cors: { origin: "*" } });

const rooms: Map<string, Set<string>> = new Map();

io.on("connection", (socket) => {
    console.log("A player has connected");

    socket.on("create", () => {
        const room = randomBytes(2).toString("hex").toUpperCase();
        rooms.set(room, new Set());
        rooms.get(room)?.add(socket.id);
        socket.emit("room", room);
        socket.join(room);
        console.log(`${socket.id} has created room ${room}`);
    });

    socket.on("join", (room) => {
        const roomExists = rooms.has(room);
        if (!roomExists) {
            socket.emit("error", "Room does not exist");
            return;
        }
        rooms.get(room)?.add(socket.id);
        socket.join(room);
        socket.emit("join", room);
        console.log(`${socket.id} has joined room ${room}`);
    });

    socket.on("move", (room, move) => {
        console.log(`${socket.id} has made a move in room ${room}`);
        socket.to(room).emit("move", move);
    });

    socket.on("disconnect", () => {
        console.log("A player has disconnected");
        rooms.forEach((players, room) => {
            if (players.has(socket.id)) {
                players.delete(socket.id);
                console.log(`Player ${socket.id} has left room ${room}`);
                if (players.size === 0) {
                    rooms.delete(room);
                    console.log(`Room ${room} has been deleted`);
                }
            }
        });
    });
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
