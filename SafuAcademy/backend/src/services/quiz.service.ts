import { PrismaClient } from '@prisma/client';

interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number; // index of correct option
    points: number;
}

export class QuizService {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async getQuizByLessonId(lessonId: number) {
        return this.prisma.quiz.findUnique({
            where: { lessonId },
            include: {
                lesson: {
                    select: {
                        id: true,
                        title: true,
                        courseId: true,
                    },
                },
            },
        });
    }

    async getQuizQuestions(lessonId: number): Promise<{
        quizId: number;
        lessonId: number;
        passingScore: number;
        questions: Array<{
            id: string;
            question: string;
            options: string[];
            points: number;
        }>;
    } | null> {
        const quiz = await this.getQuizByLessonId(lessonId);
        if (!quiz) return null;

        const questions = quiz.questions as QuizQuestion[];

        // Return questions WITHOUT correct answers
        return {
            quizId: quiz.id,
            lessonId: quiz.lessonId,
            passingScore: quiz.passingScore,
            questions: questions.map(q => ({
                id: q.id,
                question: q.question,
                options: q.options,
                points: q.points,
            })),
        };
    }

    async submitQuizAnswers(
        userId: string,
        lessonId: number,
        answers: Record<string, number> // questionId -> selected option index
    ): Promise<{
        success: boolean;
        score: number;
        passed: boolean;
        correctAnswers: Record<string, number>;
        error?: string;
    }> {
        const quiz = await this.getQuizByLessonId(lessonId);
        if (!quiz) {
            return {
                success: false,
                score: 0,
                passed: false,
                correctAnswers: {},
                error: 'Quiz not found',
            };
        }

        // Check if user is enrolled
        const enrollment = await this.prisma.userCourse.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId: quiz.lesson.courseId,
                },
            },
        });

        if (!enrollment) {
            return {
                success: false,
                score: 0,
                passed: false,
                correctAnswers: {},
                error: 'User not enrolled in this course',
            };
        }

        const questions = quiz.questions as QuizQuestion[];
        let totalPoints = 0;
        let earnedPoints = 0;
        const correctAnswers: Record<string, number> = {};

        // Grade the quiz
        for (const question of questions) {
            totalPoints += question.points;
            correctAnswers[question.id] = question.correctAnswer;

            if (answers[question.id] === question.correctAnswer) {
                earnedPoints += question.points;
            }
        }

        const score = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
        const passed = score >= quiz.passingScore;

        // Record the attempt
        await this.prisma.quizAttempt.create({
            data: {
                userId,
                quizId: quiz.id,
                score,
                passed,
                answers,
            },
        });

        return {
            success: true,
            score,
            passed,
            correctAnswers,
        };
    }

    async getUserQuizAttempts(userId: string, lessonId: number) {
        const quiz = await this.getQuizByLessonId(lessonId);
        if (!quiz) return [];

        return this.prisma.quizAttempt.findMany({
            where: {
                userId,
                quizId: quiz.id,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async hasUserPassedQuiz(userId: string, lessonId: number): Promise<boolean> {
        const quiz = await this.getQuizByLessonId(lessonId);
        if (!quiz) return false;

        const passedAttempt = await this.prisma.quizAttempt.findFirst({
            where: {
                userId,
                quizId: quiz.id,
                passed: true,
            },
        });

        return !!passedAttempt;
    }
}
