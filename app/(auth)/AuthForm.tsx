import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import {
    ActivityIndicator,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export default function AuthForm() {
    const { signIn } = useAuthActions();
    const [step, setStep] = useState<"signUp" | "signIn">("signIn");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [authError, setAuthError] = useState("");

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePassword = (password: string) => {
        return password.length >= 8;
    };

    const handleAuth = async () => {
        setEmailError("");
        setPasswordError("");
        setAuthError("");

        // Validate inputs
        let isValid = true;

        if (!validateEmail(email)) {
            setEmailError("Please enter a valid email address");
            isValid = false;
        }

        if (!validatePassword(password)) {
            setPasswordError("Password must be at least 8 characters long");
            isValid = false;
        }

        if (!isValid) return;

        setLoading(true);
        try {
            await signIn("password", { email, password, flow: step });
        } catch (error: any) {
            console.error("Auth error:", error);
            setAuthError("Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 justify-center items-center bg-white px-6">
            <View className="w-full max-w-md bg-pink-50 p-6 rounded-3xl shadow-lg">
                <Text className="text-2xl font-bold text-center text-pink-600 mb-6">
                    {step === "signIn" ? "Welcome Back 👋" : "Join Us 🎉"}
                </Text>

                <TextInput
                    placeholder="Email"
                    onChangeText={(text) => {
                        setEmail(text);
                        setEmailError("");
                        setAuthError("");
                    }}
                    value={email}
                    inputMode="email"
                    autoCapitalize="none"
                    className={`bg-white p-4 mb-4 rounded-full border ${
                        emailError ? "border-red-500" : "border-pink-200"
                    } shadow-sm text-black`}
                    placeholderTextColor="#94a3b8"
                />
                {emailError ? (
                    <Text className="text-red-500 text-sm mb-4">
                        {emailError}
                    </Text>
                ) : null}

                <TextInput
                    placeholder="Password"
                    onChangeText={(text) => {
                        setPassword(text);
                        setPasswordError("");
                        setAuthError("");
                    }}
                    value={password}
                    secureTextEntry
                    className={`bg-white p-4 mb-6 rounded-full border ${
                        passwordError ? "border-red-500" : "border-pink-200"
                    } shadow-sm text-black`}
                    placeholderTextColor="#94a3b8"
                />
                {passwordError ? (
                    <Text className="text-red-500 text-sm mb-4">
                        {passwordError}
                    </Text>
                ) : null}

                {authError ? (
                    <Text className="text-red-500 text-sm mb-4 text-center">
                        {authError}
                    </Text>
                ) : null}

                <TouchableOpacity
                    className={`${
                        loading ? "bg-pink-300" : "bg-pink-500"
                    } py-4 rounded-full mb-3 shadow-md flex-row justify-center items-center`}
                    onPress={handleAuth}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#ffffff" />
                    ) : (
                        <Text className="text-white text-center font-semibold text-lg">
                            {step === "signIn" ? "Sign In" : "Sign Up"}
                        </Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() =>
                        setStep(step === "signIn" ? "signUp" : "signIn")
                    }
                    disabled={loading}
                >
                    <Text className="text-center text-pink-500 underline font-medium my-2">
                        {step === "signIn"
                            ? "Don't have an account? Sign up"
                            : "Already have an account? Sign in"}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
