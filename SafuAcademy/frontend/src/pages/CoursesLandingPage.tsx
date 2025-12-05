import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Code,
  Layers,
  Shield,
  Wallet,
  Rocket,
  ShieldCheck,
  Zap,
  Award,
  Coins,
  Users,
  Infinity,
  Smartphone,
  RefreshCw,
  Star,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Link } from "react-router-dom";
import CourseCard from "@/components/CourseCard";
import FaqSection from "@/components/FaqSection";
import { abi, Deploy, type Course } from "@/constants";
import { useReadContract } from "wagmi";

// Pain points data
const painPoints = [
  {
    icon: Code,
    title: "Smart Contract Complexity",
    description: "Solidity syntax and security patterns feel overwhelming and confusing.",
  },
  {
    icon: Layers,
    title: "DeFi Concepts Overwhelming",
    description: "AMMs, lending protocols, yield farming - where do you even start?",
  },
  {
    icon: Shield,
    title: "Security Vulnerabilities",
    description: "Worried about writing code that could be exploited and lose funds.",
  },
  {
    icon: Wallet,
    title: "Web3 Integration Confusion",
    description: "Connecting wallets, handling transactions, managing state - it's all unclear.",
  },
];

// Solutions data
const solutions = [
  {
    icon: BookOpen,
    title: "Step-by-Step Solidity",
    description: "Learn from basics to advanced with clear, structured lessons.",
  },
  {
    icon: Rocket,
    title: "Real Projects, Not Theory",
    description: "Build actual DeFi protocols and dApps you can deploy.",
  },
  {
    icon: ShieldCheck,
    title: "Security-First Approach",
    description: "Learn audit techniques and secure coding patterns.",
  },
  {
    icon: Zap,
    title: "Web3 Integration Mastery",
    description: "Connect wallets and handle transactions like a pro.",
  },
];

// Benefits data
const benefits = [
  {
    icon: Award,
    title: "On-Chain Certificates",
    description: "Earn verifiable NFT certificates upon course completion.",
  },
  {
    icon: Coins,
    title: "Learn & Earn",
    description: "Earn token rewards as you complete lessons and quizzes.",
  },
  {
    icon: Users,
    title: "Private Community",
    description: "Join our Discord with 5,000+ Web3 developers.",
  },
  {
    icon: Infinity,
    title: "Lifetime Access",
    description: "One payment, forever access including all updates.",
  },
  {
    icon: Smartphone,
    title: "Learn Anywhere",
    description: "Mobile-optimized platform for learning on the go.",
  },
  {
    icon: RefreshCw,
    title: "Always Updated",
    description: "Content updated regularly with latest Web3 standards.",
  },
];

// Stats data
const stats = [
  { label: "Hours Content", value: "50+", icon: Activity },
  { label: "Active Students", value: "5000+", icon: Users },
  { label: "Courses", value: "12+", icon: BookOpen },
  { label: "Completion Rate", value: "95%", icon: TrendingUp },
];

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
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="pt-20 pb-12 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden"
      >
        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Trust Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
          >
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-medium">Trusted by 5,000+ Web3 Developers</span>
          </motion.div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight">
            Master Web3 &{" "}
            <span className="primary-gradient-text">Blockchain Development</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed">
            Learn smart contracts, DeFi protocols, and dApp development with hands-on projects.
            Earn rewards as you learn with your{" "}
            <code className="text-primary font-semibold px-2 py-1 rounded-md bg-primary/10">
              .safu
            </code>{" "}
            domain.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/courses/all">
              <Button variant="primary" size="lg">
                <BookOpen className="w-5 h-5 mr-2" />
                Explore Courses
              </Button>
            </Link>
            <Button variant="secondary" size="lg">
              <Wallet className="w-5 h-5 mr-2" />
              Connect Wallet
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold mb-1 primary-gradient-text">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Pain Points Section */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Struggling With <span className="primary-gradient-text">Web3?</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              These frustrations hold back thousands of aspiring blockchain developers.
              Sound familiar?
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {painPoints.map((point, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-card border border-border hover:border-destructive/50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                  <point.icon className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="font-semibold mb-2">{point.title}</h3>
                <p className="text-sm text-muted-foreground">{point.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Say Goodbye to <span className="primary-gradient-text">Frustration</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our proven system transforms these roadblocks into stepping stones.
              Here's exactly how we solve each challenge.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {solutions.map((solution, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-gradient-to-b from-card to-transparent border border-border hover:border-primary transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <solution.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{solution.title}</h3>
                <p className="text-sm text-muted-foreground">{solution.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-secondary">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Featured <span className="primary-gradient-text">Courses</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From DeFi to NFTs, master the skills that matter in Web3
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

      {/* Benefits Grid Section */}
      <section className="py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            viewport={{ once: true, amount: 0.2 }}
            className="text-center mb-12 md:mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Why Learn With <span className="primary-gradient-text">SafuAcademy?</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to become a professional Web3 developer
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl accent-gradient flex items-center justify-center mb-4">
                  <benefit.icon className="w-6 h-6 text-black" />
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
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
