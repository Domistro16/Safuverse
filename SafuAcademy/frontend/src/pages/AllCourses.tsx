import React from "react";
import { Layout } from "../components/Layout";
import { CourseCard } from "../components/CourseCard";

export const AllCourses: React.FC = () => {
  const courses = Array.from({ length: 9 }).map((_, i) => ({
    id: i,
    title: `Safu Academy Course ${i + 1}`,
    price: "$49",
    level: i % 3 === 0 ? "Beginner" : i % 3 === 1 ? "Intermediate" : "Advanced",
    badge: i % 2 === 0 ? "Popular" : "New",
    summary:
      "Short description of this Safu Academy course across Web3, AI or productivity with practical examples."
  }));

  return (
    <Layout>
      <section className="pt-8 pb-20">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white shadow border border-black/5 text-[11px] text-[#777] mb-3">
              <span className="text-base">📚</span>
              <span>All Courses</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#111] tracking-[-0.04em]">
              Explore Safu Academy
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#555] max-w-xl">
              Browse every course available inside the SafuVerse. Filter by category, level or
              search for something specific.
            </p>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {courses.map((c, idx) => (
            <CourseCard
              key={c.id}
              title={c.title}
              price={c.price}
              level={c.level}
              badge={c.badge}
              summary={c.summary}
              highlight={idx === 1}
            />
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default AllCourses;
