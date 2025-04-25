#!/bin/bash

# Enable Docker BuildKit
export DOCKER_BUILDKIT=1

# Function to display usage
usage() {
    echo "Usage: $0 [--push]"
    echo "  --push    Push images to GitHub Container Registry"
    exit 1
}

# Parse arguments
PUSH=0
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --push) PUSH=1 ;;
        *) usage ;;
    esac
    shift
done

# Detect system architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        PLATFORM="linux/amd64"
        PROFILE="amd64"
        ;;
    aarch64)
        PLATFORM="linux/arm64"
        PROFILE="arm64"
        ;;
    *)
        echo "Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

echo "Building for platform: $PLATFORM"

# Build the image
docker-compose --profile $PROFILE build

if [ $PUSH -eq 1 ]; then
    echo "Pushing images to GitHub Container Registry..."
    docker-compose --profile $PROFILE push
fi

echo "Build complete!"
if [ $ARCH == "x86_64" ]; then
    echo "To run on development machine:"
    echo "docker-compose --profile amd64 up -d"
else
    echo "To run on Jetson Nano:"
    echo "docker-compose --profile arm64 up -d"
fi