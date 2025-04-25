import tornado.web
import json
import serial
import asyncio

class ControlHandler(tornado.web.RequestHandler):
    def initialize(self):
        # Define movement commands for mecanum wheels
        self.commands = {
            'forward': 'F',
            'backward': 'B',
            'left': 'L',
            'right': 'R',
            'diagonal_left_forward': 'Q',
            'diagonal_right_forward': 'E',
            'diagonal_left_backward': 'Z',
            'diagonal_right_backward': 'C',
            'rotate_left': 'V',
            'rotate_right': 'N',
            'stop': 'S',
            'line_follow': 'T',
            'line_follow_backward': 'Y'
        }
        
    async def post(self, action):
        try:
            data = json.loads(self.request.body)
            speed = data.get('speed', 255)  # Default max speed
            duration = data.get('duration', 0)  # 0 means continuous until stop
            
            if action not in self.commands:
                self.set_status(400)
                self.write({"error": "Invalid movement command"})
                return
                
            command = self.commands[action]
            result = await self.send_movement_command(command, speed, duration)
            self.write(result)
            
        except Exception as e:
            self.set_status(500)
            self.write({"error": str(e)})
    
    async def send_movement_command(self, command, speed, duration):
        try:
            # Format: CMD,SPEED\n
            # Example: F,255\n for full speed forward
            formatted_command = f"{command},{speed}\n"
            
            # Use Arduino handler's connection
            if not self.application.arduino_handler.arduino:
                return {"error": "Not connected to Arduino"}
                
            self.application.arduino_handler.arduino.write(formatted_command.encode())
            
            if duration > 0:
                await asyncio.sleep(duration)
                # Send stop command after duration
                stop_command = f"S,0\n"
                self.application.arduino_handler.arduino.write(stop_command.encode())
                
            return {"status": "success", "command": command, "speed": speed}
        except Exception as e:
            return {"error": str(e)}