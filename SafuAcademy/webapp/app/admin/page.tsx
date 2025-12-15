'use client';

import { useEffect, useState } from 'react';

interface Stats {
    totalUsers: number;
    totalCourses: number;
    totalEnrollments: number;
    totalCompletions: number;
    recentEnrollments: number;
    recentCompletions: number;
    courseStats: {
        courseId: number;
        title: string;
        isPublished: boolean;
        lessons: number;
        enrollments: number;
        completions: number;
    }[];
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchStats() {
            try {
                const token = localStorage.getItem('auth_token');
                const res = await fetch('/api/admin/stats', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!res.ok) throw new Error('Failed to fetch stats');

                const data = await res.json();
                setStats(data);
            } catch (err) {
                setError((err as Error).message);
            } finally {
                setLoading(false);
            }
        }

        fetchStats();
    }, []);

    if (loading) {
        return <div className="text-white">Loading dashboard...</div>;
    }

    if (error) {
        return <div className="text-red-500">Error: {error}</div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-8">Dashboard</h1>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Users" value={stats?.totalUsers || 0} icon="👥" />
                <StatCard title="Total Courses" value={stats?.totalCourses || 0} icon="📚" />
                <StatCard title="Total Enrollments" value={stats?.totalEnrollments || 0} icon="📝" />
                <StatCard title="Completions" value={stats?.totalCompletions || 0} icon="🎓" />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Last 7 Days</h2>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">New Enrollments</span>
                            <span className="text-green-400 font-semibold">+{stats?.recentEnrollments || 0}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400">Completions</span>
                            <span className="text-blue-400 font-semibold">+{stats?.recentCompletions || 0}</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6">
                    <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
                    <div className="space-y-2">
                        <a
                            href="/admin/courses/new"
                            className="block w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-center transition-colors"
                        >
                            Create New Course
                        </a>
                        <a
                            href="/admin/courses"
                            className="block w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-center transition-colors"
                        >
                            Manage Courses
                        </a>
                    </div>
                </div>
            </div>

            {/* Course Stats Table */}
            <div className="bg-gray-800 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Course Performance</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-700">
                                <th className="pb-3 text-gray-400 font-medium">Course</th>
                                <th className="pb-3 text-gray-400 font-medium">Status</th>
                                <th className="pb-3 text-gray-400 font-medium text-center">Lessons</th>
                                <th className="pb-3 text-gray-400 font-medium text-center">Enrollments</th>
                                <th className="pb-3 text-gray-400 font-medium text-center">Completions</th>
                                <th className="pb-3 text-gray-400 font-medium text-center">Rate</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stats?.courseStats.map((course) => (
                                <tr key={course.courseId} className="border-b border-gray-700/50">
                                    <td className="py-3 text-white">{course.title}</td>
                                    <td className="py-3">
                                        <span className={`px-2 py-1 rounded text-xs ${course.isPublished
                                                ? 'bg-green-500/20 text-green-400'
                                                : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {course.isPublished ? 'Published' : 'Draft'}
                                        </span>
                                    </td>
                                    <td className="py-3 text-gray-300 text-center">{course.lessons}</td>
                                    <td className="py-3 text-gray-300 text-center">{course.enrollments}</td>
                                    <td className="py-3 text-gray-300 text-center">{course.completions}</td>
                                    <td className="py-3 text-gray-300 text-center">
                                        {course.enrollments > 0
                                            ? `${Math.round((course.completions / course.enrollments) * 100)}%`
                                            : '-'}
                                    </td>
                                </tr>
                            ))}
                            {(!stats?.courseStats || stats.courseStats.length === 0) && (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-400">
                                        No courses yet. Create your first course!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: string }) {
    return (
        <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-sm">{title}</p>
                    <p className="text-3xl font-bold text-white mt-1">{value}</p>
                </div>
                <span className="text-4xl">{icon}</span>
            </div>
        </div>
    );
}
