'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Lesson {
    id: string;
    title: string;
    description: string | null;
    orderIndex: number;
    videoStorageKey: string | null;
    videoDuration: number;
    watchPoints: number;
    quiz: { id: string; passingScore: number; passPoints: number } | null;
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

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'lessons'>('details');

    // New lesson form
    const [newLessonTitle, setNewLessonTitle] = useState('');
    const [newLessonType, setNewLessonType] = useState('VIDEO');
    const [addingLesson, setAddingLesson] = useState(false);

    useEffect(() => {
        fetchCourse();
    }, [courseId]);

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
            formData.append('type', newLessonType);

            const res = await fetch(`/api/admin/courses/${courseId}/lessons`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) throw new Error('Failed to add lesson');

            setNewLessonTitle('');
            fetchCourse();
        } catch (err) {
            alert((err as Error).message);
        } finally {
            setAddingLesson(false);
        }
    }

    async function deleteLesson(lessonId: string) {
        if (!confirm('Delete this lesson?')) return;

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

    if (loading) {
        return <div className="text-white">Loading course...</div>;
    }

    if (error || !course) {
        return <div className="text-red-500">Error: {error || 'Course not found'}</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">Edit Course</h1>
                    <p className="text-gray-400">ID: {course.id}</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <Link
                        href="/admin/courses"
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        Back to List
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

            {/* Details Tab */}
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
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 mb-2">Description</label>
                            <textarea
                                value={course.description}
                                onChange={(e) => setCourse({ ...course, description: e.target.value })}
                                rows={2}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 mb-2">Level</label>
                                <select
                                    value={course.level || ''}
                                    onChange={(e) => setCourse({ ...course, level: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="BEGINNER">Beginner</option>
                                    <option value="INTERMEDIATE">Intermediate</option>
                                    <option value="ADVANCED">Advanced</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-2">Category</label>
                                <input
                                    type="text"
                                    value={course.category || ''}
                                    onChange={(e) => setCourse({ ...course, category: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-gray-400 mb-2">Completion Points</label>
                                <input
                                    type="number"
                                    value={course.completionPoints}
                                    onChange={(e) => setCourse({ ...course, completionPoints: parseInt(e.target.value) || 0 })}
                                    min="0"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                                <p className="text-gray-500 text-xs mt-1">Awarded on completion</p>
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-2">Min Points to Access</label>
                                <input
                                    type="number"
                                    value={course.minPointsToAccess}
                                    onChange={(e) => setCourse({ ...course, minPointsToAccess: parseInt(e.target.value) || 0 })}
                                    min="0"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                                <p className="text-gray-500 text-xs mt-1">Required (not deducted)</p>
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-2">Enrollment Cost</label>
                                <input
                                    type="number"
                                    value={course.enrollmentCost}
                                    onChange={(e) => setCourse({ ...course, enrollmentCost: parseInt(e.target.value) || 0 })}
                                    min="0"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                                <p className="text-gray-500 text-xs mt-1">Deducted on enrollment</p>
                            </div>
                        </div>
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
                    {/* Add Lesson */}
                    <div className="bg-gray-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Add New Lesson</h2>
                        <div className="flex gap-4">
                            <input
                                type="text"
                                value={newLessonTitle}
                                onChange={(e) => setNewLessonTitle(e.target.value)}
                                placeholder="Lesson title"
                                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            />
                            <select
                                value={newLessonType}
                                onChange={(e) => setNewLessonType(e.target.value)}
                                className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            >
                                <option value="VIDEO">Video</option>
                                <option value="READING">Reading</option>
                                <option value="QUIZ">Quiz</option>
                            </select>
                            <button
                                onClick={addLesson}
                                disabled={addingLesson || !newLessonTitle.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                {addingLesson ? 'Adding...' : 'Add Lesson'}
                            </button>
                        </div>
                    </div>

                    {/* Lessons List */}
                    <div className="bg-gray-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-gray-300 font-medium w-16">#</th>
                                    <th className="px-6 py-4 text-gray-300 font-medium">Title</th>
                                    <th className="px-6 py-4 text-gray-300 font-medium">Type</th>
                                    <th className="px-6 py-4 text-gray-300 font-medium text-center">Video</th>
                                    <th className="px-6 py-4 text-gray-300 font-medium text-center">Quiz</th>
                                    <th className="px-6 py-4 text-gray-300 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {course.lessons.map((lesson) => (
                                    <tr key={lesson.id} className="border-t border-gray-700">
                                        <td className="px-6 py-4 text-gray-400">{lesson.orderIndex + 1}</td>
                                        <td className="px-6 py-4 text-white">{lesson.title}</td>
                                        <td className="px-6 py-4 text-gray-300">{lesson.videoDuration}s</td>
                                        <td className="px-6 py-4 text-center">
                                            {lesson.videoStorageKey ? (
                                                <span className="text-green-400">✓</span>
                                            ) : (
                                                <span className="text-gray-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {lesson.quiz ? (
                                                <span className="text-green-400">✓</span>
                                            ) : (
                                                <span className="text-gray-500">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <Link
                                                    href={`/admin/lessons/${lesson.id}`}
                                                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                                                >
                                                    Edit
                                                </Link>
                                                <button
                                                    onClick={() => deleteLesson(lesson.id)}
                                                    className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm rounded transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {course.lessons.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                            No lessons yet. Add your first lesson above!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
