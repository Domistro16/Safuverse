"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAccount } from "wagmi";
import { Layout } from "@/components/Layout";
import { calculateEngagementTimeScore, parseCourseDurationToSeconds } from "@/lib/scorm/scoring";

declare global {
  interface Window {
    API?: {
      LMSInitialize: (value: string) => string;
      LMSFinish: (value: string) => string;
      LMSGetValue: (key: string) => string;
      LMSSetValue: (key: string, value: string) => string;
      LMSCommit: (value: string) => string;
      LMSGetLastError: () => string;
      LMSGetErrorString: (_code: string) => string;
      LMSGetDiagnostic: (_code: string) => string;
    };
    API_1484_11?: {
      Initialize: (value: string) => string;
      Terminate: (value: string) => string;
      GetValue: (key: string) => string;
      SetValue: (key: string, value: string) => string;
      Commit: (value: string) => string;
      GetLastError: () => string;
      GetErrorString: (_code: string) => string;
      GetDiagnostic: (_code: string) => string;
    };
  }
}

interface Course {
  id: number;
  title: string;
  duration: string;
  isIncentivized: boolean;
  scormLaunchUrl: string | null;
}

interface RuntimeState {
  completionStatus?: string | null;
  successStatus?: string | null;
  normalizedScore?: number | null;
  totalTimeSeconds?: number;
}

export default function CourseScormPage() {
  const params = useParams();
  const courseId = params.courseId as string;
  const { address } = useAccount();

  const [course, setCourse] = useState<Course | null>(null);
  const [runtime, setRuntime] = useState<RuntimeState | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [proofSigned, setProofSigned] = useState(false);
  const [dappVisitTracked, setDappVisitTracked] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const stateRef = useRef<Record<string, string>>({});
  const initializedRef = useRef(false);

  const authHeaders = useMemo(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
    if (!token) return null;
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
  }, []);

  const scormCompleted = useMemo(() => {
    const completion = (runtime?.completionStatus || "").toLowerCase();
    const success = (runtime?.successStatus || "").toLowerCase();
    return completion === "completed" || success === "passed" || success === "failed";
  }, [runtime]);

  const quizScore = runtime?.normalizedScore ?? 0;
  const engagementScore = calculateEngagementTimeScore(
    runtime?.totalTimeSeconds || 0,
    parseCourseDurationToSeconds(course?.duration || "")
  );
  const baseScore = Math.round(0.7 * quizScore + 0.3 * engagementScore);

  async function fetchCourseAndProgress() {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    const [courseRes, progressRes] = await Promise.all([
      fetch(`/api/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`/api/courses/${courseId}/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    if (courseRes.ok) {
      const data = await courseRes.json();
      setCourse(data.course);
    }

    if (progressRes.ok) {
      const data = await progressRes.json();
      if (data.progress) {
        setIsEnrolled(true);
        setProofSigned(!!data.progress.proofSigned);
        setDappVisitTracked(!!data.progress.dappVisitTracked);
        if (typeof data.progress.finalScore === "number") {
          setFinalScore(data.progress.finalScore);
        }
      }
    }
  }

  async function fetchRuntimeState() {
    const token = localStorage.getItem("auth_token");
    if (!token) return;

    const res = await fetch(`/api/scorm/${courseId}/state`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;

    const data = await res.json();
    if (data.runtime?.cmiState) {
      stateRef.current = data.runtime.cmiState;
    }
    setRuntime(data.runtime || null);
  }

  async function initializeRuntime() {
    if (!authHeaders || initializedRef.current) return;
    initializedRef.current = true;

    await fetch(`/api/scorm/${courseId}/initialize`, {
      method: "POST",
      headers: authHeaders,
    });

    await fetchRuntimeState();
  }

  async function commitRuntime() {
    if (!authHeaders) return;
    await fetch(`/api/scorm/${courseId}/commit`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ state: stateRef.current }),
    });
    await fetchRuntimeState();
  }

  async function terminateRuntime() {
    if (!authHeaders) return;
    await fetch(`/api/scorm/${courseId}/terminate`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ state: stateRef.current }),
    });
    await fetchRuntimeState();
  }

  useEffect(() => {
    void fetchCourseAndProgress();
  }, [courseId]);

  useEffect(() => {
    if (!isEnrolled) return;
    void initializeRuntime();

    const interval = window.setInterval(() => {
      void commitRuntime();
    }, 15000);

    return () => {
      window.clearInterval(interval);
      void terminateRuntime();
    };
  }, [isEnrolled, authHeaders]);

  useEffect(() => {
    const api12 = {
      LMSInitialize: () => {
        void initializeRuntime();
        return "true";
      },
      LMSFinish: () => {
        void terminateRuntime();
        return "true";
      },
      LMSGetValue: (key: string) => stateRef.current[key] || "",
      LMSSetValue: (key: string, value: string) => {
        stateRef.current[key] = value;
        return "true";
      },
      LMSCommit: () => {
        void commitRuntime();
        return "true";
      },
      LMSGetLastError: () => "0",
      LMSGetErrorString: () => "",
      LMSGetDiagnostic: () => "",
    };

    const api2004 = {
      Initialize: () => {
        void initializeRuntime();
        return "true";
      },
      Terminate: () => {
        void terminateRuntime();
        return "true";
      },
      GetValue: (key: string) => stateRef.current[key] || "",
      SetValue: (key: string, value: string) => {
        stateRef.current[key] = value;
        return "true";
      },
      Commit: () => {
        void commitRuntime();
        return "true";
      },
      GetLastError: () => "0",
      GetErrorString: () => "",
      GetDiagnostic: () => "",
    };

    window.API = api12;
    window.API_1484_11 = api2004;

    return () => {
      delete window.API;
      delete window.API_1484_11;
    };
  }, [authHeaders]);

  async function handleProofSign() {
    try {
      if (!address || !window.ethereum) {
        setStatusMessage("Connect your wallet to sign proof.");
        return;
      }

      const token = localStorage.getItem("auth_token");
      if (!token) {
        setStatusMessage("Login is required.");
        return;
      }

      const nonceRes = await fetch(`/api/courses/${courseId}/claim/nonce`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const nonceData = await nonceRes.json();
      if (!nonceRes.ok) {
        setStatusMessage(nonceData.error || "Failed to request nonce.");
        return;
      }

      const signature = (await window.ethereum.request({
        method: "personal_sign",
        params: [nonceData.message, address],
      })) as string;

      const verifyRes = await fetch(`/api/courses/${courseId}/claim/actions/signature`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nonce: nonceData.nonce,
          message: nonceData.message,
          signature,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        setStatusMessage(verifyData.error || "Signature verification failed.");
        return;
      }

      setProofSigned(true);
      setStatusMessage("Signature proof verified.");
    } catch (error) {
      console.error(error);
      setStatusMessage("Signature flow failed.");
    }
  }

  async function handleDappVisitAction() {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setStatusMessage("Login is required.");
      return;
    }

    const res = await fetch(`/api/courses/${courseId}/claim/actions/dapp-visit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatusMessage(data.error || "Failed to track dApp visit.");
      return;
    }

    setDappVisitTracked(true);
    setStatusMessage("dApp visit action tracked.");
    window.open("/points", "_blank", "noopener,noreferrer");
  }

  async function handleFinalClaim() {
    try {
      setClaiming(true);
      setStatusMessage(null);

      const token = localStorage.getItem("auth_token");
      if (!token) {
        setStatusMessage("Login is required.");
        return;
      }

      const res = await fetch(`/api/courses/${courseId}/claim/final`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatusMessage(data.error || "Final claim failed.");
        return;
      }

      setFinalScore(data.finalScore ?? null);
      setStatusMessage(`Final score submitted: ${data.finalScore}`);
      await fetchCourseAndProgress();
    } finally {
      setClaiming(false);
    }
  }

  if (!course) {
    return (
      <Layout>
        <div className="h-96 flex items-center justify-center text-gray-400">Loading SCORM course...</div>
      </Layout>
    );
  }

  if (!course.isIncentivized) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto py-10 space-y-4">
          <p className="text-red-400">This course is not incentivized and does not use SCORM playback.</p>
          <Link href={`/courses/${course.id}`} className="text-blue-400 hover:underline">
            Back to course
          </Link>
        </div>
      </Layout>
    );
  }

  if (!isEnrolled) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto py-10 space-y-4">
          <p className="text-gray-300">Enroll in the course before launching SCORM.</p>
          <Link href={`/courses/${course.id}`} className="text-blue-400 hover:underline">
            Back to course
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">{course.title} · SCORM</h1>
          <p className="text-sm text-gray-400">Complete SCORM tracking, then claim final score.</p>
        </div>

        <div className="rounded-2xl overflow-hidden border border-[#2a2a3a]">
          {course.scormLaunchUrl ? (
            <iframe src={course.scormLaunchUrl} className="w-full h-[680px] bg-white" allowFullScreen />
          ) : (
            <div className="h-64 flex items-center justify-center text-red-400">
              Missing SCORM launch URL. Ask an admin to upload/configure the package.
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[#2a2a3a] bg-[#12121a] p-4 space-y-3">
          <h2 className="font-semibold text-white">Post-Course Claim</h2>

          <div className="text-sm text-gray-300 space-y-1">
            <p>SCORM completion: {scormCompleted ? "Completed" : "Incomplete"}</p>
            <p>Quiz score: {quizScore}</p>
            <p>Engagement score: {engagementScore}</p>
            <p>Base score (70/30): {baseScore}</p>
            <p>Proof signed: {proofSigned ? "Yes" : "No"}</p>
            <p>dApp visit tracked: {dappVisitTracked ? "Yes" : "No"}</p>
            {finalScore !== null && <p className="font-semibold text-emerald-400">Final score: {finalScore}</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleProofSign}
              disabled={proofSigned}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${proofSigned ? "bg-green-600 text-white" : "bg-blue-600 text-white"}`}
            >
              {proofSigned ? "Signature Verified" : "Sign Proof"}
            </button>

            <button
              onClick={handleDappVisitAction}
              disabled={dappVisitTracked}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${dappVisitTracked ? "bg-green-600 text-white" : "bg-slate-700 text-white"}`}
            >
              {dappVisitTracked ? "dApp Visit Tracked" : "Track dApp Visit"}
            </button>

            <button
              onClick={handleFinalClaim}
              disabled={!scormCompleted || !proofSigned || claiming}
              className={`px-3 py-2 rounded-lg text-sm font-semibold ${!scormCompleted || !proofSigned || claiming ? "bg-gray-600 text-gray-300" : "bg-[#ffb000] text-black"}`}
            >
              {claiming ? "Submitting..." : "Claim Final Completion & Submit"}
            </button>

            {finalScore !== null && (
              <Link
                href={`/courses/${course.id}/leaderboard`}
                className="px-3 py-2 rounded-lg text-sm font-semibold border border-emerald-500 text-emerald-400"
              >
                View Leaderboard
              </Link>
            )}
          </div>

          {statusMessage && <p className="text-xs text-amber-300">{statusMessage}</p>}
        </div>
      </div>
    </Layout>
  );
}
