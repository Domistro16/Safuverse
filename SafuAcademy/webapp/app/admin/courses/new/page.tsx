'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

// Contract ABI for createCourse - matches Level3Course.sol
const COURSE_ABI = [
    {
        name: 'createCourse',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_title', type: 'string' },
            { name: '_description', type: 'string' },
            { name: '_longDescription', type: 'string' },
            { name: '_instructor', type: 'string' },
            { name: '_objectives', type: 'string[]' },
            { name: '_prerequisites', type: 'string[]' },
            { name: '_category', type: 'string' },
            { name: '_level', type: 'string' },
            { name: '_thumbnailUrl', type: 'string' },
            { name: '_duration', type: 'string' },
            { name: '_totalLessons', type: 'uint256' },
            { name: '_minPointsToAccess', type: 'uint256' },
            { name: '_enrollmentCost', type: 'uint256' },
        ],
        outputs: [{ type: 'uint256' }],
    },
] as const;

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LEVEL3_COURSE_ADDRESS as `0x${string}`;

// Level-specific defaults
const LEVEL_DEFAULTS = {
    BEGINNER: { completionPoints: 50, minPointsToAccess: 0, enrollmentCost: 0 },
    INTERMEDIATE: { completionPoints: 100, minPointsToAccess: 0, enrollmentCost: 0 },
    ADVANCED: { completionPoints: 150, minPointsToAccess: 100, enrollmentCost: 50 },
};

// Available languages for video uploads
const AVAILABLE_LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'zh', label: '中文 (Chinese)' },
    { code: 'es', label: 'Español (Spanish)' },
    { code: 'fr', label: 'Français (French)' },
    { code: 'de', label: 'Deutsch (German)' },
    { code: 'pt', label: 'Português (Portuguese)' },
    { code: 'ja', label: '日本語 (Japanese)' },
    { code: 'ko', label: '한국어 (Korean)' },
];

// Video file with language info
interface VideoUpload {
    file: File;
    language: string;
    label: string;
}

// Quiz question type
interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
}

// Quiz data for a lesson
interface QuizData {
    enabled: boolean;
    questions: QuizQuestion[];
    passingScore: number;
    passPoints: number;
}

// Lesson type for the form
interface LessonFormData {
    title: string;
    description: string;
    videos: VideoUpload[];
    quiz: QuizData;
}

// Create empty quiz
const createEmptyQuiz = (): QuizData => ({
    enabled: false,
    questions: [],
    passingScore: 70,
    passPoints: 20,
});

// Create empty question
const createEmptyQuestion = (): QuizQuestion => ({
    question: '',
    options: ['', '', '', ''],
    correctIndex: 0,
});

export default function CreateCoursePage() {
    const router = useRouter();
    const { address } = useAccount();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'form' | 'signing' | 'uploading' | 'saving'>('form');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        longDescription: '',
        instructor: '',
        category: 'DeFi',
        level: 'BEGINNER' as keyof typeof LEVEL_DEFAULTS,
        thumbnailUrl: '',
        duration: '',
        objectives: [''],
        prerequisites: [''],
        completionPoints: 50,
        minPointsToAccess: 0,
        enrollmentCost: 0,
    });

    // Lessons state
    const [lessons, setLessons] = useState<LessonFormData[]>([]);
    const videoInputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());

    // Expanded lesson sections
    const [expandedLessons, setExpandedLessons] = useState<Set<number>>(new Set());

    const { writeContract, data: hash } = useWriteContract();
    const { isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash });

    const toggleLessonExpanded = (index: number) => {
        setExpandedLessons(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        // If level changes, update default points values
        if (name === 'level' && value in LEVEL_DEFAULTS) {
            const defaults = LEVEL_DEFAULTS[value as keyof typeof LEVEL_DEFAULTS];
            setFormData((prev) => ({
                ...prev,
                level: value as keyof typeof LEVEL_DEFAULTS,
                completionPoints: defaults.completionPoints,
                minPointsToAccess: defaults.minPointsToAccess,
                enrollmentCost: defaults.enrollmentCost,
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleArrayChange = (field: 'objectives' | 'prerequisites', index: number, value: string) => {
        setFormData((prev) => {
            const arr = [...prev[field]];
            arr[index] = value;
            return { ...prev, [field]: arr };
        });
    };

    const addArrayItem = (field: 'objectives' | 'prerequisites') => {
        setFormData((prev) => ({
            ...prev,
            [field]: [...prev[field], ''],
        }));
    };

    const removeArrayItem = (field: 'objectives' | 'prerequisites', index: number) => {
        setFormData((prev) => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index),
        }));
    };

    // Lesson handlers
    const addLesson = () => {
        const newIndex = lessons.length;
        setLessons((prev) => [
            ...prev,
            { title: '', description: '', videos: [], quiz: createEmptyQuiz() },
        ]);
        // Auto-expand new lesson
        setExpandedLessons(prev => new Set(prev).add(newIndex));
    };

    const removeLesson = (index: number) => {
        setLessons((prev) => prev.filter((_, i) => i !== index));
        setExpandedLessons(prev => {
            const next = new Set<number>();
            prev.forEach(i => {
                if (i < index) next.add(i);
                else if (i > index) next.add(i - 1);
            });
            return next;
        });
    };

    const updateLessonField = (index: number, field: 'title' | 'description', value: string) => {
        setLessons((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const moveLesson = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= lessons.length) return;

        setLessons((prev) => {
            const updated = [...prev];
            [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
            return updated;
        });

        // Update expanded state
        setExpandedLessons(prev => {
            const next = new Set<number>();
            prev.forEach(i => {
                if (i === index) next.add(newIndex);
                else if (i === newIndex) next.add(index);
                else next.add(i);
            });
            return next;
        });
    };

    // Video handlers
    const addVideoToLesson = (lessonIndex: number, language: string) => {
        const inputKey = `${lessonIndex}_${language}`;
        const input = videoInputRefs.current.get(inputKey);
        if (input) {
            input.click();
        }
    };

    const handleVideoChange = (lessonIndex: number, language: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const langInfo = AVAILABLE_LANGUAGES.find(l => l.code === language);
        if (!langInfo) return;

        setLessons((prev) => {
            const updated = [...prev];
            const lesson = updated[lessonIndex];
            const existingIndex = lesson.videos.findIndex(v => v.language === language);

            const newVideo: VideoUpload = { file, language, label: langInfo.label };

            if (existingIndex >= 0) {
                lesson.videos[existingIndex] = newVideo;
            } else {
                lesson.videos.push(newVideo);
            }
            return updated;
        });
        e.target.value = '';
    };

    const removeVideoFromLesson = (lessonIndex: number, language: string) => {
        setLessons((prev) => {
            const updated = [...prev];
            updated[lessonIndex] = {
                ...updated[lessonIndex],
                videos: updated[lessonIndex].videos.filter(v => v.language !== language),
            };
            return updated;
        });
    };

    const getAvailableLanguagesForLesson = (lessonIndex: number) => {
        const usedLanguages = lessons[lessonIndex]?.videos.map(v => v.language) || [];
        return AVAILABLE_LANGUAGES.filter(l => !usedLanguages.includes(l.code));
    };

    // Quiz handlers
    const toggleQuiz = (lessonIndex: number) => {
        setLessons((prev) => {
            const updated = [...prev];
            const lesson = updated[lessonIndex];
            const quiz = lesson.quiz;
            if (!quiz.enabled) {
                // Enable quiz and add first question if empty
                updated[lessonIndex] = {
                    ...lesson,
                    quiz: {
                        ...quiz,
                        enabled: true,
                        questions: quiz.questions.length === 0 ? [createEmptyQuestion()] : quiz.questions,
                    },
                };
            } else {
                updated[lessonIndex] = {
                    ...lesson,
                    quiz: { ...quiz, enabled: false },
                };
            }
            return updated;
        });
    };

    const updateQuizSettings = (lessonIndex: number, field: 'passingScore' | 'passPoints', value: number) => {
        setLessons((prev) => {
            const updated = [...prev];
            const lesson = updated[lessonIndex];
            updated[lessonIndex] = {
                ...lesson,
                quiz: { ...lesson.quiz, [field]: value },
            };
            return updated;
        });
    };

    const addQuizQuestion = (lessonIndex: number) => {
        setLessons((prev) => {
            const updated = [...prev];
            updated[lessonIndex] = {
                ...updated[lessonIndex],
                quiz: {
                    ...updated[lessonIndex].quiz,
                    questions: [...updated[lessonIndex].quiz.questions, createEmptyQuestion()],
                },
            };
            return updated;
        });
    };

    const removeQuizQuestion = (lessonIndex: number, questionIndex: number) => {
        setLessons((prev) => {
            const updated = [...prev];
            updated[lessonIndex] = {
                ...updated[lessonIndex],
                quiz: {
                    ...updated[lessonIndex].quiz,
                    questions: updated[lessonIndex].quiz.questions.filter((_, i) => i !== questionIndex),
                },
            };
            return updated;
        });
    };

    const updateQuestion = (lessonIndex: number, questionIndex: number, field: 'question' | 'correctIndex', value: string | number) => {
        setLessons((prev) => {
            const updated = [...prev];
            const questions = [...updated[lessonIndex].quiz.questions];
            questions[questionIndex] = {
                ...questions[questionIndex],
                [field]: value,
            };
            updated[lessonIndex] = {
                ...updated[lessonIndex],
                quiz: {
                    ...updated[lessonIndex].quiz,
                    questions,
                },
            };
            return updated;
        });
    };

    const updateQuestionOption = (lessonIndex: number, questionIndex: number, optionIndex: number, value: string) => {
        setLessons((prev) => {
            const updated = [...prev];
            const questions = [...updated[lessonIndex].quiz.questions];
            const options = [...questions[questionIndex].options];
            options[optionIndex] = value;
            questions[questionIndex] = {
                ...questions[questionIndex],
                options,
            };
            updated[lessonIndex] = {
                ...updated[lessonIndex],
                quiz: {
                    ...updated[lessonIndex].quiz,
                    questions,
                },
            };
            return updated;
        });
    };

    // Validation
    const validateLessons = (): boolean => {
        for (let i = 0; i < lessons.length; i++) {
            if (!lessons[i].title.trim()) {
                alert(`Lesson ${i + 1} is missing a title`);
                return false;
            }
            // Validate quiz if enabled
            const quiz = lessons[i].quiz;
            if (quiz.enabled) {
                if (quiz.questions.length === 0) {
                    alert(`Lesson ${i + 1} has quiz enabled but no questions`);
                    return false;
                }
                for (let q = 0; q < quiz.questions.length; q++) {
                    const question = quiz.questions[q];
                    if (!question.question.trim()) {
                        alert(`Lesson ${i + 1}, Question ${q + 1} is missing question text`);
                        return false;
                    }
                    const filledOptions = question.options.filter(o => o.trim());
                    if (filledOptions.length < 2) {
                        alert(`Lesson ${i + 1}, Question ${q + 1} needs at least 2 options`);
                        return false;
                    }
                }
            }
        }
        return true;
    };

    // State to track the created course ID from backend
    const [createdCourseId, setCreatedCourseId] = useState<number | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!address) {
            alert('Please connect your wallet');
            return;
        }

        if (!validateLessons()) {
            return;
        }

        setLoading(true);
        setStep('uploading');

        try {
            // STEP 1: Upload lessons and course data to backend FIRST
            const courseId = await uploadToBackend();
            if (!courseId) {
                throw new Error('Backend upload failed');
            }
            setCreatedCourseId(courseId);

            // STEP 2: Only execute on-chain transaction if backend upload succeeded
            setStep('signing');
            const objectives = formData.objectives.filter((o) => o.trim());
            const prerequisites = formData.prerequisites.filter((p) => p.trim());

            writeContract({
                address: CONTRACT_ADDRESS,
                abi: COURSE_ABI,
                functionName: 'createCourse',
                args: [
                    formData.title,
                    formData.description,
                    formData.longDescription,
                    formData.instructor,
                    objectives,
                    prerequisites,
                    formData.category,
                    formData.level,
                    formData.thumbnailUrl,
                    formData.duration,
                    BigInt(lessons.length),
                    BigInt(formData.minPointsToAccess),
                    BigInt(formData.enrollmentCost),
                ],
            });
        } catch (err) {
            console.error('Course creation failed:', err);
            alert(`Failed to create course: ${(err as Error).message}`);
            setLoading(false);
            setStep('form');
        }
    }

    // After successful on-chain transaction, link the txHash to the backend course
    if (txSuccess && hash && step === 'signing' && createdCourseId) {
        setStep('saving');
        linkTxHashToBackend(createdCourseId, hash);
    }

    async function uploadToBackend(): Promise<number | null> {
        try {
            const token = localStorage.getItem('auth_token');
            const submitData = new FormData();

            const courseData = {
                ...formData,
                objectives: formData.objectives.filter((o) => o.trim()),
                prerequisites: formData.prerequisites.filter((p) => p.trim()),
            };
            submitData.append('courseData', JSON.stringify(courseData));

            // Add lessons data with quiz info
            const lessonsData = lessons.map((lesson, index) => ({
                title: lesson.title,
                description: lesson.description || undefined,
                orderIndex: index,
                videos: lesson.videos.map((v, vIndex) => ({
                    language: v.language,
                    label: v.label,
                    orderIndex: vIndex,
                })),
                quiz: lesson.quiz.enabled ? {
                    questions: lesson.quiz.questions.map(q => ({
                        question: q.question,
                        options: q.options.filter(o => o.trim()),
                        correctIndex: q.correctIndex,
                    })),
                    passingScore: lesson.quiz.passingScore,
                    passPoints: lesson.quiz.passPoints,
                } : undefined,
            }));
            submitData.append('lessons', JSON.stringify(lessonsData));

            // Add video files
            lessons.forEach((lesson, lessonIndex) => {
                lesson.videos.forEach((video) => {
                    submitData.append(`video_${lessonIndex}_${video.language}`, video.file);
                });
            });

            const res = await fetch('/api/admin/courses/create-with-lessons', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: submitData,
            });

            console.log('API response status:', res.status);

            if (!res.ok) {
                const errorData = await res.json();
                console.error('API error response:', errorData);
                throw new Error(errorData.error || 'Failed to upload to backend');
            }

            const data = await res.json();
            console.log('API success response:', data);

            if (!data.course || !data.course.id) {
                console.error('Invalid response format. Expected course.id but got:', data);
                throw new Error('Invalid API response: missing course.id');
            }

            return data.course.id;
        } catch (err) {
            console.error('Backend upload failed:', err);
            throw err;
        }
    }

    async function linkTxHashToBackend(courseId: number, txHash: string) {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/admin/courses/${courseId}/link-tx`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ onChainTxHash: txHash }),
            });

            if (!res.ok) {
                console.error('Failed to link transaction hash to course');
            }

            alert('Course created successfully with all lessons and quizzes!');
            router.push(`/admin/courses/${courseId}`);
        } catch (err) {
            console.error('Failed to link txHash:', err);
            // Course is still created, just without the txHash linked
            alert('Course created, but failed to link transaction hash. You can update it later.');
            router.push(`/admin/courses/${courseId}`);
        }
    }

    return (
        <div className="max-w-4xl">
            <h1 className="text-3xl font-bold text-white mb-8">Create New Course</h1>

            {step !== 'form' && (
                <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mb-6">
                    <p className="text-blue-400">
                        {step === 'uploading' && '⏳ Step 1/3: Uploading lesson videos to backend...'}
                        {step === 'signing' && '⏳ Step 2/3: Please confirm the transaction in MetaMask...'}
                        {step === 'saving' && '⏳ Step 3/3: Linking transaction to course...'}
                    </p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-white">Basic Information</h2>

                    <div>
                        <label className="block text-gray-400 mb-2">Title *</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} required
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
                    </div>

                    <div>
                        <label className="block text-gray-400 mb-2">Short Description *</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} required rows={2}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
                    </div>

                    <div>
                        <label className="block text-gray-400 mb-2">Long Description</label>
                        <textarea name="longDescription" value={formData.longDescription} onChange={handleChange} rows={4}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-400 mb-2">Instructor</label>
                            <input type="text" name="instructor" value={formData.instructor} onChange={handleChange}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2">Duration</label>
                            <input type="text" name="duration" value={formData.duration} onChange={handleChange} placeholder="e.g. 2 hours"
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-400 mb-2">Category</label>
                            <select name="category" value={formData.category} onChange={handleChange}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                                <option value="DeFi">DeFi</option>
                                <option value="NFTs">NFTs</option>
                                <option value="Security">Security</option>
                                <option value="Trading">Trading</option>
                                <option value="Development">Development</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2">Level</label>
                            <select name="level" value={formData.level} onChange={handleChange}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500">
                                <option value="BEGINNER">Beginner</option>
                                <option value="INTERMEDIATE">Intermediate</option>
                                <option value="ADVANCED">Advanced</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-400 mb-2">Thumbnail URL</label>
                        <input type="url" name="thumbnailUrl" value={formData.thumbnailUrl} onChange={handleChange}
                            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
                    </div>
                </div>

                {/* Points Configuration */}
                <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-white">Points Configuration</h2>
                    {formData.level === 'ADVANCED' && (
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                            <p className="text-yellow-400 text-sm">⚡ Advanced courses require users to have minimum points and may deduct points on enrollment.</p>
                        </div>
                    )}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-gray-400 mb-2">Completion Points</label>
                            <input type="number" name="completionPoints" value={formData.completionPoints} onChange={handleChange} min="0"
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
                            <p className="text-gray-500 text-xs mt-1">Awarded on completion</p>
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2">Min Points to Access</label>
                            <input type="number" name="minPointsToAccess" value={formData.minPointsToAccess} onChange={handleChange} min="0"
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
                            <p className="text-gray-500 text-xs mt-1">Required to enroll</p>
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2">Enrollment Cost</label>
                            <input type="number" name="enrollmentCost" value={formData.enrollmentCost} onChange={handleChange} min="0"
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
                            <p className="text-gray-500 text-xs mt-1">Deducted on enrollment</p>
                        </div>
                    </div>
                </div>

                {/* Objectives */}
                <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-white">Learning Objectives</h2>
                    {formData.objectives.map((obj, index) => (
                        <div key={index} className="flex gap-2">
                            <input type="text" value={obj} onChange={(e) => handleArrayChange('objectives', index, e.target.value)} placeholder={`Objective ${index + 1}`}
                                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
                            <button type="button" onClick={() => removeArrayItem('objectives', index)} className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30">✕</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => addArrayItem('objectives')} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600">+ Add Objective</button>
                </div>

                {/* Prerequisites */}
                <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-white">Prerequisites</h2>
                    {formData.prerequisites.map((prereq, index) => (
                        <div key={index} className="flex gap-2">
                            <input type="text" value={prereq} onChange={(e) => handleArrayChange('prerequisites', index, e.target.value)} placeholder={`Prerequisite ${index + 1}`}
                                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
                            <button type="button" onClick={() => removeArrayItem('prerequisites', index)} className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30">✕</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => addArrayItem('prerequisites')} className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600">+ Add Prerequisite</button>
                </div>

                {/* Lessons Section */}
                <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold text-white">Lessons</h2>
                        <span className="text-gray-400 text-sm">{lessons.length} lesson{lessons.length !== 1 ? 's' : ''}</span>
                    </div>

                    {lessons.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                            <p>No lessons added yet.</p>
                            <p className="text-sm mt-1">Add lessons with videos and quizzes.</p>
                        </div>
                    )}

                    {lessons.map((lesson, index) => (
                        <div key={index} className="bg-gray-700/50 rounded-lg overflow-hidden">
                            {/* Lesson Header */}
                            <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-700/70" onClick={() => toggleLessonExpanded(index)}>
                                <div className="flex items-center gap-3">
                                    <span className="text-gray-300 font-medium">
                                        {expandedLessons.has(index) ? '▼' : '▶'} Lesson {index + 1}
                                        {lesson.title && `: ${lesson.title}`}
                                    </span>
                                    {lesson.quiz.enabled && <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded">📝 Quiz</span>}
                                    {lesson.videos.length > 0 && <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded">🎬 {lesson.videos.length} video{lesson.videos.length > 1 ? 's' : ''}</span>}
                                </div>
                                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                    <button type="button" onClick={() => moveLesson(index, 'up')} disabled={index === 0} className="px-2 py-1 bg-gray-600 text-gray-300 rounded disabled:opacity-30 hover:bg-gray-500">↑</button>
                                    <button type="button" onClick={() => moveLesson(index, 'down')} disabled={index === lessons.length - 1} className="px-2 py-1 bg-gray-600 text-gray-300 rounded disabled:opacity-30 hover:bg-gray-500">↓</button>
                                    <button type="button" onClick={() => removeLesson(index)} className="px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30">✕</button>
                                </div>
                            </div>

                            {/* Lesson Content (Expanded) */}
                            {expandedLessons.has(index) && (
                                <div className="p-4 pt-0 space-y-4 border-t border-gray-600/50">
                                    {/* Title & Description */}
                                    <div>
                                        <label className="block text-gray-400 mb-1 text-sm">Title *</label>
                                        <input type="text" value={lesson.title} onChange={(e) => updateLessonField(index, 'title', e.target.value)} placeholder="Enter lesson title"
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-gray-400 mb-1 text-sm">Description</label>
                                        <textarea value={lesson.description} onChange={(e) => updateLessonField(index, 'description', e.target.value)} placeholder="Brief description" rows={2}
                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500" />
                                    </div>

                                    {/* Videos */}
                                    <div>
                                        <label className="block text-gray-400 mb-2 text-sm">Videos (Multilingual)</label>
                                        {lesson.videos.length > 0 && (
                                            <div className="space-y-2 mb-3">
                                                {lesson.videos.map((video) => (
                                                    <div key={video.language} className="flex items-center justify-between px-3 py-2 bg-gray-600/50 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-green-400">✓</span>
                                                            <span className="text-white font-medium">{video.label}</span>
                                                            <span className="text-gray-400 text-sm truncate max-w-[200px]">{video.file.name}</span>
                                                        </div>
                                                        <button type="button" onClick={() => removeVideoFromLesson(index, video.language)} className="text-red-400 hover:text-red-300 px-2">✕</button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {AVAILABLE_LANGUAGES.map((lang) => (
                                            <input key={`${index}_${lang.code}`} type="file" accept="video/*" ref={(el) => { videoInputRefs.current.set(`${index}_${lang.code}`, el); }}
                                                onChange={(e) => handleVideoChange(index, lang.code, e)} className="hidden" />
                                        ))}
                                        {getAvailableLanguagesForLesson(index).length > 0 && (
                                            <select className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm" defaultValue=""
                                                onChange={(e) => { if (e.target.value) { addVideoToLesson(index, e.target.value); e.target.value = ''; } }}>
                                                <option value="" disabled>+ Add video in...</option>
                                                {getAvailableLanguagesForLesson(index).map((lang) => <option key={lang.code} value={lang.code}>{lang.label}</option>)}
                                            </select>
                                        )}
                                    </div>

                                    {/* Quiz Section */}
                                    <div className="border-t border-gray-600/50 pt-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="block text-gray-400 text-sm font-medium">Lesson Quiz</label>
                                            <button type="button" onClick={() => toggleQuiz(index)}
                                                className={`px-3 py-1 rounded-lg text-sm ${lesson.quiz.enabled ? 'bg-purple-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                                                {lesson.quiz.enabled ? '✓ Quiz Enabled' : '+ Add Quiz'}
                                            </button>
                                        </div>

                                        {lesson.quiz.enabled && (
                                            <div className="space-y-4 bg-gray-600/30 rounded-lg p-4">
                                                {/* Quiz Settings */}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-gray-400 mb-1 text-xs">Passing Score (%)</label>
                                                        <input type="number" min="1" max="100" value={lesson.quiz.passingScore}
                                                            onChange={(e) => updateQuizSettings(index, 'passingScore', parseInt(e.target.value) || 70)}
                                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" />
                                                    </div>
                                                    <div>
                                                        <label className="block text-gray-400 mb-1 text-xs">Pass Points</label>
                                                        <input type="number" min="0" value={lesson.quiz.passPoints}
                                                            onChange={(e) => updateQuizSettings(index, 'passPoints', parseInt(e.target.value) || 0)}
                                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" />
                                                    </div>
                                                </div>

                                                {/* Questions */}
                                                <div className="space-y-4">
                                                    {lesson.quiz.questions.map((question, qIndex) => (
                                                        <div key={qIndex} className="bg-gray-700/50 rounded-lg p-3 space-y-3">
                                                            <div className="flex justify-between items-start">
                                                                <label className="text-gray-300 text-sm font-medium">Question {qIndex + 1}</label>
                                                                <button type="button" onClick={() => removeQuizQuestion(index, qIndex)} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
                                                            </div>
                                                            <input type="text" value={question.question} onChange={(e) => updateQuestion(index, qIndex, 'question', e.target.value)}
                                                                placeholder="Enter your question" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm" />
                                                            <div className="space-y-2">
                                                                {question.options.map((option, oIndex) => (
                                                                    <div key={oIndex} className="flex items-center gap-2">
                                                                        <input type="radio" name={`correct_${index}_${qIndex}`} checked={question.correctIndex === oIndex}
                                                                            onChange={() => updateQuestion(index, qIndex, 'correctIndex', oIndex)}
                                                                            className="w-4 h-4 text-green-500" title="Mark as correct answer" />
                                                                        <input type="text" value={option} onChange={(e) => updateQuestionOption(index, qIndex, oIndex, e.target.value)}
                                                                            placeholder={`Option ${oIndex + 1}`}
                                                                            className={`flex-1 px-3 py-1.5 bg-gray-700 border rounded-lg text-white text-sm ${question.correctIndex === oIndex ? 'border-green-500' : 'border-gray-600'}`} />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <p className="text-gray-500 text-xs">Select the radio button next to the correct answer</p>
                                                        </div>
                                                    ))}
                                                </div>

                                                <button type="button" onClick={() => addQuizQuestion(index)}
                                                    className="w-full px-3 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 border border-purple-600/30 border-dashed text-sm">
                                                    + Add Question
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}

                    <button type="button" onClick={addLesson}
                        className="w-full px-4 py-3 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 border border-blue-600/30 border-dashed">
                        + Add Lesson
                    </button>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4">
                    <button type="submit" disabled={loading}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition-colors">
                        {loading ? 'Creating...' : 'Create Course'}
                    </button>
                    <button type="button" onClick={() => router.back()}
                        className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
