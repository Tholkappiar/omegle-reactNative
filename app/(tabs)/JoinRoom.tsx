// import { useRouter } from "expo-router";
// import React, { useState } from "react";
// import { Text, TextInput, TouchableOpacity, View } from "react-native";

// const JoinRoom = () => {
//     const [remoteEmail, setRemoteEmail] = useState<string>("");

//     const router = useRouter();
//     const handleJoin = () => {
//         router.push({
//             pathname: "/(components)/[remoteUserEmail]",
//             params: { remoteUserEmail: remoteEmail },
//         });
//     };

//     return (
//         <View className="flex-1 bg-slate-50 justify-center items-center px-8">
//             {/* Header Section */}
//             <View className="mb-12 items-center">
//                 <Text className="text-4xl font-bold text-slate-800 mb-3">
//                     Join Room
//                 </Text>
//                 <Text className="text-lg text-slate-500 text-center leading-6">
//                     Enter a room code to connect with others
//                 </Text>
//             </View>

//             {/* Input Card */}
//             <View className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 mb-8">
//                 <Text className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wide">
//                     Room Code
//                 </Text>
//                 <TextInput
//                     placeholder="rmeote id"
//                     placeholderTextColor="#94a3b8"
//                     onChange={(event) => setRemoteEmail(event.nativeEvent.text)}
//                     value={remoteEmail}
//                     className="w-full h-14 bg-slate-50 rounded-xl px-4 text-lg text-slate-800 border border-slate-200 focus:border-blue-500"
//                     autoCapitalize="none"
//                     autoCorrect={false}
//                 />
//             </View>

//             {/* Join Button */}
//             <TouchableOpacity
//                 onPress={handleJoin}
//                 className={
//                     "w-full max-w-sm h-14 rounded-xl items-center justify-center shadow-lg bg-blue-500"
//                 }
//             >
//                 <Text className={"text-lg font-semibold text-white"}>
//                     Join Room
//                 </Text>
//             </TouchableOpacity>

//             {/* Footer */}
//             <View className="mt-16 items-center">
//                 <Text className="text-sm text-slate-400">
//                     Make sure you have the correct room code
//                 </Text>
//             </View>
//         </View>
//     );
// };

// export default JoinRoom;
