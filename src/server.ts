import { createServer } from "http";
import { Server } from "socket.io";

const server = createServer();

const _io = new Server(server, { cors: { origin: "*" } });

const io = _io.of("/battleship");

interface Player {
    id: string;
    ready: boolean;
    ships: { name: number; x: number; y: number }[];
}

const rooms: Map<string, Set<Player>> = new Map();

io.on("connection", (socket) => {
    console.log(`${socket.id} has connected`);

    socket.on("room:create", () => {
        const roomName = generateRoomName();
        rooms.set(roomName, new Set<Player>());
        rooms.get(roomName)?.add({ id: socket.id, ready: false, ships: [] });
        socket.emit("room:created", roomName);
        socket.join(roomName);
        console.log("Creating room", roomName);
    });

    socket.on("room:join", (roomName: string) => {
        if (
            rooms.has(roomName) &&
            !Array.from(rooms.get(roomName)!).find((player) => player.id === socket.id)
        ) {
            rooms.get(roomName)?.add({ id: socket.id, ready: false, ships: [] });
            socket.join(roomName);
            socket.emit("room:joined", roomName);
            console.log(`${socket.id} has joined room ${roomName}`);
            console.log(rooms);
            const sleep = () => {
                return new Promise((resolve) => setTimeout(resolve, 1000));
            };
            sleep().then(() => {
                io.to(roomName).emit("room:player:joined", socket.id);
            });
        }
    });

    socket.on(
        "room:player:ready",
        (roomName: string, ships: { name: number; x: number; y: number }[]) => {
            console.log(`${socket.id} is ready in room ${roomName}`);

            const room = rooms.get(roomName);

            if (room) {
                const player = Array.from(room).find((p) => p.id === socket.id);

                if (player) {
                    player.ready = true;
                    player.ships = ships;

                    console.log(`${socket.id} is ready in room ${roomName}`);

                    io.to(roomName).emit("room:player:ready", socket.id);

                    if (Array.from(room).every((p) => p.ready)) {
                        console.log("Both players are ready, starting the game");
                        io.to(roomName).emit("room:game:start"); // Oyun başlasın
                    }
                }
            }
        },
    );

    socket.on(
        "room:player:turn",
        (data: { roomName: string; playerId: string; x: number; y: number }) => {
            console.log(`${socket.id} has made a move in room ${data.roomName}`);

            const room = rooms.get(data.roomName);

            const players = Array.from(room!);

            const otherPlayer = players.find((player) => player.id !== data.playerId);

            const isHit = otherPlayer?.ships.some((ship) => ship.x === data.x && ship.y === data.y);

            if (isHit) {
                console.log("Hit!");
                io.to(data.roomName).emit("room:player:hit", {
                    playerId: data.playerId,
                    x: data.x,
                    y: data.y,
                });
            }

            socket.to(data.roomName).emit("room:player:turn", { x: data.x, y: data.y });
        },
    );

    socket.on("room:game:end", (data: { roomName: string; loser: string }) => {
        console.log(`Game has ended in room ${data.roomName}, loser is ${data.loser}`);
        io.to(data.roomName).emit("room:game:end", data.loser);
    });

    socket.on("disconnect", () => {
        console.log(`${socket.id} has disconnected`);
        rooms.forEach((players, roomName) => {
            if (Array.from(players).some((player) => player.id === socket.id)) {
                rooms.set(
                    roomName,
                    new Set<Player>(
                        Array.from(players).filter((player) => player.id !== socket.id),
                    ),
                );
                if (rooms.get(roomName)?.size === 0) {
                    rooms.delete(roomName);
                }
            }
        });
    });
});

const PORT = 3000;

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

function generateRoomName() {
    const array = new Uint8Array(2);
    crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, "0"))
        .join("")
        .toUpperCase();
}
