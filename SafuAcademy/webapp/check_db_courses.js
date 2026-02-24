const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const courses = await prisma.course.findMany({
        select: { id: true, title: true }
    });
    console.log('Courses in DB:', courses);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
