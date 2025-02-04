import React, { useState } from "react";
import {
  Image,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ImageBackground,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "@/hooks/useColorScheme";
import { authService } from '../../services/authService';

export default function LoginScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Validation Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.login({
        email,
        password
      });

      console.log('Login successful:', result.user);
      router.replace('/(app)/home');
    } catch (error: any) {
      console.error('Login error:', error);
      Alert.alert(
        'Login Failed', 
        error.message || 'An error occurred during login'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ImageBackground
          source={require("@/assets/images/start-background.png")}
          style={styles.bgImg}
          resizeMode='cover'
        >
          <SafeAreaView
            style={[
              styles.container,
              { backgroundColor: isDark ? "#2C3E50" : "#f5f5f5" },
            ]}
          >
            <StatusBar style={isDark ? "light" : "dark"} />
            <View style={styles.mainContainer}>
              <View style={styles.headerContainer}>
                <Image
                  source={require("@/assets/images/logo/resq-color.png")}
                  style={styles.logoImage}
                  resizeMode='cover'
                />
                <Text
                  style={[styles.title, { color: isDark ? "#fff" : "#000" }]}
                >
                  Welcome Back
                </Text>
                <Text
                  style={[styles.subtitle, { color: isDark ? "#ccc" : "#666" }]}
                >
                  Sign in to continue
                </Text>
              </View>

              <View style={styles.formContainer}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? "#34495E" : "#fff",
                      color: isDark ? "#fff" : "#000",
                      borderColor: isDark ? "#455d7a" : "#ddd",
                      opacity: isLoading ? 0.7 : 1,
                    },
                  ]}
                  placeholder='Email'
                  placeholderTextColor={isDark ? "#95a5a6" : "#999"}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType='email-address'
                  autoCapitalize='none'
                  editable={!isLoading}
                  autoComplete="email"
                />
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? "#34495E" : "#fff",
                      color: isDark ? "#fff" : "#000",
                      borderColor: isDark ? "#455d7a" : "#ddd",
                      opacity: isLoading ? 0.7 : 1,
                    },
                  ]}
                  placeholder='Password'
                  placeholderTextColor={isDark ? "#95a5a6" : "#999"}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  editable={!isLoading}
                  autoComplete="password"
                />

                <TouchableOpacity
                  style={styles.forgotPassword}
                  onPress={() => router.push("/(auth)/forgot-password")}
                  disabled={isLoading}
                >
                  <Text
                    style={[
                      styles.forgotPasswordText,
                      { color: isDark ? "#7f8c8d" : "#666" },
                      isLoading && { opacity: 0.7 },
                    ]}
                  >
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[
                    styles.button,
                    isLoading && { opacity: 0.7 }
                  ]}
                  onPress={handleLogin}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color="#fff" />
                      <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                        Signing In...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>Sign In</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.signupContainer}>
                  <Text
                    style={[
                      styles.signupText,
                      { color: isDark ? "#ccc" : "#666" },
                    ]}
                  >
                    Don't have an account?
                  </Text>
                  <TouchableOpacity
                    onPress={() => router.push("/(auth)/signup")}
                    disabled={isLoading}
                  >
                    <Text style={[styles.signupLink, isLoading && { opacity: 0.7 }]}>
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </ImageBackground>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgImg: {
    flex: 1,
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mainContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: "space-between",
  },
  headerContainer: {
    marginTop: 40,
    marginBottom: 20,
  },
  formContainer: {
    width: "100%",
    marginVertical: 20,
  },
  logoImage: {
    width: 230,
    height: 85,
    marginBottom: 20,
    alignSelf: "center",
  },
  title: {
    fontSize: 32,
    fontFamily: "TtNormsProMedium",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    fontFamily: "TtNormsProRegular",
    textAlign: "center",
    marginBottom: 10,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "TtNormsProRegular",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontFamily: "TtNormsProRegular",
  },
  buttonContainer: {
    width: "100%",
    marginTop: "auto",
    paddingTop: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    width: "100%",
    backgroundColor: "#007bff",
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: "#fff",
    fontFamily: "TtNormsProMedium",
    fontSize: 18,
    textAlign: "center",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  signupText: {
    fontSize: 16,
    fontFamily: "TtNormsProRegular",
    marginRight: 5,
  },
  signupLink: {
    fontSize: 16,
    fontFamily: "TtNormsProMedium",
    color: "#007bff",
  },
}); 