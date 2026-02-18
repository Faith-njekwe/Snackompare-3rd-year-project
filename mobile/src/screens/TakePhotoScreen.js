import React, { useRef } from "react";
import {
  View,
  Animated,
  TouchableOpacity,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { palette, shadows } from "../theme";

export default function TakeMealPhotoEntryScreen({ navigation }) {
  const scalePhoto = useRef(new Animated.Value(1)).current;

  const animatePress = (scale, to) => {
    Animated.spring(scale, {
      toValue: to,
      useNativeDriver: true,
      friction: 6,
    }).start();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero / Header */}
        <View style={styles.hero}>
          <View style={styles.heroIconCircle}>
            <Ionicons name="camera" size={48} color="#f97316" />
          </View>
          <Text style={styles.title}>Meal Tracker</Text>
          <Text style={styles.subtitle}>
            Snap a photo of your meal and get an instant AI-powered calorie
            breakdown
          </Text>
        </View>

        {/* CTA Card */}
        <Animated.View
          style={[styles.ctaCard, { transform: [{ scale: scalePhoto }] }]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPressIn={() => animatePress(scalePhoto, 0.97)}
            onPressOut={() => animatePress(scalePhoto, 1)}
            onPress={() => navigation.navigate("MealPhotoCameraScreen")}
          >
            <View style={styles.ctaInner}>
              <View style={styles.decorOne} />
              <View style={styles.decorTwo} />
              <View style={styles.ctaContent}>
                <View style={styles.ctaLeft}>
                  <View style={styles.ctaIconCircle}>
                    <Ionicons name="camera" size={28} color="#ffffff" />
                  </View>
                  <View>
                    <Text style={styles.ctaTitle}>Take a Photo</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#ffffff" />
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* How It Works */}
        <View style={styles.howItWorks}>
          <Text style={styles.sectionTitle}>How it works</Text>
          <View style={styles.stepsRow}>
            <View style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: "#FFF7ED" }]}>
                <Ionicons name="camera-outline" size={22} color="#f97316" />
              </View>
              <Text style={styles.stepLabel}>Take a photo</Text>
            </View>
            <View style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: "#EDE9FE" }]}>
                <Ionicons name="sparkles" size={22} color="#8B5CF6" />
              </View>
              <Text style={styles.stepLabel}>AI analyzes{"\n"}your meal</Text>
            </View>
            <View style={styles.step}>
              <View style={[styles.stepIcon, { backgroundColor: "#FEF3C7" }]}>
                <Ionicons name="flame-outline" size={22} color="#F59E0B" />
              </View>
              <Text style={styles.stepLabel}>Get calorie{"\n"}estimate</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.surface,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  hero: {
    alignItems: "center",
    marginBottom: 24,
  },
  heroIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: palette.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: palette.muted,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  ctaCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    ...shadows.card,
  },
  ctaInner: {
    backgroundColor: "#f97316",
    padding: 24,
    paddingVertical: 28,
    position: "relative",
    overflow: "hidden",
  },
  ctaContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ctaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  ctaIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  ctaTitle: {
    paddingTop: 6,
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 4,
  },
  ctaDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.85)",
  },
  decorOne: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -40,
    right: -20,
  },
  decorTwo: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(0,0,0,0.06)",
    bottom: -30,
    left: -10,
  },
  howItWorks: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 20,
    ...shadows.card,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 16,
    textAlign: "center",
  },
  stepsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  step: {
    alignItems: "center",
    flex: 1,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.muted,
    textAlign: "center",
    lineHeight: 16,
  },
});
