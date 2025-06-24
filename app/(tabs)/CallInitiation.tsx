import { useCall } from "@/context/CallContext";
import { useAuthToken } from "@convex-dev/auth/react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

const CallInitiation = () => {
    const { ws, userEmail } = useCall();
    const [recipientEmail, setRecipientEmail] = useState("");
    const router = useRouter();

    const handleInitiateCall = () => {
        if (!ws) {
            alert("ws not found");
            return;
        }
        if (!recipientEmail || !userEmail) {
            alert("Please enter recipient's email");
            return;
        }
        const callId = uuidv4();
        ws.send(
            JSON.stringify({
                type: "initiate_call",
                from: userEmail,
                to: recipientEmail,
                callId,
            })
        );
        router.push({
            pathname: "/(components)/Communication",
            params: { callId, peerEmail: recipientEmail },
        });
    };

    const token = useAuthToken();
    console.log("token : ", token);

    return (
        <View className="flex-1 bg-gray-900 p-4">
            <Text className="text-white text-2xl mb-4">Start a Call</Text>
            <Text className="my-4 text-lg text-white">{userEmail}</Text>
            <TextInput
                className="bg-gray-800 text-white p-3 rounded-lg mb-4"
                placeholder="Recipient's Email"
                placeholderTextColor="#9ca3af"
                value={recipientEmail}
                onChangeText={setRecipientEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TouchableOpacity
                className="bg-blue-500 p-3 rounded-lg items-center"
                onPress={handleInitiateCall}
            >
                <Text className="text-white text-lg font-bold">Call</Text>
            </TouchableOpacity>
        </View>
    );
};

export default CallInitiation;
