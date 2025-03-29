# Use node:20-alpine as the base
FROM node:20-alpine

# Install necessary tools: git, build tools (for native deps), python3, and ffmpeg
RUN apk add --no-cache git build-base python3 ffmpeg

# Set working directory
WORKDIR /app

# Install bun globally (as in your example)
RUN npm install bun -g

# Copy dependency files
COPY package.json bun.lockb ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application code, including prisma schema
COPY . .

# Generate Prisma Client for the correct target inside the container
RUN bunx prisma generate

# Build the Next.js application for production
RUN bun run build

# Expose the port Next.js runs on
EXPOSE 3000

# Set the production command
# Assumes you have a "start" script in package.json like "next start"
CMD ["bun", "start"]
