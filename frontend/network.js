// WebSocket network manager
class NetworkManager {
    constructor() {
        this.socket = null;
        this.gameId = null;
        this.playerId = null;
        this.connected = false;
        this.listeners = {};
    }
    
    connect() {
        return new Promise((resolve, reject) => {
            // Connect to backend server
            const serverURL = window.location.origin.includes('localhost') 
                ? 'http://localhost:5001' 
                : window.location.origin;
            
            this.socket = io(serverURL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                reconnectionAttempts: 5
            });
            
            this.socket.on('connect', () => {
                console.log('Connected to server');
                this.connected = true;
                resolve();
            });
            
            this.socket.on('connected', (data) => {
                console.log('Server confirmed:', data);
            });
            
            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
                this.connected = false;
            });
            
            this.socket.on('waiting', (data) => {
                this.emit('waiting', data);
            });
            
            this.socket.on('matched', (data) => {
                this.gameId = data.gameId;
                this.playerId = data.playerId;
                this.emit('matched', data);
            });
            
            this.socket.on('state_update', (data) => {
                this.emit('gameStateUpdate', data);
            });
            
            this.socket.on('game_over', (data) => {
                this.emit('gameOver', data);
            });
            
            this.socket.on('connect_error', (error) => {
                console.error('Connection error:', error);
                reject(error);
            });
        });
    }
    
    joinQueue(playerName, playerColor, size, shape) {
        this.socket.emit('join_queue', {
            name: playerName,
            color: playerColor,
            size: size,
            shape: shape
        });
    }
    
    sendMove(x, y) {
        this.socket.emit('move', {
            gameId: this.gameId,
            x: x,
            y: y
        });
    }
    
    sendFinish() {
        this.socket.emit('finish', {
            gameId: this.gameId
        });
    }
    
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
    
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => callback(data));
        }
    }
}

// Global network instance
const network = new NetworkManager();
