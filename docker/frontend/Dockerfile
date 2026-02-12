FROM node:20-bookworm-slim

# Set working directory
WORKDIR /app

# Copy package files first for better layer caching
COPY frontend/package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY frontend/ .

EXPOSE 3000

# Start React dev server
CMD ["npm", "start"]
