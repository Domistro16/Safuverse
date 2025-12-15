'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Quiz {
    id: number;
    questions: { id?: number; question: string; options: string[]; correctIndex: number }[];
    passingScore: number;
    bonusPoints: number;
}

interface Lesson {
    id: number;
    courseId: number;
    title: string;
    description: string | null;
    order: number;
    type: string;
    contentUrl: string | null;
    videoStorageKey: string | null;
    videoDuration: number;
    watchPoints: number;
    pointsValue: number;
    quiz: Quiz | null;
    course: { id: number; title: string };
}

export default function EditLessonPage() {
    const params = useParams();
    const router = useRouter();
    const lessonId = params.id as string;
    const videoInputRef = useRef<HTMLInputElement>(null);

    const [lesson, setLesson] = useState<Lesson | null>(null);
    const [signedVideoUrl, setSignedVideoUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'quiz'>('details');

    // Quiz state
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [savingQuiz, setSavingQuiz] = useState(false);

    useEffect(() => {
        fetchLesson();
    }, [lessonId]);

    async function fetchLesson() {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/admin/lessons/${lessonId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to fetch lesson');

            const data = await res.json();
            setLesson(data.lesson);
            setSignedVideoUrl(data.signedVideoUrl);
            setQuiz(data.lesson.quiz);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        if (!lesson) return;
        setSaving(true);

        try {
            const token = localStorage.getItem('auth_token');
            const formData = new FormData();
            formData.append('title', lesson.title);
            formData.append('description', lesson.description || '');
            formData.append('type', lesson.type);
            formData.append('watchPoints', lesson.watchPoints.toString());
            formData.append('pointsValue', lesson.pointsValue.toString());

            const res = await fetch(`/api/admin/lessons/${lessonId}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) throw new Error('Failed to save lesson');

            alert('Lesson saved successfully!');
        } catch (err) {
            alert((err as Error).message);
        } finally {
            setSaving(false);
        }
    }

    async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingVideo(true);

        try {
            const token = localStorage.getItem('auth_token');
            const formData = new FormData();
            formData.append('video', file);

            const res = await fetch(`/api/admin/lessons/${lessonId}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) throw new Error('Failed to upload video');

            alert('Video uploaded successfully!');
            fetchLesson();
        } catch (err) {
            alert((err as Error).message);
        } finally {
            setUploadingVideo(false);
        }
    }

    async function saveQuiz() {
        if (!quiz) return;
        setSavingQuiz(true);

        try {
            const token = localStorage.getItem('auth_token');
            const isNew = !lesson?.quiz;

            const res = await fetch(`/api/admin/lessons/${lessonId}/quiz`, {
                method: isNew ? 'POST' : 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    questions: quiz.questions,
                    passingScore: quiz.passingScore,
                    bonusPoints: quiz.bonusPoints,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save quiz');
            }

            alert('Quiz saved successfully!');
            fetchLesson();
        } catch (err) {
            alert((err as Error).message);
        } finally {
            setSavingQuiz(false);
        }
    }

    async function deleteQuiz() {
        if (!confirm('Delete this quiz?')) return;

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/admin/lessons/${lessonId}/quiz`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to delete quiz');

            setQuiz(null);
            fetchLesson();
        } catch (err) {
            alert((err as Error).message);
        }
    }

    function addQuestion() {
        setQuiz((prev) => ({
            ...(prev || { id: 0, passingScore: 70, bonusPoints: 20, questions: [] }),
            questions: [
                ...(prev?.questions || []),
                { question: '', options: ['', '', '', ''], correctIndex: 0 },
            ],
        }));
    }

    function updateQuestion(index: number, field: string, value: string | number) {
        if (!quiz) return;
        const questions = [...quiz.questions];
        (questions[index] as Record<string, unknown>)[field] = value;
        setQuiz({ ...quiz, questions });
    }

    function updateOption(qIndex: number, oIndex: number, value: string) {
        if (!quiz) return;
        const questions = [...quiz.questions];
        questions[qIndex].options[oIndex] = value;
        setQuiz({ ...quiz, questions });
    }

    function removeQuestion(index: number) {
        if (!quiz) return;
        setQuiz({ ...quiz, questions: quiz.questions.filter((_, i) => i !== index) });
    }

    if (loading) {
        return <div className="text-white">Loading lesson...</div>;
    }

    if (error || !lesson) {
        return <div className="text-red-500">Error: {error || 'Lesson not found'}</div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <Link href={`/admin/courses/${lesson.courseId}`} className="text-blue-400 hover:underline text-sm">
                        ← Back to {lesson.course.title}
                    </Link>
                    <h1 className="text-3xl font-bold text-white mt-2">Edit Lesson</h1>
                    <p className="text-gray-400">Order: {lesson.order + 1}</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        {saving ? 'Saving...' : 'Save Lesson'}
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('details')}
                    className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'details' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                >
                    Lesson Details
                </button>
                <button
                    onClick={() => setActiveTab('quiz')}
                    className={`px-4 py-2 rounded-lg transition-colors ${activeTab === 'quiz' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                >
                    Quiz {quiz && `(${quiz.questions.length} questions)`}
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
                                value={lesson.title}
                                onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-400 mb-2">Description</label>
                            <textarea
                                value={lesson.description || ''}
                                onChange={(e) => setLesson({ ...lesson, description: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-gray-400 mb-2">Type</label>
                                <select
                                    value={lesson.type}
                                    onChange={(e) => setLesson({ ...lesson, type: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                >
                                    <option value="VIDEO">Video</option>
                                    <option value="READING">Reading</option>
                                    <option value="QUIZ">Quiz</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-2">Watch Points</label>
                                <input
                                    type="number"
                                    value={lesson.watchPoints}
                                    onChange={(e) => setLesson({ ...lesson, watchPoints: parseInt(e.target.value) || 0 })}
                                    min="0"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-2">Points Value</label>
                                <input
                                    type="number"
                                    value={lesson.pointsValue}
                                    onChange={(e) => setLesson({ ...lesson, pointsValue: parseInt(e.target.value) || 0 })}
                                    min="0"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Video */}
                    <div className="bg-gray-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Video</h2>

                        {signedVideoUrl ? (
                            <div className="mb-4">
                                <video
                                    src={signedVideoUrl}
                                    controls
                                    className="w-full max-w-2xl rounded-lg"
                                />
                            </div>
                        ) : (
                            <p className="text-gray-400 mb-4">No video uploaded yet.</p>
                        )}

                        <input
                            ref={videoInputRef}
                            type="file"
                            accept="video/*"
                            onChange={handleVideoUpload}
                            className="hidden"
                        />
                        <button
                            onClick={() => videoInputRef.current?.click()}
                            disabled={uploadingVideo}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                        >
                            {uploadingVideo ? 'Uploading...' : lesson.videoStorageKey ? 'Replace Video' : 'Upload Video'}
                        </button>
                    </div>
                </div>
            )}

            {/* Quiz Tab */}
            {activeTab === 'quiz' && (
                <div className="space-y-6">
                    <div className="bg-gray-800 rounded-xl p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-white">Quiz Settings</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={saveQuiz}
                                    disabled={savingQuiz}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                                >
                                    {savingQuiz ? 'Saving...' : 'Save Quiz'}
                                </button>
                                {lesson.quiz && (
                                    <button
                                        onClick={deleteQuiz}
                                        className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                                    >
                                        Delete Quiz
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 mb-2">Passing Score (%)</label>
                                <input
                                    type="number"
                                    value={quiz?.passingScore || 70}
                                    onChange={(e) => setQuiz((prev) => ({ ...prev!, passingScore: parseInt(e.target.value) || 70 }))}
                                    min="0"
                                    max="100"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-2">Bonus Points</label>
                                <input
                                    type="number"
                                    value={quiz?.bonusPoints || 20}
                                    onChange={(e) => setQuiz((prev) => ({ ...prev!, bonusPoints: parseInt(e.target.value) || 20 }))}
                                    min="0"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Questions */}
                    {quiz?.questions.map((q, qIndex) => (
                        <div key={qIndex} className="bg-gray-800 rounded-xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium text-white">Question {qIndex + 1}</h3>
                                <button
                                    onClick={() => removeQuestion(qIndex)}
                                    className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                                >
                                    Remove
                                </button>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-400 mb-2">Question Text</label>
                                <input
                                    type="text"
                                    value={q.question}
                                    onChange={(e) => updateQuestion(qIndex, 'question', e.target.value)}
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="block text-gray-400">Options (select correct answer)</label>
                                {q.options.map((opt, oIndex) => (
                                    <div key={oIndex} className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name={`correct-${qIndex}`}
                                            checked={q.correctIndex === oIndex}
                                            onChange={() => updateQuestion(qIndex, 'correctIndex', oIndex)}
                                            className="w-4 h-4"
                                        />
                                        <input
                                            type="text"
                                            value={opt}
                                            onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                            placeholder={`Option ${oIndex + 1}`}
                                            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={addQuestion}
                        className="w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                        + Add Question
                    </button>
                </div>
            )}
        </div>
    );
}
