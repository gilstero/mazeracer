# Maze Racer

A local two-player maze racing game with matchmaking, power-ups, and simple character customization.

## Features

- Two-player matchmaking
- Maze sizes: small `21x21`, medium `31x31`, large `41x41`
- Character color and shape choices
- Power-ups:
  - Freeze: freezes the opponent for 1 second
  - Speed: moves 1.5x faster for 3 seconds
  - Sight: shows the shortest path to the finish for 1 second
- Winner skin unlock stored in a browser cookie
- Canvas-based rendering

## Project Structure

```text
mazeracer/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── routes.py
│   │   ├── sockets.py
│   │   └── game/
│   │       ├── game_session.py
│   │       ├── matchmaker.py
│   │       ├── maze.py
│   │       ├── player.py
│   │       └── powerups.py
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── game.js
│   ├── index.html
│   ├── network.js
│   └── styles.css
├── start.sh
├── stop.sh
└── README.md
```

## Run Locally

Prerequisites:

- Python 3.8+
- A modern browser

Start both the backend and frontend:

```bash
./start.sh
```

The backend starts on:

```text
http://localhost:5001
```

The frontend starts on the first open port at or after `8000`, usually:

```text
http://localhost:8000
```

Open the printed frontend URL in two browser tabs or windows, choose each player, and press `Ready` in both.

Stop local servers:

```bash
./stop.sh
```

## Manual Run

Backend:

```bash
cd backend
pip install -r requirements.txt
python run.py
```

Frontend:

```bash
cd frontend
python -m http.server 8000
```

## Notes

- This is currently set up as a local project.
- The frontend connects to `http://localhost:5001` while running locally.
- For public hosting, keep the static frontend on Vercel and deploy the realtime backend to a long-running server host such as Railway, Render, or Fly.io.
- Set `SECRET_KEY` in the backend environment for any non-local deployment.

## License

MIT
