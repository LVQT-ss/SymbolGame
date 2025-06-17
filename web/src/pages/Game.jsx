import React, { useState } from "react";
import {
  Play,
  Star,
  Clock,
  Trophy,
  Users,
  Zap,
  Brain,
  Target,
  Gamepad2,
  Crown,
  Medal,
  ChevronRight,
  Filter,
} from "lucide-react";

// Mock games data
const GAMES_DATA = {
  featured: [
    {
      id: 1,
      title: "Math Comparison Challenge",
      description:
        "Compare numbers, fractions, and equations in this fast-paced math game!",
      difficulty: "Medium",
      duration: "5-10 min",
      players: "1-4",
      rating: 4.8,
      plays: "125K",
      category: "Math",
      image: "🔢",
      color: "from-blue-500 to-cyan-500",
      features: ["Multiplayer", "Leaderboards", "Achievements"],
      ageRange: "8+",
    },
    {
      id: 2,
      title: "Speed Comparison Race",
      description:
        "Lightning-fast comparison challenges that test your quick thinking!",
      difficulty: "Hard",
      duration: "3-5 min",
      players: "1-8",
      rating: 4.9,
      plays: "89K",
      category: "Speed",
      image: "⚡",
      color: "from-yellow-500 to-orange-500",
      features: ["Real-time", "Global Rankings", "Speed Modes"],
      ageRange: "10+",
    },
    {
      id: 3,
      title: "Logic Puzzle Master",
      description:
        "Solve complex comparison puzzles and become a logic master!",
      difficulty: "Expert",
      duration: "10-15 min",
      players: "1-2",
      rating: 4.7,
      plays: "67K",
      category: "Logic",
      image: "🧠",
      color: "from-purple-500 to-pink-500",
      features: ["Brain Training", "Progressive Difficulty", "Analytics"],
      ageRange: "12+",
    },
  ],
  categories: [
    {
      id: "math",
      name: "Math Games",
      icon: "🔢",
      color: "from-blue-500 to-cyan-500",
      count: 15,
      description: "Number comparison and mathematical challenges",
    },
    {
      id: "speed",
      name: "Speed Games",
      icon: "⚡",
      color: "from-yellow-500 to-orange-500",
      count: 12,
      description: "Fast-paced reaction and quick thinking games",
    },
    {
      id: "logic",
      name: "Logic Games",
      icon: "🧠",
      color: "from-purple-500 to-pink-500",
      count: 18,
      description: "Brain teasers and logical reasoning challenges",
    },
    {
      id: "memory",
      name: "Memory Games",
      icon: "🎯",
      color: "from-green-500 to-emerald-500",
      count: 10,
      description: "Pattern recognition and memory training",
    },
    {
      id: "multiplayer",
      name: "Multiplayer",
      icon: "👥",
      color: "from-pink-500 to-red-500",
      count: 8,
      description: "Compete with friends and players worldwide",
    },
    {
      id: "kids",
      name: "Kids Zone",
      icon: "🌈",
      color: "from-indigo-500 to-purple-500",
      count: 20,
      description: "Fun and educational games for children",
    },
  ],
  allGames: [
    {
      id: 4,
      title: "Number Ninja",
      difficulty: "Easy",
      duration: "2-3 min",
      rating: 4.6,
      plays: "45K",
      category: "Math",
      image: "🥷",
      ageRange: "6+",
    },
    {
      id: 5,
      title: "Pattern Detective",
      difficulty: "Medium",
      duration: "8-12 min",
      rating: 4.5,
      plays: "38K",
      category: "Logic",
      image: "🔍",
      ageRange: "9+",
    },
    {
      id: 6,
      title: "Quick Compare",
      difficulty: "Easy",
      duration: "1-2 min",
      rating: 4.4,
      plays: "92K",
      category: "Speed",
      image: "🏃",
      ageRange: "5+",
    },
    {
      id: 7,
      title: "Memory Master",
      difficulty: "Hard",
      duration: "5-8 min",
      rating: 4.7,
      plays: "29K",
      category: "Memory",
      image: "🧩",
      ageRange: "8+",
    },
  ],
};

const DIFFICULTY_COLORS = {
  Easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  Medium:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Hard: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  Expert: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

export default function Game() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("popular");

  const getRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    return (
      <div className="flex items-center space-x-1">
        {[...Array(fullStars)].map((_, i) => (
          <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
        ))}
        {hasHalfStar && (
          <Star className="w-4 h-4 text-yellow-400 fill-current opacity-50" />
        )}
        <span className="text-sm text-gray-600 dark:text-gray-300 ml-1">
          {rating}
        </span>
      </div>
    );
  };

  const GameCard = ({ game, featured = false }) => (
    <div
      className={`group bg-white dark:bg-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden ${
        featured ? "lg:col-span-2" : ""
      }`}
    >
      {/* Game Header */}
      <div
        className={`p-6 bg-gradient-to-r ${game.color} text-white relative overflow-hidden`}
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="text-4xl">{game.image}</div>
            <div className="flex items-center space-x-2">
              {game.features &&
                game.features.map((feature, index) => (
                  <span
                    key={index}
                    className="bg-white/20 text-xs px-2 py-1 rounded-full"
                  >
                    {feature}
                  </span>
                ))}
            </div>
          </div>
          <h3 className="text-xl font-bold mb-2">{game.title}</h3>
          <p className="text-white/90 text-sm">{game.description}</p>
        </div>
      </div>

      {/* Game Info */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          {getRatingStars(game.rating)}
          <span className="text-sm text-gray-500">{game.plays} plays</span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {game.duration}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              {game.players} players
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Age {game.ageRange}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-gray-400" />
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                DIFFICULTY_COLORS[game.difficulty]
              }`}
            >
              {game.difficulty}
            </span>
          </div>
        </div>

        <button
          className={`w-full py-3 bg-gradient-to-r ${game.color} text-white font-bold rounded-xl hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2`}
        >
          <Play className="w-5 h-5" />
          <span>Play Now</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <div className="max-w-7xl mx-auto p-6 pt-24">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-6">
            🎮 Choose Your Game 🚀
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Discover amazing comparison games that challenge your mind, improve
            your skills, and provide endless fun!
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              83
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Total Games
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-3xl mb-2">👥</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              25K
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Daily Players
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-3xl mb-2">🏆</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              156
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Tournaments
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-shadow">
            <div className="text-3xl mb-2">⭐</div>
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              4.8
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Avg Rating
            </div>
          </div>
        </div>

        {/* Featured Games */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 flex items-center">
            <Crown className="w-8 h-8 text-yellow-500 mr-3" />
            Featured Games
          </h2>

          {/* Main Featured Game */}
          <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
              <div
                className={`p-4 md:p-8 bg-gradient-to-r ${GAMES_DATA.featured[0].color} text-white relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-16 -translate-x-16"></div>
                <div className="relative z-10">
                  {/* Header Section */}
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4 lg:mb-0">
                      <div className="text-5xl md:text-6xl text-center sm:text-left">
                        {GAMES_DATA.featured[0].image}
                      </div>
                      <div className="text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-2 sm:space-y-0 sm:space-x-2 mb-2">
                          <span className="bg-white/20 text-sm px-3 py-1 rounded-full font-bold">
                            🏆 FEATURED
                          </span>
                          <span className="bg-white/20 text-sm px-3 py-1 rounded-full">
                            Most Popular
                          </span>
                        </div>
                        <h3 className="text-2xl md:text-3xl font-bold mb-3">
                          {GAMES_DATA.featured[0].title}
                        </h3>
                        <p className="text-white/90 text-base md:text-lg">
                          {GAMES_DATA.featured[0].description}
                        </p>
                      </div>
                    </div>

                    {/* Desktop Play Button */}
                    <div className="hidden lg:block">
                      <button className="bg-white text-gray-800 font-bold py-4 px-8 rounded-xl hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center space-x-3 whitespace-nowrap">
                        <Play className="w-6 h-6" />
                        <span className="text-lg">Play Now</span>
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Statistics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold">
                        {GAMES_DATA.featured[0].rating}
                      </div>
                      <div className="text-white/80 text-xs md:text-sm">
                        ★ Rating
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold">
                        {GAMES_DATA.featured[0].plays}
                      </div>
                      <div className="text-white/80 text-xs md:text-sm">
                        Total Plays
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold">
                        {GAMES_DATA.featured[0].duration}
                      </div>
                      <div className="text-white/80 text-xs md:text-sm">
                        Duration
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl md:text-2xl font-bold">
                        {GAMES_DATA.featured[0].players}
                      </div>
                      <div className="text-white/80 text-xs md:text-sm">
                        Players
                      </div>
                    </div>
                  </div>

                  {/* Features and Mobile Play Button */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                      {GAMES_DATA.featured[0].features.map((feature, index) => (
                        <span
                          key={index}
                          className="bg-white/20 text-xs md:text-sm px-3 md:px-4 py-2 rounded-full"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>

                    {/* Mobile/Tablet Play Button */}
                    <div className="lg:hidden">
                      <button className="w-full bg-white text-gray-800 font-bold py-4 px-6 rounded-xl hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center space-x-3">
                        <Play className="w-5 h-5 md:w-6 md:h-6" />
                        <span className="text-lg">Play Now</span>
                        <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Featured Games */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {GAMES_DATA.featured.slice(1).map((game) => (
              <div
                key={game.id}
                className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden group"
              >
                <div
                  className={`p-6 bg-gradient-to-r ${game.color} text-white relative overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12"></div>
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="text-4xl">{game.image}</div>
                      <span className="bg-white/20 text-xs px-2 py-1 rounded-full">
                        Featured
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{game.title}</h3>
                    <p className="text-white/90 text-sm">{game.description}</p>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    {getRatingStars(game.rating)}
                    <span className="text-sm text-gray-500">
                      {game.plays} plays
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {game.duration}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {game.players} players
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        Age {game.ageRange}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-4 h-4 text-gray-400" />
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          DIFFICULTY_COLORS[game.difficulty]
                        }`}
                      >
                        {game.difficulty}
                      </span>
                    </div>
                  </div>

                  <button
                    className={`w-full py-3 bg-gradient-to-r ${game.color} text-white font-bold rounded-xl hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 flex items-center justify-center space-x-2`}
                  >
                    <Play className="w-5 h-5" />
                    <span>Play Now</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Game Categories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 flex items-center">
            <Gamepad2 className="w-8 h-8 text-purple-500 mr-3" />
            Game Categories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {GAMES_DATA.categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`group p-6 rounded-3xl transition-all duration-300 text-left ${
                  selectedCategory === category.id
                    ? `bg-gradient-to-r ${category.color} text-white shadow-2xl scale-105`
                    : "bg-white dark:bg-gray-800 hover:shadow-xl"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{category.icon}</div>
                  <div
                    className={`text-sm px-3 py-1 rounded-full ${
                      selectedCategory === category.id
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {category.count} games
                  </div>
                </div>
                <h3
                  className={`text-xl font-bold mb-2 ${
                    selectedCategory === category.id
                      ? "text-white"
                      : "text-gray-800 dark:text-white"
                  }`}
                >
                  {category.name}
                </h3>
                <p
                  className={`text-sm ${
                    selectedCategory === category.id
                      ? "text-white/90"
                      : "text-gray-600 dark:text-gray-300"
                  }`}
                >
                  {category.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Sort and Filter */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
            <Medal className="w-8 h-8 text-blue-500 mr-3" />
            All Games
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 text-gray-700 dark:text-gray-300"
              >
                <option value="popular">Most Popular</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest</option>
                <option value="difficulty">Difficulty</option>
              </select>
            </div>
          </div>
        </div>

        {/* All Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {GAMES_DATA.allGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-3xl p-12 text-white">
          <h3 className="text-3xl font-bold mb-4">
            🌟 Ready for the Challenge?
          </h3>
          <p className="text-xl mb-8 text-white/90">
            Join thousands of players in exciting comparison games and climb the
            leaderboards!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-purple-600 font-bold py-4 px-8 rounded-xl hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg flex items-center justify-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Quick Play</span>
            </button>
            <button className="bg-white/20 text-white font-bold py-4 px-8 rounded-xl hover:bg-white/30 transform hover:scale-105 transition-all duration-200 border border-white/30 flex items-center justify-center space-x-2">
              <Trophy className="w-5 h-5" />
              <span>View Tournament</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
