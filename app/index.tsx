import { View } from "react-native";
import CallInitiation from "./(tabs)/CallInitiation";

export default function Index() {
    return (
        <View className="flex-1">
            {/* <JoinRoom /> */}
            <CallInitiation />
        </View>
    );
}
