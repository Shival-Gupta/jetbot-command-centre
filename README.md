# JetBot Dashboard

A web-based dashboard for controlling and monitoring your JetBot, featuring Arduino integration, system monitoring, and remote control capabilities.

## Features

1. **Dashboard**
   - Real-time system monitoring (CPU, GPU, RAM, Power, Storage)
   - Arduino connection status
   - System temperature monitoring
   - Network status

2. **Arduino IDE**
   - List and connect to Arduino devices
   - Upload/verify sketches
   - Serial monitor
   - Built-in code editor

3. **Robot Control**
   - Mecanum wheel movement control
   - Line following capabilities
   - Speed control
   - Keyboard and touch controls
   - Status monitoring

4. **Setup Tools**
   - Package installation
   - Arduino CLI setup
   - Autostart configuration
   - System status checking

## Requirements

- Jetson Nano
- Arduino board (connected via USB)
- Docker and Docker Compose
- Web browser (on client device)

## Quick Start

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd jetbot
   ```

2. Build and start the container:
   ```bash
   docker-compose up --build
   ```

3. Access the dashboard:
   - Open a web browser
   - Navigate to `http://<jetson-ip>:8888`
   - Login with default credentials:
     - Username: `jetbot`
     - Password: `jetbot`

## Configuration

### Autostart Setup

To configure the dashboard to start automatically on boot:

```bash
./backend/scripts/setup_service.sh
```

### Arduino Setup

1. Connect your Arduino board via USB
2. Go to the Setup page in the dashboard
3. Click "Setup Arduino CLI"
4. Navigate to the Arduino IDE page to upload your code

### Security

- Default credentials are `jetbot`/`jetbot`
- For production use, modify the credentials in `auth_handler.py`
- Use HTTPS if exposing to the internet

## Development

### Project Structure

```
├── backend/
│   ├── handlers/          # API endpoint handlers
│   ├── scripts/           # Utility scripts
│   ├── requirements.txt   # Python dependencies
│   └── server.py         # Main Tornado server
├── frontend/
│   └── src/
│       ├── global.css    # Shared styles
│       ├── global.js     # Shared JavaScript
│       ├── index.html    # Login page
│       ├── dashboard/    # System monitoring
│       ├── arduino/      # Arduino IDE interface
│       ├── control/      # Robot control interface
│       └── setup/        # System configuration
├── docker-compose.yml
└── Dockerfile
```

### API Endpoints

- `/auth/login` - Authentication
- `/ws/stats` - WebSocket for system stats
- `/arduino/*` - Arduino device management
- `/control/*` - Robot movement control
- `/setup/*` - System configuration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Troubleshooting

### Common Issues

1. **Arduino Not Detected**
   - Check USB connection
   - Verify permissions in Docker container
   - Try a different USB port

2. **Dashboard Not Loading**
   - Check network connection
   - Verify Docker container is running
   - Check system logs

3. **Autostart Not Working**
   - Verify service installation
   - Check systemd logs
   - Ensure correct permissions

### Logs

- Docker logs: `docker-compose logs`
- System service: `journalctl -u jetbot-dashboard`
- Arduino CLI: Check Setup page logs

## License

MIT License