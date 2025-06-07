import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Trophy,
  Star,
  Medal,
  Target,
  Brain,
  Gamepad2,
  Crown,
  Zap,
  Users,
  Clock,
  TrendingUp,
} from "lucide-react";

// Mock leaderboard data - using actual data
const LEADERBOARD_DATA = {
  topPlayers: [
    {
      id: 1,
      name: "Emma Chen",
      score: 2850,
      level: 15,
      avatar: "👑",
      achievement: "Size Master",
      gamesPlayed: 127,
      accuracy: 94,
      badge: "🏆",
      streak: 15,
      wins: 89,
      playtime: "24h",
    },
    {
      id: 2,
      name: "Alex Rodriguez",
      score: 2720,
      level: 14,
      avatar: "⚡",
      achievement: "Number Wizard",
      gamesPlayed: 98,
      accuracy: 91,
      badge: "🥈",
      streak: 12,
      wins: 76,
      playtime: "18h",
    },
    {
      id: 3,
      name: "Zoe Kim",
      score: 2650,
      level: 13,
      avatar: "🌟",
      achievement: "Color Expert",
      gamesPlayed: 105,
      accuracy: 89,
      badge: "🥉",
      streak: 8,
      wins: 71,
      playtime: "22h",
    },
  ],
  otherPlayers: [
    {
      rank: 4,
      name: "Marcus Johnson",
      score: 2480,
      level: 12,
      avatar: "🎯",
      accuracy: 87,
    },
    {
      rank: 5,
      name: "Sofia Martinez",
      score: 2340,
      level: 11,
      avatar: "🎮",
      accuracy: 85,
    },
    {
      rank: 6,
      name: "David Kim",
      score: 2210,
      level: 10,
      avatar: "🌈",
      accuracy: 83,
    },
    {
      rank: 7,
      name: "Maya Patel",
      score: 2090,
      level: 9,
      avatar: "⭐",
      accuracy: 81,
    },
    {
      rank: 8,
      name: "James Wilson",
      score: 1980,
      level: 9,
      avatar: "🎲",
      accuracy: 79,
    },
  ],
};

// How to play steps
const howToPlaySteps = [
  {
    step: 1,
    title: "Select Difficulty Level",
    description:
      "Choose your math level: Easy (Elementary), Normal (Middle School), or Hard (High School)",
    icon: "🎯",
  },
  {
    step: 2,
    title: "Compare Two Numbers",
    description:
      "Two numbers will appear on screen. Analyze them carefully and determine their relationship",
    icon: "🔢",
  },
  {
    step: 3,
    title: "Choose the Correct Operator",
    description:
      "Select the right mathematical operator: Greater than (>), Less than (<), or Equal to (=)",
    icon: "⚖️",
  },
  {
    step: 4,
    title: "Beat the Clock & Earn Points",
    description:
      "You have 60 seconds per round! Each correct answer earns 100 points. Game sessions last 10 minutes",
    icon: "⏱️",
  },
];

// Comparison game data for kids
const comparisonActivities = [
  {
    id: 1,
    title: "Size Detective",
    description: "Compare sizes of animals, objects, and more!",
    age: "3-6",
    difficulty: "Easy",
    icon: "📏",
    activities: ["Big vs Small", "Tall vs Short", "Wide vs Narrow"],
  },
  {
    id: 2,
    title: "Number Champions",
    description: "Which has more? Which is bigger? Count and compare!",
    age: "4-8",
    difficulty: "Easy",
    icon: "🔢",
    activities: ["More vs Less", "Counting Game", "Number Patterns"],
  },
  {
    id: 3,
    title: "Speed Racers",
    description: "Fast or slow? Compare speeds of different things!",
    age: "5-9",
    difficulty: "Medium",
    icon: "🏁",
    activities: ["Fast vs Slow", "Race Comparison", "Speed Quiz"],
  },
  {
    id: 4,
    title: "Color Explorers",
    description: "Compare colors, shades, and brightness!",
    age: "3-7",
    difficulty: "Easy",
    icon: "🎨",
    activities: ["Light vs Dark", "Color Matching", "Rainbow Order"],
  },
  {
    id: 5,
    title: "Shape Masters",
    description: "Compare shapes, patterns, and geometry!",
    age: "4-8",
    difficulty: "Medium",
    icon: "🔷",
    activities: ["Shape Sorting", "Pattern Compare", "Geometry Fun"],
  },
  {
    id: 6,
    title: "Animal Kingdom",
    description: "Compare animals - size, speed, habitats, and more!",
    age: "5-10",
    difficulty: "Medium",
    icon: "🦁",
    activities: ["Animal Sizes", "Habitat Compare", "Animal Sounds"],
  },
];

// Quick comparison challenges
const quickChallenges = [
  {
    question: "Which is bigger?",
    options: ["🐘 Elephant", "🐁 Mouse"],
    correct: 0,
  },
  {
    question: "Which is faster?",
    options: ["🐌 Snail", "🐆 Cheetah"],
    correct: 1,
  },
  {
    question: "Which is taller?",
    options: ["🌳 Tree", "🌸 Flower"],
    correct: 0,
  },
  {
    question: "Which has more?",
    options: ["⭐⭐⭐", "⭐⭐⭐⭐⭐"],
    correct: 1,
  },
];

const Home = () => {
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAge, setSelectedAge] = useState("All");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [activities, setActivities] = useState(comparisonActivities);
  const [loading, setLoading] = useState(false);

  const ageRanges = ["All", "3-6", "4-8", "5-9", "5-10"];

  useEffect(() => {
    const fetchActivities = async () => {
      if (isInitialLoad) {
        setLoading(false);
        setIsInitialLoad(false);
      } else {
        setIsFiltering(true);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      try {
        let filteredActivities = comparisonActivities;

        if (selectedAge !== "All") {
          filteredActivities = filteredActivities.filter(
            (activity) => activity.age === selectedAge
          );
        }

        setActivities(filteredActivities);
        if (isInitialLoad) {
          setLoading(false);
        } else {
          setIsFiltering(false);
        }
      } catch (error) {
        console.error("Error fetching activities:", error);
        setActivities(comparisonActivities);
        if (isInitialLoad) {
          setLoading(false);
        } else {
          setIsFiltering(false);
        }
      }
    };
    fetchActivities();
  }, [selectedAge, isInitialLoad]);

  const handleChallengeAnswer = (selectedOption) => {
    if (selectedOption === quickChallenges[currentChallenge].correct) {
      setScore(score + 1);
    }

    setShowResult(true);
    setTimeout(() => {
      setShowResult(false);
      setCurrentChallenge((prev) => (prev + 1) % quickChallenges.length);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="animate-bounce text-6xl mb-4">🎯</div>
        <div className="text-2xl font-bold text-purple-600 animate-pulse">
          Loading Comparison Games...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 min-h-screen">
      {/* Hero Section */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-4 md:top-20 md:left-20 w-32 h-32 md:w-72 md:h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-20 right-4 md:top-40 md:right-20 w-32 h-32 md:w-72 md:h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-bounce"></div>
          <div className="absolute -bottom-4 left-20 md:-bottom-8 md:left-40 w-32 h-32 md:w-72 md:h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 left-1/4 text-3xl md:text-6xl animate-bounce"
            style={{ animationDelay: "0s", animationDuration: "3s" }}
          >
            🎯
          </div>
          <div
            className="absolute top-1/3 right-1/4 text-2xl md:text-5xl animate-bounce"
            style={{ animationDelay: "1s", animationDuration: "4s" }}
          >
            🧠
          </div>
          <div
            className="absolute bottom-1/3 left-1/3 text-2xl md:text-4xl animate-bounce"
            style={{ animationDelay: "2s", animationDuration: "3.5s" }}
          >
            🏆
          </div>
          <div
            className="absolute bottom-1/4 right-1/3 text-2xl md:text-5xl animate-bounce"
            style={{ animationDelay: "0.5s", animationDuration: "4.5s" }}
          >
            🧩
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center max-w-6xl mx-auto px-4 md:px-6">
          {/* Main Title */}
          <div className="mb-6 md:mb-8">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black mb-4">
              <span className="inline-block bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                Compare
              </span>
              <br />
              <span className="inline-block bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                & Learn!
              </span>
            </h1>
            <div className="flex justify-center items-center gap-2 md:gap-4 text-2xl md:text-4xl lg:text-6xl animate-bounce">
              <span>🎮</span>
              <span>✨</span>
              <span>🚀</span>
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-gray-700 text-base md:text-xl lg:text-2xl mb-8 md:mb-12 max-w-4xl mx-auto leading-relaxed font-light px-4">
            Dive into the{" "}
            <span className="text-purple-600 font-semibold">
              ultimate comparison adventure
            </span>
            ! Master sizes, numbers, colors, shapes, and unlock your potential
            through
            <span className="text-blue-600 font-semibold">
              {" "}
              interactive learning
            </span>
            .
          </p>

          {/* Interactive Feature Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12 px-4">
            <div className="group bg-white/80 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-purple-200 hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg">
              <div className="text-3xl md:text-4xl mb-3 md:mb-4 group-hover:animate-spin">
                🏆
              </div>
              <h3 className="text-purple-800 font-bold text-base md:text-lg mb-2">
                Gamified Learning
              </h3>
              <p className="text-gray-600 text-xs md:text-sm">
                Turn education into an exciting game with rewards and
                achievements
              </p>
            </div>

            <div className="group bg-white/80 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-blue-200 hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg">
              <div className="text-3xl md:text-4xl mb-3 md:mb-4 group-hover:animate-bounce">
                🧩
              </div>
              <h3 className="text-blue-800 font-bold text-base md:text-lg mb-2">
                Smart Challenges
              </h3>
              <p className="text-gray-600 text-xs md:text-sm">
                Adaptive puzzles that grow with your skills and understanding
              </p>
            </div>

            <div className="group bg-white/80 backdrop-blur-lg rounded-2xl p-4 md:p-6 border border-pink-200 hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg sm:col-span-2 lg:col-span-1">
              <div className="text-3xl md:text-4xl mb-3 md:mb-4 group-hover:animate-pulse">
                🎨
              </div>
              <h3 className="text-pink-800 font-bold text-base md:text-lg mb-2">
                Creative Discovery
              </h3>
              <p className="text-gray-600 text-xs md:text-sm">
                Explore concepts through vibrant, interactive experiences
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center px-4">
            <Link
              to="/game"
              className="group relative w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-bold text-base md:text-lg shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-110 hover:-translate-y-1"
            >
              <span className="relative z-10">Start Learning Now! 🚀</span>
            </Link>

            <button className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 border-2 border-purple-300 text-purple-700 rounded-full font-semibold hover:bg-purple-100 transition-all duration-300 hover:scale-105">
              Explore Features ✨
            </button>
          </div>

          {/* Stats/Features Row */}
          <div className="mt-12 md:mt-16 flex flex-wrap justify-center gap-6 md:gap-8 text-center px-4">
            <div className="group">
              <div className="text-2xl md:text-3xl font-bold text-purple-600 group-hover:animate-pulse">
                1000+
              </div>
              <div className="text-gray-600 text-xs md:text-sm">Challenges</div>
            </div>
            <div className="group">
              <div className="text-2xl md:text-3xl font-bold text-blue-600 group-hover:animate-pulse">
                50+
              </div>
              <div className="text-gray-600 text-xs md:text-sm">Categories</div>
            </div>
            <div className="group">
              <div className="text-2xl md:text-3xl font-bold text-pink-600 group-hover:animate-pulse">
                ∞
              </div>
              <div className="text-gray-600 text-xs md:text-sm">Fun</div>
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Features Section */}
      <div className="py-20 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              🌟 Why Choose Compare & Learn?
            </h2>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto">
              Discover the most comprehensive and engaging comparison learning
              platform designed for every age group
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Educational Excellence */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="text-5xl mb-4 text-center">🎓</div>
              <h3 className="text-xl font-bold text-white mb-3 text-center">
                Educational Excellence
              </h3>
              <ul className="space-y-2 text-purple-100">
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>Curriculum-aligned content</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>Progressive difficulty levels</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>Expert-designed challenges</span>
                </li>
              </ul>
            </div>

            {/* Interactive Learning */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="text-5xl mb-4 text-center">🎮</div>
              <h3 className="text-xl font-bold text-white mb-3 text-center">
                Interactive Learning
              </h3>
              <ul className="space-y-2 text-purple-100">
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>Gamified experiences</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>Real-time feedback</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>Achievement system</span>
                </li>
              </ul>
            </div>

            {/* Comprehensive Coverage */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
              <div className="text-5xl mb-4 text-center">📊</div>
              <h3 className="text-xl font-bold text-white mb-3 text-center">
                Comprehensive Coverage
              </h3>
              <ul className="space-y-2 text-purple-100">
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>Numbers & Mathematics</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>Sizes & Measurements</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-yellow-300">✓</span>
                  <span>Colors & Shapes</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
            <h3 className="text-2xl md:text-3xl font-bold text-white text-center mb-8">
              🌍 Join Our Growing Community
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-3xl md:text-4xl font-black text-yellow-300 mb-2">
                  50K+
                </div>
                <div className="text-purple-100">Active Learners</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-black text-yellow-300 mb-2">
                  1M+
                </div>
                <div className="text-purple-100">Games Played</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-black text-yellow-300 mb-2">
                  95%
                </div>
                <div className="text-purple-100">Success Rate</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-black text-yellow-300 mb-2">
                  150+
                </div>
                <div className="text-purple-100">Countries</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Challenge Section */}
      <div className="py-16">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl shadow-2xl p-6 md:p-8 text-white max-w-7xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-6">
            🚀 Quick Challenge Time!
          </h3>
          <div className="bg-white/20 rounded-2xl p-4 md:p-6 backdrop-blur-sm border border-white/30">
            <div className="text-center">
              <h4 className="text-xl md:text-2xl font-bold mb-6">
                {quickChallenges[currentChallenge].question}
              </h4>
              <div className="flex flex-col sm:flex-row justify-center gap-4 md:gap-6 mb-6">
                {quickChallenges[currentChallenge].options.map(
                  (option, index) => (
                    <button
                      key={index}
                      onClick={() => handleChallengeAnswer(index)}
                      className="bg-white text-purple-600 px-4 md:px-6 py-3 md:py-4 rounded-xl text-lg md:text-xl font-bold hover:bg-purple-100 transform hover:scale-105 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={showResult}
                    >
                      {option}
                    </button>
                  )
                )}
              </div>

              {showResult && (
                <div className="text-xl md:text-2xl font-bold animate-bounce mb-4">
                  {quickChallenges[currentChallenge].options.indexOf(
                    quickChallenges[currentChallenge].options[
                      quickChallenges[currentChallenge].correct
                    ]
                  ) >= 0
                    ? "🎉 Great job!"
                    : "😊 Try again!"}
                </div>
              )}
              <div className="bg-white/30 rounded-xl p-3 md:p-4 inline-block">
                <div className="text-lg md:text-xl font-bold">
                  Score: {score} / {currentChallenge + 1}
                </div>
                <div className="text-sm md:text-base text-purple-100">
                  Challenge #{currentChallenge + 1}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="py-20 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-800 mb-6">
              💬 What Parents & Educators Say
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover how Compare & Learn is transforming education for
              families and schools worldwide
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-purple-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-3">👩‍🏫</div>
                <div>
                  <h4 className="font-bold text-gray-800">Sarah Johnson</h4>
                  <p className="text-sm text-gray-600">Elementary Teacher</p>
                </div>
              </div>
              <div className="text-yellow-400 mb-3">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-700 italic">
                "My students love the comparison games! Their math skills have
                improved dramatically, and they're excited to learn every day."
              </p>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-blue-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-3">👨‍👩‍👧‍👦</div>
                <div>
                  <h4 className="font-bold text-gray-800">
                    The Martinez Family
                  </h4>
                  <p className="text-sm text-gray-600">Homeschool Parents</p>
                </div>
              </div>
              <div className="text-yellow-400 mb-3">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-700 italic">
                "Perfect for homeschooling! Our kids aged 5 and 8 both find
                age-appropriate challenges that keep them engaged for hours."
              </p>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-green-100 hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="text-4xl mr-3">👩‍💼</div>
                <div>
                  <h4 className="font-bold text-gray-800">Dr. Emily Chen</h4>
                  <p className="text-sm text-gray-600">Child Psychologist</p>
                </div>
              </div>
              <div className="text-yellow-400 mb-3">⭐⭐⭐⭐⭐</div>
              <p className="text-gray-700 italic">
                "Brilliantly designed for cognitive development. The progressive
                difficulty helps children build confidence naturally."
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl p-8 text-white">
              <h3 className="text-2xl md:text-3xl font-bold mb-4">
                Ready to Transform Learning?
              </h3>
              <p className="text-lg mb-6 text-purple-100">
                Join thousands of families and educators who are revolutionizing
                education
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/game"
                  className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-purple-50 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  🚀 Start Free Trial
                </Link>
                <button className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-purple-600 transition-all duration-300 hover:scale-105">
                  📞 Contact Us
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activities Section */}
      <div className="py-12 md:py-16">
        <div className="bg-gradient-to-br from-pink-50/90 to-purple-50/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-pink-200 p-6 md:p-8">
          {/* Age Filter */}
          <div className="text-center mb-6 md:mb-8">
            <h3 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-gray-800">
              🎯 Choose Your Age Group
            </h3>
            <div className="flex justify-center px-4">
              <div className="w-full max-w-sm md:max-w-md">
                <select
                  value={selectedAge}
                  onChange={(e) => setSelectedAge(e.target.value)}
                  className="w-full p-3 md:p-4 border border-purple-300 rounded-xl text-sm md:text-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white shadow-lg"
                >
                  {ageRanges.map((age) => (
                    <option key={age} value={age}>
                      {age === "All" ? "All Ages" : `Ages ${age}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Activity Stats */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/50 rounded-2xl p-4 backdrop-blur-sm">
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-purple-600">
                  12
                </div>
                <div className="text-xs md:text-sm text-gray-600">
                  Categories
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-blue-600">
                  156
                </div>
                <div className="text-xs md:text-sm text-gray-600">
                  Activities
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-green-600">
                  4.9
                </div>
                <div className="text-xs md:text-sm text-gray-600">★ Rating</div>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-orange-600">
                  2M+
                </div>
                <div className="text-xs md:text-sm text-gray-600">Plays</div>
              </div>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-6 md:mb-8 text-gray-800 px-4">
            🌟 Comparison Adventures
            {isFiltering && (
              <div className="inline-block ml-2 md:ml-4">
                <div className="animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 border-purple-600"></div>
              </div>
            )}
          </h2>

          {/* Activities Grid */}
          <div
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 transition-opacity duration-300 ${
              isFiltering ? "opacity-50" : "opacity-100"
            }`}
          >
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className={`bg-gradient-to-br ${
                  index % 6 === 0
                    ? "from-purple-100 to-blue-100 border-purple-200"
                    : index % 6 === 1
                    ? "from-blue-100 to-green-100 border-blue-200"
                    : index % 6 === 2
                    ? "from-green-100 to-yellow-100 border-green-200"
                    : index % 6 === 3
                    ? "from-yellow-100 to-orange-100 border-yellow-200"
                    : index % 6 === 4
                    ? "from-orange-100 to-red-100 border-orange-200"
                    : "from-red-100 to-pink-100 border-red-200"
                } rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl hover:scale-105 transition-all duration-300 group border-2`}
              >
                <div className="relative p-6">
                  <div className="text-6xl mb-4 text-center animate-bounce">
                    {activity.icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-center text-gray-800">
                    {activity.title}
                  </h3>
                  <p className="text-gray-600 text-center mb-4 leading-relaxed">
                    {activity.description}
                  </p>

                  <div className="flex justify-center mb-4">
                    <span className="bg-white/70 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold text-gray-700 border border-gray-300">
                      Ages {activity.age}
                    </span>
                  </div>

                  <div className="space-y-2 mb-6">
                    <h4 className="font-bold text-center text-gray-800">
                      What you'll learn:
                    </h4>
                    {activity.activities.map((item, actIndex) => (
                      <div
                        key={actIndex}
                        className="flex items-center justify-center"
                      >
                        <span className="text-purple-500 mr-2">⭐</span>
                        <span className="text-sm text-gray-700">{item}</span>
                      </div>
                    ))}
                  </div>

                  <button className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl font-bold hover:from-purple-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg">
                    🎮 Start Playing
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* How to Play Section */}
          <div className="mt-16">
            <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 text-gray-800">
              🎮 How to Play
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {howToPlaySteps.map((step) => (
                <div
                  key={step.step}
                  className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-duration-300"
                >
                  <div className="text-4xl mb-4 text-center">{step.icon}</div>
                  <div className="text-center">
                    <div className="inline-block bg-purple-100 text-purple-800 rounded-full px-3 py-1 text-sm font-semibold mb-2">
                      Step {step.step}
                    </div>
                    <h4 className="text-lg font-bold mb-2">{step.title}</h4>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
