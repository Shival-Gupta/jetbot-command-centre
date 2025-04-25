import os
import tornado.ioloop
import tornado.web
import tornado.websocket
from handlers.auth_handler import AuthHandler
from handlers.stats_handler import StatsWebSocket
from handlers.arduino_handler import ArduinoHandler
from handlers.control_handler import ControlHandler
from handlers.setup_handler import SetupHandler
from handlers.power_handler import PowerHandler

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        if not self.get_secure_cookie("user"):
            self.redirect("/auth/login")
            return
        self.redirect("/dashboard/")

def make_app():
    settings = {
        "cookie_secret": os.environ.get('COOKIE_SECRET', 'your-secret-key-here'),
        "static_path": os.path.join(os.path.dirname(__file__), "../frontend/src"),
        "template_path": os.path.join(os.path.dirname(__file__), "../frontend/src"),
        "debug": bool(os.environ.get('DEBUG', False))
    }
    
    return tornado.web.Application([
        # Main routes
        (r"/", MainHandler),
        (r"/auth/login", AuthHandler),
        
        # WebSocket endpoint
        (r"/ws/stats", StatsWebSocket),
        
        # API endpoints
        (r"/arduino/([^/]+)", ArduinoHandler),
        (r"/control/([^/]+)", ControlHandler),
        (r"/setup/([^/]+)", SetupHandler),
        (r"/power/([^/]+)", PowerHandler),
        
        # Static file handlers for each section
        (r"/dashboard/(.*)", tornado.web.StaticFileHandler, {
            "path": os.path.join(os.path.dirname(__file__), "../frontend/src/dashboard"),
            "default_filename": "index.html"
        }),
        (r"/arduino/(.*)", tornado.web.StaticFileHandler, {
            "path": os.path.join(os.path.dirname(__file__), "../frontend/src/arduino"),
            "default_filename": "index.html"
        }),
        (r"/control/(.*)", tornado.web.StaticFileHandler, {
            "path": os.path.join(os.path.dirname(__file__), "../frontend/src/control"),
            "default_filename": "index.html"
        }),
        (r"/setup/(.*)", tornado.web.StaticFileHandler, {
            "path": os.path.join(os.path.dirname(__file__), "../frontend/src/setup"),
            "default_filename": "index.html"
        }),
        
        # Global static files
        (r"/(global\.js)", tornado.web.StaticFileHandler, {
            "path": os.path.join(os.path.dirname(__file__), "../frontend/src")
        }),
        (r"/(global\.css)", tornado.web.StaticFileHandler, {
            "path": os.path.join(os.path.dirname(__file__), "../frontend/src")
        })
    ], **settings)

if __name__ == "__main__":
    app = make_app()
    port = int(os.environ.get('PORT', 8888))
    app.listen(port)
    print(f"Server running on port {port}")
    tornado.ioloop.IOLoop.current().start()