import React, { useEffect, useState } from "react";
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

// Mock leaderboard data - replace with real API data
const topPlayers = [
  {
    id: 1,
    name: "Emma Chen",
    score: 2850,
    level: 15,
    avatar: "👧",
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
    avatar: "👦",
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
    avatar: "👧",
    achievement: "Color Expert",
    gamesPlayed: 105,
    accuracy: 89,
    badge: "🥉",
    streak: 8,
    wins: 71,
    playtime: "22h",
  },
];

// Additional players for the leaderboard
const otherPlayers = [
  {
    rank: 4,
    name: "Marcus Johnson",
    score: 2480,
    level: 12,
    avatar: "👨",
    accuracy: 87,
  },
  {
    rank: 5,
    name: "Sofia Martinez",
    score: 2340,
    level: 11,
    avatar: "👩",
    accuracy: 85,
  },
  {
    rank: 6,
    name: "David Kim",
    score: 2210,
    level: 10,
    avatar: "👨",
    accuracy: 83,
  },
  {
    rank: 7,
    name: "Maya Patel",
    score: 2090,
    level: 9,
    avatar: "👩",
    accuracy: 81,
  },
  {
    rank: 8,
    name: "James Wilson",
    score: 1980,
    level: 9,
    avatar: "👨",
    accuracy: 79,
  },
];

// Helper function to get rank-specific colors
const getRankColors = (rank) => {
  switch (rank) {
    case 1:
      return {
        bg: "from-yellow-400 via-orange-400 to-yellow-500",
        border: "border-yellow-300",
        glow: "from-yellow-400 to-orange-500",
      };
    case 2:
      return {
        bg: "from-gray-300 via-gray-400 to-gray-500",
        border: "border-gray-300",
        glow: "from-gray-400 to-gray-600",
      };
    case 3:
      return {
        bg: "from-orange-400 via-red-400 to-orange-500",
        border: "border-orange-300",
        glow: "from-orange-500 to-red-500",
      };
    default:
      return {
        bg: "from-purple-400 to-blue-500",
        border: "border-purple-300",
        glow: "from-purple-400 to-blue-500",
      };
  }
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
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentChallenge, setCurrentChallenge] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAge, setSelectedAge] = useState("All");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);

  const ageRanges = ["All", "3-6", "4-8", "5-9", "5-10"];

  useEffect(() => {
    const fetchActivities = async () => {
      if (isInitialLoad) {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
        setActivities([]);
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
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-bounce"></div>
          <div className="absolute -bottom-8 left-40 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div
            className="absolute top-1/4 left-1/4 text-6xl animate-bounce"
            style={{ animationDelay: "0s", animationDuration: "3s" }}
          >
            🎯
          </div>
          <div
            className="absolute top-1/3 right-1/4 text-5xl animate-bounce"
            style={{ animationDelay: "1s", animationDuration: "4s" }}
          >
            🧠
          </div>
          <div
            className="absolute bottom-1/3 left-1/3 text-4xl animate-bounce"
            style={{ animationDelay: "2s", animationDuration: "3.5s" }}
          >
            🏆
          </div>
          <div
            className="absolute bottom-1/4 right-1/3 text-5xl animate-bounce"
            style={{ animationDelay: "0.5s", animationDuration: "4.5s" }}
          >
            🧩
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center max-w-6xl mx-auto px-6">
          {/* Main Title */}
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-black mb-4">
              <span className="inline-block bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
                Compare
              </span>
              <br />
              <span className="inline-block bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                & Learn!
              </span>
            </h1>
            <div className="flex justify-center items-center gap-4 text-4xl md:text-6xl animate-bounce">
              <span>🎮</span>
              <span>✨</span>
              <span>🚀</span>
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-gray-700 text-xl md:text-2xl mb-12 max-w-4xl mx-auto leading-relaxed font-light">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="group bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-purple-200 hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg">
              <div className="text-4xl mb-4 group-hover:animate-spin">🏆</div>
              <h3 className="text-purple-800 font-bold text-lg mb-2">
                Gamified Learning
              </h3>
              <p className="text-gray-600 text-sm">
                Turn education into an exciting game with rewards and
                achievements
              </p>
            </div>

            <div className="group bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-blue-200 hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg">
              <div className="text-4xl mb-4 group-hover:animate-bounce">🧩</div>
              <h3 className="text-blue-800 font-bold text-lg mb-2">
                Smart Challenges
              </h3>
              <p className="text-gray-600 text-sm">
                Adaptive puzzles that grow with your skills and understanding
              </p>
            </div>

            <div className="group bg-white/80 backdrop-blur-lg rounded-2xl p-6 border border-pink-200 hover:bg-white/90 transition-all duration-300 hover:scale-105 hover:shadow-xl shadow-lg">
              <div className="text-4xl mb-4 group-hover:animate-pulse">🎨</div>
              <h3 className="text-pink-800 font-bold text-lg mb-2">
                Creative Discovery
              </h3>
              <p className="text-gray-600 text-sm">
                Explore concepts through vibrant, interactive experiences
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/game"
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full text-white font-bold text-lg shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-110 hover:-translate-y-1"
            >
              <span className="relative z-10">Start Learning Now! 🚀</span>
            </Link>

            <button className="px-8 py-4 border-2 border-purple-300 text-purple-700 rounded-full font-semibold hover:bg-purple-100 transition-all duration-300 hover:scale-105">
              Explore Features ✨
            </button>
          </div>

          {/* Stats/Features Row */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-center">
            <div className="group">
              <div className="text-3xl font-bold text-purple-600 group-hover:animate-pulse">
                1000+
              </div>
              <div className="text-gray-600 text-sm">Challenges</div>
            </div>
            <div className="group">
              <div className="text-3xl font-bold text-blue-600 group-hover:animate-pulse">
                50+
              </div>
              <div className="text-gray-600 text-sm">Categories</div>
            </div>
            <div className="group">
              <div className="text-3xl font-bold text-pink-600 group-hover:animate-pulse">
                ∞
              </div>
              <div className="text-gray-600 text-sm">Fun</div>
            </div>
          </div>
        </div>
      </div>

      {/* Container for all sections */}
      <div className="max-w-7xl mx-auto px-6">
        {/* Leaderboard Section */}
        <div className="py-16">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-purple-200 p-8">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="flex justify-center items-center gap-4 mb-4">
                <Crown className="text-yellow-500 animate-pulse" size={48} />
                <h3 className="text-4xl font-black bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
                  Hall of Fame
                </h3>
                <Crown className="text-yellow-500 animate-pulse" size={48} />
              </div>
              <p className="text-gray-600 text-xl font-light">
                Celebrating our legendary comparison champions
              </p>
            </div>

            {/* Top 3 Podium */}
            <div className="flex flex-col lg:flex-row items-end justify-center gap-6 mb-12">
              {/* 2nd Place */}
              <div className="order-2 lg:order-1 w-full lg:w-80">
                <div className="relative group">
                  <div
                    className={`bg-gradient-to-br ${
                      getRankColors(2).bg
                    } rounded-2xl p-6 border-2 ${
                      getRankColors(2).border
                    } shadow-xl transition-all duration-300 hover:scale-105`}
                  >
                    <div className="absolute -top-3 -right-3 bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center border-2 border-gray-300 shadow-lg">
                      <span className="text-lg font-black text-gray-800">
                        #2
                      </span>
                    </div>

                    <div className="text-center">
                      <div className="relative mb-4">
                        <div className="text-5xl mb-2">
                          {topPlayers[1].avatar}
                        </div>
                        <div className="absolute -top-1 -right-1 text-3xl">
                          {topPlayers[1].badge}
                        </div>
                      </div>

                      <h4 className="text-xl font-bold text-white mb-2">
                        {topPlayers[1].name}
                      </h4>
                      <div className="text-3xl font-bold text-white mb-1">
                        {topPlayers[1].score.toLocaleString()}
                      </div>
                      <div className="text-sm text-white/80 mb-4">points</div>

                      <div className="bg-white/20 rounded-lg p-3 mb-4">
                        <div className="text-sm text-white/90 mb-1">
                          Achievement
                        </div>
                        <div className="font-semibold text-white text-sm">
                          {topPlayers[1].achievement}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white/20 rounded-lg p-2">
                          <div className="text-white/80">Level</div>
                          <div className="font-bold text-lg text-white">
                            {topPlayers[1].level}
                          </div>
                        </div>
                        <div className="bg-white/20 rounded-lg p-2">
                          <div className="text-white/80">Accuracy</div>
                          <div className="font-bold text-lg text-white">
                            {topPlayers[1].accuracy}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1st Place */}
              <div className="order-1 lg:order-2 w-full lg:w-96 transform lg:scale-110 z-10">
                <div className="relative">
                  <div
                    className={`bg-gradient-to-br ${
                      getRankColors(1).bg
                    } rounded-3xl p-8 border-4 ${
                      getRankColors(1).border
                    } shadow-2xl`}
                  >
                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                      <div className="bg-yellow-100 rounded-full p-3 border-4 border-yellow-400 shadow-lg animate-bounce">
                        <Crown className="text-yellow-600" size={32} />
                      </div>
                    </div>

                    <div className="absolute -top-4 -right-4 bg-white rounded-full w-16 h-16 flex items-center justify-center border-4 border-yellow-400 shadow-xl">
                      <span className="text-2xl font-black text-yellow-600">
                        #1
                      </span>
                    </div>

                    <div className="text-center pt-4">
                      <div className="relative mb-4">
                        <div className="text-6xl mb-2">
                          {topPlayers[0].avatar}
                        </div>
                        <div
                          className="absolute -top-2 -right-2 text-4xl animate-spin"
                          style={{ animationDuration: "3s" }}
                        >
                          {topPlayers[0].badge}
                        </div>
                      </div>

                      <h4 className="text-2xl font-black text-white mb-2">
                        {topPlayers[0].name}
                      </h4>

                      <div className="bg-white/30 rounded-2xl p-4 mb-4">
                        <div className="text-4xl font-black text-white mb-1">
                          {topPlayers[0].score.toLocaleString()}
                        </div>
                        <div className="text-white/90 font-semibold">
                          CHAMPION POINTS
                        </div>
                      </div>

                      <div className="bg-white/25 rounded-xl p-4 mb-4">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Star className="text-yellow-200" size={20} />
                          <span className="text-sm text-white/90 font-semibold">
                            ACHIEVEMENT
                          </span>
                        </div>
                        <div className="font-bold text-yellow-100 text-lg">
                          {topPlayers[0].achievement}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/25 rounded-xl p-3">
                          <div className="text-white/80 text-sm">Level</div>
                          <div className="font-black text-2xl text-white">
                            {topPlayers[0].level}
                          </div>
                        </div>
                        <div className="bg-white/25 rounded-xl p-3">
                          <div className="text-white/80 text-sm">Accuracy</div>
                          <div className="font-black text-2xl text-white">
                            {topPlayers[0].accuracy}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="order-3 w-full lg:w-80">
                <div className="relative group">
                  <div
                    className={`bg-gradient-to-br ${
                      getRankColors(3).bg
                    } rounded-2xl p-6 border-2 ${
                      getRankColors(3).border
                    } shadow-xl transition-all duration-300 hover:scale-105`}
                  >
                    <div className="absolute -top-3 -right-3 bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center border-2 border-orange-400 shadow-lg">
                      <span className="text-lg font-black text-orange-800">
                        #3
                      </span>
                    </div>

                    <div className="text-center">
                      <div className="relative mb-4">
                        <div className="text-5xl mb-2">
                          {topPlayers[2].avatar}
                        </div>
                        <div className="absolute -top-1 -right-1 text-3xl">
                          {topPlayers[2].badge}
                        </div>
                      </div>

                      <h4 className="text-xl font-bold text-white mb-2">
                        {topPlayers[2].name}
                      </h4>
                      <div className="text-3xl font-bold text-white mb-1">
                        {topPlayers[2].score.toLocaleString()}
                      </div>
                      <div className="text-sm text-white/80 mb-4">points</div>

                      <div className="bg-white/20 rounded-lg p-3 mb-4">
                        <div className="text-sm text-white/90 mb-1">
                          Achievement
                        </div>
                        <div className="font-semibold text-white text-sm">
                          {topPlayers[2].achievement}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white/20 rounded-lg p-2">
                          <div className="text-white/80">Level</div>
                          <div className="font-bold text-lg text-white">
                            {topPlayers[2].level}
                          </div>
                        </div>
                        <div className="bg-white/20 rounded-lg p-2">
                          <div className="text-white/80">Accuracy</div>
                          <div className="font-bold text-lg text-white">
                            {topPlayers[2].accuracy}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Players */}
            <div className="max-w-4xl mx-auto">
              <h4 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                Other Top Players
              </h4>
              <div className="space-y-3">
                {otherPlayers.map((player, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200 hover:from-purple-100 hover:to-blue-100 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center font-bold text-white">
                            #{player.rank}
                          </div>
                          <div className="text-3xl">{player.avatar}</div>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-lg">
                            {player.name}
                          </h4>
                          <div className="text-sm text-gray-600">
                            Level {player.level}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-800">
                            {player.score.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">points</div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Target size={16} className="text-green-500" />
                            <span className="text-gray-800 font-semibold">
                              {player.accuracy}%
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">accuracy</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center mt-8">
              <button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105">
                <Medal size={24} className="inline mr-2" />
                View Full Leaderboard
              </button>
            </div>
          </div>
        </div>

        {/* How to Play Section */}
        <div className="py-16">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-blue-200 p-8">
            <div className="text-center mb-8">
              <h3 className="text-4xl font-bold mb-2 text-gray-800 flex items-center justify-center gap-3">
                <Gamepad2 className="text-blue-600" size={48} />
                How to Play Compare Games
                <Brain className="text-purple-600" size={48} />
              </h3>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                Master the art of comparison with these simple steps and become
                a champion!
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {howToPlaySteps.map((step) => (
                <div
                  key={step.step}
                  className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-2xl p-6 text-center transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl border border-purple-200"
                >
                  <div className="text-5xl mb-4">{step.icon}</div>
                  <div className="bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-3">
                    <span className="font-bold text-sm">{step.step}</span>
                  </div>
                  <h4 className="text-xl font-bold mb-3 text-gray-800">
                    {step.title}
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                <h4 className="text-xl font-bold mb-4 text-purple-700 flex items-center gap-2">
                  <Target size={24} />
                  Game Rules
                </h4>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>
                      Compare two numbers using mathematical operators (&lt;,
                      &gt;, =)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Each round has a 60-second time limit</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Game sessions last for 10 minutes total</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>Earn 100 points for each correct answer</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-6 border border-blue-200">
                <h4 className="text-xl font-bold mb-4 text-blue-700 flex items-center gap-2">
                  <Star size={24} />
                  Pro Tips
                </h4>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">💡</span>
                    <span>
                      Quickly analyze both numbers before selecting an operator
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">💡</span>
                    <span>
                      Start with Easy difficulty and progress to Normal and Hard
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">💡</span>
                    <span>
                      Keep track of your total time and accuracy stats
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-yellow-500 mt-1">💡</span>
                    <span>
                      Challenge friends to beat your score and completion time!
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="text-center">
              <Link
                to="/game"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <Gamepad2 size={24} />
                Start Playing Now!
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Challenge Section */}
        <div className="py-16">
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-3xl shadow-2xl p-8 text-white">
            <h3 className="text-3xl font-bold text-center mb-6">
              🚀 Quick Challenge Time!
            </h3>
            <div className="bg-white/20 rounded-2xl p-6 backdrop-blur-sm border border-white/30">
              <div className="text-center">
                <h4 className="text-2xl font-bold mb-4">
                  {quickChallenges[currentChallenge].question}
                </h4>
                <div className="flex justify-center gap-6 mb-4">
                  {quickChallenges[currentChallenge].options.map(
                    (option, index) => (
                      <button
                        key={index}
                        onClick={() => handleChallengeAnswer(index)}
                        className="bg-white text-purple-600 px-6 py-4 rounded-xl text-xl font-bold hover:bg-purple-100 transform hover:scale-105 transition-all duration-200 shadow-lg"
                        disabled={showResult}
                      >
                        {option}
                      </button>
                    )
                  )}
                </div>
                {showResult && (
                  <div className="text-2xl font-bold animate-bounce">
                    {quickChallenges[currentChallenge].options.indexOf(
                      quickChallenges[currentChallenge].options[
                        quickChallenges[currentChallenge].correct
                      ]
                    ) >= 0
                      ? "🎉 Great job!"
                      : "😊 Try again!"}
                  </div>
                )}
                <div className="text-lg mt-4">
                  Score: {score} / {currentChallenge + 1}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activities Section */}
        <div className="py-16">
          <div className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl border border-pink-200 p-8">
            {/* Age Filter */}
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-6 text-gray-800">
                🎯 Choose Your Age Group
              </h3>
              <div className="flex justify-center">
                <div className="w-full max-w-md">
                  <select
                    value={selectedAge}
                    onChange={(e) => setSelectedAge(e.target.value)}
                    className="w-full p-4 border border-purple-300 rounded-xl text-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    {ageRanges.map((age) => (
                      <option key={age} value={age}>
                        {age === "All" ? "All Ages" : `Ages ${age}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <h2 className="text-4xl font-bold text-center mb-8 text-gray-800">
              🌟 Comparison Adventures
              {isFiltering && (
                <div className="inline-block ml-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
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

            {/* Benefits Section */}
            <div className="mt-16 bg-gradient-to-br from-purple-50 to-blue-50 rounded-3xl p-8 border border-purple-200">
              <h3 className="text-3xl font-bold text-center mb-8 text-gray-800">
                🌈 Why Comparison Games Are Amazing!
              </h3>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-5xl mb-4">🧠</div>
                  <h4 className="text-xl font-bold mb-2 text-gray-800">
                    Develops Critical Thinking
                  </h4>
                  <p className="text-gray-600">
                    Kids learn to analyze, compare, and make decisions through
                    fun interactive challenges.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-5xl mb-4">📊</div>
                  <h4 className="text-xl font-bold mb-2 text-gray-800">
                    Math & Science Skills
                  </h4>
                  <p className="text-gray-600">
                    Comparing sizes, numbers, and patterns builds essential STEM
                    foundations.
                  </p>
                </div>
                <div className="text-center">
                  <div className="text-5xl mb-4">🎯</div>
                  <h4 className="text-xl font-bold mb-2 text-gray-800">
                    Problem Solving
                  </h4>
                  <p className="text-gray-600">
                    Every comparison is a puzzle that enhances logical reasoning
                    abilities.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-12">
              <Link
                to="/search"
                className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white text-xl font-bold px-12 py-6 rounded-full hover:from-purple-700 hover:via-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-xl"
              >
                🚀 Explore All Activities
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
