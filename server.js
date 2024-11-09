import { createServer } from "node:http";
import { Server } from "socket.io";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
const port = process.env.PORT || 3000;

// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

const inMemoryPlayers = [];

app.prepare().then(() => {
    const httpServer = createServer(handler);
    const io = new Server(httpServer);

    io.on("connection", (socket) => {
        socket.on("register", (data) => {
            if (inMemoryPlayers.find((player) => player.id === socket.id)) {
                return;
            }

            inMemoryPlayers.push({
                id: socket.id,
                name: data.name,
                x: data.x,
                y: data.y
            })
            io.emit("playersData", inMemoryPlayers);
        });

        socket.on("move", ({ x, y }) => {
            const player = inMemoryPlayers.find((player) => player.id === socket.id);
            player.x = x;
            player.y = y;
            io.emit("playersData", inMemoryPlayers);
        });

        socket.on("connectToPlayer", (data) => {
            const player = inMemoryPlayers.find((player) => player.id === data.playerId);
            if (!player) {
                return;
            }

            io.to(data.playerId).emit("connectRequest", {
                playerId: socket.id
            })
        });

        socket.on("roomFull", (data) => {
            io.to(data.playerId).emit("roomFull", {
                playerId: socket.id
            });
        });

        socket.on("connectResponse", (data) => {
            io.to(data.playerId).emit("connectResponse", {
                playerId: socket.id,
                roomId: data.roomId
            })
        })

        socket.on("createRoom", (data) => {
            socket.join(data.roomId);
        });

        socket.on("joinRoom", (data) => {
            socket.join(data.roomId);
            socket.to(data.roomId).emit("playerJoined", {
                playerId: socket.id
            });
        })

        socket.on('offer', (data) => {
            io.to(data.playerId).emit('offer', {
                offer: data.offer,
                playerId: socket.id
            });
        });

        socket.on('answer', (data) => {
            io.to(data.playerId).emit('answer', {
                answer: data.answer,
                playerId: socket.id
            });
        });

        socket.on('iceCandidate', (data) => {
            io.to(data.playerId).emit('iceCandidate', {
                candidate: data.candidate,
                playerId: socket.id
            });
        });

        socket.on('exitRoom', (data) => {
            io.to(data.roomId).emit('toExitRoom', {
                playerId: socket.id
            });
            socket.leave(data.roomId);
        });

        socket.on('disconnecting', () => {
            socket.rooms.forEach((room) => {
                if (room !== socket.id) {
                    socket.to(room).emit('toExitRoom', {
                        playerId: socket.id
                    });
                }
            });
            inMemoryPlayers.splice(inMemoryPlayers.findIndex((player) => player.id === socket.id), 1);
            io.emit("playersData", inMemoryPlayers);
        });
    });

    httpServer
        .once("error", (err) => {
            console.error(err);
            process.exit(1);
        })
        .listen(port, () => {
            console.log(`> Ready on http://${hostname}:${port}`);
        });
});