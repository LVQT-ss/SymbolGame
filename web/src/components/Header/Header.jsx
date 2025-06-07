import React, { useEffect, useState } from "react";
import { Menu, X, Bell, Globe, Gem, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { signOut } from "../../redux/user/userSlice";

const Header = () => {
  const [notifications] = useState(3);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { currentUser } = useSelector((state) => state.user);
  const [isScrolled, setIsScrolled] = useState(false);
  const [language, setLanguage] = useState("EN");
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = () => {
    dispatch(signOut());
    navigate("/");
  };

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "EN" ? "VI" : "EN"));
    console.log(
      "Language switched to:",
      language === "EN" ? "Vietnamese" : "English"
    );
  };

  const navLinks = [
    { path: "/", icon: "🏠", label: "Home" },
    { path: "/game", icon: "🎮", label: "Game" },
    { path: "/leaderboard", icon: "🏆", label: "Leaderboard" },
  ];

  return (
    <header
      className={`top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-lg shadow-lg border-b border-gray-200"
          : "bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <span className="text-2xl group-hover:animate-bounce transition-all duration-300">
              🎯
            </span>
            <span
              className={`text-xl font-bold transition-colors duration-300 ${
                isScrolled ? "text-gray-800" : "text-white"
              }`}
            >
              anhempc
            </span>
            <span className="text-xs bg-yellow-400 text-gray-800 px-2 py-1 rounded-full font-bold animate-pulse">
              PRO
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-all duration-300 hover:scale-105 ${
                  location.pathname === link.path
                    ? isScrolled
                      ? "bg-purple-100 text-purple-600"
                      : "bg-white/20 text-yellow-300"
                    : isScrolled
                    ? "text-gray-600 hover:bg-gray-100 hover:text-purple-600"
                    : "text-white hover:bg-white/20"
                }`}
              >
                <span className="text-sm">{link.icon}</span>
                <span className="font-medium">{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Quick Actions - Desktop */}
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={toggleLanguage}
                className={`p-2 rounded-full transition-all duration-300 hover:scale-110 flex items-center space-x-1 ${
                  isScrolled
                    ? "bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-600"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
                title={`Switch to ${
                  language === "EN" ? "Vietnamese" : "English"
                }`}
              >
                <Globe size={16} />
                <span className="text-xs font-bold">{language}</span>
              </button>

              <button
                className={`p-2 rounded-full transition-all duration-300 hover:scale-110 ${
                  isScrolled
                    ? "bg-gray-100 text-emerald-600 hover:bg-emerald-100"
                    : "bg-white/20 text-emerald-300 hover:bg-white/30"
                }`}
                title="Achievements"
              >
                <Gem size={16} />
              </button>

              {currentUser && (
                <button
                  className={`p-2 rounded-full transition-all duration-300 hover:scale-110 relative ${
                    isScrolled
                      ? "bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-600"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                  title="Notifications"
                >
                  <Bell size={16} />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                      {notifications}
                    </span>
                  )}
                </button>
              )}
            </div>

            {/* User Profile or Sign In */}
            {currentUser ? (
              <div className="relative group">
                <button
                  className={`flex items-center space-x-2 p-2 rounded-full transition-all duration-300 hover:scale-105 ${
                    isScrolled
                      ? "bg-gray-100 text-gray-600 hover:bg-purple-100 hover:text-purple-600"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <User size={14} className="text-white" />
                  </div>
                  <span className="hidden md:block font-medium">
                    {currentUser.username}
                  </span>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <Link
                    to="/leaderboard"
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-t-lg"
                  >
                    Leaderboard
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-b-lg"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                to="/sign-in"
                className={`px-4 py-2 rounded-full font-medium transition-all duration-300 hover:scale-105 ${
                  isScrolled
                    ? "bg-purple-600 text-white hover:bg-purple-700 shadow-lg"
                    : "bg-white/20 text-white hover:bg-white/30 border border-white/30"
                }`}
              >
                Sign In
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden p-2 rounded-lg transition-all duration-300 ${
                isScrolled
                  ? "text-gray-600 hover:bg-gray-100"
                  : "text-white hover:bg-white/20"
              }`}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div
            className={`md:hidden border-t transition-all duration-300 ${
              isScrolled
                ? "border-gray-200 bg-white"
                : "border-white/20 bg-white/10 backdrop-blur-lg"
            }`}
          >
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* Mobile Navigation Links */}
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-300 ${
                    location.pathname === link.path
                      ? isScrolled
                        ? "bg-purple-100 text-purple-600"
                        : "bg-white/20 text-yellow-300"
                      : isScrolled
                      ? "text-gray-600 hover:bg-gray-100"
                      : "text-white hover:bg-white/20"
                  }`}
                >
                  <span className="text-lg">{link.icon}</span>
                  <span className="font-medium">{link.label}</span>
                </Link>
              ))}

              {/* Mobile Auth Buttons */}
              {!currentUser && (
                <div className="px-3 py-2">
                  <Link
                    to="/sign-in"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full block text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Sign In
                  </Link>
                </div>
              )}

              {currentUser && (
                <button
                  onClick={() => {
                    handleSignOut();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
