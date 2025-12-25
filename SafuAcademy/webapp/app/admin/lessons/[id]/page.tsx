'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface LessonVideo {
    id: string;
    language: string;
    label: string;
    storageKey: string;
    orderIndex: number;
    signedUrl?: string | null;
}

interface Quiz {
    id: string;
    questions: { id?: string; question: string; options: string[]; correctIndex: number }[];
    passingScore: number;
    passPoints: number;
}

interface Lesson {
    id: string;
    courseId: number;
    title: string;
    description: string | null;
    orderIndex: number;
    videoStorageKey: string | null;
    videoDuration: number;
    watchPoints: number;
    quiz: Quiz | null;
    course: { id: number; title: string };
    videos: LessonVideo[];
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

    // Multi-language video state
    const [newVideoLanguage, setNewVideoLanguage] = useState<string>('en');
    const [newVideoLabel, setNewVideoLabel] = useState<string>('');
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
            formData.append('watchPoints', lesson.watchPoints.toString());

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
        if (!file || !newVideoLabel) return;

        setUploadingVideo(true);

        try {
            const token = localStorage.getItem('auth_token');
            const formData = new FormData();
            formData.append('video', file);
            formData.append('language', newVideoLanguage);
            formData.append('label', newVideoLabel);

            const res = await fetch(`/api/admin/lessons/${lessonId}/videos`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to upload video');
            }

            alert(`Video uploaded successfully for ${newVideoLabel}!`);
            setNewVideoLabel('');
            fetchLesson();
        } catch (err) {
            alert((err as Error).message);
        } finally {
            setUploadingVideo(false);
            // Reset file input
            if (videoInputRef.current) videoInputRef.current.value = '';
        }
    }

    async function handleDeleteVideo(videoId: string, language: string) {
        if (!confirm(`Delete the ${language.toUpperCase()} video?`)) return;

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/admin/lessons/${lessonId}/videos?videoId=${videoId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error('Failed to delete video');

            alert('Video deleted successfully!');
            fetchLesson();
        } catch (err) {
            alert((err as Error).message);
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
                    passPoints: quiz.passPoints,
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
            ...(prev || { id: '', passingScore: 70, passPoints: 20, questions: [] }),
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
                    <p className="text-gray-400">Order: {lesson.orderIndex + 1}</p>
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

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-gray-400 mb-2">Watch Points</label>
                                <input
                                    type="number"
                                    value={lesson.watchPoints}
                                    onChange={(e) => setLesson({ ...lesson, watchPoints: parseInt(e.target.value) || 0 })}
                                    min="0"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                                <p className="text-gray-500 text-xs mt-1">Points for watching 50%+ of video</p>
                            </div>
                            <div>
                                <label className="block text-gray-400 mb-2">Video Duration (seconds)</label>
                                <input
                                    type="number"
                                    value={lesson.videoDuration}
                                    onChange={(e) => setLesson({ ...lesson, videoDuration: parseInt(e.target.value) || 0 })}
                                    min="0"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Multi-Language Videos */}
                    <div className="bg-gray-800 rounded-xl p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Videos (Multi-Language)</h2>
                        <p className="text-gray-400 text-sm mb-4">
                            Upload videos in different languages. Users will be able to switch between language versions.
                        </p>

                        {/* Existing videos list */}
                        {lesson.videos && lesson.videos.length > 0 ? (
                            <div className="space-y-4 mb-6">
                                {lesson.videos.map((video) => (
                                    <div key={video.id} className="bg-gray-700 rounded-lg p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded">
                                                    {video.language.toUpperCase()}
                                                </span>
                                                <span className="text-white font-medium">{video.label}</span>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteVideo(video.id, video.language)}
                                                className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-colors text-sm"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                        {video.signedUrl && (
                                            <video
                                                src={video.signedUrl}
                                                controls
                                                className="w-full max-w-xl rounded-lg mt-2"
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 mb-4">No videos uploaded yet. Add videos below.</p>
                        )}

                        {/* Add new video form */}
                        <div className="border-t border-gray-600 pt-4">
                            <h3 className="text-white font-medium mb-3">Add New Video</h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Language Code</label>
                                    <select
                                        value={newVideoLanguage}
                                        onChange={(e) => setNewVideoLanguage(e.target.value)}
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="en">en - English</option>
                                        <option value="zh">zh - Chinese (中文)</option>
                                        <option value="es">es - Spanish</option>
                                        <option value="fr">fr - French</option>
                                        <option value="de">de - German</option>
                                        <option value="ja">ja - Japanese</option>
                                        <option value="ko">ko - Korean</option>
                                        <option value="pt">pt - Portuguese</option>
                                        <option value="ru">ru - Russian</option>
                                        <option value="ar">ar - Arabic</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-400 text-sm mb-1">Display Label</label>
                                    <input
                                        type="text"
                                        value={newVideoLabel}
                                        onChange={(e) => setNewVideoLabel(e.target.value)}
                                        placeholder="e.g., English, 中文"
                                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>
                            <input
                                ref={videoInputRef}
                                type="file"
                                accept="video/*"
                                onChange={handleVideoUpload}
                                className="hidden"
                            />
                            <button
                                onClick={() => videoInputRef.current?.click()}
                                disabled={uploadingVideo || !newVideoLabel}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                            >
                                {uploadingVideo ? 'Uploading...' : 'Select & Upload Video'}
                            </button>
                            {!newVideoLabel && (
                                <p className="text-yellow-400 text-xs mt-2">Please enter a display label before uploading.</p>
                            )}
                        </div>

                        {/* Legacy video notice */}
                        {signedVideoUrl && !lesson.videos?.length && (
                            <div className="mt-4 p-3 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
                                <p className="text-yellow-400 text-sm">
                                    ⚠️ This lesson has a legacy single video. Consider re-uploading it using the multi-language system above.
                                </p>
                            </div>
                        )}
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
                                <label className="block text-gray-400 mb-2">Pass Points</label>
                                <input
                                    type="number"
                                    value={quiz?.passPoints || 20}
                                    onChange={(e) => setQuiz((prev) => ({ ...prev!, passPoints: parseInt(e.target.value) || 20 }))}
                                    min="0"
                                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                                />
                                <p className="text-gray-500 text-xs mt-1">Points awarded for passing the quiz</p>
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
