import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Layout } from "../components/Layout";
import { useReadContract } from "wagmi";
import { abi, Course, Deploy } from "@/constants";
import { useTheme } from "@/hooks/useTheme";

export default function AllCoursesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { data: courses, isPending } = useReadContract({
    abi: abi,
    functionName: "getCourses",
    address: Deploy,
  }) as {
    data: Course[];
    isPending: boolean;
  };

  const fallbackCourses: Course[] = courses ?? [];

  // Get unique categories from courses
  const categories = useMemo(() => {
    const cats = new Set(fallbackCourses.map((c) => c.category));
    return ["all", ...Array.from(cats)];
  }, [fallbackCourses]);

  // Filter courses based on search and category
  const filteredCourses = useMemo(() => {
    return fallbackCourses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || course.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [fallbackCourses, searchTerm, categoryFilter]);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Top header */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className={`text-[24px] sm:text-[30px] font-bold tracking-[-0.06em] ${isDark ? 'text-white' : 'text-safuDeep'
              }`}>
              All Safu Academy courses
            </h1>
            <p className={`text-[13px] max-w-xl mt-1 ${isDark ? 'text-gray-400' : 'text-[#555]'
              }`}>
              Human‑curated, AI‑presented courses designed to be finished — not abandoned. Filter by category or level
              and pick your next unlock inside the SafuVerse.
            </p>
          </div>
          <div className={`flex flex-col sm:items-end gap-2 text-[11px] ${isDark ? 'text-gray-500' : 'text-[#777]'
            }`}>
            <span>Real learners from different sectors using Safu Academy to level up.</span>
            <span className={`font-semibold ${isDark ? 'text-white' : 'text-safuDeep'}`}>
              Adopted by builders across <strong>Blockchain, Marketing, AI, and more.</strong>
            </span>
          </div>
        </section>

        {/* Simple filters */}
        <section className={`p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-3xl border ${isDark
            ? 'bg-[#12121a] border-[#2a2a3a]'
            : 'bg-white/90 border-black/5 shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
          }`}>
          <div className={`flex-1 flex items-center gap-2 rounded-2xl px-4 py-2 ${isDark ? 'bg-[#1a1a24]' : 'bg-[#fefce8]'
            }`}>
            <span className={`text-[11px] ${isDark ? 'text-gray-500' : ''}`}>Search</span>
            <input
              placeholder="Search courses by topic, chain or keyword..."
              className={`flex-1 bg-transparent text-[12px] outline-none ${isDark
                  ? 'text-white placeholder:text-gray-600'
                  : 'placeholder:text-[#aaa]'
                }`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-full transition-colors ${categoryFilter === cat
                    ? isDark
                      ? "bg-[#fffb00] text-black font-semibold"
                      : "bg-safuDeep text-[#fef3c7] font-semibold"
                    : isDark
                      ? "bg-[#1a1a24] border border-[#2a2a3a] text-gray-300 hover:bg-[#252530]"
                      : "bg-white border border-black/10 hover:bg-[#fefce8]"
                  }`}
              >
                {cat === "all" ? "All" : cat}
              </button>
            ))}
          </div>
        </section>

        {/* Courses grid */}
        {isPending ? (
          <div className="flex items-center justify-center h-64">
            <div className={`w-16 h-16 border-2 rounded-full animate-spin ${isDark ? 'border-[#fffb00]/30 border-t-[#fffb00]' : 'border-safuDeep/30 border-t-safuDeep'
              }`} />
          </div>
        ) : filteredCourses.length > 0 ? (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCourses.map((course) => (
              <Link
                key={String(course.id)}
                to={`/courses/${course.id}`}
                className={`p-4 flex flex-col gap-3 hover:-translate-y-1 transition-all rounded-3xl border ${isDark
                    ? 'bg-[#12121a] border-[#2a2a3a] hover:border-[#fffb00]/50 hover:shadow-[0_24px_70px_rgba(255,251,0,0.1)]'
                    : 'bg-white/90 border-black/5 hover:shadow-[0_24px_70px_rgba(0,0,0,0.12)] shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
                  }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.16em] mb-1 ${isDark ? 'text-[#fffb00]' : 'text-[#a16207]'
                      }`}>
                      <span>{course.category}</span>
                      <span className={`w-1 h-1 rounded-full ${isDark ? 'bg-[#fffb00]' : 'bg-[#a16207]'}`} />
                      <span>{course.level}</span>
                    </div>
                    <h2 className={`text-[15px] font-semibold tracking-[-0.03em] ${isDark ? 'text-white' : 'text-safuDeep'
                      }`}>{course.title}</h2>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-[10px] font-semibold ${isDark ? 'bg-[#fffb00]/10 text-[#fffb00] border border-[#fffb00]/30' : 'bg-[#fef3c7] text-[#92400e]'
                    }`}>
                    {course.lessons.length} lessons
                  </div>
                </div>
                <p className={`text-[12px] leading-relaxed line-clamp-3 ${isDark ? 'text-gray-400' : 'text-[#555]'
                  }`}>{course.description}</p>
                <div className={`flex items-center justify-between text-[11px] pt-1 ${isDark ? 'text-gray-500' : 'text-[#777]'
                  }`}>
                  <span>{course.duration} total</span>
                  <span className={`font-semibold ${isDark ? 'text-[#fffb00]' : 'text-[#92400e]'}`}>View details →</span>
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <div className="text-center py-12">
            <p className={isDark ? 'text-gray-400' : 'text-[#555]'}>No courses match your search. Try different keywords.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
