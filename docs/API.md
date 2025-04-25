# API Reference

## WebSocket

### System Stats (`/ws/stats`)
```javascript
const ws = new WebSocket(`ws://${window.location.host}/ws/stats`);
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Handle system stats
};
```

Response:
```json
{
    "cpu": 25.5,
    "memory": {
        "used": 1024,
        "total": 4096
    },
    "temperature": 45.2,
    "arduino": true
}
```

## REST Endpoints

### Authentication

`POST /auth/login`
```json
{
    "username": "jetbot",
    "password": "jetbot"
}
```

### Arduino

`POST /arduino/connect`
```json
{
    "port": "/dev/ttyUSB0",
    "baud": 9600
}
```

`POST /arduino/upload`
```json
{
    "sketch": "path/to/sketch.ino"
}
```

### Robot Control

`POST /control/<action>`
- Actions: `forward`, `backward`, `left`, `right`, `stop`
```json
{
    "speed": 255,  // 0-255
    "duration": 1000  // ms, optional
}
```

### Setup

`GET /setup/status`
```json
{
    "arduino_cli": true,
    "autostart": true
}
```

## Error Responses

All errors follow:
```json
{
    "error": "Error description"
}
```

Status codes:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 500: Server Error