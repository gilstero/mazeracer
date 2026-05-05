// Game engine
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Game state
        this.gameId = null;
        this.playerId = null;
        this.maze = null;
        this.players = {};
        this.powerups = [];
        this.finished = false;
        this.winner = null;
        
        // Player data
        this.playerName = '';
        this.playerColor = '#FF0000';
        this.selectedSize = 'medium';
        this.selectedShape = 'square';
        
        // Input
        this.keys = {};
        this.setupInputHandlers();
        
        // Rendering
        this.gridSize = 20;
        this.pixelSize = 8;
        this.updateCanvasSize();
        
        // Network
        this.setupNetworkHandlers();
        
        // Game loop
        this.lastFrameTime = Date.now();
        this.gameRunning = false;
    }
    
    setupInputHandlers() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            if(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
    
    setupNetworkHandlers() {
        network.on('matched', (data) => {
            this.gameId = data.gameId;
            this.playerId = data.playerId;
            
            const state = data.state;
            this.maze = state.maze;
            this.players = state.players;
            this.powerups = state.powerups;
            
            this.updateCanvasSize();
            this.showGameUI();
            this.startGameLoop();
        });
        
        network.on('gameStateUpdate', (data) => {
            this.maze = data.maze;
            this.players = data.players;
            this.powerups = data.powerups;
            this.finished = data.completed;
            this.winner = data.winner;
            
            if (this.finished && this.winner) {
                this.gameRunning = false;
                this.showGameOver();
            }
        });
        
        network.on('waiting', (data) => {
            document.getElementById('queueStatus').innerHTML = 
                `<p>${data.message}</p><p class="queue-info">Queue: ${data.queueSize}</p>`;
        });
    }
    
    updateCanvasSize() {
        if (!this.maze) return;
        
        const size = this.maze.size;
        const canvasWidth = size * this.pixelSize;
        const canvasHeight = size * this.pixelSize;
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
    }
    
    startGame() {
        this.playerName = document.getElementById('playerName').value || 'Player';
        this.playerColor = window.selectedColor || '#FF0000';
        this.selectedSize = window.selectedSize || 'medium';
        this.selectedShape = window.selectedShape || 'square';
        
        network.joinQueue(this.playerName, this.playerColor, this.selectedSize, this.selectedShape);
        this.showWaitingUI();
    }
    
    showWaitingUI() {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Waiting for opponent...', this.canvas.width / 2, this.canvas.height / 2);
    }
    
    showGameUI() {
        document.getElementById('gameContainer').style.display = 'block';
        document.getElementById('mainMenu').style.display = 'none';
        
        // Update player info
        const p1 = this.players[Object.keys(this.players)[0]];
        const p2 = this.players[Object.keys(this.players)[1]];
        
        document.getElementById('p1Name').textContent = p1.name;
        document.getElementById('p2Name').textContent = p2.name;
    }
    
    showGameOver() {
        const winnerPlayer = this.players[this.winner];
        const isWinner = this.winner === this.playerId;
        
        document.getElementById('winnerText').textContent = 
            isWinner ? '🎉 YOU WIN! 🎉' : `${winnerPlayer.name} Wins!`;
        document.getElementById('winnerTime').textContent = 
            `Finish Time: ${winnerPlayer.finishTime.toFixed(2)}s`;
        
        document.getElementById('gameOver').style.display = 'flex';
    }
    
    startGameLoop() {
        this.gameRunning = true;
        this.gameLoop();
    }
    
    gameLoop = () => {
        if (!this.gameRunning) return;
        
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastFrameTime) / 1000;
        this.lastFrameTime = currentTime;
        
        // Update player position based on input
        this.updatePlayerInput();
        
        // Render
        this.render();
        
        requestAnimationFrame(this.gameLoop);
    }
    
    updatePlayerInput() {
        if (!this.players[this.playerId] || this.finished) return;
        
        const player = this.players[this.playerId];
        let newX = player.x;
        let newY = player.y;
        
        const moveSpeed = 0.1;
        const speedMultiplier = player.speedBoost ? 1.5 : 1.0;
        const actualSpeed = moveSpeed * speedMultiplier;
        
        if (this.keys['w'] || this.keys['arrowup']) {
            newY -= actualSpeed;
        }
        if (this.keys['s'] || this.keys['arrowdown']) {
            newY += actualSpeed;
        }
        if (this.keys['a'] || this.keys['arrowleft']) {
            newX -= actualSpeed;
        }
        if (this.keys['d'] || this.keys['arrowright']) {
            newX += actualSpeed;
        }
        
        // Send update to server only when moved
        if (newX !== player.x || newY !== player.y) {
            network.sendMove(newX, newY);
        }
        
        // Check if reached finish
        const endX = this.maze.end[0];
        const endY = this.maze.end[1];
        const distance = Math.sqrt((newX - endX) ** 2 + (newY - endY) ** 2);
        
        if (distance < 1.0 && !this.finished) {
            network.sendFinish();
        }
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.maze) return;
        
        // Render maze walls
        this.renderMaze();
        
        // Render finish point
        this.renderFinish();
        
        // Render power-ups
        this.renderPowerups();
        
        // Render players
        this.renderPlayers();
    }
    
    renderMaze() {
        const grid = this.maze.grid;
        const size = this.maze.size;
        
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (grid[y][x] === 1) {
                    this.ctx.fillStyle = '#444444';
                    this.ctx.fillRect(
                        x * this.pixelSize,
                        y * this.pixelSize,
                        this.pixelSize,
                        this.pixelSize
                    );
                }
            }
        }
        
        // Draw grid lines (optional, for debugging)
        this.ctx.strokeStyle = '#222222';
        this.ctx.lineWidth = 0.5;
        for (let i = 0; i <= size; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.pixelSize, 0);
            this.ctx.lineTo(i * this.pixelSize, size * this.pixelSize);
            this.ctx.stroke();
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.pixelSize);
            this.ctx.lineTo(size * this.pixelSize, i * this.pixelSize);
            this.ctx.stroke();
        }
    }
    
    renderFinish() {
        const endX = this.maze.end[0];
        const endY = this.maze.end[1];
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(
            endX * this.pixelSize,
            endY * this.pixelSize,
            this.pixelSize,
            this.pixelSize
        );
        
        // Draw checkered pattern
        this.ctx.fillStyle = '#FFA500';
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                if ((i + j) % 2 === 0) {
                    this.ctx.fillRect(
                        endX * this.pixelSize + i * this.pixelSize / 2,
                        endY * this.pixelSize + j * this.pixelSize / 2,
                        this.pixelSize / 2,
                        this.pixelSize / 2
                    );
                }
            }
        }
    }
    
    renderPowerups() {
        for (const powerup of this.powerups) {
            let color;
            switch (powerup.type) {
                case 'freeze': color = '#00CCFF'; break;
                case 'speed': color = '#FF00FF'; break;
                case 'sight': color = '#00FF00'; break;
                default: color = '#FFFF00';
            }
            
            // Draw rotating star
            const angle = (Date.now() / 20) % (Math.PI * 2);
            const size = this.pixelSize / 2;
            
            this.ctx.save();
            this.ctx.translate(
                (powerup.x + 0.5) * this.pixelSize,
                (powerup.y + 0.5) * this.pixelSize
            );
            this.ctx.rotate(angle);
            
            this.ctx.fillStyle = color;
            this.drawStar(0, 0, 5, size * 0.6, size * 0.3);
            
            this.ctx.restore();
        }
    }
    
    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
        let rot = Math.PI / 2 * 3;
        let step = Math.PI / spikes;
        
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - outerRadius);
        
        for (let i = 0; i < spikes; i++) {
            this.ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
            rot += step;
            this.ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
            rot += step;
        }
        
        this.ctx.lineTo(cx, cy - outerRadius);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    renderPlayers() {
        const playerIds = Object.keys(this.players);
        
        for (const playerId of playerIds) {
            const player = this.players[playerId];
            const isCurrentPlayer = playerId === this.playerId;
            
            // Draw shadow first (opponent)
            if (!isCurrentPlayer) {
                this.ctx.fillStyle = player.color + '40';  // Transparent
                this.ctx.fillRect(
                    player.x * this.pixelSize,
                    player.y * this.pixelSize,
                    this.pixelSize,
                    this.pixelSize
                );
            }
        }
        
        // Draw current player on top
        const currentPlayer = this.players[this.playerId];
        this.ctx.fillStyle = currentPlayer.color;
        this.ctx.globalAlpha = currentPlayer.frozen ? 0.5 : 1.0;
        this.ctx.fillRect(
            currentPlayer.x * this.pixelSize,
            currentPlayer.y * this.pixelSize,
            this.pixelSize,
            this.pixelSize
        );
        this.ctx.globalAlpha = 1.0;
        
        // Draw border
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(
            currentPlayer.x * this.pixelSize,
            currentPlayer.y * this.pixelSize,
            this.pixelSize,
            this.pixelSize
        );
        
        // Draw speed boost effect
        if (currentPlayer.speedBoost) {
            this.ctx.strokeStyle = '#FF00FF';
            this.ctx.lineWidth = 1;
            const offset = Math.sin(Date.now() / 100) * 2;
            this.ctx.strokeRect(
                currentPlayer.x * this.pixelSize - offset,
                currentPlayer.y * this.pixelSize - offset,
                this.pixelSize + offset * 2,
                this.pixelSize + offset * 2
            );
        }
    }
}

// Initialize on page load
let game = null;

window.addEventListener('DOMContentLoaded', async () => {
    // Setup color picker
    setupColorPicker();
    
    // Setup menu buttons
    setupMenuButtons();
    
    // Connect to server
    try {
        await network.connect();
        game = new Game();
    } catch (error) {
        console.error('Failed to connect:', error);
        alert('Failed to connect to server. Make sure the backend is running.');
    }
});

function setupColorPicker() {
    const colors = [
        '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
        '#FF6600', '#FF0066', '#00FF66', '#0066FF', '#6600FF', '#66FF00',
        '#FF3333', '#33FF33', '#3333FF', '#FFCC00', '#FF00CC', '#00CCFF',
        '#FF9900', '#00FF99', '#9900FF'
    ];
    
    const colorGrid = document.getElementById('colorGrid');
    window.selectedColor = colors[0];
    
    colors.forEach(color => {
        const colorBtn = document.createElement('button');
        colorBtn.className = 'color-btn';
        colorBtn.style.backgroundColor = color;
        colorBtn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            colorBtn.classList.add('active');
            window.selectedColor = color;
        });
        
        if (color === colors[0]) {
            colorBtn.classList.add('active');
        }
        
        colorGrid.appendChild(colorBtn);
    });
}

function setupMenuButtons() {
    window.selectedSize = 'medium';
    window.selectedShape = 'square';
    
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            window.selectedSize = e.target.dataset.size;
        });
    });
    
    document.querySelectorAll('.shape-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            window.selectedShape = e.target.dataset.shape;
        });
    });
    
    document.getElementById('playBtn').addEventListener('click', () => {
        if (game) {
            game.startGame();
        }
    });
    
    document.getElementById('playAgainBtn').addEventListener('click', () => {
        location.reload();
    });
}
