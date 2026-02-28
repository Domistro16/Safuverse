const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const campaigns = await prisma.campaign.findMany({ select: { id: true, title: true, status: true, isPublished: true, createdAt: true } });
    console.log(campaigns);
}

main().finally(() => prisma.$disconnect());
