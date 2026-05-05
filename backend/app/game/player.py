from dataclasses import dataclass, field
from typing import Optional
from datetime import datetime, timedelta

@dataclass
class PlayerState:
    id: str
    name: str
    color: str
    x: float = 1.0
    y: float = 1.0
    
    # Status effects (timestamps)
    frozen_until: Optional[datetime] = None
    speed_boost_until: Optional[datetime] = None
    show_path_until: Optional[datetime] = None
    
    # Stats
    finished: bool = False
    finish_time: Optional[float] = None
    
    def get_speed_multiplier(self) -> float:
        """Get current speed multiplier based on active effects"""
        now = datetime.now()
        if self.speed_boost_until and now < self.speed_boost_until:
            return 1.5
        return 1.0
    
    def is_frozen(self) -> bool:
        """Check if player is currently frozen"""
        now = datetime.now()
        if self.frozen_until and now < self.frozen_until:
            return True
        return False
    
    def freeze(self):
        """Freeze player for 1 second"""
        self.frozen_until = datetime.now() + timedelta(seconds=1)
    
    def apply_speed_boost(self):
        """Apply speed boost for 3 seconds"""
        self.speed_boost_until = datetime.now() + timedelta(seconds=3)
    
    def enable_path_sight(self):
        """Enable path visualization for 1 second"""
        self.show_path_until = datetime.now() + timedelta(seconds=1)
    
    def can_see_path(self) -> bool:
        """Check if player can currently see the path"""
        now = datetime.now()
        if self.show_path_until and now < self.show_path_until:
            return True
        return False
    
    def to_dict(self):
        """Convert to dictionary for sending to clients"""
        now = datetime.now()
        return {
            'id': self.id,
            'name': self.name,
            'color': self.color,
            'x': self.x,
            'y': self.y,
            'frozen': self.is_frozen(),
            'speedBoost': bool(self.speed_boost_until and now < self.speed_boost_until),
            'showPath': self.can_see_path(),
            'finished': self.finished,
            'finishTime': self.finish_time
        }
