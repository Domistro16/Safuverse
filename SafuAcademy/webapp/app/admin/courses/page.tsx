'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Course {
    id: number;
    title: string;
    description: string;
    level: string;
    isPublished: boolean;
    isActive: boolean;
    totalLessons: number;
    requiredPoints: number;
    onChainSynced: boolean;
    _count: {
        lessons: number;
        userCourses: number;
    };
}

export default function AdminCoursesPage() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    async function fetchCourses() {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/courses', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to fetch courses');

            const data = await res.json();
            setCourses(data.courses);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    async function togglePublish(courseId: number, currentStatus: boolean) {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/admin/courses/${courseId}/publish`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                const data = await res.json();
                alert(data.error || 'Failed to toggle publish status');
                return;
            }

            // Refresh list
            fetchCourses();
        } catch (err) {
            alert((err as Error).message);
        }
    }

    async function deleteCourse(courseId: number, title: string) {
        if (!confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/admin/courses/${courseId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to delete course');

            // Refresh list
            fetchCourses();
        } catch (err) {
            alert((err as Error).message);
        }
    }

    if (loading) {
        return <div className="text-white">Loading courses...</div>;
    }

    if (error) {
        return <div className="text-red-500">Error: {error}</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Courses</h1>
                <Link
                    href="/admin/courses/new"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    + Create Course
                </Link>
            </div>

            <div className="bg-gray-800 rounded-xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="px-6 py-4 text-gray-300 font-medium">ID</th>
                            <th className="px-6 py-4 text-gray-300 font-medium">Title</th>
                            <th className="px-6 py-4 text-gray-300 font-medium">Level</th>
                            <th className="px-6 py-4 text-gray-300 font-medium text-center">Lessons</th>
                            <th className="px-6 py-4 text-gray-300 font-medium text-center">Enrollments</th>
                            <th className="px-6 py-4 text-gray-300 font-medium text-center">Points Req.</th>
                            <th className="px-6 py-4 text-gray-300 font-medium text-center">Status</th>
                            <th className="px-6 py-4 text-gray-300 font-medium text-center">On-Chain</th>
                            <th className="px-6 py-4 text-gray-300 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {courses.map((course) => (
                            <tr key={course.id} className="border-t border-gray-700">
                                <td className="px-6 py-4 text-gray-400">{course.id}</td>
                                <td className="px-6 py-4 text-white font-medium">{course.title}</td>
                                <td className="px-6 py-4 text-gray-300">{course.level || 'N/A'}</td>
                                <td className="px-6 py-4 text-gray-300 text-center">{course._count.lessons}</td>
                                <td className="px-6 py-4 text-gray-300 text-center">{course._count.userCourses}</td>
                                <td className="px-6 py-4 text-gray-300 text-center">
                                    {course.requiredPoints > 0 ? course.requiredPoints : 'Free'}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded text-xs ${course.isPublished
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-yellow-500/20 text-yellow-400'
                                        }`}>
                                        {course.isPublished ? 'Published' : 'Draft'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded text-xs ${course.onChainSynced
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : 'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {course.onChainSynced ? 'Synced' : 'Not Synced'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Link
                                            href={`/admin/courses/${course.id}`}
                                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                                        >
                                            Edit
                                        </Link>
                                        <button
                                            onClick={() => togglePublish(course.id, course.isPublished)}
                                            className={`px-3 py-1 text-sm rounded transition-colors ${course.isPublished
                                                    ? 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400'
                                                    : 'bg-green-600/20 hover:bg-green-600/30 text-green-400'
                                                }`}
                                        >
                                            {course.isPublished ? 'Unpublish' : 'Publish'}
                                        </button>
                                        <button
                                            onClick={() => deleteCourse(course.id, course.title)}
                                            className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 text-sm rounded transition-colors"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {courses.length === 0 && (
                            <tr>
                                <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                                    No courses yet. Create your first course!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
