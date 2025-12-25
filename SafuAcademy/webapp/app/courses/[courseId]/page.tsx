"use client";

import React, { useState, useEffect, useRef } from "react";
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

  const isEnrolled = contractData?.[1] ?? false;
  const isCompleted = contractData?.[2] ?? false;
  const canEnroll = contractData?.[3] ?? false;

  // Determine which course data to use (backend preferred, contract as fallback)
  const isLoading = backendLoading && contractLoading;

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
    }));
  }, [backendCourse]);

  // Load progress from localStorage
  useEffect(() => {
    const loadProgress = async () => {
      if (address && courseId) {
        const progress = await getProgress(address, Number(courseId));
        if (progress && progress.completedLessons) {
          setCompletedLessons(progress.completedLessons);
        }
      }
    };
    loadProgress();
  }, [address, courseId]);

  // Load notes from localStorage per lesson
  useEffect(() => {
    if (courseId && displayLessons[selectedLessonIndex]) {
      const lessonId = displayLessons[selectedLessonIndex].id;
      const saved = window.localStorage.getItem("safu_notes_" + lessonId);
      if (saved) {
        setNotesHtml(saved);
      } else {
        setNotesHtml("");
      }
    }
  }, [courseId, selectedLessonIndex, displayLessons]);

  // Keep contentEditable in sync
  useEffect(() => {
    if (notesRef.current && notesHtml && notesRef.current.innerHTML !== notesHtml) {
      notesRef.current.innerHTML = notesHtml;
    }
  }, [notesHtml]);

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
  const handleWatchedChange = (watched: boolean, percentage: number) => {
    setWatchedPercentage(percentage);
    if (watched && !isWatched) {
      setIsWatched(true);
      // Update completed lessons
      if (!completedLessons.includes(selectedLessonIndex)) {
        const newCompleted = [...completedLessons, selectedLessonIndex];
        setCompletedLessons(newCompleted);
        // Save progress
        if (address) {
          updateProgress(address, Number(courseId!), selectedLessonIndex);
        }
      }
    }
  };

  const handleNotesInput = (e: React.FormEvent<HTMLDivElement>) => {
    const value = e.currentTarget.innerHTML;
    setNotesHtml(value);
    if (displayLessons[selectedLessonIndex]) {
      const lessonId = displayLessons[selectedLessonIndex].id;
      window.localStorage.setItem("safu_notes_" + lessonId, value);
    }
  };

  // Select lesson handler
  const handleSelectLesson = (index: number) => {
    if (isEnrolled) {
      setSelectedLessonIndex(index);
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
          <div className={`w-16 h-16 border-2 rounded-full animate-spin ${isDark ? 'border-[#fffb00]/30 border-t-[#fffb00]' : 'border-safuDeep/30 border-t-safuDeep'
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
          <Link href="/courses" className={`font-semibold hover:underline ${isDark ? 'text-[#fffb00]' : 'text-[#92400e]'}`}>
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
              <div className={`aspect-video rounded-3xl relative overflow-hidden flex items-center justify-center ${isDark
                ? 'bg-gradient-to-br from-[#1a1a2e] via-[#252540] to-[#1a1a3e]'
                : 'bg-gradient-to-br from-[#fed7aa] via-[#facc15] to-[#f97316]'
                }`}>
                {videoLoading ? (
                  <div className="w-12 h-12 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl ${isDark ? 'bg-[#fffb00] text-black' : 'bg-safuDeep/90'
                    }`}>
                    {isEnrolled ? "▶" : "🔒"}
                  </div>
                )}
                <div className="absolute bottom-4 left-4 px-3 py-1 rounded-full bg-black/60 text-[11px] text-[#fef3c7]">
                  Safu Academy · On‑chain Education
                </div>
                <div className="absolute bottom-4 right-4 px-3 py-1 rounded-full bg-black/60 text-[11px] text-[#fef3c7]">
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
            </div>
          </div>

          {/* Lesson list & tabs */}
          <aside className={`p-4 space-y-4 rounded-3xl border ${isDark
            ? 'bg-[#12121a] border-[#2a2a3a]'
            : 'bg-white/90 border-black/5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
            }`}>
            <div>
              <div className={`text-[11px] uppercase tracking-[0.16em] mb-1 ${isDark ? 'text-[#fffb00]' : 'text-[#a16207]'
                }`}>Course track</div>
              <div className={`text-[13px] font-semibold mb-3 ${isDark ? 'text-white' : 'text-safuDeep'}`}>
                {displayLessons.length} lessons · {courseDuration}
              </div>
              <div className="space-y-2 max-h-48 overflow-auto pr-1">
                {displayLessons.map((lesson, index) => {
                  const isActive = selectedLessonIndex === index;
                  const isCompleted = completedLessons.includes(index);

                  return (
                    <button
                      key={lesson.id}
                      onClick={() => handleSelectLesson(index)}
                      disabled={!isEnrolled}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-[12px] text-left border transition ${isActive
                        ? isDark
                          ? "bg-[#fffb00] text-black border-[#fffb00] font-semibold"
                          : "bg-[#111] text-[#fef3c7] border-[#111]"
                        : isEnrolled
                          ? isDark
                            ? "bg-[#1a1a24] hover:bg-[#252530] text-gray-300 border-[#2a2a3a] cursor-pointer"
                            : "bg-white hover:bg-[#fefce8] text-[#444] border-black/5 cursor-pointer"
                          : isDark
                            ? "bg-[#1a1a24] text-gray-600 border-[#2a2a3a] cursor-not-allowed"
                            : "bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed"
                        }`}
                    >
                      <span className="truncate flex items-center gap-2">
                        {isCompleted && <span className={isDark ? 'text-[#fffb00]' : 'text-green-400'}>✓</span>}
                        {lesson.title}
                      </span>
                      <span className="text-[11px] opacity-80">
                        {lesson.hasQuiz ? "📝" : ""}
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
                          ? 'bg-[#fffb00] text-black hover:bg-[#e6e200]'
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
                        ? "bg-[#fffb00] text-black font-semibold"
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
                      className={`min-h-[170px] p-4 rounded-2xl border shadow-inner text-[13px] leading-relaxed outline-none transition ${isDark
                        ? 'bg-[#1a1a24] border-[#2a2a3a] text-white focus:ring-2 focus:ring-[#fffb00]'
                        : 'bg-[#f8f8ff] border-black/10 focus:ring-2 focus:ring-[#facc15]'
                        }`}
                    />
                    <div className={`text-[11px] ${isDark ? 'text-gray-600' : 'text-[#aaa]'}`}>✓ Notes auto‑saved to this browser</div>
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
