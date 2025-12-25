const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.course.count();
        console.log('Total courses:', count);
        const published = await prisma.course.count({ where: { isPublished: true } });
        console.log('Published courses:', published);
        const first = await prisma.course.findFirst();
        console.log('First course:', first ? first.title : 'None');
    } catch (err) {
        console.error('DB Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
