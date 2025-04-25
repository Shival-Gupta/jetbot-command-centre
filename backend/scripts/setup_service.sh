#!/bin/bash

# Create systemd service file
cat > /tmp/jetbot-dashboard.service << EOL
[Unit]
Description=JetBot Dashboard Service
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=jetson
WorkingDirectory=/home/jetson/jetbot
ExecStart=/usr/bin/docker-compose up
ExecStop=/usr/bin/docker-compose down
Restart=always

[Install]
WantedBy=multi-user.target
EOL

# Move service file to systemd directory
sudo mv /tmp/jetbot-dashboard.service /etc/systemd/system/

# Reload systemd daemon
sudo systemctl daemon-reload

# Enable and start service
sudo systemctl enable jetbot-dashboard
sudo systemctl start jetbot-dashboard

echo "JetBot Dashboard service installed and started!"