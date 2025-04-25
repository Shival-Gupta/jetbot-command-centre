import tornado.web
import json
import subprocess
import sys
import os

class SetupHandler(tornado.web.RequestHandler):
    async def get(self):
        """Return current system status and installed packages"""
        status = await self.check_system_status()
        self.write(status)
    
    async def post(self):
        """Handle setup requests"""
        try:
            data = json.loads(self.request.body)
            action = data.get('action', '')
            
            if action == 'install_packages':
                result = await self.install_packages()
            elif action == 'setup_arduino':
                result = await self.setup_arduino()
            elif action == 'setup_autostart':
                result = await self.setup_autostart()
            else:
                self.set_status(400)
                result = {"error": "Invalid action"}
                
            self.write(result)
        except Exception as e:
            self.set_status(500)
            self.write({"error": str(e)})
    
    async def check_system_status(self):
        """Check installation status of required components"""
        status = {
            "packages": await self.check_packages(),
            "arduino_cli": await self.check_arduino_cli(),
            "autostart": await self.check_autostart()
        }
        return status
    
    async def check_packages(self):
        required_apt = ["python3-pip", "git", "curl"]
        required_pip = ["tornado", "pyserial", "psutil"]
        
        apt_status = {}
        for pkg in required_apt:
            proc = subprocess.run(["dpkg", "-l", pkg], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            apt_status[pkg] = proc.returncode == 0
            
        pip_status = {}
        for pkg in required_pip:
            proc = subprocess.run([sys.executable, "-m", "pip", "show", pkg], 
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            pip_status[pkg] = proc.returncode == 0
            
        return {"apt": apt_status, "pip": pip_status}
    
    async def check_arduino_cli(self):
        proc = subprocess.run(["arduino-cli", "--version"], 
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        return proc.returncode == 0
    
    async def check_autostart(self):
        service_path = "/etc/systemd/system/jetbot-dashboard.service"
        return os.path.exists(service_path)
    
    async def install_packages(self):
        """Install required system packages"""
        try:
            # Update package list
            subprocess.run(["sudo", "apt-get", "update"], check=True)
            
            # Install apt packages
            subprocess.run(["sudo", "apt-get", "install", "-y",
                          "python3-pip", "git", "curl"], check=True)
            
            # Install pip packages
            subprocess.run([sys.executable, "-m", "pip", "install", "-r",
                          "requirements.txt"], check=True)
            
            return {"status": "success", "message": "Packages installed successfully"}
        except subprocess.CalledProcessError as e:
            return {"error": f"Failed to install packages: {str(e)}"}
    
    async def setup_arduino(self):
        """Set up Arduino CLI and required libraries"""
        try:
            # Install Arduino CLI if not present
            if not await self.check_arduino_cli():
                subprocess.run(["curl", "-fsSL", 
                              "https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh",
                              "|", "sh"], check=True)
            
            # Initialize Arduino CLI config
            subprocess.run(["arduino-cli", "config", "init"], check=True)
            
            # Update core index
            subprocess.run(["arduino-cli", "core", "update-index"], check=True)
            
            # Install Arduino AVR core
            subprocess.run(["arduino-cli", "core", "install", "arduino:avr"], check=True)
            
            return {"status": "success", "message": "Arduino CLI setup completed"}
        except subprocess.CalledProcessError as e:
            return {"error": f"Failed to setup Arduino: {str(e)}"}
    
    async def setup_autostart(self):
        """Configure system service for autostart"""
        service_content = """[Unit]
Description=JetBot Dashboard Service
After=network.target

[Service]
ExecStart=/usr/bin/docker-compose -f /home/jetson/jetbot/docker-compose.yml up
WorkingDirectory=/home/jetson/jetbot
Restart=always
User=jetson

[Install]
WantedBy=multi-user.target
"""
        try:
            service_path = "/etc/systemd/system/jetbot-dashboard.service"
            
            # Write service file
            with open("/tmp/jetbot-dashboard.service", "w") as f:
                f.write(service_content)
            
            # Move to system directory
            subprocess.run(["sudo", "mv", "/tmp/jetbot-dashboard.service", 
                          service_path], check=True)
            
            # Reload systemd
            subprocess.run(["sudo", "systemctl", "daemon-reload"], check=True)
            
            # Enable and start service
            subprocess.run(["sudo", "systemctl", "enable", "jetbot-dashboard"], check=True)
            subprocess.run(["sudo", "systemctl", "start", "jetbot-dashboard"], check=True)
            
            return {"status": "success", "message": "Autostart service configured"}
        except Exception as e:
            return {"error": f"Failed to setup autostart: {str(e)}"}