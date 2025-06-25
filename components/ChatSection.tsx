import { useCall } from "@/context/CallContext";
import React, { useEffect, useState } from "react";
import {
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface ChatMessage {
    id: string;
    from: string;
    message: string;
    timestamp: number;
}

interface ChatSectionProps {
    callId: string;
    userEmail: string;
    peerEmail: string;
    isChatOpen: boolean;
    onClose: () => void;
}

export default function ChatSection({
    callId,
    userEmail,
    peerEmail,
    isChatOpen,
    onClose,
}: ChatSectionProps) {
    const { ws } = useCall();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");

    useEffect(() => {
        if (!ws) return;

        const messageHandler = (event: MessageEvent) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "chat" && data.callId === callId) {
                    setMessages((prev) => [
                        ...prev,
                        {
                            id: `${data.timestamp}-${data.from}`,
                            from: data.from,
                            message: data.message,
                            timestamp: data.timestamp,
                        },
                    ]);
                }
            } catch (err) {
                console.error("Error handling chat message:", err);
            }
        };

        ws.addEventListener("message", messageHandler);
        return () => ws.removeEventListener("message", messageHandler);
    }, [ws, callId]);

    const sendMessage = () => {
        if (!ws || !newMessage.trim()) return;

        const messageData = {
            type: "chat",
            from: userEmail,
            to: peerEmail,
            message: newMessage,
            callId,
            timestamp: Date.now(),
        };

        ws.send(JSON.stringify(messageData));
        setMessages((prev) => [
            ...prev,
            {
                id: `${messageData.timestamp}-${userEmail}`,
                from: userEmail,
                message: newMessage,
                timestamp: messageData.timestamp,
            },
        ]);
        setNewMessage("");
    };

    if (!isChatOpen) return null;

    return (
        <View className="absolute bottom-20 left-0 right-0 h-2/3 bg-gray-900/90 rounded-t-3xl p-4">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white text-lg font-semibold">
                    Chat with {peerEmail}
                </Text>
                <TouchableOpacity onPress={onClose}>
                    <Text className="text-white text-lg font-bold">✕</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1 mb-4"
                contentContainerStyle={{ paddingBottom: 20 }}
            >
                {messages
                    .sort((a, b) => a.timestamp - b.timestamp)
                    .map((msg) => (
                        <View
                            key={msg.id}
                            className={`mb-2 p-3 rounded-lg max-w-[80%] ${
                                msg.from === userEmail
                                    ? "bg-blue-500 ml-auto"
                                    : "bg-gray-700"
                            }`}
                        >
                            <Text className="text-white">{msg.message}</Text>
                            <Text className="text-xs text-gray-300 mt-1">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                            </Text>
                        </View>
                    ))}
            </ScrollView>

            <View className="flex-row items-center">
                <TextInput
                    className="flex-1 bg-gray-800 text-white p-3 rounded-full mr-2"
                    placeholder="Type a message..."
                    placeholderTextColor="#94a3b8"
                    value={newMessage}
                    onChangeText={setNewMessage}
                />
                <TouchableOpacity
                    className="bg-blue-500 p-3 rounded-full"
                    onPress={sendMessage}
                    disabled={!newMessage.trim()}
                >
                    <Text className="text-white font-bold">Send</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
