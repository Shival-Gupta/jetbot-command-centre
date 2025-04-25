# Development Guide

## Setup

### Requirements
- Python 3.9+
- Docker and Docker Compose V2
- Arduino CLI

### Quick Start

1. **Clone and Setup:**
```bash
git clone https://github.com/Shival-Gupta/jetbot-command-centre.git
cd jetbot-dashboard
```

2. **Run with Docker:**
```bash
# Development mode (with hot-reload)
docker compose -f docker-compose.dev.yml up --build

# Production mode
docker compose up --build
```

## Development

### Docker Tips

View logs:
```bash
docker compose logs -f
```

Shell access:
```bash
docker compose exec dashboard bash
```

### Common Issues

1. **USB Permissions**
```bash
sudo usermod -a -G dialout $USER  # Log out/in after
```

2. **Docker Permissions**
```bash
sudo usermod -aG docker $USER  # Log out/in after
```

## Release Process

1. Update VERSION file
2. Create a git tag:
```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions will:
- Run tests
- Build images
- Push to registries
- Create release