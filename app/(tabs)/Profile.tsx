import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import React from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

const Profile = () => {
    const user = useQuery(api.user.getProfile);
    const { signOut } = useAuthActions();

    const handleSignOut = async () => {
        await signOut();
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getUserInitials = (email: string) => {
        if (!email) return "@";
        return email
            .split("@")[0]
            .split(".")
            .map((name) => name.charAt(0).toUpperCase())
            .join("")
            .slice(0, 2);
    };

    if (!user) {
        return (
            <View className="flex-1 justify-center items-center bg-gray-50">
                <View className="bg-white p-6 rounded-xl shadow-sm">
                    <Text className="text-gray-600 text-lg">
                        Loading profile...
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <ScrollView className="flex-1 bg-gray-50">
            <View className="pt-12 pb-6">
                {/* Header */}
                <View className="items-center mb-8">
                    <Text className="text-3xl font-bold text-gray-800 mb-2">
                        Profile
                    </Text>
                </View>

                {/* Profile Card */}
                <View className="mx-6 mb-6">
                    <View className="bg-white rounded-2xl shadow-sm p-6">
                        {/* Avatar Section */}
                        <View className="items-center mb-6">
                            <View className="w-20 h-20 bg-blue-500 rounded-full items-center justify-center mb-3">
                                <Text className="text-white text-2xl font-bold">
                                    {getUserInitials(
                                        user.email ? user.email : ""
                                    )}
                                </Text>
                            </View>
                            <Text className="text-xl font-semibold text-gray-800">
                                Welcome back!
                            </Text>
                        </View>

                        {/* User Information */}
                        <View className="space-y-4">
                            <View className="border-b border-gray-100 pb-4">
                                <Text className="text-sm font-medium text-gray-500 mb-1">
                                    Email Address
                                </Text>
                                <Text className="text-lg text-gray-800">
                                    {user.email}
                                </Text>
                            </View>

                            <View className="border-b border-gray-100 pb-4">
                                <Text className="text-sm font-medium text-gray-500 mb-1">
                                    User ID
                                </Text>
                                <Text className="text-sm text-gray-600 font-mono">
                                    {user._id}
                                </Text>
                            </View>

                            <View className="pb-2">
                                <Text className="text-sm font-medium text-gray-500 mb-1">
                                    Member Since
                                </Text>
                                <Text className="text-base text-gray-800">
                                    {formatDate(user._creationTime)}
                                </Text>
                            </View>
                        </View>
                    </View>
                    <Pressable
                        className="bg-red-500 rounded-xl p-2 mt-6 shadow-sm w-32 mx-auto"
                        onPress={handleSignOut}
                    >
                        <Text className="text-white font-bold text-center text-lg">
                            Sign Out
                        </Text>
                    </Pressable>
                </View>
            </View>
        </ScrollView>
    );
};

export default Profile;
