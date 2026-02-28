const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const result = await prisma.$queryRawUnsafe(`SELECT column_name FROM information_schema.columns WHERE table_name = 'Campaign'`);
    console.log(result.map(r => r.column_name).join(', '));
}

main().finally(() => prisma.$disconnect());
