import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { authAPI } from "../../services/api";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateDate = (dateString: string) => {
    // Check if date is in YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const validateForm = () => {
    if (isLogin) {
      // Login validation - only username and password required
      if (!username.trim()) {
        Alert.alert("Error", "Please enter your username");
        return false;
      }
      if (!password.trim()) {
        Alert.alert("Error", "Please enter your password");
        return false;
      }
      return true;
    } else {
      // Registration validation - all fields required
      if (!fullName.trim()) {
        Alert.alert("Error", "Please enter your full name");
        return false;
      }
      if (!username.trim()) {
        Alert.alert("Error", "Please enter a username");
        return false;
      }
      if (username.length < 3) {
        Alert.alert("Error", "Username must be at least 3 characters long");
        return false;
      }
      if (!email.trim()) {
        Alert.alert("Error", "Please enter your email");
        return false;
      }
      if (!validateEmail(email)) {
        Alert.alert("Error", "Please enter a valid email address");
        return false;
      }
      if (!password.trim()) {
        Alert.alert("Error", "Please enter your password");
        return false;
      }
      if (password.length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters long");
        return false;
      }
      if (password !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match");
        return false;
      }
      if (!age.trim()) {
        Alert.alert("Error", "Please enter your birth date");
        return false;
      }
      if (!validateDate(age)) {
        Alert.alert("Error", "Please enter a valid date in YYYY-MM-DD format");
        return false;
      }
      return true;
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        // Login API call with username and password
        const result = await authAPI.login({
          username: username.toLowerCase().trim(),
          password: password,
        });

        console.log("Login successful:", result);

        Alert.alert(
          "Success",
          `Welcome back${
            result.user?.full_name ? `, ${result.user.full_name}` : ""
          }!`,
          [
            {
              text: "Continue",
              onPress: () => {
                // Navigate to main app
                router.replace("/(tabs)/home");
              },
            },
          ]
        );
      } else {
        // Registration API call with all required fields
        const registrationData = {
          usertype: "Customer",
          username: username.toLowerCase().trim(),
          email: email.toLowerCase().trim(),
          password: password,
          full_name: fullName.trim(),
          avatar:
            "https://i.pravatar.cc/100?img=" +
            Math.floor(Math.random() * 70 + 1), // Random avatar
          age: age.trim(),
        };

        console.log("=== REGISTRATION DATA BEING SENT ===");
        console.log("Endpoint: POST /auth/register");
        console.log("Data:", JSON.stringify(registrationData, null, 2));
        console.log("=====================================");

        const result = await authAPI.register(registrationData);

        console.log("Registration successful:", result);

        Alert.alert(
          "Success",
          "Account created successfully! You can now sign in.",
          [
            {
              text: "Sign In",
              onPress: () => {
                setIsLogin(true);
                // Keep username filled for easy login
                setPassword("");
                setConfirmPassword("");
                setFullName("");
                setEmail("");
                setAge("");
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error("Authentication error:", error);

      let errorMessage = "Something went wrong. Please try again.";

      if (error instanceof Error) {
        // Extract meaningful error messages
        if (
          error.message.includes("User already exists") ||
          error.message.includes("already exists")
        ) {
          errorMessage =
            "An account with this username or email already exists. Please try a different one.";
        } else if (
          error.message.includes("Invalid credentials") ||
          error.message.includes("invalid")
        ) {
          errorMessage =
            "Invalid username or password. Please check your credentials.";
        } else if (
          error.message.includes("User not found") ||
          error.message.includes("not found")
        ) {
          errorMessage =
            "No account found with this username. Please check your username or sign up first.";
        } else if (
          error.message.includes("network") ||
          error.message.includes("Network")
        ) {
          errorMessage =
            "Network error. Please check your internet connection.";
        } else {
          errorMessage = error.message;
        }
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address first");
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);
      await authAPI.forgotPassword(email.toLowerCase().trim());

      Alert.alert(
        "Success",
        "Password reset instructions have been sent to your email."
      );
    } catch (error) {
      console.error("Forgot password error:", error);
      Alert.alert("Error", "Failed to send reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setUsername("");
    setAge("");
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.logoText}>SYMBOL</Text>
          <Text style={styles.subtitle}>
            {isLogin ? "Welcome back!" : "Create your account"}
          </Text>
        </View>

        <View style={styles.formContainer}>
          {!isLogin && (
            <>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color="#888"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#888"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            </>
          )}

          <View style={styles.inputContainer}>
            <Ionicons
              name="at-outline"
              size={20}
              color="#888"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#888"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          {!isLogin && (
            <>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#888"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#888"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color="#888"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Birth Date (YYYY-MM-DD)"
                  placeholderTextColor="#888"
                  value={age}
                  onChangeText={setAge}
                  autoCapitalize="none"
                />
              </View>
            </>
          )}

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#888"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          {!isLogin && (
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#888"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#888"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>
          )}

          {isLogin && (
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              isLoading && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.submitButtonText}>Loading...</Text>
            ) : (
              <Text style={styles.submitButtonText}>
                {isLogin ? "Sign In" : "Sign Up"}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.toggleContainer}>
            <Text style={styles.toggleText}>
              {isLogin
                ? "Don't have an account? "
                : "Already have an account? "}
            </Text>
            <TouchableOpacity onPress={toggleMode}>
              <Text style={styles.toggleLink}>
                {isLogin ? "Sign Up" : "Sign In"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>By continuing, you agree to our</Text>
          <View style={styles.linksContainer}>
            <TouchableOpacity>
              <Text style={styles.linkText}>Terms of Service</Text>
            </TouchableOpacity>
            <Text style={styles.footerText}> and </Text>
            <TouchableOpacity>
              <Text style={styles.linkText}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#25292e",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffd33d",
    marginBottom: 8,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 16,
    color: "#ccc",
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "#444",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#fff",
    fontSize: 16,
    height: "100%",
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: "#ffd33d",
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#ffd33d",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#ffd33d",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonDisabled: {
    backgroundColor: "#666",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "#25292e",
    fontSize: 18,
    fontWeight: "bold",
  },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  toggleText: {
    color: "#ccc",
    fontSize: 14,
  },
  toggleLink: {
    color: "#ffd33d",
    fontSize: 14,
    fontWeight: "bold",
  },
  footerContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  footerText: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
  },
  linksContainer: {
    flexDirection: "row",
    marginTop: 4,
  },
  linkText: {
    color: "#ffd33d",
    fontSize: 12,
  },
});
