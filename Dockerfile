FROM node:20-alpine

WORKDIR /app

# Install necessary tools for SSL
RUN apk --no-cache add ca-certificates

# Copy package.json and package-lock.json first for better layer caching
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy SSL certificates
COPY certs /app/certs/

# Ensure the startup script is executable
COPY startup.sh /app/
RUN chmod +x /app/startup.sh

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port the app runs on
EXPOSE 8080

# Start the application using our startup script
CMD ["./startup.sh"]