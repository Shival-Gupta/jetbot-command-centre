import tornado.websocket
import json
import psutil
import asyncio
import os
import platform
import subprocess
from datetime import datetime

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
            'system': await cls.get_system_info(),
            'cpu': psutil.cpu_percent(interval=None),
            'memory': psutil.virtual_memory()._asdict(),
            'disk': psutil.disk_usage('/')._asdict(),
            'temperature': await cls.get_jetson_temp(),
            'arduino_connected': await cls.check_arduino_connection(),
            'uptime': cls.get_uptime()
        }
        
        for client in cls.clients:
            try:
                client.write_message(json.dumps(stats))
            except:
                pass

    @staticmethod
    async def get_system_info():
        try:
            # Get OS information
            os_info = {
                'system': platform.system(),
                'release': platform.release(),
                'version': platform.version(),
                'machine': platform.machine(),
                'processor': platform.processor()
            }

            # Get package counts
            dpkg_count = 0
            snap_count = 0
            try:
                dpkg = subprocess.check_output(['dpkg-query', '-f', '${binary:Package}\n', '-W']).decode()
                dpkg_count = len(dpkg.splitlines())
            except:
                pass
            try:
                snap = subprocess.check_output(['snap', 'list']).decode()
                snap_count = len(snap.splitlines()) - 1  # Subtract header line
            except:
                pass

            # Get shell information
            shell = os.environ.get('SHELL', '')
            
            # Get GPU information for Jetson
            gpu_info = None
            try:
                nvidia_smi = subprocess.check_output(['nvidia-smi', '--query-gpu=gpu_name,memory.total,memory.used', '--format=csv,noheader']).decode()
                gpu_info = nvidia_smi.strip()
            except:
                pass

            return {
                'os': os_info,
                'packages': {
                    'dpkg': dpkg_count,
                    'snap': snap_count
                },
                'shell': shell,
                'gpu': gpu_info
            }
        except Exception as e:
            return str(e)

    @staticmethod
    def get_uptime():
        try:
            with open('/proc/uptime', 'r') as f:
                uptime_seconds = float(f.readline().split()[0])
                hours = int(uptime_seconds // 3600)
                minutes = int((uptime_seconds % 3600) // 60)
                return f"{hours} hours, {minutes} mins"
        except:
            return None

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