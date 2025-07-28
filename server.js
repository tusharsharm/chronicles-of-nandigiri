
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static('.'));

// Game state
const gameRooms = new Map();

class GameRoom {
  constructor(roomId) {
    this.id = roomId;
    this.players = new Map();
    this.maxPlayers = 4;
    this.gameStarted = false;
    this.sharedEvents = [];
  }

  addPlayer(socket, playerData) {
    if (this.players.size >= this.maxPlayers) {
      return false;
    }
    
    this.players.set(socket.id, {
      socket: socket,
      player: playerData,
      isReady: false
    });
    
    return true;
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
  }

  broadcastToRoom(event, data, excludeSocketId = null) {
    this.players.forEach((playerData, socketId) => {
      if (socketId !== excludeSocketId) {
        playerData.socket.emit(event, data);
      }
    });
  }

  getPlayersData() {
    const playersData = [];
    this.players.forEach((playerData, socketId) => {
      playersData.push({
        socketId: socketId,
        name: playerData.player.name,
        class: playerData.player.class,
        level: playerData.player.level,
        hp: playerData.player.hp,
        maxHp: playerData.player.maxHp,
        isReady: playerData.isReady
      });
    });
    return playersData;
  }
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-room', (data) => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const room = new GameRoom(roomId);
    gameRooms.set(roomId, room);
    
    socket.join(roomId);
    socket.emit('room-created', { roomId: roomId });
    console.log('Room created:', roomId);
  });

  socket.on('join-room', (data) => {
    const { roomId, playerData } = data;
    const room = gameRooms.get(roomId);
    
    if (!room) {
      socket.emit('room-error', { message: 'Room not found' });
      return;
    }
    
    if (room.addPlayer(socket, playerData)) {
      socket.join(roomId);
      socket.currentRoom = roomId;
      
      // Notify all players in room
      room.broadcastToRoom('player-joined', {
        players: room.getPlayersData(),
        newPlayer: {
          socketId: socket.id,
          name: playerData.name,
          class: playerData.class
        }
      });
      
      socket.emit('room-joined', {
        roomId: roomId,
        players: room.getPlayersData()
      });
      
      console.log(`Player ${playerData.name} joined room ${roomId}`);
    } else {
      socket.emit('room-error', { message: 'Room is full' });
    }
  });

  socket.on('player-action', (data) => {
    const roomId = socket.currentRoom;
    const room = gameRooms.get(roomId);
    
    if (room) {
      // Broadcast action to other players
      room.broadcastToRoom('player-action-update', {
        socketId: socket.id,
        action: data.action,
        result: data.result,
        playerState: data.playerState
      }, socket.id);
    }
  });

  socket.on('combat-action', (data) => {
    const roomId = socket.currentRoom;
    const room = gameRooms.get(roomId);
    
    if (room) {
      room.broadcastToRoom('combat-update', {
        socketId: socket.id,
        combatData: data
      }, socket.id);
    }
  });

  socket.on('player-ready', (data) => {
    const roomId = socket.currentRoom;
    const room = gameRooms.get(roomId);
    
    if (room && room.players.has(socket.id)) {
      room.players.get(socket.id).isReady = true;
      
      room.broadcastToRoom('player-ready-update', {
        players: room.getPlayersData()
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const roomId = socket.currentRoom;
    if (roomId) {
      const room = gameRooms.get(roomId);
      if (room) {
        room.removePlayer(socket.id);
        
        if (room.players.size === 0) {
          gameRooms.delete(roomId);
          console.log('Room deleted:', roomId);
        } else {
          room.broadcastToRoom('player-left', {
            socketId: socket.id,
            players: room.getPlayersData()
          });
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
