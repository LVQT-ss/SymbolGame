import { Alert, Button, Label, Spinner, TextInput } from "flowbite-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Shield,
  Sparkles,
  Gift,
  Trophy,
  Users,
  Gamepad2,
} from "lucide-react";

export default function SignUp() {
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      return setErrorMessage("Please fill out all fields.");
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return setErrorMessage("Please enter a valid email address.");
    }

    // Password strength validation
    if (formData.password.length < 6) {
      return setErrorMessage("Password must be at least 6 characters long.");
    }

    try {
      setLoading(true);
      setErrorMessage(null);

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Fake successful registration
      console.log("User registered successfully:", {
        username: formData.username,
        email: formData.email,
      });

      setLoading(false);
      navigate("/sign-in");
    } catch (error) {
      setErrorMessage(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Welcome Section */}
          <div className="space-y-8">
            {/* Logo and Brand */}
            <div className="text-center lg:text-left">
              <Link to="/" className="inline-flex items-center space-x-3 group">
                <div className="flex items-center space-x-2">
                  <span className="text-4xl group-hover:animate-bounce transition-all duration-300">
                    🎯
                  </span>
                  <div>
                    <span className="text-4xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                      anhempc
                    </span>
                    <span className="text-4xl font-bold text-gray-800 dark:text-white ml-2">
                      PRO
                    </span>
                  </div>
                </div>
              </Link>
              <div className="mt-4">
                <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-green-500 to-blue-500 text-white text-sm font-bold rounded-full animate-pulse">
                  <Gift className="w-4 h-4 mr-1" />
                  JOIN FOR FREE
                </span>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white">
                Join Our Community! 🚀
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Create your account and unlock a world of amazing games, track
                your progress, compete with friends, and become part of our
                growing community of players!
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-3xl mb-2">🎁</div>
                <h3 className="font-bold text-gray-800 dark:text-white text-sm">
                  Free Account
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                  No hidden costs ever
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-3xl mb-2">🏅</div>
                <h3 className="font-bold text-gray-800 dark:text-white text-sm">
                  Achievements
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                  Unlock badges & rewards
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-3xl mb-2">🎮</div>
                <h3 className="font-bold text-gray-800 dark:text-white text-sm">
                  Premium Games
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                  Access exclusive content
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-3xl mb-2">🌟</div>
                <h3 className="font-bold text-gray-800 dark:text-white text-sm">
                  Leaderboards
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                  Compete globally
                </p>
              </div>
            </div>

            {/* Stats Section */}
            <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-2xl p-6 text-white">
              <h3 className="text-xl font-bold mb-4">
                🌟 Join Our Growing Community
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">50K+</div>
                  <div className="text-sm opacity-90">Active Players</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">1M+</div>
                  <div className="text-sm opacity-90">Games Played</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">100+</div>
                  <div className="text-sm opacity-90">Fun Challenges</div>
                </div>
              </div>
            </div>

            {/* Trust Badge */}
            <div className="flex items-center space-x-3 bg-green-50 dark:bg-green-900/30 rounded-2xl p-4">
              <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div>
                <h4 className="font-bold text-green-800 dark:text-green-300">
                  Safe & Secure
                </h4>
                <p className="text-green-600 dark:text-green-400 text-sm">
                  Your privacy is our priority with top-tier security
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Sign Up Form */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 lg:p-12">
            <div className="space-y-6">
              {/* Form Header */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-4">
                  <UserPlus className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                  Create Account
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Get started with your free account today
                </p>
              </div>

              {/* Sign Up Form */}
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Username Field */}
                <div className="space-y-2">
                  <Label
                    value="Username"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  />
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <TextInput
                      type="text"
                      placeholder="Choose a unique username"
                      id="username"
                      onChange={handleChange}
                      required
                      className="pl-12 py-3 rounded-xl border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    This will be your display name
                  </p>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label
                    value="Email Address"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  />
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <TextInput
                      type="email"
                      placeholder="Enter your email address"
                      id="email"
                      onChange={handleChange}
                      required
                      className="pl-12 py-3 rounded-xl border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    We'll never share your email
                  </p>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label
                    value="Password"
                    className="text-gray-700 dark:text-gray-300 font-medium"
                  />
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <TextInput
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a strong password"
                      id="password"
                      onChange={handleChange}
                      required
                      className="pl-12 pr-12 py-3 rounded-xl border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Minimum 6 characters required
                  </p>
                </div>

                {/* Terms and Privacy */}
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="terms"
                    required
                    className="mt-1 w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-gray-600 dark:text-gray-300"
                  >
                    I agree to the{" "}
                    <Link
                      to="/terms"
                      className="text-purple-600 hover:text-purple-800 font-medium"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy"
                      className="text-purple-600 hover:text-purple-800 font-medium"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <Alert className="rounded-xl" color="failure">
                    <div className="flex items-center">
                      <span className="text-sm">{errorMessage}</span>
                    </div>
                  </Alert>
                )}

                {/* Sign Up Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Spinner size="sm" className="mr-3" />
                      <span>Creating your account...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <UserPlus className="w-5 h-5 mr-2" />
                      Create My Account
                    </div>
                  )}
                </Button>

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                      What you get
                    </span>
                  </div>
                </div>

                {/* Benefits List */}
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                  <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-3">
                    🎉 Your Free Account Includes:
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                      <Trophy className="w-4 h-4 mr-2" />
                      <span>Personal dashboard & progress tracking</span>
                    </div>
                    <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                      <Gamepad2 className="w-4 h-4 mr-2" />
                      <span>Access to 100+ educational games</span>
                    </div>
                    <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                      <Users className="w-4 h-4 mr-2" />
                      <span>Join global leaderboards & competitions</span>
                    </div>
                    <div className="flex items-center text-sm text-blue-600 dark:text-blue-400">
                      <Gift className="w-4 h-4 mr-2" />
                      <span>Unlock achievements & special badges</span>
                    </div>
                  </div>
                </div>
              </form>

              {/* Sign In Link */}
              <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-300">
                  Already have an account?{" "}
                  <Link
                    to="/sign-in"
                    className="inline-flex items-center text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-bold hover:underline transition-colors"
                  >
                    <LogIn className="w-4 h-4 mr-1" />
                    Sign In Here
                  </Link>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Welcome back! We've missed you 🎮
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
