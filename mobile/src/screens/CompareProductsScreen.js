import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { palette, shadows } from "../theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CompareProductsScreen({ route, navigation }) {
  const { products } = route.params;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnims = useRef(products.map(() => new Animated.Value(50))).current;
  const rowAnims = useRef([...Array(8)].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Staggered animations for product cards
    Animated.stagger(100, [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      ...slideAnims.map((anim) =>
        Animated.spring(anim, {
          toValue: 0,
          useNativeDriver: true,
          damping: 15,
        })
      ),
    ]).start();

    // Staggered row animations
    setTimeout(() => {
      Animated.stagger(50,
        rowAnims.map((anim) =>
          Animated.spring(anim, {
            toValue: 1,
            useNativeDriver: true,
            damping: 12,
          })
        )
      ).start();
    }, 300);
  }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return palette.success;
    if (score >= 60) return palette.warning;
    return palette.danger;
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Fair";
    return "Poor";
  };

  // Find best and worst for each nutrient
  const getNutrientComparison = (key, lowerIsBetter = true) => {
    const values = products.map((p) => {
      const val = p.nutriments?.[key];
      return typeof val === "number" ? val : parseFloat(val) || 0;
    });

    const validValues = values.filter((v) => v > 0);
    if (validValues.length < 2) return { best: -1, worst: -1 };

    let bestIdx, worstIdx;
    if (lowerIsBetter) {
      bestIdx = values.indexOf(Math.min(...values));
      worstIdx = values.indexOf(Math.max(...values));
    } else {
      bestIdx = values.indexOf(Math.max(...values));
      worstIdx = values.indexOf(Math.min(...values));
    }

    // Only mark if there's a meaningful difference
    const diff = Math.abs(values[bestIdx] - values[worstIdx]);
    if (diff < 0.1) return { best: -1, worst: -1 };

    return { best: bestIdx, worst: worstIdx };
  };

  const renderNutrientRow = (label, key, unit, lowerIsBetter = true, icon, rowIndex) => {
    const { best, worst } = getNutrientComparison(key, lowerIsBetter);

    return (
      <Animated.View
        key={key}
        style={[
          styles.nutrientRow,
          {
            opacity: rowAnims[rowIndex],
            transform: [
              {
                translateX: rowAnims[rowIndex].interpolate({
                  inputRange: [0, 1],
                  outputRange: [-30, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.nutrientLabel}>
          <Ionicons name={icon} size={18} color={palette.accent} />
          <Text style={styles.nutrientLabelText}>{label}</Text>
        </View>
        <View style={styles.nutrientValues}>
          {products.map((product, index) => {
            const value = product.nutriments?.[key] || 0;
            const isBest = index === best;
            const isWorst = index === worst;

            return (
              <View
                key={product.id}
                style={[
                  styles.nutrientValue,
                  isBest && styles.nutrientValueBest,
                  isWorst && styles.nutrientValueWorst,
                ]}
              >
                <Text
                  style={[
                    styles.nutrientValueText,
                    isBest && styles.nutrientValueTextBest,
                    isWorst && styles.nutrientValueTextWorst,
                  ]}
                >
                  {typeof value === "number" ? value.toFixed(1) : "0"}
                </Text>
                <Text
                  style={[
                    styles.nutrientUnit,
                    isBest && styles.nutrientValueTextBest,
                    isWorst && styles.nutrientValueTextWorst,
                  ]}
                >
                  {unit}
                </Text>
                {isBest && (
                  <View style={styles.bestBadge}>
                    <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                  </View>
                )}
                {isWorst && (
                  <View style={styles.worstBadge}>
                    <Ionicons name="close" size={10} color="#FFFFFF" />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </Animated.View>
    );
  };

  // Find the winner (highest score)
  const winner = products.reduce((best, current) =>
    current.score > best.score ? current : best
  );

  // Count wins for each product
  const nutrientKeys = [
    { key: "energy", lower: true },
    { key: "fat", lower: true },
    { key: "saturatedFat", lower: true },
    { key: "carbs", lower: true },
    { key: "sugar", lower: true },
    { key: "protein", lower: false },
    { key: "fiber", lower: false },
    { key: "salt", lower: true },
  ];

  const wins = products.map(() => 0);
  nutrientKeys.forEach(({ key, lower }) => {
    const { best } = getNutrientComparison(key, lower);
    if (best >= 0) wins[best]++;
  });

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header Cards */}
        <View style={styles.productsHeader}>
          {products.map((product, index) => (
            <Animated.View
              key={product.id}
              style={[
                styles.productCard,
                product.id === winner.id && styles.productCardWinner,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnims[index] }],
                },
              ]}
            >
              {product.id === winner.id && (
                <View style={styles.winnerBadge}>
                  <Ionicons name="trophy" size={12} color="#FFFFFF" />
                  <Text style={styles.winnerText}>Best</Text>
                </View>
              )}

              {product.image ? (
                <Image
                  source={product.image}
                  style={styles.productImage}
                  contentFit="contain"
                  transition={200}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="nutrition-outline" size={32} color={palette.muted} />
                </View>
              )}

              <Text style={styles.productName} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={styles.productBrand} numberOfLines={1}>
                {product.brand || "Unknown"}
              </Text>

              <View
                style={[
                  styles.scoreBadge,
                  { backgroundColor: getScoreColor(product.score) },
                ]}
              >
                <Text style={styles.scoreText}>{product.score}</Text>
              </View>
              <Text style={styles.scoreLabel}>{getScoreLabel(product.score)}</Text>

              {/* Win count */}
              <View style={styles.winsContainer}>
                <Ionicons name="ribbon" size={14} color={palette.accent} />
                <Text style={styles.winsText}>{wins[index]} wins</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Legend */}
        <Animated.View style={[styles.legend, { opacity: fadeAnim }]}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: palette.success }]} />
            <Text style={styles.legendText}>Better value</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: palette.danger }]} />
            <Text style={styles.legendText}>Worse value</Text>
          </View>
        </Animated.View>

        {/* Nutrition Comparison */}
        <View style={styles.comparisonSection}>
          <Animated.Text style={[styles.sectionTitle, { opacity: fadeAnim }]}>
            Nutrition Comparison
          </Animated.Text>
          <Animated.Text style={[styles.sectionSubtitle, { opacity: fadeAnim }]}>
            Per 100g/ml • Green = better, Red = worse
          </Animated.Text>

          <View style={styles.comparisonCard}>
            {renderNutrientRow("Calories", "energy", "kcal", true, "flame-outline", 0)}
            {renderNutrientRow("Fat", "fat", "g", true, "water-outline", 1)}
            {renderNutrientRow("Sat. Fat", "saturatedFat", "g", true, "ellipse-outline", 2)}
            {renderNutrientRow("Carbs", "carbs", "g", true, "cube-outline", 3)}
            {renderNutrientRow("Sugar", "sugar", "g", true, "cafe-outline", 4)}
            {renderNutrientRow("Protein", "protein", "g", false, "barbell-outline", 5)}
            {renderNutrientRow("Fiber", "fiber", "g", false, "leaf-outline", 6)}
            {renderNutrientRow("Salt", "salt", "g", true, "snow-outline", 7)}
          </View>
        </View>

        {/* Summary */}
        <Animated.View style={[styles.summarySection, { opacity: fadeAnim }]}>
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIcon, { backgroundColor: getScoreColor(winner.score) + "20" }]}>
              <Ionicons name="trophy" size={28} color={getScoreColor(winner.score)} />
            </View>
            <View style={styles.summaryContent}>
              <Text style={styles.summaryTitle}>Our Recommendation</Text>
              <Text style={styles.summaryText}>
                <Text style={[styles.summaryHighlight, { color: getScoreColor(winner.score) }]}>
                  {winner.name}
                </Text>
                {" "}is the healthier choice with a score of{" "}
                <Text style={styles.summaryHighlight}>{winner.score}</Text> and{" "}
                <Text style={styles.summaryHighlight}>{wins[products.indexOf(winner)]} nutrient wins</Text>.
              </Text>
            </View>
          </View>
        </Animated.View>
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
    padding: 16,
    paddingBottom: 40,
  },
  productsHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  productCard: {
    flex: 1,
    backgroundColor: palette.card,
    borderRadius: 20,
    padding: 14,
    alignItems: "center",
    ...shadows.card,
  },
  productCardWinner: {
    borderWidth: 2,
    borderColor: palette.accent,
    backgroundColor: "rgba(16, 185, 129, 0.03)",
  },
  winnerBadge: {
    position: "absolute",
    top: -12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
    ...shadows.card,
  },
  winnerText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 10,
    backgroundColor: palette.surface,
  },
  placeholderImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 10,
    backgroundColor: palette.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  productName: {
    fontSize: 13,
    fontWeight: "600",
    color: palette.text,
    textAlign: "center",
    marginBottom: 2,
    lineHeight: 17,
    height: 34,
  },
  productBrand: {
    fontSize: 11,
    color: palette.muted,
    textAlign: "center",
    marginBottom: 10,
  },
  scoreBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scoreLabel: {
    fontSize: 11,
    color: palette.muted,
    fontWeight: "500",
  },
  winsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
    backgroundColor: palette.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  winsText: {
    fontSize: 11,
    fontWeight: "600",
    color: palette.accent,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    color: palette.muted,
    fontWeight: "500",
  },
  comparisonSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: palette.muted,
    marginBottom: 14,
  },
  comparisonCard: {
    backgroundColor: palette.card,
    borderRadius: 20,
    overflow: "hidden",
    ...shadows.card,
  },
  nutrientRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  nutrientLabel: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  nutrientLabelText: {
    fontSize: 14,
    color: palette.text,
    fontWeight: "600",
  },
  nutrientValues: {
    flexDirection: "row",
    gap: 8,
  },
  nutrientValue: {
    minWidth: 72,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: palette.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    position: "relative",
  },
  nutrientValueBest: {
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: palette.success,
  },
  nutrientValueWorst: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: palette.danger,
  },
  nutrientValueText: {
    fontSize: 14,
    fontWeight: "700",
    color: palette.text,
  },
  nutrientValueTextBest: {
    color: palette.success,
  },
  nutrientValueTextWorst: {
    color: palette.danger,
  },
  nutrientUnit: {
    fontSize: 11,
    fontWeight: "500",
    color: palette.muted,
  },
  bestBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.success,
    justifyContent: "center",
    alignItems: "center",
  },
  worstBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: palette.danger,
    justifyContent: "center",
    alignItems: "center",
  },
  summarySection: {
    marginTop: 4,
  },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: palette.card,
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    gap: 16,
    ...shadows.card,
  },
  summaryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 14,
    color: palette.muted,
    lineHeight: 20,
  },
  summaryHighlight: {
    color: palette.accent,
    fontWeight: "700",
  },
});
