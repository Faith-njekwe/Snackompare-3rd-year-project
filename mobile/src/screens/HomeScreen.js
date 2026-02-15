import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "../theme";

export default function HomeScreen({ navigation }) {
  const scaleScan = useAnimatedScale();
  const scaleSearch = useAnimatedScale();
  const scaleFavourites = useAnimatedScale();


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <View style={{ width: 36 }} />
          <Text style={styles.title}>SnacKompare</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Settings")}>
            <Ionicons name="person-circle-outline" size={36} color={palette.text} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Make healthier food choices with AI-powered nutrition insights
        </Text>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Choose how to check your food</Text>
          <Text style={styles.sectionSubtitle}>
            Scan a barcode or search by name to see scores, alternatives, and plans.
            Save your favourites for quick access later!
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <Animated.View style={[styles.optionCard, { transform: [{ scale: scaleScan }] }]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPressIn={() => animatePress(scaleScan, 0.97)}
              onPressOut={() => animatePress(scaleScan, 1)}
              onPress={() => navigation.navigate("Scan")}
            >
              <View style={[styles.gradientCard, styles.scanCard]}>
                <View style={styles.decorOne} />
                <View style={styles.decorTwo} />
                <View style={[styles.iconContainer, styles.iconOverlay]}>
                  <Ionicons name="scan" size={40} color="#ffffff" />
                </View>
                <Text style={styles.optionTitle}>Scan Product</Text>
                <Text style={styles.optionDescription}>
                  Scan a barcode to instantly get nutrition info and health score.
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.optionCard, { transform: [{ scale: scaleSearch }] }]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPressIn={() => animatePress(scaleSearch, 0.97)}
              onPressOut={() => animatePress(scaleSearch, 1)}
              onPress={() => navigation.navigate("SearchProducts")}
            >
              <View style={[styles.gradientCard, styles.searchCard]}>
                <View style={styles.decorOne} />
                <View style={styles.decorTwo} />
                <View style={[styles.iconContainer, styles.iconOverlay]}>
                  <Ionicons name="search" size={40} color="#ffffff" />
                </View>
                <Text style={styles.optionTitle}>Search Products</Text>
                <Text style={styles.optionDescription}>
                  Search our database to see scores, alternatives, and plans.
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={[styles.optionCard, { transform: [{ scale: scaleFavourites }] }]}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPressIn={() => animatePress(scaleFavourites, 0.97)}
              onPressOut={() => animatePress(scaleFavourites, 1)}
              onPress={() => navigation.navigate("Favourites")}
            >
              <View style={[styles.gradientCard, styles.favouritesCard]}>
                <View style={styles.decorOne} />
                <View style={styles.decorTwo} />
                <View style={[styles.iconContainer, styles.iconOverlay]}>
                   <Ionicons name="heart" size={40} color="#ffffff" />
                </View>
                <Text style={styles.optionTitle}>Favourites</Text>
                <Text style={styles.optionDescription}>
                  View and manage your favourite products.
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Ionicons name="nutrition" size={24} color={palette.accent} />
            <Text style={styles.statNumber}>2M+</Text>
            <Text style={styles.statLabel}>Products</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="heart" size={24} color={palette.danger} />
            <Text style={styles.statNumber}>100%</Text>
            <Text style={styles.statLabel}>Accurate</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="flash" size={24} color={palette.warning} />
            <Text style={styles.statNumber}>Instant</Text>
            <Text style={styles.statLabel}>Results</Text>
          </View>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function useAnimatedScale() {
  const scale = React.useRef(new Animated.Value(1)).current;
  return scale;
}

function animatePress(scale, toValue) {
  Animated.spring(scale, {
    toValue,
    useNativeDriver: true,
    speed: 20,
    bounciness: 6,
  }).start();
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 6,
  },
  title: { fontSize: 32, fontWeight: "800", color: palette.text },
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
    borderRadius: 16,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
  },
  gradientCard: {
    padding: 12,
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    position: "relative",
    textAlign: "center",
  },
  scanCard: { backgroundColor: "#4f8ef7", borderColor: "#4f8ef7", borderWidth: 1 },
  searchCard: { backgroundColor: "#13b981", borderColor: "#059669", borderWidth: 1 },
  favouritesCard: { backgroundColor: "#ef4444", borderColor: "#dc2626", borderWidth: 1 },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0, 0, 0, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  scanIconBg: { backgroundColor: "rgba(255,255,255,0.18)" },
  searchIconBg: { backgroundColor: "rgba(255,255,255,0.18)" },
  favouritesIconBg: { backgroundColor: "rgba(255,255,255,0.18)" },
  optionTitle: {
    fontSize: 16,
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
  scrollContent: {
  paddingBottom: 30,
  },
});
