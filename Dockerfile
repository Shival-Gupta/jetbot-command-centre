# syntax=docker/dockerfile:1
FROM --platform=$BUILDPLATFORM python:3.9-slim AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    gcc \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set up workspace
WORKDIR /app

# Install Python dependencies
COPY backend/requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /app/wheels -r requirements.txt

# Final stage
FROM --platform=$TARGETPLATFORM python:3.9-slim

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    udev \
    && curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 jetbot

# Set up workspace
WORKDIR /app
RUN chown jetbot:jetbot /app

# Copy Python wheels from builder
COPY --from=builder /app/wheels /app/wheels

# Install Python packages
RUN pip install --no-cache-dir /app/wheels/*

# Copy application files
COPY --chown=jetbot:jetbot backend/ backend/
COPY --chown=jetbot:jetbot frontend/ frontend/

# Switch to non-root user
USER jetbot

# Label for GitHub Container Registry
LABEL org.opencontainers.image.source=https://github.com/Shival-Gupta/jetbot-command-centre
LABEL org.opencontainers.image.description="JetBot Dashboard for Jetson Nano"
LABEL org.opencontainers.image.licenses=MIT

# Expose port
EXPOSE 8888

# Run the server
CMD ["python", "backend/server.py"]