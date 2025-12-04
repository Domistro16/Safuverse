import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  CheckCircle,
  Trophy,
  RefreshCw,
  Lightbulb,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";

interface Question {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correctAnswer: string;
  explanation?: string;
}

interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  passingScore: number;
  timeLimit?: number;
  rewards: {
    xp: number;
    tokens?: number;
  };
}

// Sample quiz data
const sampleQuiz: Quiz = {
  id: "1",
  title: "Solidity Fundamentals Quiz",
  passingScore: 70,
  timeLimit: 15,
  rewards: {
    xp: 50,
    tokens: 10,
  },
  questions: [
    {
      id: "q1",
      question: "What is the purpose of the 'payable' keyword in Solidity functions?",
      options: [
        { id: "a", text: "It makes the function return a value" },
        { id: "b", text: "It allows the function to receive ETH" },
        { id: "c", text: "It makes the function private" },
        { id: "d", text: "It optimizes gas usage" },
      ],
      correctAnswer: "b",
      explanation: "The 'payable' keyword allows a function to receive Ether when called.",
    },
    {
      id: "q2",
      question: "Which visibility modifier makes a function accessible only within the contract?",
      options: [
        { id: "a", text: "public" },
        { id: "b", text: "external" },
        { id: "c", text: "internal" },
        { id: "d", text: "private" },
      ],
      correctAnswer: "d",
      explanation: "Private functions can only be called from within the contract they are defined in.",
    },
    {
      id: "q3",
      question: "What does the 'view' keyword indicate in a function?",
      options: [
        { id: "a", text: "The function modifies state" },
        { id: "b", text: "The function only reads state" },
        { id: "c", text: "The function is payable" },
        { id: "d", text: "The function is private" },
      ],
      correctAnswer: "b",
      explanation: "'view' functions promise not to modify the blockchain state.",
    },
  ],
};

const QuizPage = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  const quiz = sampleQuiz;
  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  const handleSelectAnswer = (optionId: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [question.id]: optionId,
    });
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(false);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setShowExplanation(false);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    quiz.questions.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: quiz.questions.length,
      percentage: Math.round((correct / quiz.questions.length) * 100),
      passed: (correct / quiz.questions.length) * 100 >= quiz.passingScore,
    };
  };

  if (showResults) {
    const score = calculateScore();

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full text-center"
        >
          {/* Result Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 mx-auto mb-6 rounded-full accent-gradient flex items-center justify-center"
          >
            {score.passed ? (
              <Trophy className="w-12 h-12 text-black" />
            ) : (
              <RefreshCw className="w-12 h-12 text-black" />
            )}
          </motion.div>

          <h1 className="text-3xl font-extrabold mb-2">
            {score.passed ? "🎉 Quiz Completed!" : "Almost There!"}
          </h1>

          <p className="text-muted-foreground mb-8">
            {score.passed
              ? "Congratulations! You passed the quiz."
              : `You need ${quiz.passingScore}% to pass. Try again!`}
          </p>

          {/* Score Circle */}
          <div className="relative w-40 h-40 mx-auto mb-8">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-card"
              />
              <motion.circle
                cx="80"
                cy="80"
                r="70"
                stroke="url(#scoreGradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: score.percentage / 100 }}
                transition={{ duration: 1, delay: 0.5 }}
                style={{
                  strokeDasharray: 440,
                  strokeDashoffset: 0,
                }}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(167, 100%, 42%)" />
                  <stop offset="100%" stopColor="hsl(238, 58%, 62%)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">{score.percentage}%</span>
              <span className="text-sm text-muted-foreground">
                {score.correct}/{score.total} Correct
              </span>
            </div>
          </div>

          {/* Rewards (if passed) */}
          {score.passed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex justify-center gap-4 mb-8"
            >
              <div className="px-4 py-3 rounded-xl bg-card border border-border">
                <div className="text-2xl mb-1">⚡</div>
                <div className="text-lg font-bold text-primary">+{quiz.rewards.xp} XP</div>
                <div className="text-xs text-muted-foreground">Earned</div>
              </div>

              {quiz.rewards.tokens && (
                <div className="px-4 py-3 rounded-xl bg-card border border-border">
                  <div className="text-2xl mb-1">🪙</div>
                  <div className="text-lg font-bold text-yellow-400">+{quiz.rewards.tokens}</div>
                  <div className="text-xs text-muted-foreground">Tokens</div>
                </div>
              )}

              <div className="px-4 py-3 rounded-xl bg-card border border-border">
                <div className="text-2xl mb-1">📜</div>
                <div className="text-lg font-bold text-primary">NFT</div>
                <div className="text-xs text-muted-foreground">Certificate</div>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button
              variant="secondary"
              onClick={() => {
                setShowResults(false);
                setCurrentQuestion(0);
              }}
            >
              Review Answers
            </Button>

            {score.passed ? (
              <Button
                variant="primary"
                onClick={() => navigate(`/courses/${courseId}`)}
              >
                Back to Course
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedAnswers({});
                  setCurrentQuestion(0);
                  setShowResults(false);
                }}
              >
                Try Again
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Quiz Header */}
      <header className="fixed top-0 w-full z-50 bg-secondary border-b border-border">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Course Quiz</p>
              <p className="font-medium">{quiz.title}</p>
            </div>

            <div className="flex items-center gap-4">
              {/* Timer (optional) */}
              {quiz.timeLimit && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>12:45</span>
                </div>
              )}

              {/* Progress */}
              <div className="hidden md:flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {currentQuestion + 1} of {quiz.questions.length}
                </span>
              </div>

              {/* Exit */}
              <button
                onClick={() => navigate(`/courses/${courseId}`)}
                className="p-2 rounded-lg hover:bg-card transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 w-full h-1 rounded-full bg-card overflow-hidden">
            <motion.div
              className="h-full accent-gradient"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </header>

      {/* Quiz Content */}
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={question.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Question Number */}
              <div className="text-sm text-primary mb-4">
                Question {currentQuestion + 1} of {quiz.questions.length}
              </div>

              {/* Question Text */}
              <h2 className="text-2xl font-semibold mb-8">{question.question}</h2>

              {/* Options */}
              <div className="space-y-3">
                {question.options.map((option, index) => {
                  const isSelected = selectedAnswers[question.id] === option.id;
                  const letter = String.fromCharCode(65 + index); // A, B, C, D

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelectAnswer(option.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                        isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-border-hover bg-card"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          isSelected ? "bg-primary text-black" : "bg-secondary"
                        }`}
                      >
                        {letter}
                      </div>
                      <span className="flex-1">{option.text}</span>
                      {isSelected && <CheckCircle className="w-5 h-5 text-primary" />}
                    </button>
                  );
                })}
              </div>

              {/* Explanation (shown after answering in review mode) */}
              {showExplanation && question.explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded-xl bg-info/10 border border-info/20"
                >
                  <div className="flex items-start gap-3">
                    <Lightbulb className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-info mb-1">Explanation</p>
                      <p className="text-sm text-muted-foreground">{question.explanation}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Navigation */}
      <footer className="fixed bottom-0 w-full bg-secondary border-t border-border">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-1">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentQuestion
                    ? "bg-primary"
                    : selectedAnswers[quiz.questions[index].id]
                    ? "bg-primary/50"
                    : "bg-card"
                }`}
              />
            ))}
          </div>

          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!selectedAnswers[question.id]}
          >
            {currentQuestion === quiz.questions.length - 1 ? "Submit Quiz" : "Next"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </footer>
    </div>
  );
};

export default QuizPage;
