import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  ListFilter,
  X,
  ChevronDown,
  Sparkles,
  Star,
  Zap,
  Gem,
  LucideIcon,
} from "lucide-react";
import CourseCard from "@/components/CourseCard";
import { abi, Course, Deploy } from "@/constants";
import { useReadContract } from "wagmi";

const CourseListPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const { data: courses, isPending } = useReadContract({
    abi: abi,
    functionName: "getCourses",
    address: Deploy,
  }) as {
    data: Course[];
    isPending: boolean;
  };
  const fallbackCourses: Course[] = courses ?? [];
  const { data: participants } = useReadContract({
    abi,
    functionName: "getAllParticipants",
    address: Deploy as `0x${string}`,
  }) as {
    data: number[];
  };

  const levels = [
    "all",
    ...new Set(fallbackCourses?.map((course) => course.level)),
  ];
  const durations = ["all", "1-30 minutes", "30 minutes-1 hour", "1+ hours"];
  const categories = [
    "all",
    ...new Set(fallbackCourses?.map((course) => course.category)),
  ];
  const getDurationCategory = (duration: string) => {
    const minutes = parseInt(duration);
    if (minutes <= 30) return "1-30 minutes";
    if (minutes <= 60) return "30 minutes-1 hour";
    return "1+ hours";
  };

  const filteredCourses = useMemo(
    () =>
      fallbackCourses?.filter((course) => {
        const matchesSearchTerm =
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLevel =
          levelFilter === "all" || course.level === levelFilter;
        const matchesDuration =
          durationFilter === "all" ||
          getDurationCategory("10") === durationFilter;
        const matchesCategory =
          categoryFilter === "all" || course.category === categoryFilter;
        return (
          matchesSearchTerm &&
          matchesLevel &&
          matchesDuration &&
          matchesCategory
        );
      }),
    [fallbackCourses, searchTerm, levelFilter, durationFilter, categoryFilter]
  );

  const starterCourses = useMemo(
    () => fallbackCourses?.filter((c) => c.category === "Starter").slice(0, 3),
    [fallbackCourses]
  );
  const popularCourses = useMemo(() => {
    if (!participants) return [];

    return fallbackCourses
      ?.map((course, i) => ({
        ...course,
        participants: participants[i] || 0,
      }))
      .sort((a, b) => Number(b.participants) - Number(a.participants))
      .filter((c) => c.category === "Popular")
      .slice(0, 3);
  }, [fallbackCourses, participants]);

  const premiumCourses = useMemo(
    () => fallbackCourses?.filter((c) => c.category === "Premium").slice(0, 3),
    [fallbackCourses]
  );

  const Section = ({
    title,
    courses,
    icon,
    gradientText,
    id,
  }: {
    title: string;
    courses: Course[];
    icon: LucideIcon;
    gradientText: string;
    id: string;
  }) => (
    <section id={id} className="py-16 md:py-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.2 }}
        className="text-center mb-10 md:mb-12"
      >
        <div className="inline-flex items-center mb-3">
          {React.createElement(icon, {
            className: `w-8 h-8 ${gradientText ? "" : "text-primary"} mr-3`,
          })}
          <h2
            className={`text-3xl md:text-4xl font-bold ${
              gradientText ? gradientText : ""
            }`}
          >
            {title}
          </h2>
        </div>
        <p className="section-subtitle !mb-0 max-w-2xl mx-auto">
          {id === "starter-courses"
            ? "Kickstart your Web3 journey with these foundational courses."
            : id === "popular-courses"
            ? "See what's trending! Courses loved by our community."
            : "Unlock advanced knowledge with our exclusive premium courses."}
        </p>
      </motion.div>
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {courses.map((course, index) => (
            <CourseCard
              course={course}
              key={course.id}
              animationDelay={index * 0.1}
            />
          ))}
        </div>
      ) : isPending ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-16 h-16 border-2 border-yellow-300 border-t-yellow-500 rounded-full animate-spin" />
        </div>
      ) : (
        <p className="text-center text-muted-foreground">
          No courses available in this category yet. Stay tuned!
        </p>
      )}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        viewport={{ once: true }}
        className="text-center mt-12"
      >
        <Button
          size="lg"
          variant="outline"
          onClick={() => {
            setCategoryFilter(title.split(" ")[0]);
            setShowFilters(true);
            document
              .getElementById("filter-bar")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          className="border-primary/70 text-primary hover:bg-primary/10 hover:border-primary text-md px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 group"
        >
          View All {title}{" "}
          <ChevronDown className="w-5 h-5 ml-2.5 group-hover:translate-y-0.5 transition-transform" />
        </Button>
      </motion.div>
    </section>
  );

  return (
    <div className="min-h-screen crypto-pattern px-4 sm:px-6 lg:px-8">
      {/* Hero Section for Course Catalog */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-20 md:py-28 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/85 via-background/70 to-background/95 z-0"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center px-5 py-2.5 rounded-full glass-effect mb-6 border border-primary/30 shadow-lg">
            <Sparkles className="w-5 h-5 text-primary mr-2.5" />
            <span className="text-sm font-semibold text-gray-200">
              Your Gateway to Web3 Mastery
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
            The SafuAcademy{" "}
            <span className="primary-gradient-text">Course Catalog</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Discover a universe of AI-curated courses. From beginner basics to
            advanced strategies, find your path to becoming a Web3 pro.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-center">
            <Button
              size="lg"
              onClick={() =>
                document
                  .getElementById("filter-bar")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="bg-gradient-to-r from-primary to-orange-400 hover:from-orange-500 hover:to-primary text-background font-semibold text-md px-8 py-4 rounded-lg shadow-xl hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105 neon-glow"
            >
              <Search className="w-5 h-5 mr-2.5" />
              Explore All Courses
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Sections for Starter, Popular, Premium */}
      <div className="max-w-7xl mx-auto">
        <Section
          title="Starter Courses"
          courses={starterCourses}
          icon={Zap}
          gradientText="primary-gradient-text"
          id="starter-courses"
        />
        <div className="my-12 h-px bg-border/30 w-3/4 mx-auto"></div>
        <Section
          title="Popular Courses"
          courses={popularCourses}
          icon={Star}
          gradientText="secondary-gradient-text"
          id="popular-courses"
        />
        <div className="my-12 h-px bg-border/30 w-3/4 mx-auto"></div>
        <Section
          title="Premium Courses"
          courses={premiumCourses}
          icon={Gem}
          gradientText="primary-gradient-text"
          id="premium-courses"
        />
      </div>

      {/* Search and Filter Bar - Now a distinct section */}
      <motion.section
        id="filter-bar"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        className="py-16 md:py-20 my-12 md:my-16 glass-effect rounded-2xl"
      >
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              Find Your Perfect Course
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Use the filters below to narrow down the entire catalog and
              discover courses tailored to your needs.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center p-4 bg-card/50 rounded-xl border border-border">
            <div className="relative flex-grow w-full md:w-auto">
              <Input
                type="text"
                placeholder="Search all courses..."
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                className="pl-10 text-base py-3 bg-background border-border focus:ring-primary"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full md:w-auto border-primary/70 text-primary hover:bg-primary/10 hover:border-primary"
            >
              <ListFilter className="w-4 h-4 mr-2" />
              Filters
              <ChevronDown
                className={`w-4 h-4 ml-2 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </Button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: "1rem" }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="p-4 md:p-6 bg-card/50 rounded-xl border border-border"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div>
                  <label
                    htmlFor="categoryFilter"
                    className="block text-sm font-semibold text-gray-300 mb-1.5"
                  >
                    Category
                  </label>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="w-full bg-background border-border text-base py-3">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-foreground">
                      {categories.map((cat) => (
                        <SelectItem
                          key={cat}
                          value={cat}
                          className="capitalize cursor-pointer hover:bg-primary/10"
                        >
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label
                    htmlFor="levelFilter"
                    className="block text-sm font-semibold text-gray-300 mb-1.5"
                  >
                    Level
                  </label>
                  <Select value={levelFilter} onValueChange={setLevelFilter}>
                    <SelectTrigger className="w-full bg-background border-border text-base py-3">
                      <SelectValue placeholder="Filter by level" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-foreground">
                      {levels.map((level) => (
                        <SelectItem
                          key={level}
                          value={level}
                          className="capitalize cursor-pointer hover:bg-primary/10"
                        >
                          {level}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label
                    htmlFor="durationFilter"
                    className="block text-sm font-semibold text-gray-300 mb-1.5"
                  >
                    Duration
                  </label>
                  <Select
                    value={durationFilter}
                    onValueChange={setDurationFilter}
                  >
                    <SelectTrigger className="w-full bg-background border-border text-base py-3">
                      <SelectValue placeholder="Filter by duration" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border text-foreground">
                      {durations.map((duration) => (
                        <SelectItem
                          key={duration}
                          value={duration}
                          className="capitalize cursor-pointer hover:bg-primary/10"
                        >
                          {duration}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => {
                      setSearchTerm("");
                      setLevelFilter("all");
                      setDurationFilter("all");
                      setCategoryFilter("all");
                    }}
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-primary hover:bg-primary/5 text-base py-3"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Full Catalog Grid - shown when filters are active or search term is entered */}
          {(searchTerm ||
            levelFilter !== "all" ||
            durationFilter !== "all" ||
            categoryFilter !== "all") && (
            <div className="mt-12">
              <h3 className="text-2xl font-semibold mb-6 text-center text-gray-200">
                {searchTerm
                  ? `Search Results for "${searchTerm}"`
                  : "Filtered Courses"}
              </h3>
              {filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
                  {filteredCourses.map((course, index) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, y: 50, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.05,
                        ease: "easeOut",
                      }}
                    >
                      <CourseCard course={course} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12"
                >
                  <Search className="w-16 h-16 text-primary mx-auto mb-6 opacity-50" />
                  <h3 className="text-2xl font-semibold mb-3 text-gray-300">
                    No Courses Match Your Criteria
                  </h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    Try adjusting your search or filters.
                  </p>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
};

export default CourseListPage;
