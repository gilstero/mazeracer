import threading
from datetime import datetime
from typing import Dict, Optional
from app.game.maze import Maze, MazeSize, MazeShape
from app.game.powerups import PowerUpManager
from app.game.player import PlayerState

class GameSession:
    def __init__(self, game_id: str, player1_data: dict, player2_data: dict, 
                 maze_size: str, maze_shape: str):
        self.game_id = game_id
        self.players: Dict[str, PlayerState] = {}
        
        # Create player states
        self.players[player1_data['id']] = PlayerState(
            id=player1_data['id'],
            name=player1_data['name'],
            color=player1_data['color']
        )
        self.players[player2_data['id']] = PlayerState(
            id=player2_data['id'],
            name=player2_data['name'],
            color=player2_data['color']
        )
        
        # Game state
        self.maze = Maze(MazeSize[maze_size.upper()].value, MazeShape[maze_shape.upper()])
        self.powerup_manager = PowerUpManager(self.maze.size)
        
        self.started_at = datetime.now()
        self.completed = False
        self.winner = None
        
        self.lock = threading.Lock()
    
    def update_player_position(self, player_id: str, x: float, y: float) -> bool:
        """Update player position if valid"""
        with self.lock:
            if player_id not in self.players:
                return False
            
            player = self.players[player_id]
            
            # Can't move if frozen
            if player.is_frozen():
                return False
            
            # Check if position is valid in maze
            if self.maze.is_passable(x, y):
                player.x = x
                player.y = y
                
                # Check if reached end
                if self._check_finish(player):
                    return True
                
                # Check power-up collision
                self._check_powerups(player)
                return True
            
            return False
    
    def _check_finish(self, player: PlayerState) -> bool:
        """Check if player reached finish line"""
        end_x, end_y = self.maze.end
        distance = ((player.x - end_x) ** 2 + (player.y - end_y) ** 2) ** 0.5
        
        if distance < 1.0 and not player.finished:
            player.finished = True
            player.finish_time = (datetime.now() - self.started_at).total_seconds()
            
            # First to finish wins
            if not self.completed:
                self.completed = True
                self.winner = player.id
            
            return True
        
        return False
    
    def _check_powerups(self, player: PlayerState):
        """Check for power-up collisions"""
        collected = self.powerup_manager.check_collision(player.x, player.y)
        
        for powerup in collected:
            if powerup.type.value == 'freeze':
                # Freeze opponent
                for pid, p in self.players.items():
                    if pid != player.id:
                        p.freeze()
            elif powerup.type.value == 'speed':
                player.apply_speed_boost()
            elif powerup.type.value == 'sight':
                player.enable_path_sight()
    
    def get_state(self, player_id: str):
        """Get game state for a player"""
        with self.lock:
            return {
                'gameId': self.game_id,
                'maze': self.maze.get_maze_data(),
                'players': {
                    pid: p.to_dict() for pid, p in self.players.items()
                },
                'powerups': self.powerup_manager.get_powerups_data(),
                'completed': self.completed,
                'winner': self.winner
            }
    
    def apply_power_effect(self, player_id: str, effect_type: str):
        """Apply a power-up effect to opponent"""
        with self.lock:
            if player_id not in self.players:
                return
            
            # Find opponent
            player = self.players[player_id]
            for pid, p in self.players.items():
                if pid != player_id:
                    opponent = p
                    break
            
            if effect_type == 'freeze':
                opponent.freeze()
            elif effect_type == 'speed':
                player.apply_speed_boost()
            elif effect_type == 'sight':
                player.enable_path_sight()
