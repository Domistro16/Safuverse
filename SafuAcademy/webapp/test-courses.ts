import { PrismaClient } from '@prisma/client';
import { CourseService } from './lib/services/course.service.ts';
import { RelayerService } from './lib/services/relayer.service.ts';

const prisma = new PrismaClient();
const relayerService = new RelayerService(prisma);
const courseService = new CourseService(prisma, relayerService);

async function test() {
    try {
        console.log('Fetching courses...');
        const courses = await courseService.getAllCourses();
        console.log('Courses found:', courses.length);
        console.log(JSON.stringify(courses, null, 2));
    } catch (error) {
        console.error('Error fetching courses:', error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
