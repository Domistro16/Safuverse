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
    courseId: number;
    title: string;
    description: string | null;
    orderIndex: number;
    watchPoints: number;
    course: { id: number; title: string };
    videos: LessonVideo[];
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

export default function EditLessonPage() {
    const params = useParams();
    const lessonId = params.id as string;

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newLanguage, setNewLanguage] = useState('en');
    const [newLabel, setNewLabel] = useState('English');
    const [newUrl, setNewUrl] = useState('');

    useEffect(() => {
        void fetchLesson();
    }, [lessonId]);

    async function fetchLesson() {
        try {
            setLoading(true);
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/admin/lessons/${lessonId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to fetch lesson');
            const data = await res.json();
            setLesson(data.lesson);
        } catch (e) {
            alert((e as Error).message);
        } finally {
            setLoading(false);
        }
    }

    async function saveLesson() {
        if (!lesson) return;
        setSaving(true);
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/admin/lessons/${lessonId}`, {
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
            if (!res.ok) throw new Error('Failed to save lesson');
            alert('Lesson saved');
            await fetchLesson();
        } catch (e) {
            alert((e as Error).message);
        } finally {
            setSaving(false);
        }
    }

    async function addVideo() {
        if (!newUrl.trim()) return;
        if (!newUrl.startsWith('https://share.synthesia.io/')) {
            alert('Use a valid Synthesia URL.');
            return;
        }
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/admin/lessons/${lessonId}/videos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    language: newLanguage,
                    label: newLabel,
                    synthesiaUrl: newUrl.trim(),
                }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || 'Failed to add video');
            }
            setNewUrl('');
            await fetchLesson();
        } catch (e) {
            alert((e as Error).message);
        }
    }

    async function deleteVideo(videoId: string) {
        if (!confirm('Delete this video?')) return;
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/admin/lessons/${lessonId}/videos?videoId=${videoId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Failed to delete video');
            await fetchLesson();
        } catch (e) {
            alert((e as Error).message);
        }
    }

    if (loading) return <div className="text-white p-6">Loading lesson...</div>;
    if (!lesson) return <div className="text-red-400 p-6">Lesson not found</div>;

    return (
        <div className="max-w-4xl mx-auto p-6 text-white">
            <div className="mb-6">
                <Link href={`/admin/courses/${lesson.courseId}`} className="text-blue-400 hover:underline text-sm">
                    Back to {lesson.course.title}
                </Link>
                <h1 className="text-3xl font-bold mt-2">Edit Lesson</h1>
            </div>

            <div className="bg-gray-800 rounded-xl p-5 space-y-4">
                <input
                    value={lesson.title}
                    onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    placeholder="Title"
                />
                <textarea
                    value={lesson.description || ''}
                    onChange={(e) => setLesson({ ...lesson, description: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    rows={3}
                    placeholder="Description"
                />
                <input
                    type="number"
                    min="0"
                    value={lesson.watchPoints}
                    onChange={(e) => setLesson({ ...lesson, watchPoints: parseInt(e.target.value || '0', 10) })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    placeholder="Watch points"
                />
                <button
                    onClick={saveLesson}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg"
                >
                    {saving ? 'Saving...' : 'Save Lesson'}
                </button>
            </div>

            <div className="bg-gray-800 rounded-xl p-5 space-y-4 mt-6">
                <h2 className="text-xl font-semibold">Synthesia Videos</h2>
                {lesson.videos.length === 0 && <p className="text-gray-400">No videos yet.</p>}
                {lesson.videos.map((video) => (
                    <div key={video.id} className="bg-gray-700/50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                            <span>{video.label} ({video.language})</span>
                            <button
                                onClick={() => deleteVideo(video.id)}
                                className="px-2 py-1 bg-red-500/20 text-red-300 rounded-lg text-xs"
                            >
                                Delete
                            </button>
                        </div>
                        <a
                            href={video.signedUrl || video.storageKey}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-400 hover:underline text-sm break-all"
                        >
                            {video.signedUrl || video.storageKey}
                        </a>
                    </div>
                ))}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <select
                        value={newLanguage}
                        onChange={(e) => {
                            const code = e.target.value;
                            const found = LANGUAGES.find((l) => l.code === code);
                            setNewLanguage(code);
                            setNewLabel(found?.label || 'English');
                        }}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                    >
                        {LANGUAGES.map((lang) => (
                            <option key={lang.code} value={lang.code}>
                                {lang.label}
                            </option>
                        ))}
                    </select>
                    <input
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                        placeholder="Video label"
                    />
                    <input
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg"
                        placeholder="https://share.synthesia.io/..."
                    />
                </div>
                <button onClick={addVideo} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">
                    Add Video
                </button>
            </div>
        </div>
    );
}
