import { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Target,
  Play,
  Rocket,
  Brain,
  CheckCircle,
  Clock,
  Users,
  BookOpen,
  Lock,
  ChevronLeft,
  ChevronDown,
  Info,
  AlertTriangle,
  Link as LinkIcon,
  LucideIcon,
  Star,
  PlayCircle,
  Heart,
  Share2,
} from "lucide-react";
import CourseCard from "@/components/CourseCard";
import { Course } from "@/constants";
import { useAccount, useReadContract, useSignMessage } from "wagmi";
import { abi, Deploy } from "@/constants";
import { getParticipants } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { getProgress } from "@/hooks/progress";
import { useENSName } from "@/hooks/getPrimaryName";

const iconMap = {
  Target,
  Play,
  Rocket,
  Brain,
};

type UserType = [
  Course, // replace with the actual structure or use `any` if unknown
  boolean,
  number,
  string[], // or `any[]` if it's not an array of strings
  bigint
];

export const getRandomIcon = (title: string): LucideIcon => {
  const iconKeys = Object.keys(iconMap) as (keyof typeof iconMap)[];
  const hash = [...title].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % iconKeys.length;
  return iconMap[iconKeys[index]];
};

const CourseDetailPage = () => {
  const { courseId } = useParams();
  const { address } = useAccount();
  const { data: courses, isPending } = useReadContract({
    abi: abi,
    functionName: "getCourses",
    address: Deploy,
  }) as {
    data: Course[];
    isPending: boolean;
  };

  const { data: userCourse, isPending: userLoading } = useReadContract({
    abi: abi,
    functionName: "getCourse",
    address: Deploy,
    args: [Number(courseId), address],
  }) as {
    data: UserType;
    isPending: boolean;
  };
  // const { data: hash, writeContract, error } = useGaslessContractWrite();
  const navigate = useNavigate();
  const coursePartcipants = getParticipants(Number(courseId));
  const [isEnrolled, setIsEnrolled] = useState(false); // Mock state
  const [lessonIds, setLessonIds] = useState<number[]>([]);
  const { name } = useENSName({ owner: address as `0x${string}` });
  const [lastWatched, setLastWatched] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const { signMessageAsync } = useSignMessage(); // Use isConnected to check if a wallet is connected

  useEffect(() => {
    if (userCourse && Symbol.iterator in Object(userCourse)) {
      const [, isActive] = userCourse;
      setIsEnrolled(isActive);
    }
  }, [userCourse]);

  useEffect(() => {
    const callUser = async () => {
      const progress = await getProgress(address as string, Number(courseId));
      if (progress && Object.keys(progress).length > 0) {
        setLessonIds(progress.completedLessons);
        setLastWatched(progress.lastWatched);
      }
    };
    callUser();
  }, [courseId, address]);

  const enroll = async () => {
    const course = courses.find((c) => Number(c.id) === Number(courseId));

    const messageToSign = `Enrolling for: ${course?.title}`;

    const signature = await signMessageAsync({ message: messageToSign });
    if (!signature) return;
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}enroll/${address}/${courseId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_API_KEY,
        },
      }
    );

    if (!response.ok) {
    }
    await response.json();
  };

  const progress = useMemo(() => {
    if (courses) {
      const course = courses.find((c) => Number(c.id) === Number(courseId));
      if (course) {
        const percentage = 100 / course?.lessons.length;
        return percentage * lessonIds.length;
      }
    } else {
      return 0;
    }
  }, [courses, lessonIds]);

  if (isPending || !courses || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-2 border-yellow-300 border-t-yellow-500 rounded-full animate-spin" />
      </div>
    );
  }
  const course = courses.find((c) => Number(c.id) === Number(courseId));

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

  const IconComponent = getRandomIcon(course.title) || BookOpen;
  const relatedCourses = courses
    .filter(
      (c) => Number(c.id) !== Number(courseId) && c.level === course.level
    )
    .slice(0, 2);

  const handleEnrollOrMint = () => {
    // In a real app, this would check actual .safu domain status via API
    // For this demo, we assume they need to mint first if not "enrolled"
    setLoading(true);
    if (!name) {
      alert(
        "To enroll, you first need to mint your .safu domain. Let's go mint one!"
      );
      window.location.href = "https://names.safuverse.com";
    }
    if (!isEnrolled && name) {
      // Here you could have a modal pop up, or redirect to a minting page/service
      // For now, we'll simulate with an alert and then a redirect for demo purposes
      enroll().then(() => {
        setLoading(false);
        window.location.reload();
      }); // Refresh the page after enroll is done // Redirect to the minting page/section
      // A more robust solution would be a modal with a "Mint Now" button that leads to the minting flow.
    } else {
      // This part is if they were already "enrolled" or had a domain.
      // We'll just log for now, as `isEnrolled` is true, the UI shows "You're Enrolled"
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <motion.nav
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2 text-sm text-muted-foreground mb-6"
        >
          <Link to="/" className="hover:text-primary">Home</Link>
          <ChevronLeft className="w-4 h-4 rotate-180" />
          <Link to="/courses/all" className="hover:text-primary">Courses</Link>
          <ChevronLeft className="w-4 h-4 rotate-180" />
          <span className="text-foreground">{course.title}</span>
        </motion.nav>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 md:gap-12">
          {/* Left - Course Info (3 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-3 space-y-8"
          >
            {/* Course Hero */}
            <div>
              {/* Topics/Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge
                  variant={
                    course.level.toLowerCase() === 'beginner' ? 'beginner' :
                    course.level.toLowerCase() === 'intermediate' ? 'intermediate' :
                    course.level.toLowerCase() === 'advanced' ? 'advanced' : 'default'
                  }
                >
                  {course.level}
                </Badge>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
                {course.title}
              </h1>

              {/* Description */}
              <p className="text-lg text-muted-foreground mb-6">
                {course.description.replace(" Access with .safu domain.", "")}
              </p>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 mb-6 text-sm">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold">{course.rating || 4.8}</span>
                  <span className="text-muted-foreground">(120 reviews)</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {coursePartcipants} students
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {course.duration}m total
                </div>
              </div>

              {/* Instructor Snippet */}
              <div className="flex items-center gap-3 mb-8">
                <img
                  className="w-12 h-12 rounded-full object-cover"
                  alt={course.instructor}
                  src="https://images.unsplash.com/photo-1578390432942-d323db577792"
                />
                <div>
                  <p className="text-sm text-muted-foreground">Created by</p>
                  <p className="font-medium">{course.instructor}</p>
                </div>
              </div>

              {/* CTAs - Desktop */}
              {!isEnrolled && (
                <div className="hidden lg:flex gap-4 p-4 rounded-xl bg-amber-400/10 border border-amber-400/20">
                  <Info className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-400">
                    Mint your{" "}
                    <code className="text-primary font-semibold px-1.5 py-0.5 rounded bg-primary/10">
                      .safu
                    </code>{" "}
                    domain to enroll and access full content.
                  </p>
                </div>
              )}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 gap-2 bg-secondary p-1.5 rounded-xl border border-border">
                <TabsTrigger
                  value="overview"
                  className="py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-md"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="curriculum"
                  className="py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-md"
                >
                  Curriculum
                </TabsTrigger>
                {isEnrolled && (
                  <TabsTrigger
                    value="content"
                    className="py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-black data-[state=active]:shadow-md"
                  >
                    Start Learning
                  </TabsTrigger>
                )}
              </TabsList>

              <div className="mt-6">
                <TabsContent value="overview" className="space-y-8">
                  <div>
                    <h2 className="text-2xl font-semibold mb-4">
                      About This Course
                    </h2>
                    {course.longDescription
                      .split("\n")
                      .map((paragraph, index) => (
                        <p
                          key={index}
                          className="text-muted-foreground leading-relaxed mb-4"
                        >
                          {paragraph}
                        </p>
                      ))}
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      What You'll Learn
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {course.objectives.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold mb-4">
                      Prerequisites
                    </h3>
                    <ul className="space-y-2">
                      {course.prerequisites.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="curriculum" className="space-y-4">
                  <h2 className="text-2xl font-semibold mb-6">
                    Course Curriculum
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {course.lessons.length} lessons • {course.duration} minutes total
                  </p>

                  <div className="space-y-3">
                    {course.lessons.map((module, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                                {idx + 1}
                              </span>
                              <h3 className="font-semibold">
                                {module.lessontitle}
                              </h3>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground ml-11">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                3 min
                              </span>
                              {module.hasQuiz && (
                                <Badge variant="info" className="text-xs py-0">
                                  Quiz
                                </Badge>
                              )}
                            </div>
                          </div>
                          {!isEnrolled && idx >= 1 ? (
                            <Lock className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            isEnrolled && lessonIds.includes(idx) && (
                              <CheckCircle className="w-5 h-5 text-success" />
                            )
                          )}
                        </div>
                        {!isEnrolled && idx >= 1 && (
                          <p className="text-xs text-amber-400 mt-3 ml-11">
                            Enroll to unlock this lesson
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {isEnrolled && (
                  <TabsContent value="content">
                    <h2 className="text-2xl font-semibold mb-6 text-gray-100">
                      Access Course Content
                    </h2>
                    <p className="text-gray-300 mb-4">
                      Congratulations on enrolling! You now have full access to
                      all course materials.
                    </p>
                    <div className="space-y-3">
                      {course.lessons.map((module, idx) => (
                        <Button
                          key={idx}
                          variant="secondary"
                          className="w-full justify-start text-left h-auto py-3 disabled:no-cursor-allowed"
                          onClick={() =>
                            navigate(`/courses/lesson/${courseId}/${idx}`)
                          }
                          disabled={idx > lessonIds.length}
                        >
                          <BookOpen size={18} className="mr-3 text-primary" />
                          <div>
                            <p className="font-semibold">
                              {module.lessontitle}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              3 minutes
                            </p>
                          </div>
                        </Button>
                      ))}
                    </div>
                    <img
                      alt="Abstract representation of digital learning content"
                      className="w-full h-auto mt-6 rounded-lg object-cover opacity-70 max-h-60"
                      src="https://images.unsplash.com/photo-1656003643733-ba8e6cdcfe2f"
                    />
                  </TabsContent>
                )}
              </div>
            </Tabs>
          </motion.div>

          {/* Right - Video Preview/Enroll Card (2 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="sticky top-24">
              <div className="rounded-2xl overflow-hidden bg-card border border-border">
                {/* Video/Thumbnail */}
                <div className="relative aspect-video">
                  <img
                    className="w-full h-full object-cover"
                    alt={`${course.title} promotional image`}
                    src={course.url}
                  />
                  <button className="absolute inset-0 flex items-center justify-center bg-black/40 group">
                    <div className="w-16 h-16 rounded-full accent-gradient flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-black ml-1" />
                    </div>
                  </button>
                </div>

                {/* Enroll Card */}
                <div className="p-6">
                  {isEnrolled ? (
                    <>
                      <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="w-8 h-8 text-success" />
                        <div>
                          <h3 className="text-xl font-bold">You're Enrolled!</h3>
                          <p className="text-sm text-muted-foreground">
                            {Math.round(progress)}% complete
                          </p>
                        </div>
                      </div>

                      <Progress value={progress} className="mb-4" />

                      <Link
                        to={`${
                          progress === 100
                            ? ""
                            : `/courses/lesson/${courseId}/${
                                lastWatched == null ? 0 : lastWatched + 1
                              }`
                        }`}
                      >
                        <Button variant="primary" size="lg" className="w-full mb-3">
                          {progress == 100
                            ? "View Certificate"
                            : progress == 0
                            ? "Start Learning"
                            : "Continue Learning"}
                        </Button>
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-3xl font-bold">FREE</span>
                      </div>

                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full mb-3"
                        onClick={handleEnrollOrMint}
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="flex items-center justify-center">
                            <span className="animate-pulse">Enrolling...</span>
                          </span>
                        ) : (
                          <>
                            {!name ? "Mint .safu Domain to Enroll" : "Enroll Now"}
                          </>
                        )}
                      </Button>

                      <p className="text-center text-sm text-muted-foreground mb-4">
                        Requires .safu domain
                      </p>
                    </>
                  )}

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>Lifetime access</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>{course.lessons.length} lessons</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>Certificate of completion</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-primary" />
                      <span>Access to community</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border">
                    <div className="flex items-center justify-between gap-2">
                      <Button variant="ghost" size="sm" className="flex-1">
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      <Button variant="ghost" size="sm" className="flex-1">
                        <Heart className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {relatedCourses.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.2 }}
            className="mt-16 md:mt-24"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              Related <span className="primary-gradient-text">Courses</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedCourses.map((relatedCourse) => (
                <CourseCard key={relatedCourse.id} course={relatedCourse} />
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
};

export default CourseDetailPage;
