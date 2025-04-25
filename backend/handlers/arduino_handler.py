import tornado.web
import json
import serial
import glob
import subprocess
from serial.tools import list_ports

class ArduinoHandler(tornado.web.RequestHandler):
    arduino = None
    
    def initialize(self):
        self.actions = {
            'list': self.list_devices,
            'connect': self.connect_device,
            'disconnect': self.disconnect_device,
            'compile': self.compile_code,
            'upload': self.upload_code,
            'send': self.send_command
        }
    
    async def post(self, action):
        if action not in self.actions:
            self.set_status(400)
            self.write({"error": "Invalid action"})
            return
            
        try:
            data = json.loads(self.request.body)
            result = await self.actions[action](data)
            self.write(result)
        except Exception as e:
            self.set_status(500)
            self.write({"error": str(e)})
    
    async def list_devices(self, data):
        ports = list_ports.comports()
        return {
            "devices": [
                {
                    "port": p.device,
                    "description": p.description,
                    "manufacturer": p.manufacturer
                }
                for p in ports
            ]
        }
    
    async def connect_device(self, data):
        port = data.get('port')
        baud = data.get('baud', 9600)
        
        if self.arduino:
            self.arduino.close()
            
        try:
            self.arduino = serial.Serial(port, baud, timeout=1)
            return {"status": "connected", "port": port, "baud": baud}
        except Exception as e:
            return {"error": f"Failed to connect: {str(e)}"}
    
    async def disconnect_device(self, data):
        if self.arduino:
            self.arduino.close()
            self.arduino = None
        return {"status": "disconnected"}
    
    async def compile_code(self, data):
        sketch_path = data.get('sketch')
        if not sketch_path:
            return {"error": "No sketch path provided"}
            
        cmd = ["arduino-cli", "compile", "--fqbn", "arduino:avr:uno", sketch_path]
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = proc.communicate()
        
        if proc.returncode == 0:
            return {"status": "success", "output": stdout.decode()}
        else:
            return {"error": stderr.decode()}
    
    async def upload_code(self, data):
        sketch_path = data.get('sketch')
        port = data.get('port')
        
        if not sketch_path or not port:
            return {"error": "Missing sketch path or port"}
            
        cmd = ["arduino-cli", "upload", "-p", port, "--fqbn", "arduino:avr:uno", sketch_path]
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        stdout, stderr = proc.communicate()
        
        if proc.returncode == 0:
            return {"status": "success", "output": stdout.decode()}
        else:
            return {"error": stderr.decode()}
    
    async def send_command(self, data):
        if not self.arduino:
            return {"error": "Not connected to any device"}
            
        command = data.get('command', '')
        if not command:
            return {"error": "No command provided"}
            
        try:
            self.arduino.write(command.encode())
            response = self.arduino.readline().decode().strip()
            return {"status": "success", "response": response}
        except Exception as e:
            return {"error": f"Failed to send command: {str(e)}"}