# Use Node LTS
FROM node:18

# Create app directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the backend
COPY . .

# Expose your backend port
EXPOSE 8080

# Start the server
CMD ["npm", "start"]
