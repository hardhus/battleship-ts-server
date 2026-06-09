# Battleship Multiplayer Server (Socket.IO + TypeScript)

This repository serves as the central websocket coordination engine for the multiplayer Battleship board game. Implemented in **Node.js** with **TypeScript**, it behaves as the authoritative referee, handling room states isolation, player synchronization hooks, and server-side hit detection to maintain mathematical gameplay integrity across active network pipelines.

---

## 🔗 Client Architecture Connection

This server architecture couples directly via custom duplex events to drive matching network frames for its graphical client interface:

* **Graphical Frontend Client Framework:** **[Battleship-TS-Game](https://github.com/hardhus/battleship-ts-game)**

---

## 🚀 Key Technical Features

* **Server-Authoritative Hit Verification:** Players transmit raw target coordinates (`room:player:turn`) to the server. The backend parses internal memory map layouts (`Player` struct schemas), calculates intersections against the opponent's hidden ship matrix, and broadcasts certified `room:player:hit` events. This completely eliminates client-side cheating vectors.
* **Cryptographic Room Token Generators:** Utilizes standard `crypto.getRandomValues` hardware-backed byte generation methods to spawn unique, random hexadecimal room names to serve as independent websocket room buffers.
* **Lock-Step State Gateways:** Coordinates initial setups, ensuring both players complete ship placement grids and pass validation parameters (`ready = true`) before emitting global `room:game:start` triggers.
* **Automated Memory Cleanup & Connection Auditing:** Tracks socket connection statuses in real-time. Upon catching an unexpected client socket close event, it automatically strips the user from active registers and cleans up orphaned rooms to maintain optimal heap usage.

## 📂 Project Structure

```text
├── src/
│   └── server.ts      ← Primary engine housing Socket.IO server namespaces, event loops, and data structures
├── tsconfig.json      ← TypeScript compiler layout targeting ES2020 definitions
└── package.json       ← Target modules including hot-reloaded local testing runners (Nodemon + ts-node)

```

## 🛠️ Local Development & Build Infrastructure

### 1. Launch Local Server Environment (Hot-Reloaded)

Runs the server locally on port `3000` via automated execution tunnels:

```bash
npm run dev

```

### 2. Compile for Production Deployment

Triggers the native TypeScript compiler to output static, fully structured Javascript payloads inside the target destination path `./dist`:

```bash
npm run build

```

---

## 📊 Wire Protocol Specifications

The server exposes an isolated websocket gateway on namespace `/battleship`, responding to the following wire protocol schemas:

| Inbound Event Name | Payload Shape | Description |
| --- | --- | --- |
| `room:create` | *None* | Generates a token, allocates internal memory states, and binds the socket to a room. |
| `room:join` | `roomName: string` | Registers a second player into the targeted room if slots are open. |
| `room:player:ready` | `roomName: string, ships: Array<{name, x, y}>` | Submits local hidden ship placement vectors and sets player readiness. |
| `room:player:turn` | `data: {roomName, playerId, x, y}` | Accepts a target cell click, performs server-side grid hit checking, and toggles turns. |
| `room:game:end` | `data: {roomName, loser: string}` | Emits a conclusive event to notify both players of the match results. |

