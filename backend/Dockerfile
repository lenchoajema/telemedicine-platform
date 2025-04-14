FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the API port
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]