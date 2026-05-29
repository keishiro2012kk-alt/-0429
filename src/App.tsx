import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { Navigation } from "./components/Navigation";
import { AnimatePresence, motion } from "motion/react";
import { InstallPrompt } from "./components/InstallPrompt";
import { LoginHeader } from "./components/LoginHeader";

// Page sub-components
import Home from "./pages/Home";
import WordBank from "./pages/WordBank";
import Flashcards from "./pages/Flashcards";
import QuizConfig from "./pages/QuizConfig";
import ActiveQuiz from "./pages/ActiveQuiz";
import Stats from "./pages/Stats";
import ReadingPractice from "./pages/ReadingPractice";

function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="pb-24 pt-20 px-4 max-w-4xl mx-auto w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <div className="relative min-h-screen">
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10 bg-[#060B19]">
          <div className="absolute top-[-30%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-blue-600/10 blur-[150px] mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-cyan-400/10 blur-[150px] mix-blend-screen" />
          <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-purple-500/10 blur-[150px] mix-blend-screen" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
        </div>

        <div className="fixed top-0 w-full z-40 p-4 flex justify-end pointer-events-none">
          <div className="pointer-events-auto">
            <LoginHeader />
          </div>
        </div>

        <Routes>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/words" element={<PageTransition><WordBank /></PageTransition>} />
          <Route path="/reading" element={<PageTransition><ReadingPractice /></PageTransition>} />
          <Route path="/cards" element={<PageTransition><Flashcards /></PageTransition>} />
          <Route path="/checker" element={<PageTransition><ReadingPractice /></PageTransition>} />
          <Route path="/tutor" element={<PageTransition><ReadingPractice /></PageTransition>} />
          <Route path="/quiz" element={<PageTransition><QuizConfig /></PageTransition>} />
          <Route path="/quiz/active" element={<PageTransition><ActiveQuiz /></PageTransition>} />
          <Route path="/stats" element={<PageTransition><Stats /></PageTransition>} />
        </Routes>
        
        <Navigation />
        <InstallPrompt />
      </div>
    </Router>
  );
}
