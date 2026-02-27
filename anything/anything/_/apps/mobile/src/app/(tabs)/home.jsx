import { View } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Page, Text, Button, Heading } from "@/components/ds.jsx";
import { useTheme } from "@/utils/theme";

const TESTIMONIALS = [
  {
    quote:
      "Goldey's Heating & Cooling handles all HVAC concerns with our rental properties. They are accessible, knowledgeable, prompt and professional.",
    name: "Elizabeth Rogers Davis",
  },
  {
    quote:
      "Goldey's understands that our rentals are investment properties and for our owners we try to keep costs down, but still provide quality service.",
    name: "Joan Russell",
  },
  {
    quote:
      "Goldey's makes it a point to address every issue in a timely manner with top of the line customer service and honest feedback.",
    name: "Paul Foster",
  },
  {
    quote:
      "Goldey's is hands down remarkable to work with. Professional, easy to work with, and a stress-free install process.",
    name: "Amanda & Brandon Quire",
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { tokens } = useTheme();

  const heroImageUrl = "{asset:1b4987e2-cd9f-46e0-8508-7a1e9b024ee6}";

  return (
    <Page>
      {/* Title */}
      <View style={{ marginTop: 2 }}>
        <Heading level={1}>
          Two Decades of Quality Customer Service You can Trust
        </Heading>
      </View>

      {/* Hero */}
      <View
        style={{
          marginTop: 14,
          borderRadius: 18,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: tokens.border.default,
          backgroundColor: tokens.surface.primary,
        }}
      >
        <Image
          source={{ uri: heroImageUrl }}
          style={{ width: "100%", height: 190 }}
          contentFit="cover"
          transition={150}
        />

        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.25)",
          }}
        />

        <View
          style={{
            position: "absolute",
            left: 14,
            right: 14,
            bottom: 14,
          }}
        >
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button onPress={() => router.push("/(tabs)/schedule")}>
                Schedule
              </Button>
            </View>
            <View style={{ flex: 1 }}>
              <Button
                variant="secondary"
                onPress={() => router.push("/(tabs)/account")}
              >
                My Account
              </Button>
            </View>
          </View>
        </View>
      </View>

      {/* Reviews */}
      <View style={{ marginTop: 18 }}>
        <Heading level={2}>Reviews</Heading>

        <View style={{ marginTop: 12, gap: 12 }}>
          {TESTIMONIALS.map((t) => (
            <View
              key={t.name}
              style={{
                borderRadius: 18,
                borderWidth: 1,
                borderColor: tokens.border.default,
                backgroundColor: tokens.surface.primary,
                padding: 16,
              }}
            >
              <Text tone="secondary">“{t.quote}”</Text>
              <Text tone="tertiary" size="sm" style={{ marginTop: 10 }}>
                — {t.name}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Page>
  );
}
