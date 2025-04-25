import tornado.web
import subprocess

class PowerHandler(tornado.web.RequestHandler):
    def check_permission(self):
        if not self.get_secure_cookie("user"):
            self.set_status(401)
            self.write({"error": "Unauthorized"})
            return False
        return True

    async def post(self, action):
        if not self.check_permission():
            return

        try:
            if action == "reboot":
                subprocess.run(['sudo', 'reboot'], check=True)
                self.write({"status": "Rebooting system"})
            elif action == "poweroff":
                subprocess.run(['sudo', 'poweroff'], check=True)
                self.write({"status": "Powering off system"})
            else:
                self.set_status(400)
                self.write({"error": "Invalid action"})
        except Exception as e:
            self.set_status(500)
            self.write({"error": str(e)})