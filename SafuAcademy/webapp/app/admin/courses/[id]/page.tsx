'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';

// Contract ABI for updateCourse
const COURSE_ABI = [
    {
        name: 'updateCourse',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: '_courseId', type: 'uint256' },
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
        outputs: [],
    },
] as const;

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LEVEL3_COURSE_ADDRESS as `0x${string}`;

// Available languages for videos
const AVAILABLE_LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español (Spanish)' },
    { code: 'fr', label: 'Français (French)' },
    { code: 'zh', label: '中文 (Chinese)' },
    { code: 'de', label: 'Deutsch (German)' },
    { code: 'pt', label: 'Português (Portuguese)' },
    { code: 'ja', label: '日本語 (Japanese)' },
    { code: 'ko', label: '한국어 (Korean)' },
];

interface LessonVideo {
    id: string;
    language: string;
    label: string;
    storageKey: string;
    signedUrl?: string | null;
}

interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
}

interface Quiz {
    id: string;
    passingScore: number;
    passPoints: number;
    questions: QuizQuestion[];
}

interface Lesson {
    id: string;
    title: string;
    description: string | null;
    orderIndex: number;
    videoStorageKey: string | null;
    videoDuration: number;
    watchPoints: number;
    quiz: Quiz | null;
    videos?: LessonVideo[];
}

interface Course {
    id: number;
    title: string;
    description: string;
    longDescription: string | null;
    instructor: string | null;
    category: string | null;
    level: string | null;
    thumbnailUrl: string | null;
    duration: string | null;
    objectives: string[];
    prerequisites: string[];
    completionPoints: number;
    minPointsToAccess: number;
    enrollmentCost: number;
    isPublished: boolean;
    onChainSynced: boolean;
    lessons: Lesson[];
}

export default function EditCoursePage() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.id as string;
    const { address } = useAccount();

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'lessons'>('details');

    // Expanded lesson state
    const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

    // New lesson form
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [newLessonDescription, setNewLessonDescription] = useState('');
    const [addingLesson, setAddingLesson] = useState(false);

    // Video upload refs
    const videoInputRefs = useRef<Map<string, HTMLInputElement | null>>(new Map());

    // Staged videos - pending upload (like create page)
    const [pendingVideos, setPendingVideos] = useState<Map<string, { language: string; label: string; file: File }[]>>(new Map());

    // Lesson-level saving state
    const [savingLessonId, setSavingLessonId] = useState<string | null>(null);

    // On-chain sync
    const { writeContract, data: hash, isPending: isSyncing } = useWriteContract();
    const { isSuccess: syncSuccess } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

    useEffect(() => {
        if (syncSuccess) {
            alert('Successfully synced to blockchain!');
            fetchCourse();
        }
    }, [syncSuccess]);

    async function fetchCourse() {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/admin/courses/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to fetch course');

            const data = await res.json();
            setCourse(data.course);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!course) return;
        setSaving(true);

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/admin/courses/${courseId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: course.title,
                    description: course.description,
                    longDescription: course.longDescription,
                    instructor: course.instructor,
                    category: course.category,
                    level: course.level,
                    thumbnailUrl: course.thumbnailUrl,
                    duration: course.duration,
                    objectives: course.objectives,
                    prerequisites: course.prerequisites,
                    completionPoints: course.completionPoints,
                    minPointsToAccess: course.minPointsToAccess,
                    enrollmentCost: course.enrollmentCost,
                }),
            });

            if (!res.ok) throw new Error('Failed to save course');

            alert('Course saved successfully!');
        } catch (err) {
            alert((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    async function addLesson() {
        if (!newLessonTitle.trim()) return;
        setAddingLesson(true);

        try {
            const token = localStorage.getItem('auth_token');
            const formData = new FormData();
            formData.append('title', newLessonTitle);
            formData.append('description', newLessonDescription);

            const res = await fetch(`/api/admin/courses/${courseId}/lessons`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) throw new Error('Failed to add lesson');

            setNewLessonTitle('');
            setNewLessonDescription('');
            fetchCourse();
        } catch (err) {
            alert((err as Error).message);
        } finally {
            setAddingLesson(false);
        }
    }

    async function deleteLesson(lessonId: string) {
        if (!confirm('Delete this lesson and all its videos/quiz?')) return;

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/admin/lessons/${lessonId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to delete lesson');

            fetchCourse();
        } catch (err) {
            alert((err as Error).message);
        }
    }

    async function updateLessonField(lessonId: string, field: string, value: string) {
        if (!course) return;
        // Optimistic update
        setCourse({
            ...course,
            lessons: course.lessons.map(l =>
                l.id === lessonId ? { ...l, [field]: value } : l
            ),
        });
    }

    async function saveLesson(lessonId: string) {
        const lesson = course?.lessons.find(l => l.id === lessonId);
        if (!lesson) return;

        setSavingLessonId(lessonId);
        try {
            const token = localStorage.getItem('auth_token');

            // 1. Save lesson title/description
            const formData = new FormData();
            formData.append('title', lesson.title);
            formData.append('description', lesson.description || '');

            const res = await fetch(`/api/admin/lessons/${lessonId}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) throw new Error('Failed to save lesson');

            // 2. Upload any pending videos
            const lessonPending = pendingVideos.get(lessonId) || [];
            for (const vid of lessonPending) {
                const videoFormData = new FormData();
                videoFormData.append('video', vid.file);
                videoFormData.append('language', vid.language);
                videoFormData.append('label', vid.label);

                const videoRes = await fetch(`/api/admin/lessons/${lessonId}/videos`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: videoFormData,
                });

                if (!videoRes.ok) {
                    const err = await videoRes.json();
                    throw new Error(err.error || `Failed to upload ${vid.label} video`);
                }
            }

            // Clear pending videos for this lesson
            if (lessonPending.length > 0) {
                setPendingVideos(prev => {
                    const next = new Map(prev);
                    next.delete(lessonId);
                    return next;
                });
            }

            fetchCourse();
        } catch (err) {
            alert((err as Error).message);
        } finally {
            setSavingLessonId(null);
        }
    }

    // Stage video locally (don't upload yet)
    function stageVideo(lessonId: string, language: string, file: File) {
        const langInfo = AVAILABLE_LANGUAGES.find(l => l.code === language);
        if (!langInfo) return;

        setPendingVideos(prev => {
            const next = new Map(prev);
            const existing = next.get(lessonId) || [];
            // Remove if already staged for this language
            const filtered = existing.filter(v => v.language !== language);
            next.set(lessonId, [...filtered, { language, label: langInfo.label, file }]);
            return next;
        });
    }

    // Remove staged video (before upload)
    function removePendingVideo(lessonId: string, language: string) {
        setPendingVideos(prev => {
            const next = new Map(prev);
            const existing = next.get(lessonId) || [];
            next.set(lessonId, existing.filter(v => v.language !== language));
            return next;
        });
    }

    // Get languages available for a lesson (excluding both saved and pending)
    function getAvailableLanguagesForLessonWithPending(lesson: Lesson) {
        const savedLanguages = lesson.videos?.map(v => v.language) || [];
        const lessonPending = pendingVideos.get(lesson.id) || [];
        const pendingLanguages = lessonPending.map(v => v.language);
        const usedLanguages = [...savedLanguages, ...pendingLanguages];
        return AVAILABLE_LANGUAGES.filter(l => !usedLanguages.includes(l.code));
    }

    async function uploadVideo(lessonId: string, language: string, file: File) {
        try {
            const token = localStorage.getItem('auth_token');
            const formData = new FormData();
            formData.append('video', file);
            formData.append('language', language);
            formData.append('label', AVAILABLE_LANGUAGES.find(l => l.code === language)?.label || language);

            const res = await fetch(`/api/admin/lessons/${lessonId}/videos`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to upload video');
            }

            fetchCourse();
        } catch (err) {
            alert((err as Error).message);
        }
    }

    async function deleteVideo(lessonId: string, language: string) {
        if (!confirm(`Delete ${language} video?`)) return;

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/admin/lessons/${lessonId}/videos?language=${language}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to delete video');

            fetchCourse();
        } catch (err) {
            alert((err as Error).message);
        }
    }

    async function createOrUpdateQuiz(lessonId: string, quiz: Partial<Quiz>) {
        try {
            const token = localStorage.getItem('auth_token');
            const lesson = course?.lessons.find(l => l.id === lessonId);
            const method = lesson?.quiz ? 'PUT' : 'POST';

            const res = await fetch(`/api/admin/lessons/${lessonId}/quiz`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(quiz),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save quiz');
            }

            fetchCourse();
        } catch (err) {
            alert((err as Error).message);
        }
    }

    async function deleteQuiz(lessonId: string) {
        if (!confirm('Delete this quiz?')) return;

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/admin/lessons/${lessonId}/quiz`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to delete quiz');

            fetchCourse();
        } catch (err) {
            alert((err as Error).message);
        }
    }

    // Update quiz locally (without saving to server)
    function updateLessonQuizLocally(lessonId: string, updatedQuiz: Quiz) {
        if (!course) return;
        setCourse({
            ...course,
            lessons: course.lessons.map(l =>
                l.id === lessonId ? { ...l, quiz: updatedQuiz } : l
            ),
        });
    }

    // Save quiz to server
    async function saveQuiz(lessonId: string) {
        const lesson = course?.lessons.find(l => l.id === lessonId);
        if (!lesson?.quiz) return;

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/admin/lessons/${lessonId}/quiz`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    questions: lesson.quiz.questions,
                    passingScore: lesson.quiz.passingScore,
                    passPoints: lesson.quiz.passPoints,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to save quiz');
            }

            alert('Quiz saved successfully!');
        } catch (err) {
            alert((err as Error).message);
        }
    }

    function toggleLessonExpanded(lessonId: string) {
        setExpandedLessons(prev => {
            const next = new Set(prev);
            if (next.has(lessonId)) {
                next.delete(lessonId);
            } else {
                next.add(lessonId);
            }
            return next;
        });
    }

    function getAvailableLanguagesForLesson(lesson: Lesson) {
        const usedLanguages = lesson.videos?.map(v => v.language) || [];
        return AVAILABLE_LANGUAGES.filter(l => !usedLanguages.includes(l.code));
    }

    function syncToBlockchain() {
        if (!course || !address) {
            alert('Please connect your wallet');
            return;
        }

        writeContract({
            address: CONTRACT_ADDRESS,
            abi: COURSE_ABI,
            functionName: 'updateCourse',
            args: [
                BigInt(course.id), // On-chain ID matches database ID
                course.title,
                course.description,
                course.longDescription || '',
                course.instructor || '',
                course.objectives.filter(o => o.trim()),
                course.prerequisites.filter(p => p.trim()),
                course.category || '',
                course.level || '',
                course.thumbnailUrl || '',
                course.duration || '',
                BigInt(course.lessons.length),
                BigInt(course.minPointsToAccess),
                BigInt(course.enrollmentCost),
            ],
        });
    }

    if (loading) {
        return <div className="text-white">Loading course...</div>;
    }

    if (error || !course) {
        return <div className="text-red-500">Error: {error || 'Course not found'}</div>;
    }

    return (
        <div>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6 md:mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Edit Course</h1>
                    <p className="text-gray-400 text-sm">ID: {course.id}</p>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-4">
                    <button
                        onClick={syncToBlockchain}
                        disabled={isSyncing || !address}
                        className="px-3 md:px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm md:text-base"
                        title={!address ? 'Connect wallet to sync' : 'Update course data on blockchain'}
                    >
                        {isSyncing ? '⏳ Syncing...' : '🔗 Sync'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-3 md:px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm md:text-base"
                    >
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                    <Link
                        href="/admin/courses"
                        className="px-3 md:px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm md:text-base"
                    >
                        Back
                    </Link>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('details')}
                    className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'details'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                >
                    Course Details
                </button>
                <button
                    onClick={() => setActiveTab('lessons')}
                    className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'lessons'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                >
                    Lessons ({course.lessons.length})
                </button>
            </div>

            {/* Details Tab - keeping as is, but abbreviated for clarity */}
            {activeTab === 'details' && (
                <div className="space-y-6">
                    <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                        <h2 className="text-xl font-semibold text-white">Basic Information</h2>
                        <div>
                            <label className="block text-gray-400 mb-2">Title</label>
                            <input
                                type="text"
                                value={course.title}
                                onChange={(e) => setCourse({ ...course, title: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2">Description (Short)</label>
                            <textarea
                                value={course.description}
                                onChange={(e) => setCourse({ ...course, description: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2">Long Description</label>
                            <textarea
                                value={course.longDescription || ''}
                                onChange={(e) => setCourse({ ...course, longDescription: e.target.value })}
                                rows={4}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 mb-2 text-sm">Instructor</label>
                                <input
                                    type="text"
                                    value={course.instructor || ''}
                                    onChange={(e) => setCourse({ ...course, instructor: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-2 text-sm">Duration</label>
                                <input
                                    type="text"
                                    value={course.duration || ''}
                                    onChange={(e) => setCourse({ ...course, duration: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-400 mb-2">Thumbnail URL</label>
                            <input
                                type="text"
                                value={course.thumbnailUrl || ''}
                                onChange={(e) => setCourse({ ...course, thumbnailUrl: e.target.value })}
                                placeholder="https://example.com/image.jpg"
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            />
                            {course.thumbnailUrl && (
                                <img src={course.thumbnailUrl} alt="Thumbnail preview" className="mt-2 h-20 rounded-lg object-cover" />
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 mb-2 text-sm">Level</label>
                                <select
                                    value={course.level || ''}
                                    onChange={(e) => setCourse({ ...course, level: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                                >
                                    <option value="BEGINNER">Beginner</option>
                                    <option value="INTERMEDIATE">Intermediate</option>
                                    <option value="ADVANCED">Advanced</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-2 text-sm">Category</label>
                                <input
                                    type="text"
                                    value={course.category || ''}
                                    onChange={(e) => setCourse({ ...course, category: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-gray-400 mb-2 text-sm">Completion Points</label>
                                <input
                                    type="number"
                                    value={course.completionPoints}
                                    onChange={(e) => setCourse({ ...course, completionPoints: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-2 text-sm">Min Points</label>
                                <input
                                    type="number"
                                    value={course.minPointsToAccess}
                                    onChange={(e) => setCourse({ ...course, minPointsToAccess: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-2 text-sm">Enrollment Cost</label>
                                <input
                                    type="number"
                                    value={course.enrollmentCost}
                                    onChange={(e) => setCourse({ ...course, enrollmentCost: parseInt(e.target.value) || 0 })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Objectives */}
                    <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-white">Learning Objectives</h2>
                            <button
                                onClick={() => setCourse({ ...course, objectives: [...course.objectives, ''] })}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                            >
                                + Add
                            </button>
                        </div>
                        {course.objectives.map((obj, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={obj}
                                    onChange={(e) => {
                                        const newObjectives = [...course.objectives];
                                        newObjectives[index] = e.target.value;
                                        setCourse({ ...course, objectives: newObjectives });
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                />
                                <button
                                    onClick={() => {
                                        const newObjectives = course.objectives.filter((_, i) => i !== index);
                                        setCourse({ ...course, objectives: newObjectives });
                                    }}
                                    className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Prerequisites */}
                    <div className="bg-gray-800 rounded-xl p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-semibold text-white">Prerequisites</h2>
                            <button
                                onClick={() => setCourse({ ...course, prerequisites: [...course.prerequisites, ''] })}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded"
                            >
                                + Add
                            </button>
                        </div>
                        {course.prerequisites.map((prereq, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={prereq}
                                    onChange={(e) => {
                                        const newPrerequisites = [...course.prerequisites];
                                        newPrerequisites[index] = e.target.value;
                                        setCourse({ ...course, prerequisites: newPrerequisites });
                                    }}
                                    className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                />
                                <button
                                    onClick={() => {
                                        const newPrerequisites = course.prerequisites.filter((_, i) => i !== index);
                                        setCourse({ ...course, prerequisites: newPrerequisites });
                                    }}
                                    className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Status */}
                    <div className="bg-gray-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Status</h2>
                        <div className="flex gap-4">
                            <span className={`px-3 py-1 rounded ${course.isPublished ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                {course.isPublished ? 'Published' : 'Draft'}
                            </span>
                            <span className={`px-3 py-1 rounded ${course.onChainSynced ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                                {course.onChainSynced ? 'On-chain Synced' : 'Not Synced'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Lessons Tab */}
            {activeTab === 'lessons' && (
                <div className="space-y-6">
                    {/* Sync to Blockchain Button */}
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 flex justify-between items-center">
                        <div>
                            <p className="text-yellow-400 font-medium">Blockchain Sync</p>
                            <p className="text-gray-400 text-sm">
                                Current lessons: {course.lessons.length}. Update on-chain after adding/removing lessons.
                            </p>
                        </div>
                        <button
                            onClick={syncToBlockchain}
                            disabled={isSyncing || !address}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            {isSyncing ? 'Syncing...' : '⛓️ Sync to Blockchain'}
                        </button>
                    </div>

                    {/* Add Lesson Form */}
                    <div className="bg-gray-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Add New Lesson</h2>
                        <div className="space-y-4">
                            <input
                                type="text"
                                value={newLessonTitle}
                                onChange={(e) => setNewLessonTitle(e.target.value)}
                                placeholder="Lesson title"
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            />
                            <textarea
                                value={newLessonDescription}
                                onChange={(e) => setNewLessonDescription(e.target.value)}
                                placeholder="Lesson description (optional)"
                                rows={2}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                            />
                            <button
                                onClick={addLesson}
                                disabled={addingLesson || !newLessonTitle.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg"
                            >
                                {addingLesson ? 'Adding...' : '+ Add Lesson'}
                            </button>
                        </div>
                    </div>

                    {/* Lessons List */}
                    <div className="space-y-4">
                        {course.lessons.length === 0 ? (
                            <div className="bg-gray-800 rounded-xl p-12 text-center text-gray-400">
                                No lessons yet. Add your first lesson above!
                            </div>
                        ) : (
                            course.lessons.map((lesson) => {
                                const isExpanded = expandedLessons.has(lesson.id);
                                const lessonPending = pendingVideos.get(lesson.id) || [];

                                return (
                                    <div key={lesson.id} className="bg-gray-800 rounded-xl overflow-hidden">
                                        {/* Lesson Header */}
                                        <div
                                            className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-700/50"
                                            onClick={() => toggleLessonExpanded(lesson.id)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-gray-300">
                                                    {isExpanded ? '▼' : '▶'} Lesson {lesson.orderIndex + 1}
                                                </span>
                                                <span className="text-white font-medium">{lesson.title}</span>
                                                {lesson.videos && lesson.videos.length > 0 && (
                                                    <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded">
                                                        🎬 {lesson.videos.length} video{lesson.videos.length > 1 ? 's' : ''}
                                                    </span>
                                                )}
                                                {lesson.quiz && (
                                                    <span className="text-xs bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded">
                                                        📝 Quiz
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteLesson(lesson.id); }}
                                                className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>

                                        {/* Expanded Content */}
                                        {isExpanded && (
                                            <div className="p-4 pt-0 space-y-6 border-t border-gray-700">
                                                {/* Title & Description */}
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="block text-gray-400 mb-1 text-sm">Title</label>
                                                        <input
                                                            type="text"
                                                            value={lesson.title}
                                                            onChange={(e) => updateLessonField(lesson.id, 'title', e.target.value)}
                                                            onBlur={() => saveLesson(lesson.id)}
                                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-gray-400 mb-1 text-sm">Description</label>
                                                        <textarea
                                                            value={lesson.description || ''}
                                                            onChange={(e) => updateLessonField(lesson.id, 'description', e.target.value)}
                                                            onBlur={() => saveLesson(lesson.id)}
                                                            rows={2}
                                                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                                                        />
                                                    </div>
                                                    {savingLessonId === lesson.id && (
                                                        <p className="text-gray-500 text-xs">Saving...</p>
                                                    )}
                                                </div>

                                                {/* Videos Section */}
                                                <div>
                                                    <label className="block text-gray-400 mb-2 text-sm font-medium">Videos (Multi-language)</label>

                                                    {/* Saved videos (green checkmark) */}
                                                    {lesson.videos && lesson.videos.length > 0 && (
                                                        <div className="space-y-2 mb-3">
                                                            {lesson.videos.map((video) => (
                                                                <div key={video.id} className="flex items-center justify-between px-3 py-2 bg-gray-600/50 rounded-lg">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-green-400">✓</span>
                                                                        <span className="text-white">{video.label}</span>
                                                                        <span className="text-gray-500 text-xs">(saved)</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => deleteVideo(lesson.id, video.language)}
                                                                        className="text-red-400 hover:text-red-300 px-2"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Pending videos (yellow indicator) */}
                                                    {(pendingVideos.get(lesson.id) || []).length > 0 && (
                                                        <div className="space-y-2 mb-3">
                                                            {(pendingVideos.get(lesson.id) || []).map((video) => (
                                                                <div key={video.language} className="flex items-center justify-between px-3 py-2 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="text-yellow-400">⏳</span>
                                                                        <span className="text-white">{video.label}</span>
                                                                        <span className="text-yellow-400 text-xs">(pending - click Save to upload)</span>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => removePendingVideo(lesson.id, video.language)}
                                                                        className="text-red-400 hover:text-red-300 px-2"
                                                                    >
                                                                        ✕
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Hidden file inputs */}
                                                    {AVAILABLE_LANGUAGES.map((lang) => (
                                                        <input
                                                            key={`${lesson.id}_${lang.code}`}
                                                            type="file"
                                                            accept="video/*"
                                                            ref={(el) => { videoInputRefs.current.set(`${lesson.id}_${lang.code}`, el); }}
                                                            onChange={(e) => {
                                                                const file = e.target.files?.[0];
                                                                if (file) stageVideo(lesson.id, lang.code, file);
                                                                e.target.value = '';
                                                            }}
                                                            className="hidden"
                                                        />
                                                    ))}
                                                    {getAvailableLanguagesForLessonWithPending(lesson).length > 0 && (
                                                        <select
                                                            className="px-3 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white text-sm"
                                                            defaultValue=""
                                                            onChange={(e) => {
                                                                if (e.target.value) {
                                                                    const input = videoInputRefs.current.get(`${lesson.id}_${e.target.value}`);
                                                                    input?.click();
                                                                    e.target.value = '';
                                                                }
                                                            }}
                                                        >
                                                            <option value="" disabled>+ Add video in...</option>
                                                            {getAvailableLanguagesForLessonWithPending(lesson).map((lang) => (
                                                                <option key={lang.code} value={lang.code}>{lang.label}</option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>

                                                {/* Save Lesson Button */}
                                                <div className="border-t border-gray-600/50 pt-4">
                                                    <button
                                                        onClick={() => saveLesson(lesson.id)}
                                                        disabled={savingLessonId === lesson.id}
                                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${(pendingVideos.get(lesson.id) || []).length > 0
                                                            ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                            } disabled:bg-gray-600`}
                                                    >
                                                        {savingLessonId === lesson.id
                                                            ? '⏳ Saving & Uploading...'
                                                            : (pendingVideos.get(lesson.id) || []).length > 0
                                                                ? `💾 Save Lesson & Upload ${(pendingVideos.get(lesson.id) || []).length} Video(s)`
                                                                : '💾 Save Lesson Changes'}
                                                    </button>
                                                </div>

                                                {/* Quiz Section */}
                                                <div className="border-t border-gray-600/50 pt-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <label className="text-gray-400 text-sm font-medium">Lesson Quiz</label>
                                                        {lesson.quiz ? (
                                                            <button
                                                                onClick={() => deleteQuiz(lesson.id)}
                                                                className="px-3 py-1 bg-red-600/20 text-red-400 rounded text-sm"
                                                            >
                                                                Delete Quiz
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => createOrUpdateQuiz(lesson.id, {
                                                                    questions: [{
                                                                        question: 'Enter your question here',
                                                                        options: ['Option A', 'Option B', 'Option C', 'Option D'],
                                                                        correctIndex: 0
                                                                    }],
                                                                    passingScore: 70,
                                                                    passPoints: 20,
                                                                })}
                                                                className="px-3 py-1 bg-purple-600 text-white rounded text-sm"
                                                            >
                                                                + Add Quiz
                                                            </button>
                                                        )}
                                                    </div>
                                                    {lesson.quiz && (
                                                        <div className="bg-gray-700/30 rounded-lg p-4 space-y-4">
                                                            {/* Passing Score & Points */}
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="block text-gray-400 mb-1 text-xs">Passing Score (%)</label>
                                                                    <input
                                                                        type="number"
                                                                        value={lesson.quiz.passingScore}
                                                                        onChange={(e) => {
                                                                            const updated = { ...lesson.quiz!, passingScore: parseInt(e.target.value) || 70 };
                                                                            updateLessonQuizLocally(lesson.id, updated);
                                                                        }}
                                                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-gray-400 mb-1 text-xs">Pass Points</label>
                                                                    <input
                                                                        type="number"
                                                                        value={lesson.quiz.passPoints}
                                                                        onChange={(e) => {
                                                                            const updated = { ...lesson.quiz!, passPoints: parseInt(e.target.value) || 0 };
                                                                            updateLessonQuizLocally(lesson.id, updated);
                                                                        }}
                                                                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm"
                                                                    />
                                                                </div>
                                                            </div>

                                                            {/* Questions */}
                                                            <div className="space-y-4">
                                                                <div className="flex justify-between items-center">
                                                                    <label className="text-gray-400 text-sm font-medium">
                                                                        Questions ({lesson.quiz.questions.length})
                                                                    </label>
                                                                    <button
                                                                        onClick={() => {
                                                                            const newQ = { question: 'New question', options: ['Option A', 'Option B'], correctIndex: 0 };
                                                                            const updated = { ...lesson.quiz!, questions: [...lesson.quiz!.questions, newQ] };
                                                                            updateLessonQuizLocally(lesson.id, updated);
                                                                        }}
                                                                        className="px-2 py-1 bg-purple-600/50 hover:bg-purple-600 text-purple-200 rounded text-xs"
                                                                    >
                                                                        + Add Question
                                                                    </button>
                                                                </div>

                                                                {lesson.quiz.questions.map((q, qIdx) => (
                                                                    <div key={qIdx} className="bg-gray-600/30 rounded-lg p-3 space-y-3">
                                                                        <div className="flex justify-between items-start gap-2">
                                                                            <div className="flex-1">
                                                                                <label className="block text-gray-500 text-xs mb-1">Question {qIdx + 1}</label>
                                                                                <input
                                                                                    type="text"
                                                                                    value={q.question}
                                                                                    onChange={(e) => {
                                                                                        const newQuestions = [...lesson.quiz!.questions];
                                                                                        newQuestions[qIdx] = { ...q, question: e.target.value };
                                                                                        updateLessonQuizLocally(lesson.id, { ...lesson.quiz!, questions: newQuestions });
                                                                                    }}
                                                                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                                                                    placeholder="Enter question..."
                                                                                />
                                                                            </div>
                                                                            <button
                                                                                onClick={() => {
                                                                                    if (lesson.quiz!.questions.length <= 1) {
                                                                                        alert('Quiz must have at least 1 question');
                                                                                        return;
                                                                                    }
                                                                                    const newQuestions = lesson.quiz!.questions.filter((_, i) => i !== qIdx);
                                                                                    updateLessonQuizLocally(lesson.id, { ...lesson.quiz!, questions: newQuestions });
                                                                                }}
                                                                                className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs mt-5"
                                                                            >
                                                                                ✕
                                                                            </button>
                                                                        </div>

                                                                        {/* Options */}
                                                                        <div className="space-y-2">
                                                                            <div className="flex justify-between items-center">
                                                                                <label className="text-gray-500 text-xs">Options (select correct answer)</label>
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const newQuestions = [...lesson.quiz!.questions];
                                                                                        newQuestions[qIdx] = {
                                                                                            ...q,
                                                                                            options: [...q.options, `Option ${String.fromCharCode(65 + q.options.length)}`]
                                                                                        };
                                                                                        updateLessonQuizLocally(lesson.id, { ...lesson.quiz!, questions: newQuestions });
                                                                                    }}
                                                                                    className="px-2 py-0.5 bg-gray-600 hover:bg-gray-500 text-gray-300 rounded text-xs"
                                                                                >
                                                                                    + Option
                                                                                </button>
                                                                            </div>
                                                                            {q.options.map((opt, optIdx) => (
                                                                                <div key={optIdx} className="flex items-center gap-2">
                                                                                    <button
                                                                                        onClick={() => {
                                                                                            const newQuestions = [...lesson.quiz!.questions];
                                                                                            newQuestions[qIdx] = { ...q, correctIndex: optIdx };
                                                                                            updateLessonQuizLocally(lesson.id, { ...lesson.quiz!, questions: newQuestions });
                                                                                        }}
                                                                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${q.correctIndex === optIdx
                                                                                            ? 'border-green-500 bg-green-500/30 text-green-400'
                                                                                            : 'border-gray-500 text-gray-500 hover:border-gray-400'
                                                                                            }`}
                                                                                        title={q.correctIndex === optIdx ? 'Correct answer' : 'Click to set as correct'}
                                                                                    >
                                                                                        {q.correctIndex === optIdx ? '✓' : String.fromCharCode(65 + optIdx)}
                                                                                    </button>
                                                                                    <input
                                                                                        type="text"
                                                                                        value={opt}
                                                                                        onChange={(e) => {
                                                                                            const newQuestions = [...lesson.quiz!.questions];
                                                                                            const newOptions = [...q.options];
                                                                                            newOptions[optIdx] = e.target.value;
                                                                                            newQuestions[qIdx] = { ...q, options: newOptions };
                                                                                            updateLessonQuizLocally(lesson.id, { ...lesson.quiz!, questions: newQuestions });
                                                                                        }}
                                                                                        className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                                                                                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                                                                                    />
                                                                                    {q.options.length > 2 && (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                const newQuestions = [...lesson.quiz!.questions];
                                                                                                const newOptions = q.options.filter((_, i) => i !== optIdx);
                                                                                                let newCorrectIndex = q.correctIndex;
                                                                                                if (optIdx < q.correctIndex) newCorrectIndex--;
                                                                                                else if (optIdx === q.correctIndex) newCorrectIndex = 0;
                                                                                                newQuestions[qIdx] = { ...q, options: newOptions, correctIndex: newCorrectIndex };
                                                                                                updateLessonQuizLocally(lesson.id, { ...lesson.quiz!, questions: newQuestions });
                                                                                            }}
                                                                                            className="px-1 text-red-400 hover:text-red-300 text-sm"
                                                                                        >
                                                                                            ✕
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Save Quiz Button */}
                                                            <button
                                                                onClick={() => saveQuiz(lesson.id)}
                                                                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium"
                                                            >
                                                                💾 Save Quiz Changes
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
