import { Alert, Button, Label, Spinner, TextInput } from "flowbite-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Shield,
  Sparkles,
} from "lucide-react";
import {
  signInStart,
  signInSuccess,
  signInFailure,
} from "../redux/user/userSlice";

export default function SignIn() {
  const [formData, setFormData] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const { loading, error: errorMessage } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return dispatch(signInFailure("Please fill out all fields."));
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return dispatch(signInFailure("Please enter a valid email address."));
    }

    try {
      dispatch(signInStart());

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Fake successful authentication - In real app, this would be an API call
      const fakeUserData = {
        id: 1,
        username: formData.email.split("@")[0] || "user",
        email: formData.email,
        profilePicture: "https://via.placeholder.com/100x100?text=User",
        isAdmin: formData.email === "admin@example.com",
      };

      dispatch(signInSuccess(fakeUserData));
      navigate("/dashboard");
    } catch (error) {
      dispatch(
        signInFailure(error.message || "An error occurred during sign in.")
      );
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
                <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-bold rounded-full animate-pulse">
                  <Sparkles className="w-4 h-4 mr-1" />
                  PREMIUM EXPERIENCE
                </span>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="space-y-6">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-800 dark:text-white">
                Welcome Back! 👋
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                Ready to continue your amazing journey? Sign in to access your
                personalized dashboard, track your progress, and unlock
                exclusive features.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-3xl mb-2">🏆</div>
                <h3 className="font-bold text-gray-800 dark:text-white text-sm">
                  Track Progress
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                  Monitor your achievements
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-3xl mb-2">🎮</div>
                <h3 className="font-bold text-gray-800 dark:text-white text-sm">
                  Exclusive Games
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                  Access premium content
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-3xl mb-2">👥</div>
                <h3 className="font-bold text-gray-800 dark:text-white text-sm">
                  Community
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                  Connect with friends
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow">
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-bold text-gray-800 dark:text-white text-sm">
                  Analytics
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-xs">
                  Detailed insights
                </p>
              </div>
            </div>

            {/* Security Badge */}
            <div className="flex items-center space-x-3 bg-green-50 dark:bg-green-900/30 rounded-2xl p-4">
              <Shield className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div>
                <h4 className="font-bold text-green-800 dark:text-green-300">
                  Secure & Safe
                </h4>
                <p className="text-green-600 dark:text-green-400 text-sm">
                  Your data is protected with enterprise-grade security
                </p>
              </div>
            </div>
          </div>

          {/* Right Side - Sign In Form */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 lg:p-12">
            <div className="space-y-6">
              {/* Form Header */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-4">
                  <LogIn className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">
                  Sign In
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Enter your credentials to access your account
                </p>
              </div>

              {/* Sign In Form */}
              <form className="space-y-6" onSubmit={handleSubmit}>
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
                      placeholder="Enter your password"
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
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label
                      htmlFor="remember"
                      className="ml-2 text-sm text-gray-600 dark:text-gray-300"
                    >
                      Remember me
                    </label>
                  </div>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Error Message */}
                {errorMessage && (
                  <Alert className="rounded-xl" color="failure">
                    <div className="flex items-center">
                      <span className="text-sm">{errorMessage}</span>
                    </div>
                  </Alert>
                )}

                {/* Sign In Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <Spinner size="sm" className="mr-3" />
                      <span>Signing you in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <LogIn className="w-5 h-5 mr-2" />
                      Sign In
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
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Demo Credentials */}
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-4 border border-blue-200 dark:border-blue-700">
                  <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2">
                    🎮 Demo Mode
                  </h4>
                  <p className="text-blue-600 dark:text-blue-400 text-sm mb-3">
                    Try the application with any email and password combination!
                  </p>
                  <div className="space-y-1 text-xs">
                    <p className="text-blue-600 dark:text-blue-400">
                      <strong>Admin access:</strong> admin@example.com + any
                      password
                    </p>
                    <p className="text-blue-600 dark:text-blue-400">
                      <strong>Regular user:</strong> any email + any password
                    </p>
                  </div>
                </div>
              </form>

              {/* Sign Up Link */}
              <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-300">
                  Don't have an account yet?{" "}
                  <Link
                    to="/sign-up"
                    className="inline-flex items-center text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 font-bold hover:underline transition-colors"
                  >
                    <UserPlus className="w-4 h-4 mr-1" />
                    Create Account
                  </Link>
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Join thousands of users enjoying our platform!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
