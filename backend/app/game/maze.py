import random
from enum import Enum

class MazeSize(Enum):
    SMALL = 21
    MEDIUM = 31
    LARGE = 41

class MazeShape(Enum):
    SQUARE = "square"
    TRIANGLE = "triangle"
    CIRCLE = "circle"

class Maze:
    def __init__(self, size, shape):
        self.size = size
        self.shape = shape
        self.grid = self._generate_maze()
        self.start = (1, 1)
        self.end = self._find_end()
    
    def _generate_maze(self):
        """Generate maze using iterative backtracking."""
        size = self.size
        maze = [[1 for _ in range(size)] for _ in range(size)]
        stack = [(1, 1)]
        maze[1][1] = 0

        while stack:
            x, y = stack[-1]
            directions = [(0, -2), (2, 0), (0, 2), (-2, 0)]
            random.shuffle(directions)

            carved = False
            for dx, dy in directions:
                nx, ny = x + dx, y + dy
                if 0 < nx < size - 1 and 0 < ny < size - 1 and maze[ny][nx] == 1:
                    maze[y + dy // 2][x + dx // 2] = 0
                    maze[ny][nx] = 0
                    stack.append((nx, ny))
                    carved = True
                    break

            if not carved:
                stack.pop()

        return maze

    def _find_end(self):
        for y in range(self.size - 2, 0, -1):
            for x in range(self.size - 2, 0, -1):
                if self.grid[y][x] == 0:
                    return (x, y)
        return self.start
    
    def is_passable(self, x, y, radius=0.36):
        """Check if a player-sized box fits in walkable grid cells."""
        min_x = x + 0.5 - radius
        max_x = x + 0.5 + radius
        min_y = y + 0.5 - radius
        max_y = y + 0.5 + radius

        if min_x < 0 or max_x >= self.size or min_y < 0 or max_y >= self.size:
            return False

        cells = {
            (int(min_x), int(min_y)),
            (int(max_x), int(min_y)),
            (int(min_x), int(max_y)),
            (int(max_x), int(max_y)),
        }

        if self.shape == MazeShape.CIRCLE:
            center = self.size / 2
            for cell_x, cell_y in cells:
                distance = ((cell_x - center) ** 2 + (cell_y - center) ** 2) ** 0.5
                if distance >= center * 0.95:
                    return False

        return all(self.grid[cell_y][cell_x] == 0 for cell_x, cell_y in cells)
    
    def get_maze_data(self):
        """Return maze data for client"""
        return {
            'size': self.size,
            'shape': self.shape.value,
            'grid': self.grid,
            'start': self.start,
            'end': self.end
        }
