FROM mcr.microsoft.com/devcontainers/javascript-node:18

# Install MongoDB tools
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends mongodb-clients

WORKDIR /workspace