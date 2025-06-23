FROM node:22-alpine
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project
COPY . .

# Set the working directory to worker
WORKDIR /app/worker

# Run the worker
CMD ["node", "index.js"]