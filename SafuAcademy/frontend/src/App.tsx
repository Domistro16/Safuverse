import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ScrollToTop from "@/components/ScrollToTop";

// New redesigned pages (use their own Layout)
import Home from "@/pages/Home";
import AllCourses from "@/pages/AllCourses";
import Certificates from "@/pages/Certificates";
import PointsHistory from "@/pages/PointsHistory";
import CourseDetailPage from "@/pages/CourseDetailPage";
import Profile from "@/pages/Profile";
import ChatAgent from "@/pages/ChatAgent";

// Legacy pages (use existing Navbar/Footer wrapper)
import QuizPage from "@/pages/QuizPage";

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* New redesigned pages with their own Layout */}
        <Route path="/" element={<Home />} />
        <Route path="/courses" element={<AllCourses />} />
        <Route path="/courses/:courseId" element={<CourseDetailPage />} />
        <Route path="/certificates" element={<Certificates />} />
        <Route path="/points" element={<PointsHistory />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/chat" element={<ChatAgent />} />

        {/* Quiz page with existing Navbar/Footer */}
        <Route
          path="/courses/:courseId/lessons/:lessonId/quiz"
          element={
            <div className="min-h-screen bg-background overflow-x-hidden font-gilroy subtle-bg-pattern">
              <Navbar />
              <main className="pt-20">
                <QuizPage />
              </main>
              <Footer />
            </div>
          }
        />
      </Routes>
      <Toaster />
    </>
  );
}

export default App;
