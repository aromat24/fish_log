# Fish Log PWA Dev Container
FROM mcr.microsoft.com/devcontainers/javascript-node:lts

# Install extra tools and dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        git \
        curl \
        nano \
        vim \
        wget \
        unzip \
        build-essential \
        python3-pip \
        python3-venv \
        sqlite3 \
        tree \
    && rm -rf /var/lib/apt/lists/*

# Install global npm packages useful for PWA development
RUN npm install -g \
    live-server \
    http-server \
    pwa-builder \
    workbox-cli

# Set default shell to bash
SHELL ["/bin/bash", "-c"]

# Set working directory
WORKDIR /workspace

# Install Python packages useful for data processing
RUN pip3 install --upgrade pip && \
    pip3 install pandas sqlite3

# Expose common development ports
EXPOSE 8080 3000 5000

# Set environment variables
ENV NODE_ENV=development
