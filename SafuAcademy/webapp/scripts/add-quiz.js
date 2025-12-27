// Script to list courses and update course 0 thumbnail
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
    // First list all courses
    console.log('Existing courses:');
    const courses = await prisma.course.findMany({
        orderBy: { id: 'asc' },
        select: { id: true, title: true }
    });
    courses.forEach(c => console.log(`  ID ${c.id}: ${c.title}`));

    // Try to update course 0
    console.log('\nAttempting to update course ID 0...');
    try {
        const course = await prisma.course.update({
            where: { id: 0 },
            data: { thumbnailUrl: 'https://i.ibb.co/zh0wPqY0/Smart-contracts-thumb.png' }
        });
        console.log(`✓ Course 0 (${course.title}): thumbnail updated`);
    } catch (err) {
        console.log(`✗ Course 0 not found. The lowest ID in your database is ${courses[0]?.id || 'none'}`);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
