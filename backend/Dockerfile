FROM node:18.17.1-slim-bullseye

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the API port
EXPOSE 5000

# Start the server from the src directory
CMD ["node", "src/server.js"]