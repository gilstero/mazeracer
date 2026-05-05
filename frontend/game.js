class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.gameId = null;
        this.playerId = null;
        this.maze = null;
        this.players = {};
        this.powerups = [];
        this.finished = false;
        this.winner = null;
        this.matchmaking = false;
        
        this.playerName = '';
        this.playerColor = '#FF0000';
        this.selectedSize = 'medium';
        this.selectedShape = 'square';
        
        this.keys = {};
        this.setupInputHandlers();
        this.setupNetworkHandlers();
        this.gameRunning = false;
        
        this.setupUIHandlers();
        this.generateNewMaze();
    }
    
    setupUIHandlers() {
        document.getElementById('playBtn').addEventListener('click', () => this.ready());
        document.getElementById('backBtn').addEventListener('click', () => this.back());
        document.getElementById('playAgainBtn').addEventListener('click', () => location.reload());
        
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedSize = e.target.dataset.size;
                this.generateNewMaze();
                this.updateChoices();
            });
        });
        
        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedShape = e.target.dataset.shape;
                this.generateNewMaze();
                this.updateChoices();
            });
        });

        document.getElementById('playerName').addEventListener('input', () => this.updateChoices());
        this.updateChoices();
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
            this.maze = data.state.maze;
            this.players = data.state.players;
            this.powerups = data.state.powerups;
            
            this.updateCanvasSize();
            this.startRacing();
            this.updateChoices();
        });
        
        network.on('gameStateUpdate', (data) => {
            this.players = data.players;
            this.powerups = data.powerups;
            this.finished = data.completed;
            this.winner = data.winner;
            
            if (this.finished && this.winner) {
                this.showGameOver();
            }
        });
        
        network.on('waiting', (data) => {
            document.getElementById('status').textContent = 'Waiting for opponent';
        });

        network.on('leftQueue', () => {
            if (!this.gameRunning) {
                document.getElementById('status').textContent = '';
            }
        });
    }
    
    generateNewMaze() {
        const { Maze, MazeSize } = window.mazeGenerator || {};
        if (!Maze) return;
        
        const sizeValue = MazeSize[this.selectedSize.toUpperCase()];
        this.maze = new Maze(sizeValue, this.selectedShape);
        this.updateCanvasSize();
        this.render();
    }
    
    updateCanvasSize() {
        if (!this.maze) return;
        const size = this.maze.size;
        this.canvas.width = size * 8;
        this.canvas.height = size * 8;
    }
    
    ready() {
        this.playerName = document.getElementById('playerName').value || 'Player';
        this.playerColor = window.selectedColor || '#FF0000';
        this.matchmaking = true;
        
        document.getElementById('playBtn').style.display = 'none';
        document.getElementById('backBtn').style.display = 'block';
        document.getElementById('status').textContent = 'Ready';
        this.updateChoices();
        
        network.joinQueue(this.playerName, this.playerColor, this.selectedSize, this.selectedShape);
    }
    
    back() {
        this.matchmaking = false;
        network.leaveQueue();
        document.getElementById('playBtn').style.display = 'block';
        document.getElementById('backBtn').style.display = 'none';
        document.getElementById('status').textContent = '';
        this.updateChoices();
        this.generateNewMaze();
    }
    
    startRacing() {
        document.getElementById('playBtn').style.display = 'none';
        document.getElementById('backBtn').style.display = 'none';
        document.getElementById('status').textContent = 'Race started';
        this.matchmaking = false;
        this.gameRunning = true;
        this.gameLoop();
    }

    updateChoices() {
        const choices = document.getElementById('choices');
        if (!choices) return;

        const ownName = document.getElementById('playerName').value || 'Player';
        const ownColor = window.selectedColor || this.playerColor;

        if (this.gameRunning && Object.keys(this.players).length > 0) {
            choices.innerHTML = Object.values(this.players).map(player => `
                <div class="choice-row">
                    <span class="color-dot" style="background:${player.color}"></span>
                    <span>${this.escapeHtml(player.name)}</span>
                    <span>${this.escapeHtml(player.size)}</span>
                    <span>${this.escapeHtml(player.shape)}</span>
                </div>
            `).join('');
            return;
        }

        choices.innerHTML = `
            <div class="choice-row">
                <span class="color-dot" style="background:${ownColor}"></span>
                <span>${this.escapeHtml(ownName)}</span>
                <span>${this.selectedSize}</span>
                <span>${this.selectedShape}</span>
            </div>
        `;
    }

    escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char]);
    }
    
    showGameOver() {
        const winnerPlayer = this.players[this.winner];
        const isWinner = this.winner === this.playerId;
        
        document.getElementById('resultText').textContent = isWinner ? 'You Won!' : `${winnerPlayer.name} Won!`;
        document.getElementById('timeText').textContent = `Time: ${winnerPlayer.finishTime.toFixed(2)}s`;
        document.getElementById('gameOverlay').style.display = 'flex';
        
        this.gameRunning = false;
    }
    
    gameLoop = () => {
        if (!this.gameRunning) return;
        
        this.updatePlayerInput();
        this.render();
        requestAnimationFrame(this.gameLoop);
    }
    
    updatePlayerInput() {
        if (!this.players[this.playerId] || this.finished) return;
        
        const player = this.players[this.playerId];
        let newX = player.x;
        let newY = player.y;
        
        const moveSpeed = 0.1;
        const speedMult = player.speedBoost ? 1.5 : 1.0;
        const actualSpeed = moveSpeed * speedMult;
        
        if (this.keys['w'] || this.keys['arrowup']) newY -= actualSpeed;
        if (this.keys['s'] || this.keys['arrowdown']) newY += actualSpeed;
        if (this.keys['a'] || this.keys['arrowleft']) newX -= actualSpeed;
        if (this.keys['d'] || this.keys['arrowright']) newX += actualSpeed;
        
        if (newX !== player.x || newY !== player.y) {
            network.sendMove(newX, newY);
        }
        
        const endX = this.maze.end[0];
        const endY = this.maze.end[1];
        const distance = Math.sqrt((newX - endX) ** 2 + (newY - endY) ** 2);
        
        if (distance < 1.0 && !this.finished) {
            network.sendFinish();
        }
    }
    
    render() {
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (!this.maze) return;
        
        this.renderMaze();
        this.renderFinish();
        this.renderPowerups();
        this.renderPlayers();
    }
    
    renderMaze() {
        const grid = this.maze.grid;
        const size = this.maze.size;
        const pixelSize = 8;
        
        this.ctx.fillStyle = '#333333';
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (grid[y][x] === 1) {
                    this.ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
                }
            }
        }
    }
    
    renderFinish() {
        const pixelSize = 8;
        const endX = this.maze.end[0];
        const endY = this.maze.end[1];
        
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillRect(endX * pixelSize, endY * pixelSize, pixelSize, pixelSize);
        
        this.ctx.fillStyle = '#FFA500';
        for (let i = 0; i < 2; i++) {
            for (let j = 0; j < 2; j++) {
                if ((i + j) % 2 === 0) {
                    this.ctx.fillRect(
                        endX * pixelSize + i * pixelSize / 2,
                        endY * pixelSize + j * pixelSize / 2,
                        pixelSize / 2,
                        pixelSize / 2
                    );
                }
            }
        }
    }
    
    renderPowerups() {
        const pixelSize = 8;
        for (const powerup of this.powerups) {
            let color;
            switch (powerup.type) {
                case 'freeze': color = '#00CCFF'; break;
                case 'speed': color = '#FF00FF'; break;
                case 'sight': color = '#00FF00'; break;
                default: color = '#FFFF00';
            }
            
            const angle = (Date.now() / 20) % (Math.PI * 2);
            const size = pixelSize / 2;
            
            this.ctx.save();
            this.ctx.translate((powerup.x + 0.5) * pixelSize, (powerup.y + 0.5) * pixelSize);
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
        const pixelSize = 8;
        const playerIds = Object.keys(this.players);

        if (playerIds.length === 0) {
            this.drawPlayer(1, 1, window.selectedColor || this.playerColor, this.selectedShape, pixelSize, false);
            return;
        }
        
        for (const playerId of playerIds) {
            const player = this.players[playerId];
            const isCurrentPlayer = playerId === this.playerId;
            
            if (!isCurrentPlayer) {
                this.drawPlayer(player.x, player.y, player.color, player.shape, pixelSize, true);
            }
        }
        
        const currentPlayer = this.players[this.playerId];
        if (!currentPlayer) return;

        this.ctx.globalAlpha = currentPlayer.frozen ? 0.5 : 1.0;
        this.drawPlayer(currentPlayer.x, currentPlayer.y, currentPlayer.color, currentPlayer.shape, pixelSize, false);
        this.ctx.globalAlpha = 1.0;
        
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(currentPlayer.x * pixelSize, currentPlayer.y * pixelSize, pixelSize, pixelSize);
    }

    drawPlayer(x, y, color, shape, pixelSize, ghost) {
        const left = x * pixelSize;
        const top = y * pixelSize;
        const centerX = left + pixelSize / 2;
        const centerY = top + pixelSize / 2;
        const inset = pixelSize * 0.15;

        this.ctx.fillStyle = ghost ? `${color}66` : color;
        this.ctx.beginPath();

        if (shape === 'circle') {
            this.ctx.arc(centerX, centerY, pixelSize * 0.42, 0, Math.PI * 2);
        } else if (shape === 'triangle') {
            this.ctx.moveTo(centerX, top + inset);
            this.ctx.lineTo(left + pixelSize - inset, top + pixelSize - inset);
            this.ctx.lineTo(left + inset, top + pixelSize - inset);
            this.ctx.closePath();
        } else {
            this.ctx.rect(left + inset, top + inset, pixelSize - inset * 2, pixelSize - inset * 2);
        }

        this.ctx.fill();
    }
}

let game = null;

window.addEventListener('DOMContentLoaded', async () => {
    setupColorPicker();
    
    try {
        await network.connect();
        game = new Game();
    } catch (error) {
        console.error('Failed to connect:', error);
        alert('Cannot connect to server');
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
        const btn = document.createElement('button');
        btn.className = 'color-btn';
        btn.style.backgroundColor = color;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            window.selectedColor = color;
            if (game && !game.gameRunning) {
                game.playerColor = color;
                game.updateChoices();
                game.render();
            }
        });
        
        if (color === colors[0]) btn.classList.add('active');
        colorGrid.appendChild(btn);
    });
}

// Maze generator (simple version without backend)
class Maze {
    constructor(size, shape) {
        this.size = size;
        this.shape = shape;
        this.grid = this.generateMaze();
        this.start = [1, 1];
        this.end = [size - 2, size - 2];
    }
    
    generateMaze() {
        const size = this.size;
        const maze = Array(size).fill(null).map(() => Array(size).fill(1));
        
        const carve = (x, y) => {
            maze[y][x] = 0;
            const dirs = [[0, -2], [2, 0], [0, 2], [-2, 0]];
            dirs.sort(() => Math.random() - 0.5);
            
            for (const [dx, dy] of dirs) {
                const nx = x + dx, ny = y + dy;
                if (nx > 0 && nx < size - 1 && ny > 0 && ny < size - 1 && maze[ny][nx] === 1) {
                    maze[y + dy / 2][x + dx / 2] = 0;
                    carve(nx, ny);
                }
            }
        };
        
        carve(1, 1);
        return maze;
    }
}

const MazeSize = {
    SMALL: 15,
    MEDIUM: 25,
    LARGE: 40
};

window.mazeGenerator = { Maze, MazeSize };
