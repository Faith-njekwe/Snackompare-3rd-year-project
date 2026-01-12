import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "../theme";
import { addFavorite, isFavorite } from "../services/storage";

export default function ProductDetailModal({ visible, product, onClose }) {
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (product) {
      checkFavoriteStatus();
    }
  }, [product]);

  const checkFavoriteStatus = async () => {
    if (!product) return;
    const status = await isFavorite(product.id);
    setIsFavorited(status);
  };

  const handleAddToFavorites = async () => {
    if (!product) return;
    const success = await addFavorite(product);
    if (success) {
      setIsFavorited(true);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return palette.success;
    if (score >= 60) return palette.warning;
    return palette.danger;
  };

  if (!product) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={28} color={palette.text} />
          </TouchableOpacity>

          <ScrollView>
            {product.image && (
              <Image source={{ uri: product.image }} style={styles.modalImage} />
            )}

            <View style={styles.modalHeader}>
              <View style={styles.modalTitleSection}>
                <Text style={styles.modalTitle}>{product.name}</Text>
                <Text style={styles.modalBrand}>{product.brand}</Text>
              </View>
              <View
                style={[
                  styles.modalScoreBadge,
                  { backgroundColor: getScoreColor(product.score) },
                ]}
              >
                <Text style={styles.modalScoreText}>{product.score}</Text>
              </View>
            </View>

            <View style={styles.nutrimentSection}>
              <Text style={styles.sectionTitle}>Nutrition (per 100g/ml)</Text>

              <View style={styles.nutrimentGrid}>
                <NutrimentRow
                  label="Energy"
                  value={product.nutriments?.energy}
                  unit="kcal"
                />
                <NutrimentRow label="Fat" value={product.nutriments?.fat} unit="g" />
                <NutrimentRow
                  label="Saturated Fat"
                  value={product.nutriments?.saturatedFat}
                  unit="g"
                />
                <NutrimentRow label="Carbs" value={product.nutriments?.carbs} unit="g" />
                <NutrimentRow label="Sugar" value={product.nutriments?.sugar} unit="g" />
                <NutrimentRow
                  label="Protein"
                  value={product.nutriments?.protein}
                  unit="g"
                />
                <NutrimentRow label="Fiber" value={product.nutriments?.fiber} unit="g" />
                <NutrimentRow label="Salt" value={product.nutriments?.salt} unit="g" />
              </View>
            </View>

            {product.allergens && product.allergens.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Allergens</Text>
                <Text style={styles.sectionText}>
                  {product.allergens.map((a) => a.replace("en:", "")).join(", ")}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.addButton,
                isFavorited && { backgroundColor: palette.muted },
              ]}
              onPress={handleAddToFavorites}
              disabled={isFavorited}
            >
              <Ionicons
                name={isFavorited ? "heart" : "heart-outline"}
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.addButtonText}>
                {isFavorited ? "Added to Favourites" : "Add to Favourites"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function NutrimentRow({ label, value, unit }) {
  const formatVal = (v) => {
    const num = Number(v);
    if (Number.isFinite(num)) return `${num.toFixed(1)} ${unit}`;
    return "N/A";
  };

  return (
    <View style={styles.nutrimentRow}>
      <Text style={styles.nutrimentLabel}>{label}</Text>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
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
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: palette.surface,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitleSection: {
    flex: 1,
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
  },
  modalScoreBadge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 16,
  },
  modalScoreText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  nutrimentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: palette.text,
    marginBottom: 12,
  },
  nutrimentGrid: {
    backgroundColor: palette.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
  },
  nutrimentRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  nutrimentLabel: {
    fontSize: 15,
    color: palette.text,
  },
  nutrimentValue: {
    fontSize: 15,
    fontWeight: "600",
    color: palette.accent,
  },
  section: {
    marginBottom: 24,
  },
  sectionText: {
    fontSize: 15,
    color: palette.text,
    lineHeight: 22,
  },
  addButton: {
    backgroundColor: palette.accent,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
