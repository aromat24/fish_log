# Fish Log Dev Container
FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

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
    && rm -rf /var/lib/apt/lists/*

# Set default shell to bash
SHELL ["/bin/bash", "-c"]

# Set working directory
WORKDIR /workspace

# (Optional) Install global npm packages here if needed
# RUN npm install -g serve

# (Optional) Install Python packages globally if needed
# RUN pip3 install --upgrade pip

# (Optional) Expose ports (e.g., 8080 for local server)
EXPOSE 8080
