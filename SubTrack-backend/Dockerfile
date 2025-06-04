# Simple Backend Dockerfile - No bcrypt compilation needed
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (no native compilation needed)
RUN npm ci

# Install nodemon globally
RUN npm install -g nodemon

# Copy source code
COPY . .

# Create uploads directory
RUN mkdir -p uploads/avatars

# Expose port
EXPOSE 3000

# Start with nodemon
CMD ["nodemon", "src/index.js"]