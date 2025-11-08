import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { BookOpen, Filter, ArrowRight, Sparkles, Info } from "lucide-react";
import { Link } from "react-router-dom";
import CourseCard from "@/components/CourseCard";
import FaqSection from "@/components/FaqSection"; // Import the new FAQ section
import { abi, Deploy, type Course } from "@/constants";
import { useReadContract } from "wagmi";

const CoursesLandingPage = () => {
  const { data: courses, isPending } = useReadContract({
    abi: abi,
    functionName: "getCourses",
    address: Deploy,
  }) as {
    data: Course[];
    isPending: boolean;
  };

  const featuredCourses = courses?.filter(
    (course) => course.id == 3n || course.id == 0n || course.id == 1n
  );

  return (
    <div className="min-h-screen crypto-pattern">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background/90 z-0"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center px-5 py-2.5 rounded-full glass-effect mb-6 border border-primary/30 shadow-lg">
            <Sparkles className="w-5 h-5 text-primary mr-2.5" />
            <span className="text-sm font-semibold text-gray-200">
              Level Up Your Skills
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 leading-tight">
            Explore Our AI-Powered{" "}
            <span className="primary-gradient-text">Courses</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Human curated, AI presented courses available in 32 languages.
            Unlocked with your
            <code className="text-primary font-bold p-1.5 rounded-md bg-primary/10 shadow-sm">
              .safu
            </code>
            digital identity
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 justify-center items-center">
            <Link to="/courses/all">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-orange-400 hover:from-orange-500 hover:to-primary text-background font-semibold text-md px-8 py-4 rounded-lg shadow-xl hover:shadow-primary/50 transition-all duration-300 transform hover:scale-105 neon-glow"
              >
                <BookOpen className="w-5 h-5 mr-2.5" />
                Browse All Courses
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="border-primary/70 text-primary hover:bg-primary/10 hover:border-primary text-md px-8 py-4 rounded-lg transition-all duration-300 transform hover:scale-105 group"
            >
              <Info className="w-5 h-5 mr-2.5" />
              Why .safu Domain?{" "}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Featured Courses Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="section-title">
              Featured <span className="secondary-gradient-text">Courses</span>
            </h2>
            <p className="section-subtitle">
              Get a glimpse of our most popular courses, handpicked for
              ambitious creators.
            </p>
          </motion.div>
          {isPending ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-16 h-16 border-2 border-yellow-300 border-t-yellow-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {featuredCourses?.map((course, index) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 50, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    duration: 0.6,
                    delay: index * 0.1,
                    ease: "easeOut",
                  }}
                  viewport={{ once: true, amount: 0.3 }}
                >
                  <CourseCard course={course} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Why SafuAcademy Section */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-background/50">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="section-title">
              Why Learn with{" "}
              <span className="primary-gradient-text">SafuAcademy?</span>
            </h2>
            <p className="section-subtitle">
              We're redefining Web3 education with cutting-edge AI and a focus
              on practical skills.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[
              {
                icon: Sparkles,
                title: "AI-Personalized Learning",
                desc: "Courses adapt to your pace and style, ensuring optimal learning.",
              },
              {
                icon: BookOpen,
                title: "Web3 Focused Curriculum",
                desc: "Content designed by industry experts for real-world Web3 application.",
              },
              {
                icon: Filter,
                title: "Creator-Centric Approach",
                desc: "Acquire skills that directly translate to success in the creator economy.",
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.15,
                  ease: "easeOut",
                }}
                viewport={{ once: true, amount: 0.3 }}
                className="glass-effect p-8 rounded-xl card-hover-effect"
              >
                <item.icon className="w-12 h-12 text-primary mx-auto mb-5" />
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-sm text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FaqSection />
    </div>
  );
};

export default CoursesLandingPage;
