from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = 'maze-racer-secret-key'
    
    CORS(app)
    socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')
    
    from app.routes import main_bp
    from app.sockets import register_socket_handlers
    
    app.register_blueprint(main_bp)
    register_socket_handlers(socketio)
    
    return app, socketio
