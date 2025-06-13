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

    const handleAuth = async () => {
        setLoading(true);
        try {
            await signIn("password", { email, password, flow: step });
        } catch (error) {
            console.error("Auth error:", error);
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
                    onChangeText={setEmail}
                    value={email}
                    inputMode="email"
                    autoCapitalize="none"
                    className="bg-white p-4 mb-4 rounded-full border border-pink-200 shadow-sm"
                    placeholderTextColor="#94a3b8"
                />

                <TextInput
                    placeholder="Password"
                    onChangeText={setPassword}
                    value={password}
                    secureTextEntry
                    className="bg-white p-4 mb-6 rounded-full border border-pink-200 shadow-sm"
                    placeholderTextColor="#94a3b8"
                />

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
