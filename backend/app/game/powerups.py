from enum import Enum
import random
from dataclasses import dataclass
from typing import List

class PowerUpType(Enum):
    FREEZE = "freeze"  # Freezes opponent for 1 sec
    SPEED = "speed"    # Speed boost for 3 secs (1.5x)
    SIGHT = "sight"    # Shows path for 1 sec

@dataclass
class PowerUp:
    x: float
    y: float
    type: PowerUpType
    id: int

class PowerUpManager:
    def __init__(self, maze_size, num_powerups=15):
        self.maze_size = maze_size
        self.powerups: List[PowerUp] = []
        self.next_id = 0
        self._spawn_powerups(num_powerups)
    
    def _spawn_powerups(self, count):
        """Randomly place power-ups on the maze"""
        for _ in range(count):
            x = random.randint(2, self.maze_size - 3)
            y = random.randint(2, self.maze_size - 3)
            ptype = random.choice(list(PowerUpType))
            
            self.powerups.append(PowerUp(
                x=x,
                y=y,
                type=ptype,
                id=self.next_id
            ))
            self.next_id += 1
    
    def check_collision(self, player_x, player_y, radius=0.5):
        """Check if player collects a power-up"""
        collected = []
        remaining = []
        
        for powerup in self.powerups:
            distance = ((player_x - powerup.x) ** 2 + (player_y - powerup.y) ** 2) ** 0.5
            if distance < radius:
                collected.append(powerup)
            else:
                remaining.append(powerup)
        
        self.powerups = remaining
        return collected
    
    def get_powerups_data(self):
        """Return powerup data for rendering"""
        return [
            {
                'id': p.id,
                'x': p.x,
                'y': p.y,
                'type': p.type.value
            }
            for p in self.powerups
        ]
