"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Layout } from "@/components/Layout";
import { useReadContract, useAccount } from "wagmi";
import { abi, Deploy, OnChainCourse } from "@/lib/constants";
import VideoPlayer from "@/components/VideoPlayer";
import { getProgress, updateProgress } from "@/hooks/progress";
import { useTheme } from "@/app/providers";

interface VideoSource {
  url: string;
  language: string;
  label: string;
}

// Backend lesson type (from database)
interface BackendLesson {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  watchPoints: number;
  quiz?: { id: string; passingScore: number; passPoints: number } | null;
}

// Backend course type (from database)
interface BackendCourse {
  id: number;
  title: string;
  description: string;
  longDescription: string;
  instructor: string;
  category: string;
  level: string;
  thumbnailUrl: string | null;
  duration: string;
  objectives: string[];
  prerequisites: string[];
  completionPoints: number;
  minPointsToAccess: number;
  enrollmentCost: number;
  isPublished: boolean;
  lessons: BackendLesson[];
}

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { address } = useAccount();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState("Transcript");
  const [notesHtml, setNotesHtml] = useState("");
  const notesRef = useRef<HTMLDivElement>(null);
  const [videos, setVideos] = useState<VideoSource[]>([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [_videoError, setVideoError] = useState<string | null>(null);

  // Lesson player state
  const [selectedLessonIndex, setSelectedLessonIndex] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<number[]>([]);
  const [_watchedPercentage, setWatchedPercentage] = useState(0);
  const [isWatched, setIsWatched] = useState(false);

  // Enrollment state
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  // Backend course data
  const [backendCourse, setBackendCourse] = useState<BackendCourse | null>(null);
  const [backendLoading, setBackendLoading] = useState(true);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [backendEnrolled, setBackendEnrolled] = useState(false);

  // Course progress from API (includes quiz-based progress)
  const [courseProgress, setCourseProgress] = useState<{
    progressPercent: number;
    lessonProgress: Array<{
      lessonId: string;
      isWatched: boolean;
      quizPassed: boolean | null;
      isComplete: boolean;
    }>;
    isComplete: boolean;
    onChainCompletionSynced: boolean;
  } | null>(null);

  // Notes sync state
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(true);

  // Blockchain sync retry state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string; txHash?: string } | null>(null);

  // Fetch course from backend API (primary source)
  useEffect(() => {
    async function fetchFromBackend() {
      try {
        setBackendLoading(true);
        const token = localStorage.getItem('auth_token');
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/courses/${courseId}`, { headers });
        if (res.ok) {
          const data = await res.json();
          setBackendCourse(data.course);
          setBackendError(null);
        } else {
          setBackendError('Course not found in database');
        }
      } catch (err) {
        console.error('Backend fetch failed:', err);
        setBackendError('Failed to fetch from backend');
      } finally {
        setBackendLoading(false);
      }
    }

    if (courseId) {
      fetchFromBackend();
    }
  }, [courseId]);

  // Fetch user enrollment status from smart contract
  const { data: contractData, isPending: contractLoading } = useReadContract({
    abi: abi,
    functionName: "getCourseWithUserStatus",
    address: Deploy,
    args: [BigInt(courseId), address || "0x0000000000000000000000000000000000000000"],
  }) as {
    data: [OnChainCourse, boolean, boolean, boolean] | undefined; // [course, enrolled, completed, canEnroll]
    isPending: boolean;
  };

  // Derive enrollment status from on-chain OR database
  // If courseProgress or backendEnrolled flag exists, user is enrolled in database (even if on-chain sync failed)
  const isEnrolledOnchain = contractData?.[1] ?? false;
  const isEnrolledInDb = !!courseProgress || backendEnrolled; // DB enrollment
  const isEnrolled = isEnrolledOnchain || isEnrolledInDb;

  const isCompletedOnchain = contractData?.[2] ?? false;
  const isCompletedInDb = courseProgress?.isComplete ?? false;
  const isCompleted = isCompletedOnchain || isCompletedInDb;

  const canEnroll = contractData?.[3] ?? false;

  // Show loading while backend is loading (primary data source)
  const isLoading = backendLoading;

  // Build course object from backend data
  // Note: Lessons are stored off-chain in PostgreSQL, not on the contract
  const course = React.useMemo(() => {
    if (backendCourse) {
      return {
        ...backendCourse,
        id: BigInt(backendCourse.id),
        longDescription: backendCourse.longDescription || backendCourse.description,
      };
    }
    return null;
  }, [backendCourse]);

  // Lessons are always from backend - no contract fallback
  const displayLessons = React.useMemo(() => {
    if (!backendCourse || backendCourse.lessons.length === 0) {
      return [];
    }
    return backendCourse.lessons.map((bl, index) => ({
      id: bl.id,
      title: bl.title,
      lessontitle: bl.title,
      description: bl.description,
      orderIndex: bl.orderIndex ?? index,
      hasQuiz: !!bl.quiz,
      quiz: bl.quiz || null,
    }));
  }, [backendCourse]);

  // Load progress from API - always attempt (not dependent on isEnrolled to break circular dependency)
  useEffect(() => {
    const loadProgress = async () => {
      if (!courseId || !address) return;

      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const res = await fetch(`/api/courses/${courseId}/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          if (data.progress) {
            setCourseProgress(data.progress);
            setBackendEnrolled(true); // User is enrolled in DB if progress exists

            // Update completedLessons based on lesson progress
            // A lesson is "complete" for sequential unlock purposes when video is watched
            const completed = data.progress.lessonProgress
              .map((lp: any, idx: number) => lp.isWatched ? idx : -1)
              .filter((idx: number) => idx >= 0);
            setCompletedLessons(completed);
          }
        }
      } catch (err) {
        console.error('Failed to load progress:', err);
        // Fallback to localStorage
        if (address && courseId) {
          const progress = await getProgress(address, Number(courseId));
          if (progress && progress.completedLessons) {
            setCompletedLessons(progress.completedLessons);
          }
        }
      }
    };
    loadProgress();
  }, [address, courseId]);

  // Load notes from API (with localStorage fallback)
  useEffect(() => {
    let cancelled = false;

    async function loadNotes() {
      // Wait until lessons are loaded
      if (displayLessons.length === 0) {
        return;
      }

      if (!displayLessons[selectedLessonIndex]) {
        setNotesHtml("");
        return;
      }

      const lessonId = displayLessons[selectedLessonIndex].id;
      const token = localStorage.getItem('auth_token');

      // Try API first if authenticated
      if (token) {
        try {
          const res = await fetch(`/api/notes?lessonId=${lessonId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.ok) {
            const data = await res.json();
            if (!cancelled) {
              if (data.note?.content) {
                setNotesHtml(data.note.content);
                // Also update localStorage for offline access
                window.localStorage.setItem("safu_notes_" + lessonId, data.note.content);
              } else {
                // No note in DB, check localStorage
                const saved = window.localStorage.getItem("safu_notes_" + lessonId);
                setNotesHtml(saved || "");
              }
              setNotesSaved(true);
            }
            return;
          }
        } catch (err) {
          console.error('Failed to fetch notes from API:', err);
        }
      }

      // Fallback to localStorage
      if (!cancelled) {
        const saved = window.localStorage.getItem("safu_notes_" + lessonId);
        setNotesHtml(saved || "");
        setNotesSaved(true);
      }
    }

    loadNotes();
    return () => {
      cancelled = true;
    };
  }, [selectedLessonIndex, displayLessons]);

  // Keep contentEditable in sync with state
  useEffect(() => {
    if (notesRef.current && notesRef.current.innerHTML !== notesHtml) {
      notesRef.current.innerHTML = notesHtml;
    }
  }, [notesHtml]);

  // Debounced save to API
  const saveNotesToApi = useCallback(async (lessonId: string, content: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setNotesSaving(true);
    try {
      const res = await fetch('/api/notes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ lessonId, content }),
      });

      if (res.ok) {
        setNotesSaved(true);
      }
    } catch (err) {
      console.error('Failed to save notes to API:', err);
    } finally {
      setNotesSaving(false);
    }
  }, []);

  // Fetch video for selected lesson (only when enrolled)
  // Videos are always fetched from backend API
  useEffect(() => {
    let cancelled = false;

    async function getVideo() {
      if (!isEnrolled) {
        setVideos([]);
        return;
      }

      const lesson = displayLessons[selectedLessonIndex];
      if (!lesson) {
        setVideos([]);
        return;
      }

      setVideoLoading(true);
      setVideoError(null);
      setIsWatched(false);
      setWatchedPercentage(0);

      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`/api/lessons/${lesson.id}/video`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (res.ok) {
          const data = await res.json();
          if (data.videos && data.videos.length > 0) {
            const newVideos: VideoSource[] = data.videos.map((v: { signedUrl: string; language: string; label: string }) => ({
              url: v.signedUrl,
              language: v.language,
              label: v.label,
            }));
            if (!cancelled) setVideos(newVideos);
          } else if (data.signedUrl) {
            // Legacy single video support
            if (!cancelled) setVideos([{ url: data.signedUrl, language: 'en', label: 'English' }]);
          } else {
            if (!cancelled) setVideos([]);
          }
        } else {
          if (!cancelled) setVideoError("Video unavailable");
        }
      } catch (err) {
        console.error("Failed to fetch video from backend:", err);
        if (!cancelled) setVideoError("Video unavailable");
      } finally {
        if (!cancelled) setVideoLoading(false);
      }
    }

    getVideo();
    return () => {
      cancelled = true;
    };
  }, [isEnrolled, selectedLessonIndex, displayLessons]);

  // Handle video watch progress
  const handleWatchedChange = useCallback(async (watched: boolean, percentage: number) => {
    setWatchedPercentage(percentage);
    if (watched && !isWatched) {
      setIsWatched(true);

      const lesson = displayLessons[selectedLessonIndex];

      // Update completed lessons locally
      if (!completedLessons.includes(selectedLessonIndex)) {
        const newCompleted = [...completedLessons, selectedLessonIndex];
        setCompletedLessons(newCompleted);

        // Save to localStorage
        if (address) {
          updateProgress(address, Number(courseId!), selectedLessonIndex);
        }
      }

      // Save to database via API
      if (lesson) {
        try {
          const token = localStorage.getItem('auth_token');
          if (token) {
            const res = await fetch(`/api/lessons/${lesson.id}/complete`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ videoProgressPercent: percentage }),
            });

            if (res.ok) {
              // Refresh course progress to get updated quiz-based calculation
              const progressRes = await fetch(`/api/courses/${courseId}/progress`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              if (progressRes.ok) {
                const data = await progressRes.json();
                setCourseProgress(data.progress);
              }
            }
          }
        } catch (err) {
          console.error('Failed to save lesson completion:', err);
        }
      }
    }
  }, [isWatched, selectedLessonIndex, completedLessons, address, courseId, displayLessons]);

  const handleNotesInput = (e: React.FormEvent<HTMLDivElement>) => {
    const value = e.currentTarget.innerHTML;
    setNotesHtml(value);
    setNotesSaved(false);

    if (displayLessons[selectedLessonIndex]) {
      const lessonId = displayLessons[selectedLessonIndex].id;
      // Save to localStorage immediately
      window.localStorage.setItem("safu_notes_" + lessonId, value);
    }
  };

  // Handle key down to ensure space works properly
  const handleNotesKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Prevent any parent handlers from interfering with typing
    e.stopPropagation();
  };

  // Manual save to cloud
  const handleSaveToCloud = () => {
    if (displayLessons[selectedLessonIndex]) {
      const lessonId = displayLessons[selectedLessonIndex].id;
      saveNotesToApi(lessonId, notesHtml);
    }
  };

  // Check if a lesson is accessible (first lesson or previous is completed)
  const isLessonAccessible = (index: number): boolean => {
    if (index === 0) return true; // First lesson always accessible
    return completedLessons.includes(index - 1); // Previous lesson must be completed
  };

  // Calculate progress percentage from API (includes quiz-based progress)
  const progressPercent = courseProgress?.progressPercent ??
    (displayLessons.length > 0
      ? Math.round((completedLessons.length / displayLessons.length) * 100)
      : 0);

  // Helper to check if current lesson video has been watched
  const isCurrentLessonWatched = (): boolean => {
    if (!courseProgress || !displayLessons[selectedLessonIndex]) return false;
    const lessonId = displayLessons[selectedLessonIndex].id;
    const lessonProg = courseProgress.lessonProgress?.find(lp => lp.lessonId === lessonId);
    return lessonProg?.isWatched ?? false;
  };

  // Select lesson handler - only allow if lesson is accessible
  const handleSelectLesson = (index: number) => {
    if (isEnrolled && isLessonAccessible(index)) {
      setSelectedLessonIndex(index);
    }
  };

  // Handle blockchain sync retry for completed courses
  const handleRetrySync = async () => {
    if (!courseId) return;

    setSyncing(true);
    setSyncResult(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setSyncResult({ success: false, message: 'Please sign in first' });
        setSyncing(false);
        return;
      }

      const res = await fetch(`/api/courses/${courseId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (res.ok && data.synced) {
        setSyncResult({
          success: true,
          message: data.alreadySynced ? 'Already synced!' : 'Synced successfully!',
          txHash: data.txHash,
        });
        // Refresh progress to show updated sync status
        const progressRes = await fetch(`/api/courses/${courseId}/progress`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (progressRes.ok) {
          const progressData = await progressRes.json();
          setCourseProgress(progressData.progress);
        }
      } else {
        setSyncResult({
          success: false,
          message: data.error || 'Sync failed',
        });
      }
    } catch (err) {
      console.error('Sync retry error:', err);
      setSyncResult({ success: false, message: 'Network error' });
    } finally {
      setSyncing(false);
    }
  };

  // Enrollment handler
  const handleEnroll = async () => {
    if (!address) {
      setEnrollError('Please connect your wallet first');
      return;
    }

    setEnrolling(true);
    setEnrollError(null);

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setEnrollError('Please sign in first');
        setEnrolling(false);
        return;
      }

      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setEnrollError(data.error || 'Failed to enroll');
        setEnrolling(false);
        return;
      }

      // Enrollment successful - refresh the page to get updated status
      window.location.reload();
    } catch (err) {
      console.error('Enrollment error:', err);
      setEnrollError('Failed to enroll. Please try again.');
      setEnrolling(false);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className={`w-16 h-16 border-2 rounded-full animate-spin ${isDark ? 'border-[#ffb000]/30 border-t-[#ffb000]' : 'border-safuDeep/30 border-t-safuDeep'
            }`} />
        </div>
      </Layout>
    );
  }

  if (!course && !backendCourse) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-safuDeep'}`}>Course not found</h2>
          <p className={`mb-4 ${isDark ? 'text-gray-400' : 'text-[#555]'}`}>The course you're looking for doesn't exist.</p>
          <Link href="/courses" className={`font-semibold hover:underline ${isDark ? 'text-[#ffb000]' : 'text-[#92400e]'}`}>
            ← Back to courses
          </Link>
        </div>
      </Layout>
    );
  }

  const currentLesson = displayLessons[selectedLessonIndex];
  const courseTitle = backendCourse?.title || course?.title || 'Untitled Course';
  const courseDescription = backendCourse?.description || course?.description || '';
  const courseLongDescription = backendCourse?.longDescription || course?.longDescription || courseDescription;
  const courseDuration = backendCourse?.duration || course?.duration || '';
  const courseObjectives = backendCourse?.objectives || course?.objectives || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className={`text-[11px] flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-[#777]'}`}>
          <Link href="/courses" className={`hover:underline ${isDark ? 'hover:text-white' : 'hover:text-safuDeep'}`}>
            All courses
          </Link>
          <span>/</span>
          <span className={`font-medium ${isDark ? 'text-white' : 'text-safuDeep'}`}>{courseTitle}</span>
        </div>

        {/* Top layout */}
        <section className="grid lg:grid-cols-[minmax(0,3fr)_minmax(260px,1.5fr)] gap-6 items-start">
          {/* Video + meta */}
          <div className="space-y-4">
            {/* Video Player */}
            {isEnrolled && videos.length > 0 && !videoLoading ? (
              <div className="rounded-3xl overflow-hidden">
                <VideoPlayer videos={videos} onWatchedChange={handleWatchedChange} />
              </div>
            ) : (
              <div
                className={`aspect-video rounded-3xl relative overflow-hidden flex items-center justify-center ${
                  !isEnrolled && backendCourse?.thumbnailUrl
                    ? 'bg-cover bg-center'
                    : isDark
                    ? 'bg-gradient-to-br from-[#1a1a2e] via-[#252540] to-[#1a1a3e]'
                    : 'bg-gradient-to-br from-[#fed7aa] via-[#facc15] to-[#f97316]'
                }`}
                style={
                  !isEnrolled && backendCourse?.thumbnailUrl
                    ? { backgroundImage: `url(${backendCourse.thumbnailUrl})` }
                    : undefined
                }
              >
                {/* Overlay for better visibility of content on thumbnail */}
                {!isEnrolled && backendCourse?.thumbnailUrl && (
                  <div className="absolute inset-0 bg-black/40" />
                )}

                {videoLoading ? (
                  <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
                ) : (
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl relative z-10 ${isDark ? 'bg-[#ffb000] text-black' : 'bg-safuDeep/90'
                    }`}>
                    {isEnrolled ? "▶" : "🔒"}
                  </div>
                )}
                <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black/60 text-[11px] text-[#fef3c7] z-10">
                  Safu Academy · On‑chain Education
                </div>
                <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/60 text-[11px] text-[#fef3c7] z-10">
                  {courseDuration}
                </div>
              </div>
            )}

            <div>
              <h1 className={`text-[22px] sm:text-[26px] font-bold tracking-[-0.05em] ${isDark ? 'text-white' : 'text-safuDeep'
                }`}>
                {currentLesson?.title || courseTitle}
              </h1>
              <p className={`text-[13px] mt-1 max-w-xl ${isDark ? 'text-gray-400' : 'text-[#555]'}`}>
                {courseDescription}
              </p>

              {/* Take Quiz Button - show if current lesson has a quiz */}
              {isEnrolled && currentLesson?.quiz && (
                isCurrentLessonWatched() || isWatched ? (
                  <Link
                    href={`/lessons/${currentLesson.id}/quiz`}
                    className={`inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl font-semibold text-[13px] transition shadow-lg ${isDark
                      ? 'bg-purple-600 hover:bg-purple-500 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                  >
                    📝 Take Quiz
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${isDark ? 'bg-white/20' : 'bg-white/30'}`}>
                      +{currentLesson.quiz.passPoints} pts
                    </span>
                  </Link>
                ) : (
                  <div
                    className={`inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl font-semibold text-[13px] opacity-50 cursor-not-allowed ${isDark
                      ? 'bg-gray-600 text-gray-400'
                      : 'bg-gray-300 text-gray-500'
                      }`}
                    title="Watch the video first to unlock the quiz"
                  >
                    🔒 Quiz locked
                    <span className="text-[11px]">Watch video first</span>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Lesson list & tabs */}
          <aside className={`p-4 space-y-4 rounded-3xl border ${isDark
            ? 'bg-[#12121a] border-[#2a2a3a]'
            : 'bg-white/90 border-black/5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
            }`}>
            <div>
              <div className={`text-[11px] uppercase tracking-[0.16em] mb-1 ${isDark ? 'text-[#ffb000]' : 'text-[#a16207]'
                }`}>Course track</div>
              <div className={`text-[13px] font-semibold mb-2 ${isDark ? 'text-white' : 'text-safuDeep'}`}>
                {displayLessons.length} lessons · {courseDuration}
              </div>

              {/* Progress Bar */}
              {isEnrolled && (
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className={`text-[11px] ${isDark ? 'text-gray-400' : 'text-[#666]'}`}>Progress</span>
                    <span className={`text-[11px] font-semibold ${isDark ? 'text-[#ffb000]' : 'text-[#92400e]'}`}>
                      {progressPercent}%
                    </span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#2a2a3a]' : 'bg-gray-200'}`}>
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${isDark ? 'bg-[#ffb000]' : 'bg-gradient-to-r from-amber-400 to-orange-500'}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className={`text-[10px] mt-1 ${isDark ? 'text-gray-500' : 'text-[#888]'}`}>
                    {courseProgress
                      ? `${courseProgress.lessonProgress?.filter(l => l.isComplete).length ?? 0} of ${displayLessons.length} lessons fully completed`
                      : `${completedLessons.length} of ${displayLessons.length} completed`
                    }
                  </div>

                  {/* Sync to Blockchain button - only show when completed but NOT synced */}
                  {progressPercent === 100 && courseProgress && !courseProgress.onChainCompletionSynced && (
                    <div className="mt-2">
                      <button
                        onClick={handleRetrySync}
                        disabled={syncing}
                        className={`w-full py-2 px-3 rounded-xl text-[11px] font-semibold transition ${syncing
                          ? 'opacity-50 cursor-wait'
                          : syncResult?.success
                            ? isDark
                              ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                              : 'bg-green-100 text-green-700 border border-green-300'
                            : isDark
                              ? 'bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20'
                              : 'bg-red-50 text-red-600 border border-red-300 hover:bg-red-100'
                          }`}
                      >
                        {syncing
                          ? '⏳ Syncing...'
                          : syncResult?.success
                            ? `✓ ${syncResult.message}`
                            : '⚠️ Retry Blockchain Sync'
                        }
                      </button>
                      {syncResult && !syncResult.success && (
                        <div className="text-[10px] text-red-400 mt-1">{syncResult.message}</div>
                      )}
                      {syncResult?.txHash && (
                        <div className={`text-[10px] mt-1 truncate ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                          TX: {syncResult.txHash.slice(0, 10)}...{syncResult.txHash.slice(-8)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2 max-h-48 overflow-auto pr-1">
                {displayLessons.map((lesson, index) => {
                  const isActive = selectedLessonIndex === index;
                  const isVideoWatched = completedLessons.includes(index);
                  const isAccessible = isLessonAccessible(index);
                  const isLocked = isEnrolled && !isAccessible;

                  // Check lesson completion from API progress
                  const lessonProg = courseProgress?.lessonProgress?.find(lp => lp.lessonId === lesson.id);
                  const hasQuiz = lesson.hasQuiz;
                  const quizPassed = lessonProg?.quizPassed ?? false;
                  const isFullyComplete = hasQuiz ? (isVideoWatched && quizPassed) : isVideoWatched;
                  const isPartialComplete = hasQuiz && isVideoWatched && !quizPassed;

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => handleSelectLesson(index)}
                      disabled={!isEnrolled || isLocked}
                      title={isLocked ? 'Complete previous lesson first' : undefined}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-[12px] text-left border transition ${isActive
                        ? isDark
                          ? "bg-[#ffb000] text-black border-[#ffb000] font-semibold"
                          : "bg-[#111] text-[#fef3c7] border-[#111]"
                        : isEnrolled && isAccessible
                          ? isDark
                            ? "bg-[#1a1a24] hover:bg-[#252530] text-gray-300 border-[#2a2a3a] cursor-pointer"
                            : "bg-white hover:bg-[#fefce8] text-[#444] border-black/5 cursor-pointer"
                          : isDark
                            ? "bg-[#1a1a24] text-gray-600 border-[#2a2a3a] cursor-not-allowed opacity-60"
                            : "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed opacity-60"
                        }`}
                    >
                      <span className="truncate flex items-center gap-2">
                        {isFullyComplete ? (
                          <span className={isDark ? 'text-[#ffb000]' : 'text-green-500'}>✓</span>
                        ) : isPartialComplete ? (
                          <span className="text-orange-400" title="Video watched, quiz pending">◐</span>
                        ) : isLocked ? (
                          <span className="text-gray-500">🔒</span>
                        ) : null}
                        {lesson.title}
                      </span>
                      <span className="text-[11px] opacity-80 flex items-center gap-1">
                        {hasQuiz && (
                          quizPassed
                            ? <span className="text-green-400" title="Quiz passed">✓📝</span>
                            : <span title="Quiz available">📝</span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!isEnrolled && (
                <div className="mt-3 space-y-2">
                  {!address ? (
                    <p className={`text-[11px] text-center ${isDark ? 'text-gray-500' : 'text-[#777]'}`}>
                      Connect wallet to enroll
                    </p>
                  ) : canEnroll ? (
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className={`w-full py-2.5 rounded-2xl font-semibold text-[13px] transition ${enrolling
                        ? 'bg-gray-500 cursor-not-allowed'
                        : isDark
                          ? 'bg-[#ffb000] text-black hover:bg-[#e6e200]'
                          : 'bg-[#111] text-white hover:bg-[#333]'
                        }`}
                    >
                      {enrolling ? '⏳ Enrolling...' : '🎓 Enroll Now'}
                    </button>
                  ) : (
                    <p className={`text-[11px] text-center ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>
                      Insufficient points to enroll
                    </p>
                  )}
                  {enrollError && (
                    <p className="text-[11px] text-center text-red-500">
                      {enrollError}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className={`border-t pt-3 ${isDark ? 'border-[#2a2a3a]' : 'border-black/5'}`}>
              <div className={`inline-flex rounded-full p-1 text-[11px] mb-3 ${isDark ? 'bg-[#1a1a24]' : 'bg-[#fefce8]'
                }`}>
                {["Transcript", "Resources", "Notes"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-full transition ${activeTab === tab
                      ? isDark
                        ? "bg-[#ffb000] text-black font-semibold"
                        : "bg-[#111] text-[#fef3c7]"
                      : isDark
                        ? "text-gray-400"
                        : "text-[#555]"
                      }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className={`text-[13px] space-y-3 ${isDark ? 'text-gray-300' : 'text-[#444]'}`}>
                {activeTab === "Transcript" && (
                  <p>
                    {courseLongDescription}
                  </p>
                )}
                {activeTab === "Resources" && (
                  <ul className="list-disc list-inside space-y-1">
                    {courseObjectives && courseObjectives.length > 0 ? (
                      courseObjectives.map((obj, i) => <li key={i}>{obj}</li>)
                    ) : (
                      <>
                        <li>Course materials and dashboards</li>
                        <li>Templates to get started</li>
                        <li>Additional reading materials</li>
                      </>
                    )}
                  </ul>
                )}
                {activeTab === "Notes" && (
                  <div className="space-y-3">
                    <div className={`text-[12px] ${isDark ? 'text-gray-500' : 'text-[#777]'}`}>Your personal notes for this lesson:</div>
                    <div
                      ref={notesRef}
                      contentEditable
                      suppressContentEditableWarning
                      onInput={handleNotesInput}
                      onKeyDown={handleNotesKeyDown}
                      className={`min-h-[170px] p-4 rounded-2xl border shadow-inner text-[13px] leading-relaxed outline-none transition ${isDark
                        ? 'bg-[#1a1a24] border-[#2a2a3a] text-white focus:ring-2 focus:ring-[#ffb000]'
                        : 'bg-[#f8f8ff] border-black/10 focus:ring-2 focus:ring-[#facc15]'
                        }`}
                    />
                    <div className="flex items-center justify-between">
                      <div className={`text-[11px] ${isDark ? 'text-gray-600' : 'text-[#aaa]'}`}>
                        {notesSaving ? (
                          <span>⏳ Saving to cloud...</span>
                        ) : notesSaved ? (
                          <span>✓ Synced to cloud</span>
                        ) : (
                          <span>💾 Saved locally</span>
                        )}
                      </div>
                      {!notesSaved && !notesSaving && (
                        <button
                          onClick={handleSaveToCloud}
                          className={`text-[11px] px-3 py-1 rounded-full font-medium transition ${isDark
                            ? 'bg-[#ffb000] text-black hover:bg-[#e6e200]'
                            : 'bg-[#111] text-white hover:bg-[#333]'
                            }`}
                        >
                          ☁️ Save to Cloud
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </Layout>
  );
}
