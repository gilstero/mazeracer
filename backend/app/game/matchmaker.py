import threading
import uuid
from typing import Optional, Tuple
from datetime import datetime

class Matchmaker:
    def __init__(self):
        self.waiting_queue = []
        self.matches = {}  # room_id -> match data
        self.player_sessions = {}  # sid -> game_id mapping
        self.lock = threading.Lock()
    
    def join_queue(self, player_name: str, player_color: str, session_id: str) -> Optional[tuple]:
        """Add player to matching queue, return (game_id, player_number) if match found"""
        with self.lock:
            player_id = str(uuid.uuid4())
            
            if len(self.waiting_queue) > 0:
                # Match with first waiting player
                opponent = self.waiting_queue.pop(0)
                game_id = self._create_match(player_id, opponent['id'], 
                                            player_name, opponent['name'],
                                            player_color, opponent['color'],
                                            session_id, opponent['sid'])
                
                # Track session -> game mapping
                self.player_sessions[session_id] = game_id
                self.player_sessions[opponent['sid']] = game_id
                
                return (game_id, 1, session_id, opponent['sid'])  # Return both sids
            else:
                # Add to queue
                self.waiting_queue.append({
                    'id': player_id,
                    'name': player_name,
                    'color': player_color,
                    'timestamp': datetime.now(),
                    'sid': session_id
                })
                return None
    
    def _create_match(self, p1_id: str, p2_id: str, 
                      p1_name: str, p2_name: str,
                      p1_color: str, p2_color: str,
                      p1_sid: str, p2_sid: str) -> str:
        """Create a match between two players"""
        game_id = str(uuid.uuid4())
        self.matches[game_id] = {
            'player1': {'id': p1_id, 'name': p1_name, 'color': p1_color, 'sid': p1_sid},
            'player2': {'id': p2_id, 'name': p2_name, 'color': p2_color, 'sid': p2_sid},
            'created_at': datetime.now(),
            'completed': False,
            'winner': None
        }
        return game_id
    
    def get_match(self, game_id: str):
        """Get match data"""
        return self.matches.get(game_id)
    
    def end_match(self, game_id: str, winner_id: str):
        """Mark match as completed"""
        with self.lock:
            if game_id in self.matches:
                self.matches[game_id]['completed'] = True
                self.matches[game_id]['winner'] = winner_id
    
    def get_queue_size(self) -> int:
        """Get number of players waiting"""
        with self.lock:
            return len(self.waiting_queue)
    
    def cleanup_stale_queue(self, timeout_seconds=300):
        """Remove players waiting too long (5 minutes)"""
        with self.lock:
            now = datetime.now()
            self.waiting_queue = [
                p for p in self.waiting_queue
                if (now - p['timestamp']).total_seconds() < timeout_seconds
            ]

# Global matchmaker instance
matchmaker = Matchmaker()
