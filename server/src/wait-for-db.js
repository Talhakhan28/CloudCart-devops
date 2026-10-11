require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const retryLimit = Number(process.env.DATABASE_CONNECT_RETRIES || 30);
const retryDelayMs = Number(process.env.DATABASE_CONNECT_RETRY_DELAY_MS || 2000);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function start() {
  for (let attempt = 1; attempt <= retryLimit; attempt += 1) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
      console.log("Database connection established");
      require("./index");
      return;
    } catch (error) {
      await prisma.$disconnect().catch(() => {});
      console.error(
        `Database connection attempt ${attempt}/${retryLimit} failed; retrying`,
      );
      if (attempt < retryLimit) await wait(retryDelayMs);
    }
  }

  console.error("Database did not become available before the retry limit");
  process.exit(1);
}

start();
