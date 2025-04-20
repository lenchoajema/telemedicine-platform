FROM mcr.microsoft.com/devcontainers/javascript-node:18

# Install MongoDB tools and additional development utilities
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    mongodb-clients \
    redis-tools \
    curl \
    vim \
    htop \
    git-lfs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install global npm packages
RUN npm install -g nodemon concurrently npm-check-updates

# Set up workspace
WORKDIR /workspace

# Configure Git to handle line endings correctly
RUN git config --global core.autocrlf input

# Set environment variables
ENV NODE_ENV=development
ENV PATH=/workspace/node_modules/.bin:$PATH

# Expose ports (backend API, frontend dev server, MongoDB)
EXPOSE 5000 5173 27017

# Default command to keep the container running
CMD ["sleep", "infinity"]