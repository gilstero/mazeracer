from flask_socketio import emit, join_room, leave_room, disconnect
from flask import request
from app.game.matchmaker import matchmaker
from app.game.game_session import GameSession

# Store active game sessions
active_games = {}

def register_socket_handlers(socketio):
    @socketio.on('connect')
    def handle_connect(auth):
        print(f'Client connected: {request.sid}')
        emit('connected', {'status': 'Connected to server'})
    
    @socketio.on('disconnect')
    def handle_disconnect():
        print(f'Client disconnected: {request.sid}')
    
    @socketio.on('join_queue')
    def handle_join_queue(data):
        """Player joins matchmaking queue"""
        player_name = data.get('name', 'Player')
        player_color = data.get('color', '#FF0000')
        session_id = request.sid
        maze_size = data.get('size', 'medium')
        maze_shape = data.get('shape', 'square')
        
        result = matchmaker.join_queue(player_name, player_color, session_id)
        
        if result:
            # Match found! Unpack the result
            game_id, player_num, p1_sid, p2_sid = result
            match = matchmaker.get_match(game_id)
            
            # Create game session
            session = GameSession(game_id, match['player1'], match['player2'], maze_size, maze_shape)
            active_games[game_id] = session
            
            # Join both players to the room explicitly
            socketio.server.enter_room(p1_sid, game_id)
            socketio.server.enter_room(p2_sid, game_id)
            
            # Get state for both players
            p1_state = session.get_state(match['player1']['id'])
            p2_state = session.get_state(match['player2']['id'])
            
            # Send matched event to both players with correct player ID
            socketio.emit('matched', {
                'gameId': game_id,
                'playerId': match['player1']['id'],
                'state': p1_state,
                'playerNumber': 1
            }, to=p1_sid)
            
            socketio.emit('matched', {
                'gameId': game_id,
                'playerId': match['player2']['id'],
                'state': p2_state,
                'playerNumber': 2
            }, to=p2_sid)
            
            print(f'✓ Match: {game_id} - {match["player1"]["name"]} vs {match["player2"]["name"]}')
        else:
            # Waiting for opponent
            emit('waiting', {
                'message': 'Waiting for opponent...',
                'queueSize': matchmaker.get_queue_size()
            })
    
    
    @socketio.on('move')
    def handle_move(data):
        """Update player position"""
        game_id = data.get('gameId')
        session_id = request.sid
        x = data.get('x')
        y = data.get('y')
        
        if game_id not in active_games:
            return
        
        game = active_games[game_id]
        # Find which player this session is
        match = matchmaker.get_match(game_id)
        if not match:
            return
        
        # Determine player ID based on session
        if match['player1']['sid'] == session_id:
            player_id = match['player1']['id']
        elif match['player2']['sid'] == session_id:
            player_id = match['player2']['id']
        else:
            return
        
        game.update_player_position(player_id, x, y)
        
        # Broadcast game state to both players
        socketio.emit('state_update', game.get_state(player_id), room=game_id)
    
    @socketio.on('collect_powerup')
    def handle_collect_powerup(data):
        """Handle power-up collection"""
        game_id = data.get('gameId')
        session_id = request.sid
        powerup_type = data.get('type')
        
        if game_id not in active_games:
            return
        
        game = active_games[game_id]
        match = matchmaker.get_match(game_id)
        if not match:
            return
        
        # Determine player ID based on session
        if match['player1']['sid'] == session_id:
            player_id = match['player1']['id']
        elif match['player2']['sid'] == session_id:
            player_id = match['player2']['id']
        else:
            return
        
        game.apply_power_effect(player_id, powerup_type)
        
        socketio.emit('state_update', game.get_state(player_id), room=game_id)
    
    @socketio.on('finish')
    def handle_finish(data):
        """Player reached finish line"""
        game_id = data.get('gameId')
        session_id = request.sid
        
        if game_id not in active_games:
            return
        
        game = active_games[game_id]
        match = matchmaker.get_match(game_id)
        if not match:
            return
        
        # Determine player ID based on session
        if match['player1']['sid'] == session_id:
            player_id = match['player1']['id']
        elif match['player2']['sid'] == session_id:
            player_id = match['player2']['id']
        else:
            return
        
        if game.completed:
            socketio.emit('game_over', {
                'winner': game.winner,
                'state': game.get_state(player_id)
            }, room=game_id)
            
            # Clean up
            matchmaker.end_match(game_id, game.winner)
            del active_games[game_id]
