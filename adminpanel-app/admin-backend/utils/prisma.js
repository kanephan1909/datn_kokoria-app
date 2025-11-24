const { PrismaClient } = require('@prisma/client');

// Prisma 7: Connection URL được đọc từ prisma.config.ts
// Không cần truyền vào constructor nữa
const prisma = new PrismaClient();

module.exports = prisma;

