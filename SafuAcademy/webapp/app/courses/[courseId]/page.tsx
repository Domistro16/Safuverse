"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Layout } from "@/components/Layout";
import { useReadContract, useAccount } from "wagmi";
import { abi, Course, Deploy, Lesson } from "@/lib/constants";
import { PinataSDK } from "pinata";
import VideoPlayer from "@/components/VideoPlayer";
import { getProgress, updateProgress } from "@/hooks/progress";
import { useTheme } from "@/app/providers";

const pinata = new PinataSDK({
  pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT,
  pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
});

interface VideoSource {
  url: string;
  language: string;
  label: string;
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

  // Fetch course data from smart contract
  const { data: courseData, isPending } = useReadContract({
    abi: abi,
    functionName: "getCourse",
    address: Deploy,
    args: [BigInt(courseId), address || "0x0000000000000000000000000000000000000000"],
  }) as {
    data: [Course, boolean, number, bigint] | undefined;
    isPending: boolean;
  };

  const course = courseData?.[0];
  const isEnrolled = courseData?.[1] ?? false;
  // attendees = courseData?.[3] - available if needed

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
    if (courseId && course?.lessons[selectedLessonIndex]) {
      const lessonId = course.lessons[selectedLessonIndex].id;
      const saved = window.localStorage.getItem("safu_notes_" + lessonId);
      if (saved) {
        setNotesHtml(saved);
      } else {
        setNotesHtml("");
      }
    }
  }, [courseId, selectedLessonIndex, course]);

  // Keep contentEditable in sync
  useEffect(() => {
    if (notesRef.current && notesHtml && notesRef.current.innerHTML !== notesHtml) {
      notesRef.current.innerHTML = notesHtml;
    }
  }, [notesHtml]);

  // Fetch video for selected lesson (only when enrolled)
  useEffect(() => {
    let cancelled = false;

    async function getVideo() {
      if (!course || !isEnrolled) {
        setVideos([]);
        return;
      }

      const lesson = course.lessons[selectedLessonIndex];
      if (!lesson || !lesson.url || lesson.url.length === 0) {
        setVideos([]);
        return;
      }

      setVideoLoading(true);
      setVideoError(null);
      setIsWatched(false);
      setWatchedPercentage(0);

      try {
        const userLang = navigator.language;

        // Fetch English video (first URL)
        const res1 = await pinata.gateways.private.createAccessLink({
          cid: lesson.url[0] as string,
          expires: 800,
        });
        const url1 = typeof res1 === "string" ? res1 : (res1 as any).accessLink ?? (res1 as any).url ?? "";

        // Fetch Chinese video if exists (second URL)
        let url2: string | null = null;
        if (lesson.url.length > 1 && lesson.url[1]) {
          const res2 = await pinata.gateways.private.createAccessLink({
            cid: lesson.url[1] as string,
            expires: 800,
          });
          url2 = typeof res2 === "string" ? res2 : (res2 as any).accessLink ?? (res2 as any).url ?? null;
        }

        // Determine order based on user language
        let newVideos: VideoSource[] = [];
        if (userLang.startsWith("zh") && url2) {
          newVideos = [
            { url: url2, language: "zh", label: "中文" },
            { url: url1, language: "en", label: "English" },
          ];
        } else {
          newVideos = [{ url: url1, language: "en", label: "English" }];
          if (url2) newVideos.push({ url: url2, language: "zh", label: "中文" });
        }

        if (!cancelled) setVideos(newVideos);
      } catch (err: any) {
        console.error("Failed to fetch video:", err);
        if (!cancelled) setVideoError("Video unavailable");
      } finally {
        if (!cancelled) setVideoLoading(false);
      }
    }

    getVideo();
    return () => {
      cancelled = true;
    };
  }, [course, isEnrolled, selectedLessonIndex]);

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
    if (course?.lessons[selectedLessonIndex]) {
      const lessonId = course.lessons[selectedLessonIndex].id;
      window.localStorage.setItem("safu_notes_" + lessonId, value);
    }
  };

  // Select lesson handler
  const handleSelectLesson = (index: number) => {
    if (isEnrolled) {
      setSelectedLessonIndex(index);
    }
  };

  if (isPending) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className={`w-16 h-16 border-2 rounded-full animate-spin ${isDark ? 'border-[#fffb00]/30 border-t-[#fffb00]' : 'border-safuDeep/30 border-t-safuDeep'
            }`} />
        </div>
      </Layout>
    );
  }

  if (!course) {
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

  const currentLesson = course.lessons[selectedLessonIndex];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className={`text-[11px] flex items-center gap-2 ${isDark ? 'text-gray-500' : 'text-[#777]'}`}>
          <Link href="/courses" className={`hover:underline ${isDark ? 'hover:text-white' : 'hover:text-safuDeep'}`}>
            All courses
          </Link>
          <span>/</span>
          <span className={`font-medium ${isDark ? 'text-white' : 'text-safuDeep'}`}>{currentLesson?.lessontitle || course.title}</span>
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
                  {course.duration}
                </div>
              </div>
            )}

            <div>
              <h1 className={`text-[22px] sm:text-[26px] font-bold tracking-[-0.05em] ${isDark ? 'text-white' : 'text-safuDeep'
                }`}>
                {currentLesson?.lessontitle || course.title}
              </h1>
              <p className={`text-[13px] mt-1 max-w-xl ${isDark ? 'text-gray-400' : 'text-[#555]'}`}>
                {course.description}
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
                {course.lessons.length} lessons · {course.duration}
              </div>
              <div className="space-y-2 max-h-48 overflow-auto pr-1">
                {course.lessons.map((lesson: Lesson, index: number) => {
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
                        {lesson.lessontitle}
                      </span>
                      <span className="text-[11px] opacity-80">
                        {lesson.quizzes ? "📝" : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
              {!isEnrolled && (
                <p className={`text-[11px] mt-2 text-center ${isDark ? 'text-gray-500' : 'text-[#777]'}`}>
                  Connect wallet & enroll to access lessons
                </p>
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
                    {course.longDescription || course.description}
                  </p>
                )}
                {activeTab === "Resources" && (
                  <ul className="list-disc list-inside space-y-1">
                    {course.objectives && course.objectives.length > 0 ? (
                      course.objectives.map((obj, i) => <li key={i}>{obj}</li>)
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
