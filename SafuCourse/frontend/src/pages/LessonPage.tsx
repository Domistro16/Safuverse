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
      <div className="flex items-center justify-center h-screen">
        {videos.length}
        <div className="w-16 h-16 border-4 border-yellow-300 border-t-yellow-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center crypto-pattern py-12 px-4">
        <AlertTriangle className="w-24 h-24 text-destructive mb-6" />
        <h1 className="text-4xl font-bold mb-4 primary-gradient-text">
          Course Not Found
        </h1>
        <p className="text-xl text-gray-300 mb-8">
          Oops! We couldn't find the course you're looking for.
        </p>
        <Link to="/courses/all">
          <Button
            size="lg"
            className="bg-gradient-to-r from-primary to-orange-400 hover:from-orange-500 hover:to-primary text-background font-semibold"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back to All Courses
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen crypto-pattern py-5 md:py-5 px-4 sm:px-6 lg:px-8 w-full crypto-pattern -mb-10 md:mb-10 justify-center">
      <div>
        <Link to={`/courses/${courseId}`}>
          <Button
            variant="ghost"
            className="text-primary hover:bg-primary/10 md:ml-20"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back to Course
          </Button>
        </Link>
        <h1 className=" md:text-xl font-light text-sm primary-gradient-text text-left sm:mt-5 md:ml-20 mt-5">
          <span className="">{course.title}:</span>
          <br />
          {course.lessons[Number(id)].lessontitle} (Lesson {Number(id) + 1})
        </h1>
      </div>
      <div className="h-[50%] md:h-[400px] w-[100%] md:w-[70%] lg:w-[70%] mx-auto mt-10 mb-40">
        <div className="mb-6 flex justify-center">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  bool ? "bg-green-500 animate-pulse" : "bg-yellow-500"
                }`}
              />
              <span className="text-white font-semibold">
                {bool ? "✓ Watched" : "Watching"}
              </span>
            </div>
            <div className="h-4 w-px bg-white/30" />
            <span className="text-white/80 text-sm">
              {watchedPercentage.toFixed(1)}% completed
            </span>
          </div>
        </div>

        <VideoPlayer videos={videos} onWatchedChange={handleWatchedChange} />

        <div className="flex justify-between mt-5">
          {Number(id) >= 1 ? (
            <button
              className="px-3 py-1 border-2 border-neutral-500 primary-gradient-text rounded-xl font-bold transition-all duration-300 delay-100 hover:border-[#FFB000]"
              onClick={() => prev()}
            >
              Back
            </button>
          ) : (
            <div /> // Empty div to maintain space if Back button is hidden
          )}
          <button
            className="px-3 py-1 border-2 border-neutral-500 primary-gradient-text rounded-xl font-bold transition-all duration-300 delay-100 hover:border-[#FFB000]"
            onClick={() => next()}
          >
            {Number(id) === course.lessons.length + 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonPlayer;
