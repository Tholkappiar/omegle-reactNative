import { DoorOpen } from "@/lib/icons/DoorOpen";
import { User } from "@/lib/icons/User";
import { Tabs } from "expo-router";
import React from "react";

const _layout = () => {
    return (
        <Tabs screenOptions={{ headerShown: false }}>
            <Tabs.Screen
                name="JoinRoom"
                options={{
                    title: "Join Room",
                    tabBarIcon: () => <DoorOpen />,
                }}
            />
            <Tabs.Screen
                name="Profile"
                options={{
                    title: "Profile",
                    tabBarIcon: () => <User />,
                }}
            />
        </Tabs>
    );
};

export default _layout;
