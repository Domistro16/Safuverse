import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CoursesLandingPage from "@/pages/CoursesLandingPage";
import CourseListPage from "@/pages/CourseListPage";
import CourseDetailPage from "@/pages/CourseDetailPage";
import ScrollToTop from "@/components/ScrollToTop";
import LessonPlayer from "@/pages/LessonPage";
function App() {
  return (
    <>
      <ScrollToTop />
      <div className="min-h-screen bg-background overflow-x-hidden font-gilroy subtle-bg-pattern">
        <Navbar />
        <main className="pt-20">
          {/* Add padding-top to main to avoid content being hidden by fixed navbar */}

          <Routes>
            <Route path="/" element={<CoursesLandingPage />} />
            <Route path="/courses/all" element={<CourseListPage />} />
            <Route path="/courses/:courseId" element={<CourseDetailPage />} />
            <Route
              path="/courses/lesson/:courseId/:id"
              element={<LessonPlayer />}
            />
          </Routes>
        </main>
        <Footer />
        <Toaster />
      </div>
    </>
  );
}

export default App;
