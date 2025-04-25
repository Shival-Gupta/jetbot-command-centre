import tornado.websocket
import json
import psutil
import asyncio

class StatsWebSocket(tornado.websocket.WebSocketHandler):
    clients = set()
    update_task = None

    def check_origin(self, origin):
        return True  # Allow cross-origin requests

    def open(self):
        StatsWebSocket.clients.add(self)
        if not StatsWebSocket.update_task:
            StatsWebSocket.update_task = tornado.ioloop.PeriodicCallback(
                self.send_stats_to_all, 1000  # Update every second
            )
            StatsWebSocket.update_task.start()

    def on_close(self):
        StatsWebSocket.clients.remove(self)
        if not StatsWebSocket.clients and StatsWebSocket.update_task:
            StatsWebSocket.update_task.stop()
            StatsWebSocket.update_task = None

    @classmethod
    async def send_stats_to_all(cls):
        if not cls.clients:
            return
            
        stats = {
            'cpu': psutil.cpu_percent(interval=None),
            'memory': psutil.virtual_memory()._asdict(),
            'disk': psutil.disk_usage('/')._asdict(),
            'temperature': await cls.get_jetson_temp(),
            'arduino_connected': await cls.check_arduino_connection()
        }
        
        for client in cls.clients:
            try:
                client.write_message(json.dumps(stats))
            except:
                pass

    @staticmethod
    async def get_jetson_temp():
        try:
            with open("/sys/devices/virtual/thermal/thermal_zone0/temp", "r") as f:
                temp = float(f.read().strip()) / 1000
            return temp
        except:
            return None

    @staticmethod
    async def check_arduino_connection():
        try:
            devices = [d for d in os.listdir('/dev') if d.startswith(('ttyUSB', 'ttyACM'))]
            return len(devices) > 0
        except:
            return False