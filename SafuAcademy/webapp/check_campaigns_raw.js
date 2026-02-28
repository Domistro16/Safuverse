const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const campaigns = await prisma.$queryRaw`
    SELECT "id", "title", "status"
    FROM "Campaign"
    ORDER BY "createdAt" DESC
  `;
    console.log(campaigns);
}

main().finally(() => prisma.$disconnect());
