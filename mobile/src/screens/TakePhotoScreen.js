import React, { useRef } from "react";
import { View, Animated, TouchableOpacity, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "../theme";

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
      <View style={styles.centerPage}>
        <Animated.View
          style={[styles.optionCard, { transform: [{ scale: scalePhoto }] }]}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPressIn={() => animatePress(scalePhoto, 0.97)}
            onPressOut={() => animatePress(scalePhoto, 1)}
            onPress={() => navigation.navigate("MealPhotoCameraScreen")}
          >
            <View style={[styles.gradientCard, styles.photoCard]}>
              <View style={styles.decorOne} />
              <View style={styles.decorTwo} />
              <View style={styles.iconContainer}>
                <Ionicons name="camera" size={40} color="#ffffff" />
              </View>

              <Text style={styles.optionTitle}>Take Picture</Text>
              <Text style={styles.optionDescription}>
                Take a picture to get a full AI-powered calorie estimation!
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
    alignItems: "center",
  },
  title: { fontSize: 32, fontWeight: "800", color: palette.text, marginBottom: 6, textAlign: "center" },
  subtitle: {
    fontSize: 15,
    color: palette.muted,
    marginBottom: 18,
    lineHeight: 22,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  sectionHeader: {
    marginBottom: 10,
    gap: 4,
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.text,
    textAlign: "center",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: palette.muted,
    lineHeight: 20,
    textAlign: "center",
    paddingHorizontal: 12,
  },
  optionsContainer: {
    gap: 14,
    marginBottom: 8,
    width: "100%",
  },
  optionCard: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  gradientCard: {
    padding: 16,
    minHeight: 135,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    position: "relative",
    textAlign: "center",
  },
  scanCard: { backgroundColor: "#4f8ef7", borderColor: "#4f8ef7", borderWidth: 1 },
  searchCard: { backgroundColor: "#13b981", borderColor: "#059669", borderWidth: 1 },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(0, 0, 0, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  scanIconBg: { backgroundColor: "rgba(255,255,255,0.18)" },
  searchIconBg: { backgroundColor: "rgba(255,255,255,0.18)" },
  optionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 4,
    textAlign: "center",
  },
  optionDescription: {
    fontSize: 13,
    color: palette.text,
    lineHeight: 18,
    textAlign: "center",
  },
  decorOne: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.08)",
    top: -50,
    right: -20,
  },
  decorTwo: {
    position: "absolute",
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(0,0,0,0.06)",
    bottom: -30,
    left: -10,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    width: "100%",
  },
  statBox: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    color: palette.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: palette.muted,
    marginTop: 4,
  },
  centerPage: {
  flex: 1,
  backgroundColor: palette.bg,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 16,
  },
  photoCard: { backgroundColor: "#f97316", borderColor: "#f97316", borderWidth: 1 },
});

