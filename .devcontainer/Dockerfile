# Fish Log Dev Container
FROM node:18-bullseye

# Set working directory
WORKDIR /workspace

# Install additional tools
RUN apt-get update && apt-get install -y \
    git \
    nano \
    vim \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd --gid 1000 vscode \
    && useradd --uid 1000 --gid vscode --shell /bin/bash --create-home vscode

# Change ownership of workspace
RUN chown -R vscode:vscode /workspace

# Switch to non-root user
USER vscode

# Expose port for the app
EXPOSE 8080
