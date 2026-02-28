const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const result = await prisma.campaign.findFirst();
    console.log(Object.keys(result).join(', '));
}

main().finally(() => prisma.$disconnect());
