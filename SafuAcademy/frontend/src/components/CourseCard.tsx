import React from "react";

type CourseCardProps = {
  title: string;
  price: string;
  level: string;
  badge: string;
  summary: string;
  highlight?: boolean;
};

export const CourseCard: React.FC<CourseCardProps> = ({
  title,
  price,
  level,
  badge,
  summary,
  highlight
}) => {
  return (
    <div
      className={`relative rounded-[28px] bg-white/70 border ${
        highlight
          ? "border-[#111] shadow-[0_28px_80px_rgba(15,23,42,0.22)]"
          : "border-black/5 shadow-[0_18px_55px_rgba(15,23,42,0.10)]"
      } overflow-hidden flex flex-col transition duration-500 [transform:preserve-3d] hover:-translate-y-3 hover:shadow-[0_40px_110px_rgba(15,23,42,0.32)] hover:[transform:rotate(-1deg)_scale(1.05)]`}
      style={{ perspective: "900px" }}
    >
      <div className="w-full h-52 md:h-60 bg-white border-b border-black/5 overflow-hidden flex items-center justify-center p-5">
        <div
          className="w-full h-full rounded-[20px] overflow-hidden border-[20px] border-white shadow-[0_10px_40px_rgba(0,0,0,0.08)] transition-transform duration-500 hover:scale-[1.04]"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="w-full h-full bg-[radial-gradient(circle_at_0%_0%,#fff3cd,transparent_55%),radial-gradient(circle_at_100%_120%,#ffe1a3,transparent_55%)] flex items-center justify-center text-sm font-semibold text-[#aa7a09]">
            Safu Course Preview
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-2 text-[11px] text-[#777]">
          <span className="text-[#f5a623] tracking-[0.16em]">★★★★★</span>
          <span>{price}</span>
        </div>
        <h3 className="font-semibold text-[17px] text-[#111] mb-2 leading-snug line-clamp-2">
          {title}
        </h3>
        <p className="text-[#555] text-sm mb-4 flex-1 leading-relaxed line-clamp-3">
          {summary}
        </p>
        <div className="flex items-center justify-between text-[11px] mt-auto">
          <span className="px-3 py-1 bg-[#fff7df] text-[#c89216] font-semibold rounded-full">
            {badge}
          </span>
          <span className="text-[#777]">{level}</span>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
