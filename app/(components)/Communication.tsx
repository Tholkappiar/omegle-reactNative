import React from "react";
import { Text, View } from "react-native";

const Communication = () => {
    return (
        <View className="flex-1 p-4 gap-2">
            <View className="flex-1 bg-red-400 rounded-lg">
                <Text>first</Text>
            </View>
            <View className="flex-1 bg-blue-400 rounded-lg">
                <Text>Second</Text>
            </View>
        </View>
    );
};

export default Communication;
