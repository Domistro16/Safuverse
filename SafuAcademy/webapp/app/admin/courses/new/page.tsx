'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';

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
            { name: '_isIncentivized', type: 'bool' },
        ],
        outputs: [{ type: 'uint256' }],
    },
] as const;

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LEVEL3_COURSE_ADDRESS as `0x${string}`;

const LEVEL_DEFAULTS = {
    BEGINNER: { completionPoints: 50 },
    INTERMEDIATE: { completionPoints: 100 },
    ADVANCED: { completionPoints: 150 },
} as const;

const LANGUAGES = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Spanish' },
    { code: 'fr', label: 'French' },
    { code: 'de', label: 'German' },
    { code: 'pt', label: 'Portuguese' },
    { code: 'zh', label: 'Chinese' },
    { code: 'ja', label: 'Japanese' },
    { code: 'ko', label: 'Korean' },
] as const;

type Level = keyof typeof LEVEL_DEFAULTS;

interface LessonVideoInput {
    language: string;
    label: string;
    url: string;
}

interface LessonInput {
    title: string;
    description: string;
    watchPoints: number;
    videos: LessonVideoInput[];
}

interface CourseFormState {
    title: string;
    description: string;
    longDescription: string;
    instructor: string;
    category: string;
    level: Level;
    thumbnailUrl: string;
    duration: string;
    objectives: string[];
    prerequisites: string[];
    completionPoints: number;
    keyTakeaways: string[];
    isIncentivized: boolean;
    scormVersion: 'SCORM_12' | 'SCORM_2004';
    scormLaunchUrl: string;
    scormManifestPath: string;
    scormPackageVersion: number;
}

export default function CreateCoursePage() {
    const router = useRouter();
    const { address } = useAccount();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'form' | 'saving' | 'signing'>('form');
    const [createdCourseId, setCreatedCourseId] = useState<number | null>(null);

    const [formData, setFormData] = useState<CourseFormState>({
        title: '',
        description: '',
        longDescription: '',
        instructor: '',
        category: 'Blockchain Basics',
        level: 'BEGINNER' as Level,
        thumbnailUrl: '',
        duration: '',
        objectives: [''],
        prerequisites: [''],
        completionPoints: LEVEL_DEFAULTS.BEGINNER.completionPoints,
        keyTakeaways: [''],
        isIncentivized: false,
        scormVersion: 'SCORM_12' as 'SCORM_12' | 'SCORM_2004',
        scormLaunchUrl: '',
        scormManifestPath: '',
        scormPackageVersion: 1,
    });

    const [lessons, setLessons] = useState<LessonInput[]>([]);
    const [scormZipFile, setScormZipFile] = useState<File | null>(null);

    const { writeContract, data: hash } = useWriteContract();
    const { isSuccess: txSuccess } = useWaitForTransactionReceipt({ hash });
    const linkedRef = useRef(false);

    useEffect(() => {
        if (!txSuccess || !hash || createdCourseId == null || linkedRef.current) return;
        linkedRef.current = true;
        (async () => {
            try {
                const token = localStorage.getItem('auth_token');
                const res = await fetch(`/api/admin/courses/${createdCourseId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ onChainTxHash: hash }),
                });

                if (!res.ok) {
                    const err = await res.json().catch(() => ({}));
                    throw new Error(err.error || 'Failed to attach tx hash');
                }

                alert('Course created successfully.');
                router.push(`/admin/courses/${createdCourseId}`);
            } catch (error) {
                console.error(error);
                alert((error as Error).message);
                setLoading(false);
                setStep('form');
                linkedRef.current = false;
            }
        })();
    }, [txSuccess, hash, createdCourseId, router]);

    const handleLevelChange = (value: string) => {
        const level = value as Level;
        const defaults = LEVEL_DEFAULTS[level];
        setFormData((prev) => ({
            ...prev,
            level,
            completionPoints: defaults.completionPoints,
        }));
    };

    const updateArrayField = (
        field: 'objectives' | 'prerequisites',
        index: number,
        value: string
    ) => {
        setFormData((prev) => {
            const next = [...prev[field]];
            next[index] = value;
            return { ...prev, [field]: next };
        });
    };

    const addArrayItem = (field: 'objectives' | 'prerequisites') => {
        setFormData((prev) => ({ ...prev, [field]: [...prev[field], ''] }));
    };

    const removeArrayItem = (field: 'objectives' | 'prerequisites', index: number) => {
        setFormData((prev) => ({
            ...prev,
            [field]: prev[field].filter((_, i) => i !== index),
        }));
    };

    const addLesson = () => {
        setLessons((prev) => [
            ...prev,
            {
                title: '',
                description: '',
                watchPoints: 10,
                videos: [{ language: 'en', label: 'English', url: '' }],
            },
        ]);
    };

    const removeLesson = (lessonIndex: number) => {
        setLessons((prev) => prev.filter((_, i) => i !== lessonIndex));
    };

    const updateLesson = (
        lessonIndex: number,
        field: 'title' | 'description' | 'watchPoints',
        value: string | number
    ) => {
        setLessons((prev) => {
            const next = [...prev];
            next[lessonIndex] = { ...next[lessonIndex], [field]: value };
            return next;
        });
    };

    const addLessonVideo = (lessonIndex: number) => {
        setLessons((prev) => {
            const next = [...prev];
            next[lessonIndex] = {
                ...next[lessonIndex],
                videos: [...next[lessonIndex].videos, { language: 'en', label: 'English', url: '' }],
            };
            return next;
        });
    };

    const removeLessonVideo = (lessonIndex: number, videoIndex: number) => {
        setLessons((prev) => {
            const next = [...prev];
            next[lessonIndex] = {
                ...next[lessonIndex],
                videos: next[lessonIndex].videos.filter((_, i) => i !== videoIndex),
            };
            return next;
        });
    };

    const updateLessonVideo = (
        lessonIndex: number,
        videoIndex: number,
        field: 'language' | 'label' | 'url',
        value: string
    ) => {
        setLessons((prev) => {
            const next = [...prev];
            const videos = [...next[lessonIndex].videos];
            const current = { ...videos[videoIndex], [field]: value };

            if (field === 'language') {
                const found = LANGUAGES.find((l) => l.code === value);
                if (found) current.label = found.label;
            }

            videos[videoIndex] = current;
            next[lessonIndex] = { ...next[lessonIndex], videos };
            return next;
        });
    };

    const validateForm = (): string | null => {
        if (!address) return 'Please connect your wallet.';
        if (!formData.title.trim()) return 'Course title is required.';
        if (!formData.description.trim()) return 'Course description is required.';

        if (formData.isIncentivized) {
            if (!formData.scormLaunchUrl.trim() && !scormZipFile) {
                return 'Incentivized courses require a SCORM launch URL or SCORM zip package.';
            }
            return null;
        }

        if (lessons.length === 0) return 'Add at least one lesson.';

        for (let i = 0; i < lessons.length; i++) {
            const lesson = lessons[i];
            if (!lesson.title.trim()) return `Lesson ${i + 1} title is required.`;
            for (let j = 0; j < lesson.videos.length; j++) {
                const video = lesson.videos[j];
                if (!video.url.trim()) continue;
                if (!video.url.startsWith('https://share.synthesia.io/')) {
                    return `Lesson ${i + 1}, video ${j + 1}: invalid Synthesia URL.`;
                }
            }
        }

        return null;
    };

    const uploadToBackend = async () => {
        const token = localStorage.getItem('auth_token');
        const submitData = new FormData();

        submitData.append(
            'courseData',
            JSON.stringify({
                ...formData,
                objectives: formData.objectives.filter((x) => x.trim()),
                prerequisites: formData.prerequisites.filter((x) => x.trim()),
                keyTakeaways: formData.keyTakeaways.filter((x) => x.trim()),
            })
        );

        if (scormZipFile) {
            submitData.append('scormZip', scormZipFile);
        }

        submitData.append(
            'lessons',
            JSON.stringify(
                lessons.map((lesson, lessonIndex) => ({
                    title: lesson.title.trim(),
                    description: lesson.description || undefined,
                    orderIndex: lessonIndex,
                    watchPoints: lesson.watchPoints,
                    videos: lesson.videos
                        .filter((video) => video.url.trim() !== '')
                        .map((video, videoIndex) => ({
                            language: video.language,
                            label: video.label,
                            orderIndex: videoIndex,
                            url: video.url.trim(),
                        })),
                }))
            )
        );

        const res = await fetch('/api/admin/courses/create-with-lessons', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: submitData,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to create course in backend');
        }

        const data = await res.json();
        console.log('[CREATE DEBUG] API response:', JSON.stringify(data));
        console.log('[CREATE DEBUG] course id:', data.course?.id, 'type:', typeof data.course?.id);
        return data.course?.id as number;
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) {
            alert(validationError);
            return;
        }

        setLoading(true);
        setStep('saving');
        linkedRef.current = false;

        try {
            if (!CONTRACT_ADDRESS) {
                throw new Error('Contract address is not configured. Set NEXT_PUBLIC_LEVEL3_COURSE_ADDRESS.');
            }

            const backendCourseId = await uploadToBackend();
            if (backendCourseId == null) throw new Error('Invalid backend response.');
            setCreatedCourseId(backendCourseId);

            setStep('signing');
            writeContract({
                address: CONTRACT_ADDRESS,
                abi: COURSE_ABI,
                functionName: 'createCourse',
                args: [
                    formData.title,
                    formData.description,
                    formData.longDescription,
                    formData.instructor,
                    formData.objectives.filter((x) => x.trim()),
                    formData.prerequisites.filter((x) => x.trim()),
                    formData.category,
                    formData.level,
                    formData.thumbnailUrl,
                    formData.duration,
                    BigInt(formData.isIncentivized ? Math.max(1, lessons.length) : lessons.length),
                    formData.isIncentivized,
                ],
            });
        } catch (error) {
            console.error(error);
            alert((error as Error).message);
            setStep('form');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-6 text-white">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Create Course</h1>
                <p className="text-gray-400 mt-2">
                    Configure free (Synthesia iframe) or incentivized (SCORM) course delivery.
                </p>
                {loading && (
                    <p className="mt-3 text-yellow-300">
                        {step === 'saving' && 'Saving course in backend...'}
                        {step === 'signing' && 'Waiting for wallet signature and transaction...'}
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <section className="bg-gray-800 p-5 rounded-xl space-y-4">
                    <h2 className="text-xl font-semibold">Course Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            value={formData.title}
                            onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                            placeholder="Title"
                            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                            required
                        />
                        <input
                            value={formData.instructor}
                            onChange={(e) => setFormData((p) => ({ ...p, instructor: e.target.value }))}
                            placeholder="Instructor"
                            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                        />
                        <input
                            value={formData.category}
                            onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                            placeholder="Category"
                            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                        />
                        <select
                            value={formData.level}
                            onChange={(e) => handleLevelChange(e.target.value)}
                            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                        >
                            <option value="BEGINNER">Beginner</option>
                            <option value="INTERMEDIATE">Intermediate</option>
                            <option value="ADVANCED">Advanced</option>
                        </select>
                        <input
                            value={formData.duration}
                            onChange={(e) => setFormData((p) => ({ ...p, duration: e.target.value }))}
                            placeholder="Duration (e.g. 2 hours)"
                            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                        />
                        <input
                            value={formData.thumbnailUrl}
                            onChange={(e) => setFormData((p) => ({ ...p, thumbnailUrl: e.target.value }))}
                            placeholder="Thumbnail URL"
                            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                        />
                    </div>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                        placeholder="Short description"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                        rows={3}
                        required
                    />
                    <textarea
                        value={formData.longDescription}
                        onChange={(e) => setFormData((p) => ({ ...p, longDescription: e.target.value }))}
                        placeholder="Long description"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                        rows={5}
                    />
                </section>

                <section className="bg-gray-800 p-5 rounded-xl space-y-4">
                    <h2 className="text-xl font-semibold">Course Mode</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <select
                            value={formData.isIncentivized ? 'INCENTIVIZED' : 'FREE'}
                            onChange={(e) => {
                                const isIncentivized = e.target.value === 'INCENTIVIZED';
                                setFormData((prev) => ({
                                    ...prev,
                                    isIncentivized,
                                    completionPoints: isIncentivized
                                        ? LEVEL_DEFAULTS[prev.level].completionPoints
                                        : 0,
                                }));
                            }}
                            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                        >
                            <option value="FREE">FREE (Iframe, completion only)</option>
                            <option value="INCENTIVIZED">INCENTIVIZED (SCORM + scoring)</option>
                        </select>
                        <input
                            type="number"
                            min="1"
                            value={formData.scormPackageVersion}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    scormPackageVersion: parseInt(e.target.value || '1', 10),
                                }))
                            }
                            placeholder="SCORM package version"
                            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                            disabled={!formData.isIncentivized}
                        />
                        <select
                            value={formData.scormVersion}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    scormVersion: e.target.value as 'SCORM_12' | 'SCORM_2004',
                                }))
                            }
                            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                            disabled={!formData.isIncentivized}
                        >
                            <option value="SCORM_12">SCORM 1.2</option>
                            <option value="SCORM_2004">SCORM 2004</option>
                        </select>
                        <input
                            value={formData.scormLaunchUrl}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, scormLaunchUrl: e.target.value }))
                            }
                            placeholder="SCORM launch URL (e.g. /scorm/12/1/index.html)"
                            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                            disabled={!formData.isIncentivized}
                        />
                        <input
                            value={formData.scormManifestPath}
                            onChange={(e) =>
                                setFormData((prev) => ({ ...prev, scormManifestPath: e.target.value }))
                            }
                            placeholder="SCORM manifest path (optional)"
                            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg md:col-span-2"
                            disabled={!formData.isIncentivized}
                        />
                        <input
                            type="file"
                            accept=".zip,application/zip"
                            className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg md:col-span-2"
                            disabled={!formData.isIncentivized}
                            onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                setScormZipFile(file);
                            }}
                        />
                    </div>
                    <p className="text-xs text-gray-400">
                        For incentivized courses, upload a Synthesia SCORM zip package or provide a launch URL.
                    </p>
                </section>

                {formData.isIncentivized && (
                    <section className="bg-gray-800 p-5 rounded-xl space-y-4">
                        <h2 className="text-xl font-semibold">Points Configuration</h2>
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                            <input
                                type="number"
                                min="0"
                                value={formData.completionPoints}
                                onChange={(e) =>
                                    setFormData((p) => ({
                                        ...p,
                                        completionPoints: parseInt(e.target.value || '0', 10),
                                    }))
                                }
                                placeholder="Completion Points"
                                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                            />
                        </div>
                    </section>
                )}

                <section className="bg-gray-800 p-5 rounded-xl space-y-4">
                    <h2 className="text-xl font-semibold">Objectives</h2>
                    {formData.objectives.map((value, index) => (
                        <div key={`objective-${index}`} className="flex gap-2">
                            <input
                                value={value}
                                onChange={(e) => updateArrayField('objectives', index, e.target.value)}
                                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                                placeholder={`Objective ${index + 1}`}
                            />
                            <button
                                type="button"
                                onClick={() => removeArrayItem('objectives', index)}
                                className="px-3 py-2 bg-red-500/20 text-red-300 rounded-lg"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => addArrayItem('objectives')}
                        className="px-3 py-2 bg-gray-700 rounded-lg"
                    >
                        Add objective
                    </button>
                </section>

                <section className="bg-gray-800 p-5 rounded-xl space-y-4">
                    <h2 className="text-xl font-semibold">Prerequisites</h2>
                    {formData.prerequisites.map((value, index) => (
                        <div key={`prereq-${index}`} className="flex gap-2">
                            <input
                                value={value}
                                onChange={(e) => updateArrayField('prerequisites', index, e.target.value)}
                                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                                placeholder={`Prerequisite ${index + 1}`}
                            />
                            <button
                                type="button"
                                onClick={() => removeArrayItem('prerequisites', index)}
                                className="px-3 py-2 bg-red-500/20 text-red-300 rounded-lg"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => addArrayItem('prerequisites')}
                        className="px-3 py-2 bg-gray-700 rounded-lg"
                    >
                        Add prerequisite
                    </button>
                </section>

                <section className="bg-gray-800 p-5 rounded-xl space-y-4">
                    <h2 className="text-xl font-semibold">Key Takeaways</h2>
                    {formData.keyTakeaways.map((value, index) => (
                        <div key={`takeaway-${index}`} className="flex gap-2">
                            <textarea
                                value={value}
                                onChange={(e) => {
                                    const next = [...formData.keyTakeaways];
                                    next[index] = e.target.value;
                                    setFormData((p) => ({ ...p, keyTakeaways: next }));
                                }}
                                className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg resize-y"
                                rows={3}
                                placeholder={`Takeaway ${index + 1}`}
                            />
                            <button
                                type="button"
                                onClick={() => setFormData((p) => ({ ...p, keyTakeaways: p.keyTakeaways.filter((_, i) => i !== index) }))}
                                className="px-3 py-2 bg-red-500/20 text-red-300 rounded-lg"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, keyTakeaways: [...p.keyTakeaways, ''] }))}
                        className="px-3 py-2 bg-gray-700 rounded-lg"
                    >
                        Add takeaway
                    </button>
                </section>

                <section className="bg-gray-800 p-5 rounded-xl space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">
                            {formData.isIncentivized ? 'Lessons (Optional for incentivized)' : 'Lessons'}
                        </h2>
                        <button
                            type="button"
                            onClick={addLesson}
                            className="px-3 py-2 bg-blue-600 rounded-lg"
                            disabled={formData.isIncentivized}
                        >
                            Add lesson
                        </button>
                    </div>
                    {formData.isIncentivized && (
                        <p className="text-xs text-gray-400">
                            Incentivized mode plays the SCORM package. Lesson videos are not required.
                        </p>
                    )}
                    {lessons.map((lesson, lessonIndex) => (
                        <div key={`lesson-${lessonIndex}`} className="bg-gray-700/40 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold">Lesson {lessonIndex + 1}</h3>
                                <button
                                    type="button"
                                    onClick={() => removeLesson(lessonIndex)}
                                    className="px-2 py-1 bg-red-500/20 text-red-300 rounded-lg text-sm"
                                >
                                    Remove lesson
                                </button>
                            </div>
                            <input
                                value={lesson.title}
                                onChange={(e) => updateLesson(lessonIndex, 'title', e.target.value)}
                                placeholder="Lesson title"
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                            />
                            <textarea
                                value={lesson.description}
                                onChange={(e) => updateLesson(lessonIndex, 'description', e.target.value)}
                                placeholder="Lesson description"
                                rows={2}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                            />
                            {formData.isIncentivized && (
                                <input
                                    type="number"
                                    min="0"
                                    value={lesson.watchPoints}
                                    onChange={(e) =>
                                        updateLesson(lessonIndex, 'watchPoints', parseInt(e.target.value || '0', 10))
                                    }
                                    placeholder="Watch points"
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                                />
                            )}

                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-gray-300">Videos (Synthesia URLs)</p>
                                    <button
                                        type="button"
                                        onClick={() => addLessonVideo(lessonIndex)}
                                        className="px-2 py-1 bg-gray-600 rounded-lg text-sm"
                                    >
                                        Add video
                                    </button>
                                </div>
                                {lesson.videos.map((video, videoIndex) => (
                                    <div key={`lesson-${lessonIndex}-video-${videoIndex}`} className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                        <select
                                            value={video.language}
                                            onChange={(e) =>
                                                updateLessonVideo(lessonIndex, videoIndex, 'language', e.target.value)
                                            }
                                            className="px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                                        >
                                            {LANGUAGES.map((lang) => (
                                                <option key={lang.code} value={lang.code}>
                                                    {lang.label}
                                                </option>
                                            ))}
                                        </select>
                                        <input
                                            value={video.label}
                                            onChange={(e) =>
                                                updateLessonVideo(lessonIndex, videoIndex, 'label', e.target.value)
                                            }
                                            placeholder="Label"
                                            className="px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                                        />
                                        <input
                                            value={video.url}
                                            onChange={(e) =>
                                                updateLessonVideo(lessonIndex, videoIndex, 'url', e.target.value)
                                            }
                                            placeholder="https://share.synthesia.io/..."
                                            className="px-2 py-2 bg-gray-700 border border-gray-600 rounded-lg md:col-span-2"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeLessonVideo(lessonIndex, videoIndex)}
                                            className="px-2 py-2 bg-red-500/20 text-red-300 rounded-lg md:col-span-4"
                                        >
                                            Remove video
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {lessons.length === 0 && <p className="text-gray-400 text-sm">No lessons added yet.</p>}
                </section>

                <div className="flex gap-3">
                    <button
                        disabled={loading}
                        type="submit"
                        className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-semibold"
                    >
                        {loading ? 'Processing...' : 'Create Course'}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-5 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
