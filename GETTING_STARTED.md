# Maze Racer - Getting Started Guide

## Quick Start (macOS/Linux)

### 1. Setup Backend
```bash
cd backend
pip3 install -r requirements.txt
```

### 2. Run Backend
```bash
python3 run.py
```
The backend will start on `http://localhost:5000`

### 3. In another terminal, Run Frontend
```bash
cd frontend
python3 -m http.server 8000
```
The frontend will be available at `http://localhost:8000`

### 4. Open in Browser
Navigate to `http://localhost:8000` and start playing!

## Or Use the Start Script
```bash
chmod +x start.sh
./start.sh
```

## Game Features Explained

### Character Colors (20 Options)
Choose from 20+ distinct colors to customize your racing block character.

### Maze Sizes
- **Small**: 15x15 - Quick races (~2-3 minutes)
- **Medium**: 25x25 - Balanced races (~3-5 minutes)
- **Large**: 40x40 - Epic races (~5-10 minutes)

### Maze Designs
- **Square**: Classic grid-based maze
- **Triangle**: Triangular maze layout (bounces off angled edges)
- **Circle**: Circular maze (walls based on distance from center)

### Power-Ups (3 Types)

#### 🔵 Freeze (Cyan Star)
- Freezes your opponent for 1 second
- They can't move during this time
- Strategy: Use when they're close to winning!

#### 🟣 Speed Boost (Magenta Star)
- Move 1.5x faster for 3 seconds
- Enables quick escapes and catching up
- Strategy: Grab early for major advantage

#### 🟢 Path Sight (Green Star)
- Shows you the optimal path to finish for 1 second
- Helps navigate complex mazes
- Strategy: Use when lost or at a fork

## Network Architecture

### Real-time Sync
Players see each other's position in real-time:
- Your player: **Solid block** (bright color)
- Opponent: **Transparent shadow** (darker version)

### Matchmaking
- Queue system automatically pairs players
- Players with same settings matched first
- Instant connection once opponent found

### Status Effects
- **Frozen**: Player appears dimmed (semi-transparent)
- **Speed Boost**: Magenta glow around player
- **Path Sight**: Green highlight (visible only to that player)

## Troubleshooting

### Backend won't connect
```
Error: Connection refused at localhost:5000
```
Make sure Flask is running: `python3 run.py`

### No opponent found
Queue is empty. Open another browser window or tab and start another game.

### Maze not rendering
Make sure your browser supports Canvas 2D context (all modern browsers do).

### Slow performance
- Close other applications
- Use a wired connection for better latency
- Refresh browser cache (Cmd+Shift+R on macOS)

## Development Notes

### Adding New Features

**New Power-Up Type**:
1. Add to `backend/app/game/powerups.py` enum
2. Add effect logic in `GameSession.apply_power_effect()`
3. Add rendering in `game.js` `renderPowerups()`

**New Maze Shape**:
1. Add shape to `backend/app/game/maze.py` enum
2. Implement `is_passable()` logic for shape
3. Update UI button in `game.js`

**New Maze Size**:
1. Add to `backend/app/game/maze.py` `MazeSize` enum
2. Update UI in `frontend/index.html`

## Performance Tips

### Backend
- Uses threading for async game sessions
- Supports multiple concurrent matches
- Scalable to 100+ players with proper deployment

### Frontend
- 60 FPS rendering loop
- Efficient maze grid rendering
- Optimized collision detection
- No animation frame drops on modern hardware

## Deployment (Future)

### Production Deployment
```bash
# Backend - use Gunicorn
gunicorn --worker-class eventlet -w 1 app:app

# Frontend - use any HTTP server
# nginx, Apache, or AWS S3 + CloudFront
```

### Environment Variables
```bash
export FLASK_ENV=production
export CORS_ORIGINS=https://yourdomain.com
```

## Support

For issues or feature requests, check the main README.md
