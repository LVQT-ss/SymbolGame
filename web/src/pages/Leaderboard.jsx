import React, { useState } from "react";
import {
  Trophy,
  Medal,
  Crown,
  Star,
  TrendingUp,
  Zap,
  Target,
  Award,
  Users,
  Clock,
  Brain,
  Gamepad2,
} from "lucide-react";

// Mock leaderboard data
const LEADERBOARD_DATA = {
  global: [
    {
      rank: 1,
      id: 1,
      name: "Emma Chen",
      username: "@emma_champion",
      score: 2850,
      level: 15,
      avatar: "👑",
      country: "🇺🇸",
      achievements: ["Size Master", "Speed Demon", "Perfect Week"],
      gamesPlayed: 127,
      accuracy: 94,
      winRate: 89,
      streak: 15,
      playtime: "24h",
      trend: "up",
      change: "+120",
    },
    {
      rank: 2,
      id: 2,
      name: "Alex Rodriguez",
      username: "@alex_ninja",
      score: 2720,
      level: 14,
      avatar: "⚡",
      country: "🇪🇸",
      achievements: ["Number Wizard", "Lightning Fast", "Top Scorer"],
      gamesPlayed: 98,
      accuracy: 91,
      winRate: 85,
      streak: 12,
      playtime: "18h",
      trend: "up",
      change: "+85",
    },
    {
      rank: 3,
      id: 3,
      name: "Zoe Kim",
      username: "@zoe_master",
      score: 2650,
      level: 13,
      avatar: "🌟",
      country: "🇰🇷",
      achievements: ["Color Expert", "Consistency King", "Rising Star"],
      gamesPlayed: 105,
      accuracy: 89,
      winRate: 82,
      streak: 8,
      playtime: "22h",
      trend: "up",
      change: "+67",
    },
    {
      rank: 4,
      id: 4,
      name: "Marcus Johnson",
      username: "@marcus_pro",
      score: 2480,
      level: 12,
      avatar: "🎯",
      country: "🇬🇧",
      achievements: ["Accuracy Master", "Daily Player"],
      gamesPlayed: 89,
      accuracy: 87,
      winRate: 78,
      streak: 5,
      playtime: "15h",
      trend: "stable",
      change: "+12",
    },
    {
      rank: 5,
      id: 5,
      name: "Sofia Martinez",
      username: "@sofia_star",
      score: 2340,
      level: 11,
      avatar: "🎮",
      country: "🇲🇽",
      achievements: ["Team Player", "Friendly Competitor"],
      gamesPlayed: 76,
      accuracy: 85,
      winRate: 75,
      streak: 3,
      playtime: "12h",
      trend: "down",
      change: "-23",
    },
  ],
  weekly: [
    {
      rank: 1,
      name: "Lightning Lucy",
      score: 1250,
      change: "+15",
      avatar: "⚡",
      country: "🇨🇦",
    },
    {
      rank: 2,
      name: "Speed Sam",
      score: 1180,
      change: "+8",
      avatar: "🏎️",
      country: "🇦🇺",
    },
    {
      rank: 3,
      name: "Quick Quinn",
      score: 1095,
      change: "+22",
      avatar: "💨",
      country: "🇫🇷",
    },
  ],
  daily: [
    {
      rank: 1,
      name: "Today's Hero",
      score: 450,
      change: "+5",
      avatar: "🦸",
      country: "🇯🇵",
    },
    {
      rank: 2,
      name: "Daily Grind",
      score: 398,
      change: "+3",
      avatar: "💪",
      country: "🇩🇪",
    },
    {
      rank: 3,
      name: "Morning Star",
      score: 367,
      change: "+12",
      avatar: "🌅",
      country: "🇮🇳",
    },
  ],
};

const CATEGORIES = [
  {
    id: "math",
    name: "Math Masters",
    icon: "🔢",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "speed",
    name: "Speed Demons",
    icon: "⚡",
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: "accuracy",
    name: "Precision Pros",
    icon: "🎯",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "endurance",
    name: "Marathon Players",
    icon: "🏃",
    color: "from-purple-500 to-pink-500",
  },
];

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState("global");
  const [activeCategory, setActiveCategory] = useState("math");
  const [currentUser] = useState({
    rank: 47,
    name: "You",
    score: 1580,
    level: 8,
    avatar: "👤",
    trend: "up",
    change: "+34",
  });

  const getRankIcon = (rank) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <span className="text-gray-500 font-bold">#{rank}</span>;
  };

  const getTrendIcon = (trend) => {
    if (trend === "up")
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === "down")
      return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />;
    return <div className="w-4 h-4 bg-gray-300 rounded-full"></div>;
  };

  const tabs = [
    { id: "global", name: "Global", icon: "🌍" },
    { id: "weekly", name: "Weekly", icon: "📅" },
    { id: "daily", name: "Daily", icon: "⭐" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <div className="max-w-7xl mx-auto p-6 pt-24">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-6">
            🏆 Global Leaderboard 🌟
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Compete with players worldwide! Climb the ranks, earn achievements,
            and become the ultimate champion!
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  50,234
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Active Players
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  1.2M
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Games Played
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  15,678
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Competitions
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  890K
                </p>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  Hours Played
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Your Rank Card */}
        <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-3xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-4xl">{currentUser.avatar}</div>
              <div>
                <h3 className="text-xl font-bold">Your Current Rank</h3>
                <p className="text-white/90">Keep climbing the leaderboard!</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">#{currentUser.rank}</div>
              <div className="flex items-center space-x-2">
                {getTrendIcon(currentUser.trend)}
                <span className="text-sm">{currentUser.change} this week</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 shadow-lg">
            <div className="flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`p-4 rounded-2xl transition-all duration-200 ${
                activeCategory === category.id
                  ? "bg-gradient-to-r " +
                    category.color +
                    " text-white shadow-lg scale-105"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-lg"
              }`}
            >
              <div className="text-2xl mb-2">{category.icon}</div>
              <div className="font-bold text-sm">{category.name}</div>
            </button>
          ))}
        </div>

        {/* Leaderboard */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white">
            <h2 className="text-2xl font-bold flex items-center">
              <Trophy className="w-6 h-6 mr-2" />
              {tabs.find((tab) => tab.id === activeTab)?.name} Champions
            </h2>
            <p className="text-white/90 mt-1">
              Top performers in{" "}
              {CATEGORIES.find((cat) => cat.id === activeCategory)?.name}
            </p>
          </div>

          <div className="p-6">
            {/* Top 3 Podium */}
            {activeTab === "global" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {LEADERBOARD_DATA.global.slice(0, 3).map((player, index) => (
                  <div
                    key={player.id}
                    className={`text-center ${
                      index === 0
                        ? "order-2 md:order-2"
                        : index === 1
                        ? "order-1 md:order-1"
                        : "order-3 md:order-3"
                    }`}
                  >
                    <div
                      className={`relative mx-auto w-20 h-20 rounded-full bg-gradient-to-r ${
                        index === 0
                          ? "from-yellow-400 to-yellow-600"
                          : index === 1
                          ? "from-gray-400 to-gray-600"
                          : "from-amber-400 to-amber-600"
                      } flex items-center justify-center text-3xl ${
                        index === 0 ? "w-24 h-24" : ""
                      }`}
                    >
                      {player.avatar}
                      <div className="absolute -top-2 -right-2">
                        {getRankIcon(player.rank)}
                      </div>
                    </div>
                    <h3 className="font-bold text-lg mt-3 text-gray-800 dark:text-white">
                      {player.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {player.username}
                    </p>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-purple-600">
                        {player.score}
                      </div>
                      <div className="text-sm text-gray-500">
                        Level {player.level}
                      </div>
                    </div>
                    <div className="flex justify-center mt-2">
                      <span className="text-xl">{player.country}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Detailed Rankings */}
            <div className="space-y-4">
              {(activeTab === "global"
                ? LEADERBOARD_DATA.global.slice(3)
                : LEADERBOARD_DATA[activeTab]
              ).map((player, index) => (
                <div
                  key={player.id || index}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8">
                      {getRankIcon(player.rank)}
                    </div>
                    <div className="text-2xl">{player.avatar}</div>
                    <div>
                      <h4 className="font-bold text-gray-800 dark:text-white">
                        {player.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {player.username || `Rank ${player.rank}`}
                      </p>
                    </div>
                    <span className="text-xl">{player.country}</span>
                  </div>

                  <div className="flex items-center space-x-6">
                    {activeTab === "global" && (
                      <>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Accuracy</div>
                          <div className="font-bold text-gray-800 dark:text-white">
                            {player.accuracy}%
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm text-gray-500">Win Rate</div>
                          <div className="font-bold text-gray-800 dark:text-white">
                            {player.winRate}%
                          </div>
                        </div>
                      </>
                    )}
                    <div className="text-center">
                      <div className="text-sm text-gray-500">Score</div>
                      <div className="font-bold text-2xl text-purple-600">
                        {player.score}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getTrendIcon(player.trend)}
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {player.change}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12 bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            🚀 Ready to Climb the Ranks?
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Join the competition and see how high you can climb! Every game
            counts towards your ranking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-8 rounded-xl hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-lg">
              🎮 Play Now
            </button>
            <button className="bg-gradient-to-r from-blue-500 to-green-500 text-white font-bold py-3 px-8 rounded-xl hover:from-blue-600 hover:to-green-600 transform hover:scale-105 transition-all duration-200 shadow-lg">
              📊 View My Stats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
