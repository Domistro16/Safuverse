import { useEffect, useMemo, useRef, useState } from "react";
import { PinataSDK } from "pinata";
import { abi, Course, Deploy } from "@/constants";
// This imports the functional component from the previous sample.
import { getProgress, updateProgress } from "@/hooks/progress";
import { useAccount, useReadContract } from "wagmi";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronLeft } from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";

import VideoPlayer from "@/components/VideoPlayer";

type UserType = [
  Course, // replace with the actual structure or use `any` if unknown
  boolean,
  number,
  string[], // or `any[]` if it's not an array of strings
  bigint
];

interface VideoSource {
  url: string;
  language: string;
  label: string;
}
const LessonPlayer = () => {
  const { courseId, id } = useParams<string>();
  const [bool, setContinue] = useState(false);
  const [lessonIds, setLessonIds] = useState<number[]>([]);
  const [retrieved, setRetrieved] = useState(false);
  const { address } = useAccount();
  const [wallet, setWallet] = useState<`0x${string}`>();
  const [watchedPercentage, setWatchedPercentage] = useState(0);

  const { data: userCourse, isPending: userLoading } = useReadContract({
    abi: abi,
    functionName: "getCourse",
    address: Deploy,
    args: [Number(courseId), address],
  }) as {
    data: UserType;
    isPending: boolean;
  };
  useEffect(() => {
    if (userCourse && Symbol.iterator in Object(userCourse)) {
      const [, isActive] = userCourse;
      if (!isActive) {
        navigate(`/courses/${courseId}`);
      }
    }
  }, [userCourse]);
  const handleWatchedChange = (watched: boolean, percentage: number) => {
    setContinue(watched);
    setWatchedPercentage(percentage);
    setLessonIds((prev) => [...prev, Number(id)]);
    updateProgress(wallet!, Number(courseId!), Number(id));
  };
  // const { data: hash, writeContract, error } = useGaslessContractWrite();

  const pinata = useMemo(
    () =>
      new PinataSDK({
        pinataJwt: import.meta.env.VITE_PINATA_JWT!,
        pinataGateway: "jade-obliged-caribou-149.mypinata.cloud",
      }),
    []
  );
  const boolRef = useRef(bool);
  const { data: courses, isPending } = useReadContract({
    abi: abi,
    functionName: "getCourses",
    address: Deploy,
  }) as {
    data: Course[];
    isPending: boolean;
  };
  const navigate = useNavigate();
  useEffect(() => {
    const callUser = async () => {
      const progress = await getProgress(address as string, Number(courseId));

      if (progress && Object.keys(progress).length > 0) {
        setLessonIds(progress.completedLessons);
        setRetrieved(true);
      }
    };
    callUser();
  }, [courseId, address]);

  useEffect(() => {
    if (!retrieved) return;
    if (lessonIds.length < Number(id)) {
      navigate(`/courses/${courseId}`);
    }
  }, [lessonIds, id]);

  // Update ref when state changes
  useEffect(() => {
    boolRef.current = bool;
  }, [bool]);

  useEffect(() => {
    setContinue(false);
  }, [Number(id)]);
  useEffect(() => {
    if (!address) return;
    setWallet(address);
  }, [address]);

  const course = courses?.find((c) => Number(c.id) === Number(courseId));

  const [videos, setVideos] = useState<VideoSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function getVideo() {
      if (!course) {
        setVideos([]);
        return;
      }
      const lesson = course.lessons[Number(id)];
      if (!lesson) {
        setVideos([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // first link
        const userLang = navigator.language;
        // e.g. "en-US", "zh-CN", etc.

        // fetch English video
        const res1 = await pinata.gateways.private.createAccessLink({
          cid: lesson.url[0] as string,
          expires: 800,
        });
        const url1 =
          typeof res1 === "string"
            ? res1
            : (res1 as any).accessLink ??
              (res1 as any).url ??
              JSON.stringify(res1);

        // fetch Chinese video (if available)
        let url2: string | null = null;
        if (lesson.url?.[1]) {
          const res2 = await pinata.gateways.private.createAccessLink({
            cid: lesson.url[1] as string,
            expires: 800,
          });
          url2 =
            typeof res2 === "string"
              ? res2
              : (res2 as any).accessLink ??
                (res2 as any).url ??
                JSON.stringify(res2);
        }

        // now determine the order based on language
        let newVideos: VideoSource[] = [];

        if (userLang.startsWith("zh") && url2) {
          // Chinese preferred
          newVideos = [
            { url: url2, language: "zh", label: "中文" },
            { url: url1, language: "en", label: "English" },
          ];
        } else {
          // English preferred (default)
          newVideos = [{ url: url1, language: "en", label: "English" }];
          if (url2)
            newVideos.push({ url: url2, language: "zh", label: "中文" });
        }

        if (!cancelled) setVideos(newVideos);
      } catch (err: any) {
        console.error("Failed to fetch video:", err);
        if (!cancelled) setError(String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    getVideo();
    return () => {
      cancelled = true; // avoid setting state after unmount
    };
  }, [id, course, pinata]); // prefer id, not Number(id) — keeps deps stable

  const next = (): void => {
    if (!course) return;

    const currentId = Number(id);

    const canAccessNext =
      (bool || lessonIds.includes(currentId)) &&
      currentId < course.lessons.length;

    if (canAccessNext) {
      navigate(`/courses/lesson/${courseId}/${currentId + 1}`);
      setContinue(false);
    } else {
      window.alert("C'mon, Don't skip a lesson");
    }
  };

  const prev = (): void => {
    navigate(`/courses/lesson/${courseId}/${Number(id) - 1}`);
    setContinue(false);
  };
  // Watch for progress

  if (isPending || !courses || !address || loading || error || userLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center bg-background py-12 px-4">
        <AlertTriangle className="w-24 h-24 text-destructive mb-6" />
        <h1 className="text-4xl font-bold mb-4 primary-gradient-text">
          Course Not Found
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Oops! We couldn't find the course you're looking for.
        </p>
        <Link to="/courses/all">
          <Button variant="primary" size="lg">
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back to All Courses
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <Link to={`/courses/${courseId}`}>
          <Button variant="ghost" className="text-primary hover:bg-primary/10 mb-6">
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back to Course
          </Button>
        </Link>
        <div className="mb-8">
          <p className="text-sm text-muted-foreground mb-2">{course.title}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {course.lessons[Number(id)].lessontitle}
          </h1>
          <p className="text-sm text-primary mt-1">Lesson {Number(id) + 1} of {course.lessons.length}</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-3 bg-card/50 backdrop-blur-sm rounded-full px-6 py-3 border border-border">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  bool ? "bg-success animate-pulse" : "bg-warning"
                }`}
              />
              <span className="text-foreground font-semibold text-sm">
                {bool ? "✓ Watched" : "Watching"}
              </span>
            </div>
            <div className="h-4 w-px bg-border" />
            <span className="text-muted-foreground text-sm">
              {watchedPercentage.toFixed(1)}% completed
            </span>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden border border-border bg-card/30 mb-8">
          <VideoPlayer videos={videos} onWatchedChange={handleWatchedChange} />
        </div>

        <div className="flex justify-between items-center">
          {Number(id) >= 1 ? (
            <Button variant="secondary" size="lg" onClick={() => prev()}>
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous Lesson
            </Button>
          ) : (
            <div />
          )}
          <Button variant="primary" size="lg" onClick={() => next()}>
            {Number(id) === course.lessons.length + 1 ? "Finish Course" : "Next Lesson"}
            {Number(id) !== course.lessons.length + 1 && (
              <ChevronLeft className="w-5 h-5 ml-2 rotate-180" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LessonPlayer;
