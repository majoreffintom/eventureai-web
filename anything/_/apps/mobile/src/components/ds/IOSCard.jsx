import React from "react";
import { View } from "react-native";

export default function IOSCard({ children, style, ...props }) {
  return (
    <View
      style={[
        {
          borderRadius: 24,
          backgroundColor: "rgba(255,255,255,0.72)",
          borderWidth: 1,
          borderColor: "rgba(0,0,0,0.06)",
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}
