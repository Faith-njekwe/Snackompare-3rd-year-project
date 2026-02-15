import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Vibration,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { palette, shadows } from "../theme";
import { addFavorite, isFavorite } from "../services/storage";
import { findHealthierAlternatives } from "../services/openFoodFacts";

export default function ProductDetailModal({ visible, product, onClose }) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [alternatives, setAlternatives] = useState([]);
  const [loadingAlternatives, setLoadingAlternatives] = useState(false);
  const [selectedAlternative, setSelectedAlternative] = useState(null);
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 15,
      }).start();
    } else {
      slideAnim.setValue(0);
    }
  }, [visible]);

  useEffect(() => {
    if (product) {
      checkFavoriteStatus();
      loadAlternatives();
    }
  }, [product]);

  const checkFavoriteStatus = async () => {
    if (!product) return;
    const status = await isFavorite(product.id);
    setIsFavorited(status);
  };

  const loadAlternatives = async () => {
    if (!product || product.score >= 85) {
      setAlternatives([]);
      return;
    }

    setLoadingAlternatives(true);
    try {
      const results = await findHealthierAlternatives(
        product.category,
        product.score,
        product.id
      );
      setAlternatives(results);
    } catch (error) {
      console.error("Error loading alternatives:", error);
      setAlternatives([]);
    } finally {
      setLoadingAlternatives(false);
    }
  };

  const handleAddToFavorites = async () => {
    if (!product) return;
    const success = await addFavorite(product);
    if (success) {
      setIsFavorited(true);
      Vibration.vibrate(50);
    }
  };

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setAlternatives([]);
      setSelectedAlternative(null);
      onClose();
    });
  };

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

  // Show alternative product details
  if (selectedAlternative) {
    return (
      <Modal
        visible={visible}
        animationType="none"
        transparent={true}
        onRequestClose={() => setSelectedAlternative(null)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedAlternative(null)}
            >
              <Ionicons name="arrow-back" size={24} color={palette.text} />
            </TouchableOpacity>

            <ScrollView showsVerticalScrollIndicator={false}>
              {(selectedAlternative.imageFull || selectedAlternative.image) && (
                <Image
                  source={selectedAlternative.imageFull || selectedAlternative.image}
                  style={styles.modalImage}
                  contentFit="contain"
                  transition={200}
                />
              )}

              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedAlternative.name}</Text>
                <Text style={styles.modalBrand}>{selectedAlternative.brand || "Unknown brand"}</Text>
              </View>

              <View style={styles.scoreSection}>
                <View
                  style={[
                    styles.modalScoreBadge,
                    { backgroundColor: getScoreColor(selectedAlternative.score) },
                  ]}
                >
                  <Text style={styles.modalScoreText}>{selectedAlternative.score}</Text>
                </View>
                <View style={styles.scoreInfo}>
                  <Text style={styles.scoreLabel}>
                    {getScoreLabel(selectedAlternative.score)} Choice
                  </Text>
                  <Text style={styles.scoreImprovement}>
                    +{selectedAlternative.score - product.score} points better
                  </Text>
                </View>
              </View>

              <View style={styles.nutrimentSection}>
                <Text style={styles.sectionTitle}>Nutrition Facts</Text>
                <Text style={styles.sectionSubtitle}>Per 100g/ml</Text>

                <View style={styles.nutrimentGrid}>
                  <NutrimentRow label="Calories" value={selectedAlternative.nutriments?.energy} unit="kcal" icon="flame-outline" />
                  <NutrimentRow label="Fat" value={selectedAlternative.nutriments?.fat} unit="g" icon="water-outline" />
                  <NutrimentRow label="Carbs" value={selectedAlternative.nutriments?.carbs} unit="g" icon="cube-outline" />
                  <NutrimentRow label="Protein" value={selectedAlternative.nutriments?.protein} unit="g" icon="barbell-outline" />
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  }

  if (!product) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [600, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.modalHandle} />
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={palette.text} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false}>
            {(product.imageFull || product.image) && (
              <Image
                source={product.imageFull || product.image}
                style={styles.modalImage}
                contentFit="contain"
                transition={200}
              />
            )}

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{product.name}</Text>
              <Text style={styles.modalBrand}>{product.brand || "Unknown brand"}</Text>
              {product.category && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{product.category}</Text>
                </View>
              )}
            </View>

            <View style={styles.scoreSection}>
              <View
                style={[
                  styles.modalScoreBadge,
                  { backgroundColor: getScoreColor(product.score) },
                ]}
              >
                <Text style={styles.modalScoreText}>{product.score}</Text>
              </View>
              <View style={styles.scoreInfo}>
                <Text style={styles.scoreLabel}>{getScoreLabel(product.score)} Choice</Text>
                <Text style={styles.scoreDescription}>Health Score</Text>
              </View>
            </View>

            <View style={styles.nutrimentSection}>
              <Text style={styles.sectionTitle}>Nutrition Facts</Text>
              <Text style={styles.sectionSubtitle}>Per 100g/ml</Text>

              <View style={styles.nutrimentGrid}>
                <NutrimentRow label="Calories" value={product.nutriments?.energy} unit="kcal" icon="flame-outline" />
                <NutrimentRow label="Fat" value={product.nutriments?.fat} unit="g" icon="water-outline" />
                <NutrimentRow label="Saturated" value={product.nutriments?.saturatedFat} unit="g" icon="ellipse-outline" indent />
                <NutrimentRow label="Carbs" value={product.nutriments?.carbs} unit="g" icon="cube-outline" />
                <NutrimentRow label="Sugar" value={product.nutriments?.sugar} unit="g" icon="cafe-outline" indent />
                <NutrimentRow label="Protein" value={product.nutriments?.protein} unit="g" icon="barbell-outline" />
                <NutrimentRow label="Fiber" value={product.nutriments?.fiber} unit="g" icon="leaf-outline" />
                <NutrimentRow label="Salt" value={product.nutriments?.salt} unit="g" icon="snow-outline" />
              </View>
            </View>

            {product.allergens && product.allergens.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Allergens</Text>
                <View style={styles.allergenContainer}>
                  {product.allergens.map((a, i) => (
                    <View key={i} style={styles.allergenBadge}>
                      <Ionicons name="warning-outline" size={14} color={palette.warning} />
                      <Text style={styles.allergenText}>{a.replace("en:", "")}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Healthier Alternatives Section */}
            {product.score < 85 && (
              <View style={styles.alternativesSection}>
                <View style={styles.alternativesHeader}>
                  <Ionicons name="leaf" size={20} color={palette.success} />
                  <Text style={styles.alternativesTitle}>Healthier Alternatives</Text>
                </View>

                {loadingAlternatives ? (
                  <View style={styles.alternativesLoading}>
                    <ActivityIndicator size="small" color={palette.accent} />
                    <Text style={styles.alternativesLoadingText}>Finding alternatives...</Text>
                  </View>
                ) : alternatives.length > 0 ? (
                  <View style={styles.alternativesList}>
                    {alternatives.map((alt) => (
                      <TouchableOpacity
                        key={alt.id}
                        style={styles.alternativeCard}
                        onPress={() => setSelectedAlternative(alt)}
                        activeOpacity={0.7}
                      >
                        {alt.image ? (
                          <Image source={alt.image} style={styles.alternativeImage} />
                        ) : (
                          <View style={styles.alternativePlaceholder}>
                            <Ionicons name="nutrition-outline" size={20} color={palette.muted} />
                          </View>
                        )}
                        <View style={styles.alternativeInfo}>
                          <Text style={styles.alternativeName} numberOfLines={1}>
                            {alt.name}
                          </Text>
                          <Text style={styles.alternativeBrand} numberOfLines={1}>
                            {alt.brand || "Unknown"}
                          </Text>
                        </View>
                        <View style={styles.alternativeScoreContainer}>
                          <View
                            style={[
                              styles.alternativeScore,
                              { backgroundColor: getScoreColor(alt.score) },
                            ]}
                          >
                            <Text style={styles.alternativeScoreText}>{alt.score}</Text>
                          </View>
                          <Text style={styles.alternativeImprovement}>
                            +{alt.score - product.score}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={palette.muted} />
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <View style={styles.noAlternatives}>
                    <Text style={styles.noAlternativesText}>
                      No better alternatives found in this category
                    </Text>
                  </View>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.addButton,
                isFavorited && styles.addButtonDisabled,
              ]}
              onPress={handleAddToFavorites}
              disabled={isFavorited}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isFavorited ? "heart" : "heart-outline"}
                size={22}
                color="#FFFFFF"
              />
              <Text style={styles.addButtonText}>
                {isFavorited ? "Added to Favourites" : "Add to Favourites"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function NutrimentRow({ label, value, unit, icon, indent }) {
  const formatVal = (v) => {
    const num = Number(v);
    if (Number.isFinite(num)) return `${num.toFixed(1)} ${unit}`;
    return "N/A";
  };

  return (
    <View style={[styles.nutrimentRow, indent && styles.nutrimentRowIndent]}>
      <View style={styles.nutrimentLeft}>
        <Ionicons name={icon} size={16} color={indent ? palette.muted : palette.accent} />
        <Text style={[styles.nutrimentLabel, indent && styles.nutrimentLabelIndent]}>{label}</Text>
      </View>
      <Text style={styles.nutrimentValue}>{formatVal(value)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: palette.bg,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "90%",
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: palette.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    backgroundColor: palette.surface,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    marginBottom: 20,
    backgroundColor: palette.surface,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: palette.text,
    marginBottom: 4,
  },
  modalBrand: {
    fontSize: 16,
    color: palette.muted,
    marginBottom: 10,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: palette.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 13,
    color: palette.accent,
    fontWeight: "600",
  },
  scoreSection: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    gap: 16,
  },
  modalScoreBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  modalScoreText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.text,
  },
  scoreDescription: {
    fontSize: 14,
    color: palette.muted,
    marginTop: 2,
  },
  scoreImprovement: {
    fontSize: 14,
    color: palette.success,
    fontWeight: "600",
    marginTop: 2,
  },
  nutrimentSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: palette.muted,
    marginBottom: 12,
  },
  nutrimentGrid: {
    backgroundColor: palette.card,
    borderRadius: 16,
    padding: 4,
    ...shadows.card,
  },
  nutrimentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  nutrimentRowIndent: {
    paddingLeft: 36,
    backgroundColor: palette.surface,
  },
  nutrimentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  nutrimentLabel: {
    fontSize: 15,
    color: palette.text,
    fontWeight: "500",
  },
  nutrimentLabelIndent: {
    color: palette.muted,
    fontWeight: "400",
  },
  nutrimentValue: {
    fontSize: 15,
    fontWeight: "600",
    color: palette.accent,
  },
  section: {
    marginBottom: 20,
  },
  allergenContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  allergenBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  allergenText: {
    fontSize: 13,
    color: palette.warning,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  alternativesSection: {
    marginBottom: 20,
    backgroundColor: "rgba(16, 185, 129, 0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.2)",
  },
  alternativesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  alternativesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: palette.success,
  },
  alternativesLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  alternativesLoadingText: {
    fontSize: 14,
    color: palette.muted,
  },
  alternativesList: {
    gap: 10,
  },
  alternativeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.card,
    padding: 12,
    borderRadius: 12,
    ...shadows.card,
  },
  alternativeImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: palette.surface,
  },
  alternativePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: palette.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  alternativeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  alternativeName: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.text,
  },
  alternativeBrand: {
    fontSize: 12,
    color: palette.muted,
    marginTop: 2,
  },
  alternativeScoreContainer: {
    alignItems: "center",
    marginRight: 8,
  },
  alternativeScore: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  alternativeScoreText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  alternativeImprovement: {
    fontSize: 11,
    color: palette.success,
    fontWeight: "600",
    marginTop: 2,
  },
  noAlternatives: {
    paddingVertical: 12,
  },
  noAlternativesText: {
    fontSize: 14,
    color: palette.muted,
    textAlign: "center",
  },
  addButton: {
    backgroundColor: palette.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 14,
    marginTop: 8,
    gap: 10,
    ...shadows.card,
  },
  addButtonDisabled: {
    backgroundColor: palette.muted,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
