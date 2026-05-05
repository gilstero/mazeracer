import random
from enum import Enum

class MazeSize(Enum):
    SMALL = 15
    MEDIUM = 25
    LARGE = 40

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
        self.end = (size - 2, size - 2)
    
    def _generate_maze(self):
        """Generate maze using recursive backtracking"""
        size = self.size
        # Initialize with all walls
        maze = [[1 for _ in range(size)] for _ in range(size)]
        
        # Carving algorithm
        def carve(x, y):
            maze[y][x] = 0
            directions = [(0, -2), (2, 0), (0, 2), (-2, 0)]
            random.shuffle(directions)
            
            for dx, dy in directions:
                nx, ny = x + dx, y + dy
                if 0 < nx < size - 1 and 0 < ny < size - 1 and maze[ny][nx] == 1:
                    maze[y + dy // 2][x + dx // 2] = 0
                    carve(nx, ny)
        
        carve(1, 1)
        return maze
    
    def is_passable(self, x, y):
        """Check if position is walkable"""
        if x < 0 or x >= self.size or y < 0 or y >= self.size:
            return False
        
        if self.shape == MazeShape.CIRCLE:
            # Check distance from center for circular maze
            center = self.size / 2
            distance = ((x - center) ** 2 + (y - center) ** 2) ** 0.5
            return distance < center * 0.95 and self.grid[int(y)][int(x)] == 0
        
        return self.grid[int(y)][int(x)] == 0
    
    def get_maze_data(self):
        """Return maze data for client"""
        return {
            'size': self.size,
            'shape': self.shape.value,
            'grid': self.grid,
            'start': self.start,
            'end': self.end
        }
