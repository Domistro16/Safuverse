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
  Info,
  AlertTriangle,
  Link as LinkIcon,
  LucideIcon,
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
    <div className="min-h-screen crypto-pattern py-12 md:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-6 md:mb-8"
        >
          <Link to="/courses/all">
            <Button
              variant="ghost"
              className="text-primary hover:bg-primary/10"
            >
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back to All Courses
            </Button>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="lg:col-span-2 space-y-8"
          >
            <div className="glass-effect p-6 md:p-8 rounded-xl">
              <div className="flex items-center mb-4">
                <IconComponent className="w-10 h-10 text-primary mr-4" />
                <div>
                  <Badge
                    variant="outline"
                    className="mb-2 border-primary text-primary"
                  >
                    {course.level}
                  </Badge>
                  <h1 className="text-3xl md:text-4xl font-bold primary-gradient-text">
                    {course.title}
                  </h1>
                </div>
              </div>
              <p className="text-lg text-gray-300 leading-relaxed mb-1">
                {course.description.replace(" Access with .safu domain.", "")}
              </p>
              {!isEnrolled && (
                <p className="text-sm text-amber-400 flex items-center">
                  <Info size={16} className="mr-1.5" /> Mint your{" "}
                  <code className="text-primary font-semibold p-0.5 rounded bg-primary/10 mx-1">
                    .safu
                  </code>{" "}
                  domain to enroll and access full content.
                </p>
              )}

              <div className="flex flex-wrap gap-4 mt-6 text-sm">
                <div className="flex items-center text-gray-300">
                  <Users className="w-4 h-4 mr-1.5 text-primary/80" />{" "}
                  {coursePartcipants as number} students
                </div>
                <div className="flex items-center text-gray-300">
                  <Clock className="w-4 h-4 mr-1.5 text-primary/80" /> Approx.{" "}
                  {course.duration} minutes
                </div>
              </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 gap-2 bg-card/50 p-1.5 h-30 rounded-lg border border-border">
                <TabsTrigger
                  value="overview"
                  className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="modules"
                  className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                >
                  Modules
                </TabsTrigger>
                {isEnrolled && (
                  <TabsTrigger
                    value="content"
                    className="py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
                  >
                    Course Content
                  </TabsTrigger>
                )}
              </TabsList>

              <div className="mt-6 glass-effect p-6 md:p-8 rounded-xl min-h-[300px]">
                <TabsContent value="overview">
                  <h2 className="text-2xl font-semibold mb-4 text-gray-100">
                    Course Overview
                  </h2>

                  {course.longDescription
                    .split("\n")
                    .map((paragraph, index) => (
                      <p
                        key={index}
                        className="text-gray-300 leading-relaxed mb-6"
                      >
                        {paragraph}
                      </p>
                    ))}

                  <h3 className="text-xl font-semibold mb-3 text-gray-200">
                    What You'll Learn
                  </h3>
                  <ul className="space-y-2 mb-6">
                    {course.objectives.map((item, idx) => (
                      <li key={idx} className="flex items-start text-gray-300">
                        <CheckCircle className="w-5 h-5 text-green-400 mr-3 mt-1 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <h3 className="text-xl font-semibold mb-3 text-gray-200">
                    Prerequisites
                  </h3>
                  <ul className="space-y-2">
                    {course.prerequisites.map((item, idx) => (
                      <li key={idx} className="flex items-start text-gray-300">
                        <Info className="w-5 h-5 text-cyan-400 mr-3 mt-1 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </TabsContent>

                <TabsContent value="modules">
                  <h2 className="text-2xl font-semibold mb-6 text-gray-100">
                    Course Modules
                  </h2>
                  <div className="space-y-4">
                    {course.lessons.map((module, idx) => (
                      <div
                        key={idx}
                        className="p-4 border border-border rounded-lg bg-background/30"
                      >
                        <h3 className="text-lg font-semibold text-primary mb-1">
                          {module.lessontitle}
                        </h3>
                        <div className="flex items-center text-xs text-gray-400 space-x-3">
                          <span>&bull;</span>
                          <span>Approx. 3 minutes</span>
                        </div>
                        {!isEnrolled && idx >= 1 && (
                          <div className="mt-2 flex items-center text-sm text-amber-400">
                            <Lock size={14} className="mr-1.5" /> This module is
                            locked. Mint .safu domain & enroll to access.
                          </div>
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="lg:col-span-1 space-y-8"
          >
            <div className="glass-effect p-6 rounded-xl sticky top-24">
              <img
                className="w-full h-48 object-cover rounded-lg mb-6 shadow-lg"
                alt={`${course.title} promotional image`}
                src={course.url}
              />

              {isEnrolled ? (
                <div className="text-center">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2 primary-gradient-text">
                    You're Enrolled!
                  </h3>
                  <p className="text-gray-300 mb-4">
                    Start learning now or explore other courses.
                  </p>
                  <div className="my-3 text-left font-semibold text-gray-400">
                    Course Progress
                    <Progress value={progress} className="mt-1" />
                  </div>
                  <Link
                    to={`${
                      progress === 100
                        ? ""
                        : `/courses/lesson/${courseId}/${
                            lastWatched == null ? 0 : lastWatched + 1
                          }`
                    }`}
                  >
                    <Button
                      variant="outline"
                      className="w-full border-primary text-primary hover:bg-primary/10"
                    >
                      {progress == 100
                        ? "View Certificate"
                        : progress == 0
                        ? "Start Learning"
                        : "Continue Learning"}
                    </Button>
                  </Link>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold mb-2 primary-gradient-text">
                    Enrollment Required
                  </h2>
                  <p className="text-sm text-gray-400 mb-5">
                    Full access to this course and its materials is unlocked by
                    minting your{" "}
                    <code className="text-primary font-semibold p-1 rounded bg-primary/10">
                      .safu
                    </code>{" "}
                    domain.
                  </p>
                  <Button
                    size="lg"
                    onClick={handleEnrollOrMint}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-primary to-orange-400 hover:from-orange-500 hover:to-primary text-background font-semibold text-md py-3.5 rounded-lg shadow-xl hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105 neon-glow"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center space-x-1 text-xl font-bold">
                        <span>●</span>
                        <span>●</span>
                        <span>●</span>
                      </span>
                    ) : (
                      <>
                        <LinkIcon className="w-5 h-5 mr-2.5" />
                        {!name ? "Mint .safu Domain to Enroll" : "Enroll"}
                      </>
                    )}
                  </Button>
                  {/* Simulate enrollment after mint button for demo */}
                </>
              )}

              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-lg font-semibold mb-3 text-gray-200">
                  Instructor
                </h3>
                <div className="flex items-center space-x-3">
                  <img
                    className="w-12 h-12 rounded-full object-cover"
                    alt={course.instructor}
                    src="https://images.unsplash.com/photo-1578390432942-d323db577792"
                  />
                  <div>
                    <p className="font-semibold text-gray-100">
                      {course.instructor}
                    </p>
                    <p className="text-xs text-primary">
                      Web3 Educator & Specialist
                    </p>
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
