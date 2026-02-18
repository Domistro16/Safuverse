'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface LessonVideo {
    id: string;
    language: string;
    label: string;
    storageKey: string;
    signedUrl?: string | null;
}

interface Lesson {
    id: string;
    title: string;
    description: string | null;
    orderIndex: number;
    watchPoints: number;
    videos: LessonVideo[];
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
    keyTakeaways: string[];
    isIncentivized: boolean;
    scormVersion: 'SCORM_12' | 'SCORM_2004' | null;
    scormLaunchUrl: string | null;
    scormManifestPath: string | null;
    scormPackageVersion: number;
    lessons: Lesson[];
}

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

export default function EditCoursePage() {
    const params = useParams();
    const courseId = params.id as string;
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'details' | 'lessons'>('details');
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [newLessonDescription, setNewLessonDescription] = useState('');
    const [newLessonWatchPoints, setNewLessonWatchPoints] = useState(10);
    const [newLessonVideoUrl, setNewLessonVideoUrl] = useState('');
    const [newLessonLanguage, setNewLessonLanguage] = useState('en');
    const [newLessonLabel, setNewLessonLabel] = useState('English');
    const [pendingVideo, setPendingVideo] = useState<Record<string, { language: string; label: string; url: string }>>({});
    const [scormZipFile, setScormZipFile] = useState<File | null>(null);

    useEffect(() => {
        void fetchCourse();
    }, [courseId]);

    async function fetchCourse() {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/admin/courses/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to load course');
            const data = await res.json();
            setCourse(data.course);
        } catch (e) {
            alert((e as Error).message);
        } finally {
            setLoading(false);
        }
    }

    async function saveCourse() {
        if (!course) return;
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`/api/admin/courses/${course.id}`, {
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
                keyTakeaways: course.keyTakeaways,
                isIncentivized: course.isIncentivized,
                scormVersion: course.scormVersion,
                scormLaunchUrl: course.scormLaunchUrl,
                scormManifestPath: course.scormManifestPath,
                scormPackageVersion: course.scormPackageVersion,
            }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(err.error || 'Failed to save course');
            return;
        }
        alert('Course saved');
        await fetchCourse();
    }

    async function uploadScormPackage() {
        if (!course) return;
        if (!course.isIncentivized) {
            alert('Enable incentivized mode before uploading SCORM.');
            return;
        }

        const token = localStorage.getItem('auth_token');
        const formData = new FormData();
        formData.append('packageVersion', String(course.scormPackageVersion || 1));
        formData.append('scormVersion', course.scormVersion || 'SCORM_12');
        formData.append('launchUrl', course.scormLaunchUrl || '');
        formData.append('manifestPath', course.scormManifestPath || '');
        if (scormZipFile) {
            formData.append('scormZip', scormZipFile);
        }

        const res = await fetch(`/api/admin/courses/${course.id}/scorm`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            alert(data.error || 'Failed to upload SCORM package');
            return;
        }

        setScormZipFile(null);
        alert('SCORM package configured');
        await fetchCourse();
    }

    async function addLesson() {
        if (!course || !newLessonTitle.trim()) return;
        if (newLessonVideoUrl && !newLessonVideoUrl.startsWith('https://share.synthesia.io/')) {
            alert('Use a valid Synthesia URL.');
            return;
        }
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`/api/admin/courses/${course.id}/lessons`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                title: newLessonTitle,
                description: newLessonDescription,
                watchPoints: newLessonWatchPoints,
                synthesiaUrl: newLessonVideoUrl || undefined,
                language: newLessonLanguage,
                label: newLessonLabel,
            }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(err.error || 'Failed to add lesson');
            return;
        }
        setNewLessonTitle('');
        setNewLessonDescription('');
        setNewLessonWatchPoints(10);
        setNewLessonVideoUrl('');
        await fetchCourse();
    }

    async function saveLesson(lesson: Lesson) {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                title: lesson.title,
                description: lesson.description,
                watchPoints: lesson.watchPoints,
            }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(err.error || 'Failed to save lesson');
            return;
        }
        await fetchCourse();
    }

    async function deleteLesson(lessonId: string) {
        if (!confirm('Delete this lesson?')) return;
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`/api/admin/lessons/${lessonId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            alert('Failed to delete lesson');
            return;
        }
        await fetchCourse();
    }

    async function addVideo(lessonId: string) {
        const data = pendingVideo[lessonId];
        if (!data?.url?.trim()) return;
        if (!data.url.startsWith('https://share.synthesia.io/')) {
            alert('Use a valid Synthesia URL.');
            return;
        }
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`/api/admin/lessons/${lessonId}/videos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                language: data.language,
                label: data.label,
                synthesiaUrl: data.url,
            }),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            alert(err.error || 'Failed to add video');
            return;
        }
        setPendingVideo((prev) => ({ ...prev, [lessonId]: { language: 'en', label: 'English', url: '' } }));
        await fetchCourse();
    }

    async function deleteVideo(lessonId: string, videoId: string) {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`/api/admin/lessons/${lessonId}/videos?videoId=${videoId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            alert('Failed to delete video');
            return;
        }
        await fetchCourse();
    }

    if (loading) return <div className="text-white p-6">Loading...</div>;
    if (!course) return <div className="text-red-400 p-6">Course not found</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 text-white">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <Link href="/admin/courses" className="text-blue-400 hover:underline text-sm">Back to courses</Link>
                    <h1 className="text-3xl font-bold mt-2">Edit Course</h1>
                </div>
                <button onClick={saveCourse} className="px-4 py-2 bg-blue-600 rounded-lg">Save Course</button>
            </div>

            <div className="flex gap-3 mb-6">
                <button onClick={() => setActiveTab('details')} className={`px-4 py-2 rounded-lg ${activeTab === 'details' ? 'bg-blue-600' : 'bg-gray-700'}`}>Details</button>
                <button onClick={() => setActiveTab('lessons')} className={`px-4 py-2 rounded-lg ${activeTab === 'lessons' ? 'bg-blue-600' : 'bg-gray-700'}`}>Lessons</button>
            </div>

            {activeTab === 'details' && (
                <div className="space-y-4 bg-gray-800 rounded-xl p-5">
                    <input value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })} className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600" placeholder="Title" />
                    <textarea value={course.description} onChange={(e) => setCourse({ ...course, description: e.target.value })} className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600" rows={3} placeholder="Description" />
                    <textarea value={course.longDescription || ''} onChange={(e) => setCourse({ ...course, longDescription: e.target.value })} className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600" rows={4} placeholder="Long description" />
                    {course.isIncentivized && (
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-3">
                            <input type="number" min="0" value={course.completionPoints} onChange={(e) => setCourse({ ...course, completionPoints: parseInt(e.target.value || '0', 10) })} className="px-3 py-2 bg-gray-700 rounded-lg border border-gray-600" placeholder="Completion points" />
                        </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select
                            value={course.isIncentivized ? 'INCENTIVIZED' : 'FREE'}
                            onChange={(e) => {
                                const isIncentivized = e.target.value === 'INCENTIVIZED';
                                setCourse({
                                    ...course,
                                    isIncentivized,
                                    completionPoints: isIncentivized ? course.completionPoints : 0,
                                });
                            }}
                            className="px-3 py-2 bg-gray-700 rounded-lg border border-gray-600"
                        >
                            <option value="FREE">FREE</option>
                            <option value="INCENTIVIZED">INCENTIVIZED</option>
                        </select>
                        <select
                            value={course.scormVersion || 'SCORM_12'}
                            onChange={(e) => setCourse({ ...course, scormVersion: e.target.value as 'SCORM_12' | 'SCORM_2004' })}
                            className="px-3 py-2 bg-gray-700 rounded-lg border border-gray-600"
                            disabled={!course.isIncentivized}
                        >
                            <option value="SCORM_12">SCORM 1.2</option>
                            <option value="SCORM_2004">SCORM 2004</option>
                        </select>
                        <input
                            value={course.scormLaunchUrl || ''}
                            onChange={(e) => setCourse({ ...course, scormLaunchUrl: e.target.value })}
                            className="px-3 py-2 bg-gray-700 rounded-lg border border-gray-600"
                            placeholder="SCORM launch URL"
                            disabled={!course.isIncentivized}
                        />
                        <input
                            value={course.scormManifestPath || ''}
                            onChange={(e) => setCourse({ ...course, scormManifestPath: e.target.value })}
                            className="px-3 py-2 bg-gray-700 rounded-lg border border-gray-600"
                            placeholder="SCORM manifest path"
                            disabled={!course.isIncentivized}
                        />
                        <input
                            type="number"
                            min="1"
                            value={course.scormPackageVersion || 1}
                            onChange={(e) => setCourse({ ...course, scormPackageVersion: parseInt(e.target.value || '1', 10) })}
                            className="px-3 py-2 bg-gray-700 rounded-lg border border-gray-600"
                            placeholder="SCORM package version"
                            disabled={!course.isIncentivized}
                        />
                        <input
                            type="file"
                            accept=".zip,application/zip"
                            className="px-3 py-2 bg-gray-700 rounded-lg border border-gray-600"
                            onChange={(e) => setScormZipFile(e.target.files?.[0] || null)}
                            disabled={!course.isIncentivized}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button onClick={uploadScormPackage} className="px-3 py-2 bg-emerald-600 rounded-lg text-sm">
                            Upload/Apply SCORM
                        </button>
                        <a
                            href={`/api/admin/courses/${course.id}/leaderboard/export?top=100`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-2 bg-gray-700 rounded-lg text-sm"
                        >
                            Export Top 100 CSV
                        </a>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-semibold">Key Takeaways</h3>
                        {(course.keyTakeaways || []).map((value, index) => (
                            <div key={`takeaway-${index}`} className="flex gap-2">
                                <textarea
                                    value={value}
                                    onChange={(e) => {
                                        const next = [...(course.keyTakeaways || [])];
                                        next[index] = e.target.value;
                                        setCourse({ ...course, keyTakeaways: next });
                                    }}
                                    className="flex-1 px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 resize-y"
                                    rows={3}
                                    placeholder={`Takeaway ${index + 1}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setCourse({ ...course, keyTakeaways: (course.keyTakeaways || []).filter((_, i) => i !== index) })}
                                    className="px-2 py-1 bg-red-500/20 text-red-300 rounded-lg text-sm"
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => setCourse({ ...course, keyTakeaways: [...(course.keyTakeaways || []), ''] })}
                            className="px-3 py-2 bg-gray-700 rounded-lg text-sm"
                        >
                            Add takeaway
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'lessons' && (
                <div className="space-y-5">
                    <div className="bg-gray-800 rounded-xl p-5 space-y-3">
                        <h2 className="text-xl font-semibold">Add Lesson</h2>
                        <input value={newLessonTitle} onChange={(e) => setNewLessonTitle(e.target.value)} className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600" placeholder="Lesson title" />
                        <textarea value={newLessonDescription} onChange={(e) => setNewLessonDescription(e.target.value)} className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600" rows={2} placeholder="Lesson description" />
                        {course.isIncentivized && (
                            <input type="number" min="0" value={newLessonWatchPoints} onChange={(e) => setNewLessonWatchPoints(parseInt(e.target.value || '0', 10))} className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600" placeholder="Watch points" />
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <select value={newLessonLanguage} onChange={(e) => { const code = e.target.value; const found = LANGUAGES.find((l) => l.code === code); setNewLessonLanguage(code); setNewLessonLabel(found?.label || 'English'); }} className="px-3 py-2 bg-gray-700 rounded-lg border border-gray-600">
                                {LANGUAGES.map((lang) => <option key={lang.code} value={lang.code}>{lang.label}</option>)}
                            </select>
                            <input value={newLessonLabel} onChange={(e) => setNewLessonLabel(e.target.value)} className="px-3 py-2 bg-gray-700 rounded-lg border border-gray-600" placeholder="Video label" />
                            <input value={newLessonVideoUrl} onChange={(e) => setNewLessonVideoUrl(e.target.value)} className="px-3 py-2 bg-gray-700 rounded-lg border border-gray-600" placeholder="https://share.synthesia.io/..." />
                        </div>
                        <button onClick={addLesson} className="px-4 py-2 bg-blue-600 rounded-lg">Add lesson</button>
                    </div>

                    {course.lessons.sort((a, b) => a.orderIndex - b.orderIndex).map((lesson, index) => (
                        <div key={lesson.id} className="bg-gray-800 rounded-xl p-5 space-y-3">
                            <div className="flex justify-between items-center">
                                <h3 className="font-semibold">Lesson {index + 1}</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => saveLesson(lesson)} className="px-3 py-2 bg-blue-600 rounded-lg text-sm">Save</button>
                                    <button onClick={() => deleteLesson(lesson.id)} className="px-3 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm">Delete</button>
                                </div>
                            </div>
                            <input value={lesson.title} onChange={(e) => setCourse({ ...course, lessons: course.lessons.map((l) => l.id === lesson.id ? { ...l, title: e.target.value } : l) })} className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600" />
                            <textarea value={lesson.description || ''} onChange={(e) => setCourse({ ...course, lessons: course.lessons.map((l) => l.id === lesson.id ? { ...l, description: e.target.value } : l) })} className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600" rows={2} />
                            {course.isIncentivized && (
                                <input type="number" min="0" value={lesson.watchPoints} onChange={(e) => setCourse({ ...course, lessons: course.lessons.map((l) => l.id === lesson.id ? { ...l, watchPoints: parseInt(e.target.value || '0', 10) } : l) })} className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600" />
                            )}

                            <div className="space-y-2">
                                {lesson.videos.map((video) => (
                                    <div key={video.id} className="bg-gray-700/50 rounded-lg p-3">
                                        <div className="flex justify-between items-center">
                                            <span>{video.label} ({video.language})</span>
                                            <button onClick={() => deleteVideo(lesson.id, video.id)} className="px-2 py-1 bg-red-500/20 text-red-300 rounded-lg text-xs">Delete</button>
                                        </div>
                                        <a href={video.signedUrl || video.storageKey} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline break-all text-sm">
                                            {video.signedUrl || video.storageKey}
                                        </a>
                                    </div>
                                ))}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                    <select value={pendingVideo[lesson.id]?.language || 'en'} onChange={(e) => { const code = e.target.value; const found = LANGUAGES.find((l) => l.code === code); setPendingVideo((prev) => ({ ...prev, [lesson.id]: { language: code, label: found?.label || 'English', url: prev[lesson.id]?.url || '' } })); }} className="px-3 py-2 bg-gray-700 rounded-lg border border-gray-600">
                                        {LANGUAGES.map((lang) => <option key={lang.code} value={lang.code}>{lang.label}</option>)}
                                    </select>
                                    <input value={pendingVideo[lesson.id]?.label || 'English'} onChange={(e) => setPendingVideo((prev) => ({ ...prev, [lesson.id]: { language: prev[lesson.id]?.language || 'en', label: e.target.value, url: prev[lesson.id]?.url || '' } }))} className="px-3 py-2 bg-gray-700 rounded-lg border border-gray-600" placeholder="Label" />
                                    <input value={pendingVideo[lesson.id]?.url || ''} onChange={(e) => setPendingVideo((prev) => ({ ...prev, [lesson.id]: { language: prev[lesson.id]?.language || 'en', label: prev[lesson.id]?.label || 'English', url: e.target.value } }))} className="px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 md:col-span-2" placeholder="https://share.synthesia.io/..." />
                                </div>
                                <button onClick={() => addVideo(lesson.id)} className="px-3 py-2 bg-gray-700 rounded-lg text-sm">Add video</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
