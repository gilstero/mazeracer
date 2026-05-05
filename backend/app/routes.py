from flask import Blueprint, jsonify
from app.game.matchmaker import matchmaker

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    return jsonify({'status': 'Maze Racer Server Running'})

@main_bp.route('/api/queue-size')
def queue_size():
    return jsonify({'waiting': matchmaker.get_queue_size()})
