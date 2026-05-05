# Maze Racer - Two Player Racing Game

A fast-paced, real-time two-player maze racing game with power-ups, matchmaking, and customizable characters.

## Features

- **Multiplayer Matchmaking**: Automatically pairs players together
- **Three Maze Sizes**: Small (15x15), Medium (25x25), Large (40x40)
- **Three Maze Designs**: Square, Triangle, Circle
- **Character Customization**: 20+ color choices for your character
- **Power-Ups**:
  - ❄️ Freeze: Freeze opponent for 1 second
  - 💨 Speed Boost: Move 1.5x faster for 3 seconds
  - 👁️ Sight: See the optimal path for 1 second
- **Real-time Multiplayer**: WebSocket-based real-time synchronization
- **Fast Performance**: Canvas-based rendering for smooth gameplay

## Project Structure

```
mazeracer/
├── backend/
│   ├── app/
│   │   ├── __init__.py           # Flask app initialization
│   │   ├── routes.py             # HTTP routes
│   │   ├── sockets.py            # WebSocket handlers
│   │   └── game/
│   │       ├── maze.py           # Maze generation
│   │       ├── player.py         # Player state management
│   │       ├── powerups.py       # Power-up system
│   │       ├── matchmaker.py     # Player matchmaking
│   │       └── game_session.py   # Game session logic
│   ├── run.py                    # Server entry point
│   └── requirements.txt          # Python dependencies
│
├── frontend/
│   ├── index.html                # Main HTML
│   ├── game.js                   # Game engine & loop
│   ├── network.js                # WebSocket client
│   ├── styles.css                # Styling
│   └── assets/                   # Images & sounds (future)
│
└── README.md
```

## Backend Architecture

### Python Stack
- **Flask**: Web framework
- **Flask-SocketIO**: Real-time WebSocket communication
- **Threading**: Async game session management

### Game Logic
1. **Matchmaker**: Queues players and creates matches
2. **GameSession**: Manages individual game state
3. **Maze**: Procedurally generates playable mazes
4. **PowerUpManager**: Tracks and handles power-ups
5. **PlayerState**: Manages player position and status effects

## Frontend Architecture

### Canvas-Based Rendering
- Pixel art style for simplicity and performance
- Real-time maze rendering
- Smooth player animations
- Power-up visual effects

### Game Loop
- 60 FPS game loop using requestAnimationFrame
- Input handling (WASD/Arrow keys)
- Network state synchronization

## Running the Game

### Prerequisites
- Python 3.8+
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python run.py
```

The server will start on `http://localhost:5000`

### Frontend
```bash
cd frontend
# Serve using any HTTP server, e.g.:
python -m http.server 8000
```

Open `http://localhost:8000` in your browser.

## How to Play

1. **Join Game**:
   - Enter your player name
   - Choose your character color
   - Select maze size (Small, Medium, Large)
   - Choose maze design (Square, Triangle, Circle)
   - Click PLAY

2. **Find Your Opponent**:
   - Wait in queue for matchmaking (typically instant)
   - Once matched, the maze loads with both players

3. **Race**:
   - Use WASD or Arrow Keys to move
   - Reach the golden finish line first to win
   - Collect power-ups for advantages:
     - **Blue Star (Freeze)**: Freezes opponent for 1 sec
     - **Purple Star (Speed)**: Go 1.5x faster for 3 secs
     - **Green Star (Sight)**: See the optimal path for 1 sec

4. **Win**:
   - First player to reach the finish line wins
   - See your finish time and play again

## Performance Optimization

- **Canvas Rendering**: Hardware-accelerated 2D drawing
- **Efficient Network**: Only sends position updates when moved
- **Maze Generation**: Pre-computed using recursive backtracking
- **Power-up Collision**: O(n) simple distance checks

## Future Enhancements

- [ ] Leaderboards
- [ ] Game replay system
- [ ] Additional power-ups and obstacles
- [ ] Sound effects and music
- [ ] Mobile touch controls
- [ ] Game modes (team racing, free-for-all)
- [ ] Character skins beyond colors
- [ ] Difficulty levels

## License

MIT License - Feel free to use and modify!
