FROM node:18-alpine

# Install curl for health checks
RUN apk --no-cache add curl

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install
RUN npm install path-to-regexp@6.2.1

# Copy the rest of the application
COPY . .

# Expose the API port
EXPOSE 5000

# Start the server
CMD ["node", "src/server.js"]
