'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Layout } from '@/components/Layout';
import { useTheme } from '@/app/providers';

interface Question {
    question: string;
    options: string[];
}

interface Quiz {
    quizId: string;
    passingScore: number;
    passPoints: number;
    questions: Question[];
    lesson: { id: string; title: string; courseId: number; course: { id: number; title: string } };
}

interface Attempt {
    id: string;
    scorePercent: number;
    isPassed: boolean;
    createdAt: string;
}

export default function QuizPage() {
    const params = useParams();
    const router = useRouter();
    const lessonId = params.lessonId as string;
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [attempts, setAttempts] = useState<Attempt[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Quiz taking state
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<{
        scorePercent: number;
        passed: boolean;
        correctIndices: number[];
        pointsAwarded: number;
    } | null>(null);

    useEffect(() => {
        fetchQuiz();
    }, [lessonId]);

    async function fetchQuiz() {
        try {
            const token = localStorage.getItem('auth_token');
            if (!token) {
                setError('Please sign in to take the quiz');
                setLoading(false);
                return;
            }

            const res = await fetch(`/api/lessons/${lessonId}/quiz`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to load quiz');
            }

            const data = await res.json();
            setQuiz(data.quiz);
            setAttempts(data.attempts || []);
            setSelectedAnswers(new Array(data.quiz.questions.length).fill(-1));
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    function selectAnswer(questionIndex: number, optionIndex: number) {
        const newAnswers = [...selectedAnswers];
        newAnswers[questionIndex] = optionIndex;
        setSelectedAnswers(newAnswers);
    }

    async function submitQuiz() {
        if (!quiz) return;
        if (selectedAnswers.some(a => a === -1)) {
            alert('Please answer all questions before submitting');
            return;
        }

        setSubmitting(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/lessons/${lessonId}/quiz/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ answers: selectedAnswers }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit quiz');
            }

            const data = await res.json();
            setResult(data);
        } catch (err) {
            alert((err as Error).message);
        } finally {
            setSubmitting(false);
        }
    }

    function retryQuiz() {
        setResult(null);
        setSelectedAnswers(new Array(quiz!.questions.length).fill(-1));
        setCurrentQuestion(0);
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className={`w-12 h-12 border-2 rounded-full animate-spin ${isDark ? 'border-[#ffb000]/30 border-t-[#ffb000]' : 'border-amber-500/30 border-t-amber-500'}`} />
                </div>
            </Layout>
        );
    }

    if (error || !quiz) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <div className={`text-[48px] mb-4`}>📝</div>
                    <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {error || 'Quiz not found'}
                    </h2>
                    <Link href="/courses" className={`font-medium hover:underline ${isDark ? 'text-[#ffb000]' : 'text-amber-600'}`}>
                        ← Back to Courses
                    </Link>
                </div>
            </Layout>
        );
    }

    // Show result if quiz is completed
    if (result) {
        return (
            <Layout>
                <div className="max-w-2xl mx-auto py-8">
                    <div className={`rounded-3xl p-8 text-center border ${isDark
                        ? 'bg-[#12121a] border-[#2a2a3a]'
                        : 'bg-white border-gray-200 shadow-lg'
                        }`}>
                        <div className="text-[64px] mb-4">
                            {result.passed ? '🎉' : '😔'}
                        </div>
                        <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            {result.passed ? 'Congratulations!' : 'Not quite there'}
                        </h1>
                        <p className={`text-lg mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            You scored <span className={`font-bold ${result.passed ? (isDark ? 'text-[#ffb000]' : 'text-green-600') : 'text-red-500'}`}>
                                {result.scorePercent}%
                            </span>
                        </p>
                        <p className={`mb-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                            Passing score: {quiz.passingScore}%
                        </p>

                        {result.passed && result.pointsAwarded > 0 && (
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${isDark
                                ? 'bg-[#ffb000]/10 text-[#ffb000]'
                                : 'bg-green-100 text-green-700'
                                }`}>
                                ✨ +{result.pointsAwarded} points earned!
                            </div>
                        )}

                        <div className="flex gap-4 justify-center">
                            {!result.passed && (
                                <button
                                    onClick={retryQuiz}
                                    className={`px-6 py-3 rounded-xl font-semibold transition ${isDark
                                        ? 'bg-[#ffb000] text-black hover:bg-[#ffa000]'
                                        : 'bg-amber-500 text-white hover:bg-amber-600'
                                        }`}
                                >
                                    Try Again
                                </button>
                            )}
                            <Link
                                href={`/courses/${quiz.lesson.courseId}`}
                                className={`px-6 py-3 rounded-xl font-semibold transition ${isDark
                                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                    }`}
                            >
                                Back to Course
                            </Link>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    const question = quiz.questions[currentQuestion];
    const answeredCount = selectedAnswers.filter(a => a !== -1).length;
    const allAnswered = answeredCount === quiz.questions.length;

    return (
        <Layout>
            <div className="max-w-3xl mx-auto py-6">
                {/* Header */}
                <div className="mb-6">
                    <Link
                        href={`/courses/${quiz.lesson.courseId}`}
                        className={`text-sm mb-2 hover:underline inline-block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                    >
                        ← Back to {quiz.lesson.course.title}
                    </Link>
                    <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        📝 Quiz: {quiz.lesson.title}
                    </h1>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        Answer all {quiz.questions.length} questions · Pass: {quiz.passingScore}% · Earn: {quiz.passPoints} points
                    </p>
                </div>

                {/* Progress bar */}
                <div className="mb-8">
                    <div className="flex justify-between text-sm mb-2">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            Question {currentQuestion + 1} of {quiz.questions.length}
                        </span>
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            {answeredCount} answered
                        </span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#2a2a3a]' : 'bg-gray-200'}`}>
                        <div
                            className={`h-full transition-all ${isDark ? 'bg-[#ffb000]' : 'bg-amber-500'}`}
                            style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Question Card */}
                <div className={`rounded-3xl p-6 border mb-6 ${isDark
                    ? 'bg-[#12121a] border-[#2a2a3a]'
                    : 'bg-white border-gray-200 shadow-lg'
                    }`}>
                    <h2 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {question.question}
                    </h2>

                    <div className="space-y-3">
                        {question.options.map((option, optIndex) => {
                            const isSelected = selectedAnswers[currentQuestion] === optIndex;
                            return (
                                <button
                                    key={optIndex}
                                    onClick={() => selectAnswer(currentQuestion, optIndex)}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition ${isSelected
                                        ? isDark
                                            ? 'border-[#ffb000] bg-[#ffb000]/10'
                                            : 'border-amber-500 bg-amber-50'
                                        : isDark
                                            ? 'border-[#2a2a3a] hover:border-[#3a3a4a] bg-[#1a1a24]'
                                            : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${isSelected
                                            ? isDark
                                                ? 'bg-[#ffb000] text-black'
                                                : 'bg-amber-500 text-white'
                                            : isDark
                                                ? 'bg-[#2a2a3a] text-gray-400'
                                                : 'bg-gray-200 text-gray-600'
                                            }`}>
                                            {String.fromCharCode(65 + optIndex)}
                                        </span>
                                        <span className={isDark ? 'text-white' : 'text-gray-900'}>
                                            {option}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between items-center">
                    <button
                        onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                        disabled={currentQuestion === 0}
                        className={`px-4 py-2 rounded-xl font-medium transition ${currentQuestion === 0
                            ? 'opacity-50 cursor-not-allowed'
                            : isDark ? 'hover:bg-[#1a1a24]' : 'hover:bg-gray-100'
                            } ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                        ← Previous
                    </button>

                    <div className="flex gap-2">
                        {quiz.questions.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setCurrentQuestion(idx)}
                                className={`w-8 h-8 rounded-full text-sm font-medium transition ${currentQuestion === idx
                                    ? isDark ? 'bg-[#ffb000] text-black' : 'bg-amber-500 text-white'
                                    : selectedAnswers[idx] !== -1
                                        ? isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                                        : isDark ? 'bg-[#2a2a3a] text-gray-400' : 'bg-gray-200 text-gray-600'
                                    }`}
                            >
                                {idx + 1}
                            </button>
                        ))}
                    </div>

                    {currentQuestion < quiz.questions.length - 1 ? (
                        <button
                            onClick={() => setCurrentQuestion(currentQuestion + 1)}
                            className={`px-4 py-2 rounded-xl font-medium transition ${isDark
                                ? 'bg-[#ffb000] text-black hover:bg-[#ffa000]'
                                : 'bg-amber-500 text-white hover:bg-amber-600'
                                }`}
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            onClick={submitQuiz}
                            disabled={!allAnswered || submitting}
                            className={`px-6 py-2 rounded-xl font-semibold transition ${allAnswered
                                ? isDark
                                    ? 'bg-green-600 text-white hover:bg-green-500'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-400 text-white cursor-not-allowed'
                                }`}
                        >
                            {submitting ? 'Submitting...' : 'Submit Quiz'}
                        </button>
                    )}
                </div>

                {/* Previous attempts */}
                {attempts.length > 0 && (
                    <div className={`mt-8 p-4 rounded-2xl border ${isDark ? 'bg-[#1a1a24] border-[#2a2a3a]' : 'bg-gray-50 border-gray-200'}`}>
                        <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            Previous Attempts
                        </h3>
                        <div className="space-y-2">
                            {attempts.map((attempt, idx) => (
                                <div key={attempt.id} className={`flex justify-between text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                    <span>Attempt {attempts.length - idx}</span>
                                    <span className={attempt.isPassed ? (isDark ? 'text-green-400' : 'text-green-600') : 'text-red-500'}>
                                        {attempt.scorePercent}% {attempt.isPassed ? '✓' : '✗'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
