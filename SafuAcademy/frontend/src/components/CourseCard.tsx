import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Play,
  Rocket,
  Brain,
  Lock,
  LucideIcon,
  Star,
  Clock,
  PlayCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { abi, Course, Deploy } from "@/constants";
import { useAccount, useReadContract } from "wagmi";

const iconMap = {
  Target,
  Play,
  Rocket,
  Brain,
};

export const getRandomIcon = (title: string): LucideIcon => {
  const iconKeys = Object.keys(iconMap) as (keyof typeof iconMap)[];
  const hash = [...title].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const index = hash % iconKeys.length;
  return iconMap[iconKeys[index]];
};
type UserType = [
  Course, // replace with the actual structure or use `any` if unknown
  boolean,
  number,
  string[], // or `any[]` if it's not an array of strings
  bigint
];

const CourseCard = ({
  course,
  animationDelay = 0,
}: {
  course: Course;
  animationDelay?: number;
}) => {
  // Mock enrollment for card display: For demo, let's assume no course is pre-enrolled on general cards
  // Actual enrollment state would come from user context or props
  const { address } = useAccount();
  const { data: userCourse } = useReadContract({
    abi: abi,
    functionName: "getCourse",
    address: Deploy,
    args: [Number(course.id), address],
  }) as {
    data: UserType;
    isPending: boolean;
  };
  const navigate = useNavigate();

  const [isEnrolled, setIsEnrolled] = useState(false); // Mock state
  useEffect(() => {
    if (userCourse && Symbol.iterator in Object(userCourse)) {
      const [, isActive] = userCourse;
      setIsEnrolled(isActive);
    }
  }, [userCourse]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.6, delay: animationDelay, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.3 }}
      className="rounded-2xl overflow-hidden bg-card border border-border hover:border-primary transition-all duration-300 group cursor-pointer flex flex-col h-full hover:shadow-[0_0_30px_rgba(0,212,170,0.3)]"
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          alt={`${course.title} course preview`}
          src={course.url}
        />

        {/* Price/Free Badge */}
        <div className="absolute top-3 left-3">
          {course.isFree || Number(course.price) === 0 ? (
            <Badge variant="free" className="font-semibold">
              FREE
            </Badge>
          ) : (
            <span className="px-3 py-1 rounded-full bg-background/80 backdrop-blur text-foreground text-sm font-semibold">
              ${Number(course.price) / 1000000}
            </span>
          )}
        </div>

        {/* Featured Badge (if applicable) */}
        {course.isFeatured && (
          <div className="absolute top-3 right-3">
            <Badge variant="premium" className="font-semibold text-xs">
              Featured
            </Badge>
          </div>
        )}

        {/* Rating */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-background/80 backdrop-blur">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-medium">{course.rating || 4.8}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors min-h-[56px]">
          {course.title}
        </h3>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-grow min-h-[40px]">
          {course.description.split(" Access with .safu domain.")[0]}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
          <Badge
            variant={
              course.level.toLowerCase() === 'beginner' ? 'beginner' :
              course.level.toLowerCase() === 'intermediate' ? 'intermediate' :
              course.level.toLowerCase() === 'advanced' ? 'advanced' : 'default'
            }
            className="font-medium"
          >
            {course.level}
          </Badge>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {course.duration}m
          </span>
          <span className="flex items-center gap-1">
            <PlayCircle className="w-3 h-3" />
            {course.lessons.length || 12} lessons
          </span>
        </div>

        {/* Footer */}
        <div className="mt-auto">
          {!isEnrolled && (
            <p className="text-xs text-amber-400 mb-2 flex items-center justify-center">
              <Lock size={12} className="mr-1" /> Requires .safu domain
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;
