"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { Layout } from "@/components/Layout";
import { useTheme } from "@/app/providers";

interface LessonVideo {
  id: string;
  language: string;
  label: string;
  storageKey: string;
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
  longDescription: string;
  instructor: string;
  category: string;
  level: string;
  thumbnailUrl: string | null;
  duration: string;
  objectives: string[];
  prerequisites: string[];
  completionPoints: number;
  isIncentivized: boolean;
  scormVersion: "SCORM_12" | "SCORM_2004" | null;
  scormLaunchUrl: string | null;
  keyTakeaways: string[];
  lessons: Lesson[];
}

interface CourseProgress {
  progressPercent: number;
  isComplete: boolean;
  proofSigned?: boolean;
  dappVisitTracked?: boolean;
  finalScore?: number;
  leaderboardEligible?: boolean;
  scormCompletionStatus?: string | null;
  scormQuizScore?: number | null;
}

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { address } = useAccount();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [course, setCourse] = useState<Course | null>(null);
  const [courseLoading, setCourseLoading] = useState(true);
  const [courseError, setCourseError] = useState<string | null>(null);

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [progress, setProgress] = useState<CourseProgress | null>(null);

  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState<string | null>(null);

  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [markingWatched, setMarkingWatched] = useState(false);

  const primaryLesson = useMemo(
    () =>
      course?.lessons
        ?.slice()
        .sort((a, b) => a.orderIndex - b.orderIndex)[0] || null,
    [course]
  );

  const canEnroll = true;

  async function fetchCourse() {
    try {
      setCourseLoading(true);
      const token = localStorage.getItem("auth_token");
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`/api/courses/${courseId}`, { headers });
      if (!res.ok) {
        setCourseError("Course not found");
        return;
      }

      const data = await res.json();
      setCourse(data.course);
      setCourseError(null);
    } catch (error) {
      console.error(error);
      setCourseError("Failed to fetch course");
    } finally {
      setCourseLoading(false);
    }
  }

  async function fetchProgress() {
    if (!address) return;

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      const res = await fetch(`/api/courses/${courseId}/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) return;
      const data = await res.json();
      if (data.progress) {
        setProgress(data.progress);
        setIsEnrolled(true);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    if (!courseId) return;
    void fetchCourse();
  }, [courseId]);

  useEffect(() => {
    if (!address || !courseId) return;
    void fetchProgress();
  }, [address, courseId]);

  useEffect(() => {
    async function loadLessonVideo() {
      if (!primaryLesson || !isEnrolled || course?.isIncentivized) {
        setEmbedUrl(null);
        return;
      }

      try {
        const token = localStorage.getItem("auth_token");
        if (!token) return;
        const res = await fetch(`/api/lessons/${primaryLesson.id}/video`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setEmbedUrl(
          data?.videos?.[0]?.signedUrl ||
          data?.signedUrl ||
          primaryLesson?.videos?.[0]?.storageKey ||
          null
        );
      } catch (error) {
        console.error(error);
      }
    }

    void loadLessonVideo();
  }, [primaryLesson, isEnrolled, course?.isIncentivized]);

  async function handleEnroll() {
    try {
      setEnrolling(true);
      setEnrollError(null);

      const token = localStorage.getItem("auth_token");
      if (!token) {
        setEnrollError("Please login first.");
        return;
      }

      const res = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEnrollError(data.error || "Enrollment failed.");
        return;
      }

      setIsEnrolled(true);
      await fetchProgress();
    } catch (error) {
      console.error(error);
      setEnrollError("Enrollment failed.");
    } finally {
      setEnrolling(false);
    }
  }

  async function markLessonWatched() {
    if (!primaryLesson) return;
    try {
      setMarkingWatched(true);
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      await fetch(`/api/lessons/${primaryLesson.id}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ videoProgressPercent: 100 }),
      });

      await fetchProgress();
    } catch (error) {
      console.error(error);
    } finally {
      setMarkingWatched(false);
    }
  }

  if (courseLoading) {
    return (
      <Layout>
        <div className="h-96 flex items-center justify-center text-gray-400">Loading course...</div>
      </Layout>
    );
  }

  if (!course || courseError) {
    return (
      <Layout>
        <div className="h-96 flex flex-col items-center justify-center gap-2">
          <p className="text-red-500">{courseError || "Course not found."}</p>
          <Link href="/courses" className="text-blue-400 hover:underline">
            Back to courses
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="space-y-2">
          <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
            {course.category} · {course.level}
          </p>
          <h1 className={`text-3xl font-bold ${isDark ? "text-white" : "text-safuDeep"}`}>
            {course.title}
          </h1>
          <p className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>{course.description}</p>
        </div>

        <div className={`rounded-2xl border p-4 ${isDark ? "border-[#2a2a3a] bg-[#12121a]" : "border-black/10 bg-white"}`}>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`px-2 py-1 rounded-full ${course.isIncentivized ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-500/20 text-slate-300"}`}>
              {course.isIncentivized ? "Incentivized" : "Free"}
            </span>
            {course.isIncentivized && course.scormVersion && (
              <span className="px-2 py-1 rounded-full bg-blue-500/20 text-blue-300">
                {course.scormVersion === "SCORM_2004" ? "SCORM 2004" : "SCORM 1.2"}
              </span>
            )}
            <span className={`${isDark ? "text-gray-400" : "text-gray-600"}`}>
              Duration: {course.duration}
            </span>
          </div>

          {isEnrolled && (
            <div className="mt-3 text-sm space-y-1">
              <p className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
                Progress: <span className="font-semibold">{progress?.progressPercent ?? 0}%</span>
              </p>
              {course.isIncentivized && (
                <>
                  <p className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    SCORM status: {progress?.scormCompletionStatus || "incomplete"}
                  </p>
                  <p className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
                    Quiz score: {progress?.scormQuizScore ?? "-"}
                  </p>
                  {typeof progress?.finalScore === "number" && (
                    <p className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      Final score: {progress.finalScore}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {!isEnrolled ? (
            <div className="mt-4 space-y-2">
              {!address ? (
                <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-600"}`}>Connect wallet to enroll.</p>
              ) : canEnroll ? (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className={`px-4 py-2 rounded-xl font-semibold ${isDark ? "bg-[#ffb000] text-black" : "bg-black text-white"}`}
                >
                  {enrolling ? "Enrolling..." : "Enroll Now"}
                </button>
              ) : (
                <p className="text-xs text-orange-500">Insufficient points to enroll.</p>
              )}
              {enrollError && <p className="text-xs text-red-500">{enrollError}</p>}
            </div>
          ) : course.isIncentivized ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/courses/${course.id}/scorm`}
                className={`px-4 py-2 rounded-xl font-semibold ${isDark ? "bg-[#ffb000] text-black" : "bg-black text-white"}`}
              >
                Open SCORM Course
              </Link>
              {progress?.leaderboardEligible && (
                <Link
                  href={`/courses/${course.id}/leaderboard`}
                  className="px-4 py-2 rounded-xl font-semibold border border-emerald-500 text-emerald-400"
                >
                  View Leaderboard
                </Link>
              )}
            </div>
          ) : (
            <button
              onClick={markLessonWatched}
              disabled={markingWatched}
              className={`mt-4 px-4 py-2 rounded-xl font-semibold ${isDark ? "bg-[#ffb000] text-black" : "bg-black text-white"}`}
            >
              {markingWatched ? "Saving..." : "Mark Lesson Watched"}
            </button>
          )}
        </div>

        {!course.isIncentivized && isEnrolled && embedUrl && (
          <div className="rounded-2xl overflow-hidden border border-black/10">
            <iframe
              src={embedUrl}
              className="w-full h-[520px]"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        <div className={`rounded-2xl border p-4 ${isDark ? "border-[#2a2a3a] bg-[#12121a]" : "border-black/10 bg-white"}`}>
          <h2 className={`text-lg font-semibold mb-2 ${isDark ? "text-white" : "text-safuDeep"}`}>About this course</h2>
          <p className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>{course.longDescription || course.description}</p>
        </div>

        {course.keyTakeaways && course.keyTakeaways.length > 0 && (
          <div className={`rounded-2xl border p-4 ${isDark ? "border-[#2a2a3a] bg-[#12121a]" : "border-black/10 bg-white"}`}>
            <h2 className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-safuDeep"}`}>Key Takeaways</h2>
            <ul className="space-y-2">
              {course.keyTakeaways.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 text-emerald-400">✓</span>
                  <span className={`${isDark ? "text-gray-300" : "text-gray-700"}`}>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
}
