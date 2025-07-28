
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
  constructor(roomCode) {
    this.code = roomCode;
    this.players = new Map();
    this.maxPlayers = 10;
    this.gameStarted = false;
    this.gamePhase = 'lobby'; // lobby, playing, meeting, voting
    this.tasks = [];
    this.completedTasks = 0;
    this.totalTasksNeeded = 0;
    this.impostors = [];
    this.votes = new Map();
    this.meetingCooldown = 0;
  }

  addPlayer(socket, playerName) {
    if (this.players.size >= this.maxPlayers) {
      return false;
    }
    
    const playerColors = ['#ff0000', '#0000ff', '#00ff00', '#ff00ff', '#ffff00', '#00ffff', '#ffffff', '#ff8800', '#8800ff', '#88ff00'];
    
    this.players.set(socket.id, {
      socket: socket,
      name: playerName,
      color: playerColors[this.players.size],
      isImpostor: false,
      isAlive: true,
      completedTasks: 0,
      position: { x: 0, y: 1.5, z: 0 },
      hasVoted: false
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
        id: socketId,
        name: playerData.name,
        color: playerData.color,
        isImpostor: playerData.isImpostor,
        isAlive: playerData.isAlive,
        completedTasks: playerData.completedTasks
      });
    });
    return playersData;
  }

  startGame() {
    if (this.players.size < 2) return false;
    
    this.gameStarted = true;
    this.gamePhase = 'playing';
    
    // Assign impostors (1 impostor for 4-6 players, 2 for 7-10)
    const impostorCount = this.players.size <= 6 ? 1 : 2;
    const playerIds = Array.from(this.players.keys());
    
    // Randomly select impostors
    for (let i = 0; i < impostorCount; i++) {
      const randomIndex = Math.floor(Math.random() * playerIds.length);
      const impostorId = playerIds.splice(randomIndex, 1)[0];
      this.players.get(impostorId).isImpostor = true;
      this.impostors.push(impostorId);
    }
    
    // Create tasks for crewmates
    this.generateTasks();
    
    // Notify all players
    this.players.forEach((playerData, socketId) => {
      const tasks = playerData.isImpostor ? [] : this.getPlayerTasks();
      
      playerData.socket.emit('game-started', {
        isImpostor: playerData.isImpostor,
        tasks: tasks,
        players: this.getPlayersData(),
        playerColor: playerData.color
      });
    });
    
    return true;
  }

  generateTasks() {
    const allTasks = [
      'Fix Wiring in Electrical',
      'Start Reactor',
      'Unlock Manifolds',
      'Prime Shields',
      'Chart Course in Navigation',
      'Stabilize Steering',
      'Clean O2 Filter',
      'Calibrate Distributor',
      'Empty Garbage',
      'Fuel Engines'
    ];
    
    this.tasks = allTasks.slice(0, 6); // 6 tasks per player
    this.totalTasksNeeded = this.tasks.length * (this.players.size - this.impostors.length);
  }

  getPlayerTasks() {
    return this.tasks.map(task => ({
      name: task,
      completed: false
    }));
  }

  completeTask(socketId, taskName) {
    const player = this.players.get(socketId);
    if (!player || player.isImpostor || !player.isAlive) return;
    
    player.completedTasks++;
    this.completedTasks++;
    
    this.broadcastToRoom('task-completed', {
      taskName: taskName,
      totalCompleted: this.completedTasks,
      totalTasks: this.totalTasksNeeded
    });
    
    // Check win condition
    if (this.completedTasks >= this.totalTasksNeeded) {
      this.endGame('crewmates');
    }
  }

  killPlayer(killerId, victimId) {
    const killer = this.players.get(killerId);
    const victim = this.players.get(victimId);
    
    if (!killer || !victim || !killer.isImpostor || !victim.isAlive) return;
    
    victim.isAlive = false;
    
    this.broadcastToRoom('player-killed', {
      victimId: victimId,
      victimName: victim.name
    });
    
    // Check win conditions
    this.checkWinConditions();
  }

  startEmergencyMeeting(callerId, reason) {
    this.gamePhase = 'meeting';
    this.votes.clear();
    
    // Reset voting status
    this.players.forEach(player => {
      player.hasVoted = false;
    });
    
    this.broadcastToRoom('emergency-meeting', {
      reason: reason,
      players: this.getPlayersData()
    });
  }

  vote(socketId, vote) {
    const player = this.players.get(socketId);
    if (!player || !player.isAlive || player.hasVoted) return;
    
    player.hasVoted = true;
    this.votes.set(socketId, vote);
    
    // Check if all alive players have voted
    const alivePlayers = Array.from(this.players.values()).filter(p => p.isAlive);
    const votedPlayers = Array.from(this.players.values()).filter(p => p.isAlive && p.hasVoted);
    
    if (votedPlayers.length >= alivePlayers.length) {
      this.processVotes();
    }
  }

  processVotes() {
    const voteCount = new Map();
    
    this.votes.forEach(vote => {
      if (vote !== 'skip') {
        voteCount.set(vote, (voteCount.get(vote) || 0) + 1);
      }
    });
    
    // Find player with most votes
    let maxVotes = 0;
    let eliminatedPlayer = null;
    let tie = false;
    
    voteCount.forEach((votes, playerId) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        eliminatedPlayer = playerId;
        tie = false;
      } else if (votes === maxVotes) {
        tie = true;
      }
    });
    
    if (!tie && eliminatedPlayer) {
      const player = this.players.get(eliminatedPlayer);
      if (player) {
        player.isAlive = false;
        this.broadcastToRoom('player-eliminated', {
          eliminatedId: eliminatedPlayer,
          eliminatedName: player.name,
          wasImpostor: player.isImpostor
        });
      }
    }
    
    this.gamePhase = 'playing';
    this.checkWinConditions();
  }

  checkWinConditions() {
    const aliveCrewmates = Array.from(this.players.values()).filter(p => p.isAlive && !p.isImpostor);
    const aliveImpostors = Array.from(this.players.values()).filter(p => p.isAlive && p.isImpostor);
    
    if (aliveImpostors.length === 0) {
      this.endGame('crewmates');
    } else if (aliveImpostors.length >= aliveCrewmates.length) {
      this.endGame('impostors');
    }
  }

  endGame(winner) {
    this.gameStarted = false;
    this.gamePhase = 'lobby';
    
    const impostors = Array.from(this.players.values())
      .filter(p => p.isImpostor)
      .map(p => ({ name: p.name, color: p.color }));
    
    this.broadcastToRoom('game-over', {
      winner: winner,
      impostors: impostors
    });
  }
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-room', (data) => {
    const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    const room = new GameRoom(roomCode);
    gameRooms.set(roomCode, room);
    
    if (room.addPlayer(socket, data.playerName)) {
      socket.join(roomCode);
      socket.currentRoom = roomCode;
      
      socket.emit('room-created', {
        roomCode: roomCode,
        players: room.getPlayersData()
      });
      
      console.log('Room created:', roomCode, 'by', data.playerName);
    }
  });

  socket.on('join-room', (data) => {
    const { roomCode, playerName } = data;
    const room = gameRooms.get(roomCode);
    
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }
    
    if (room.gameStarted) {
      socket.emit('error', { message: 'Game already in progress' });
      return;
    }
    
    if (room.addPlayer(socket, playerName)) {
      socket.join(roomCode);
      socket.currentRoom = roomCode;
      
      room.broadcastToRoom('player-joined', {
        players: room.getPlayersData(),
        newPlayer: { name: playerName }
      });
      
      socket.emit('room-joined', {
        roomCode: roomCode,
        players: room.getPlayersData()
      });
      
      console.log(`Player ${playerName} joined room ${roomCode}`);
    } else {
      socket.emit('error', { message: 'Room is full' });
    }
  });

  socket.on('start-game', (data) => {
    const room = gameRooms.get(data.roomCode);
    if (room && room.startGame()) {
      console.log('Game started in room:', data.roomCode);
    }
  });

  socket.on('player-move', (data) => {
    const room = gameRooms.get(data.roomCode);
    if (room && room.players.has(socket.id)) {
      room.players.get(socket.id).position = data.position;
      
      room.broadcastToRoom('player-move', {
        socketId: socket.id,
        position: data.position
      }, socket.id);
    }
  });

  socket.on('complete-task', (data) => {
    const room = gameRooms.get(data.roomCode);
    if (room) {
      room.completeTask(socket.id, data.taskName);
    }
  });

  socket.on('kill-player', (data) => {
    const room = gameRooms.get(data.roomCode);
    if (room) {
      room.killPlayer(socket.id, data.victimId);
    }
  });

  socket.on('emergency-meeting', (data) => {
    const room = gameRooms.get(data.roomCode);
    if (room) {
      room.startEmergencyMeeting(socket.id, `Emergency meeting called by ${data.callerName}`);
    }
  });

  socket.on('report-body', (data) => {
    const room = gameRooms.get(data.roomCode);
    if (room) {
      room.startEmergencyMeeting(socket.id, `Body reported by ${data.reporterName}`);
    }
  });

  socket.on('vote', (data) => {
    const room = gameRooms.get(data.roomCode);
    if (room) {
      room.vote(socket.id, data.vote);
    }
  });

  socket.on('sabotage', (data) => {
    const room = gameRooms.get(data.roomCode);
    if (room) {
      room.broadcastToRoom('sabotage-activated', {
        sabotageType: data.sabotageType
      });
    }
  });

  socket.on('chat-message', (data) => {
    const room = gameRooms.get(data.roomCode);
    if (room && room.players.has(socket.id)) {
      const player = room.players.get(socket.id);
      
      room.broadcastToRoom('chat-message', {
        playerName: player.name,
        message: data.message
      });
    }
  });

  socket.on('leave-room', () => {
    const roomCode = socket.currentRoom;
    if (roomCode) {
      const room = gameRooms.get(roomCode);
      if (room) {
        const player = room.players.get(socket.id);
        room.removePlayer(socket.id);
        
        if (room.players.size === 0) {
          gameRooms.delete(roomCode);
          console.log('Room deleted:', roomCode);
        } else {
          room.broadcastToRoom('player-left', {
            socketId: socket.id,
            playerName: player ? player.name : 'Unknown',
            players: room.getPlayersData()
          });
        }
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const roomCode = socket.currentRoom;
    if (roomCode) {
      const room = gameRooms.get(roomCode);
      if (room) {
        const player = room.players.get(socket.id);
        room.removePlayer(socket.id);
        
        if (room.players.size === 0) {
          gameRooms.delete(roomCode);
          console.log('Room deleted:', roomCode);
        } else {
          room.broadcastToRoom('player-left', {
            socketId: socket.id,
            playerName: player ? player.name : 'Unknown',
            players: room.getPlayersData()
          });
        }
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Among Us Clone server running on port ${PORT}`);
});
