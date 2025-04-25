import tornado.web
import json

class AuthHandler(tornado.web.RequestHandler):
    def get(self):
        if self.get_secure_cookie("user"):
            self.redirect("/")
            return
        self.render("index.html")
    
    def post(self):
        data = json.loads(self.request.body)
        username = data.get("username")
        password = data.get("password")
        
        if username == "jetbot" and password == "jetbot":
            self.set_secure_cookie("user", username)
            self.write({"status": "success"})
        else:
            self.set_status(401)
            self.write({"status": "error", "message": "Invalid credentials"})