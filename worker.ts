import { worker, scheduler } from "./lib/queue"
import { prisma } from "./lib/prisma"

// This file is the entry point for the worker process
// It should be run separately from the web server

console.log("Starting subtitle generation worker...")

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("Worker shutting down...")
  await worker.close()
  await scheduler.close()
  await prisma.$disconnect()
  process.exit(0)
})

process.on("SIGINT", async () => {
  console.log("Worker shutting down...")
  await worker.close()
  await scheduler.close()
  await prisma.$disconnect()
  process.exit(0)
})

// Keep the process running
process.stdin.resume()

