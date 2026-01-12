import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, useCameraDevice, useCodeScanner } from "react-native-vision-camera";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "../theme";
import { getProductByBarcode, formatProductForApp } from "../services/openFoodFacts";
import { addFavorite, isFavorite } from "../services/storage";

export default function ScanScreen() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [scannedCode, setScannedCode] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [product, setProduct] = useState(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const device = useCameraDevice("back");

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === "granted");
    })();
  }, []);

  const fetchProductData = async (barcode) => {
    setIsLoadingProduct(true);
    try {
      const rawProduct = await getProductByBarcode(barcode);
      if (rawProduct) {
        const formattedProduct = formatProductForApp(rawProduct);
        setProduct(formattedProduct);

        // Check if already favorited
        const favoriteStatus = await isFavorite(formattedProduct.id);
        setIsFavorited(favoriteStatus);

        setShowProductModal(true);
      } else {
        setProduct(null);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setProduct(null);
    } finally {
      setIsLoadingProduct(false);
    }
  };

  const handleAddToFavorites = async () => {
    if (!product) return;

    const success = await addFavorite(product);
    if (success) {
      setIsFavorited(true);
    }
  };

  const codeScanner = useCodeScanner({
    codeTypes: ["qr", "ean-13", "ean-8", "code-128", "code-39", "upc-a", "upc-e"],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && isActive) {
        const code = codes[0];
        if (code.value) {
          setIsActive(false);
          setScannedCode(code.value);
          setIsScanning(false);

          // Fetch product data
          fetchProductData(code.value);

          // Reactivate after 3 seconds
          setTimeout(() => {
            setIsActive(true);
            setIsScanning(true);
            setScannedCode(null);
          }, 3000);
        }
      }
    },
  });

  const closeModal = () => {
    setShowProductModal(false);
    setProduct(null);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return palette.success;
    if (score >= 60) return palette.warning;
    return palette.danger;
  };

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="camera-outline" size={64} color={palette.muted} />
          <Text style={styles.permissionText}>Camera permission required</Text>
          <TouchableOpacity
            style={styles.button}
            onPress={async () => {
              const status = await Camera.requestCameraPermission();
              setHasPermission(status === "granted");
            }}
          >
            <Text style={styles.buttonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={palette.accent} />
          <Text style={styles.permissionText}>Loading camera...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isScanning && isActive}
        codeScanner={codeScanner}
      />

      <View style={styles.overlay}>
        <View style={styles.topOverlay} />
        <View style={styles.middleRow}>
          <View style={styles.sideOverlay} />
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <View style={styles.sideOverlay} />
        </View>
        <View style={styles.bottomOverlay}>
          <Text style={styles.instructionText}>
            {isLoadingProduct
              ? "Loading product..."
              : isScanning
              ? "Point camera at barcode"
              : scannedCode && !product && !isLoadingProduct
              ? "Product not found in database"
              : scannedCode
              ? `Scanned: ${scannedCode}`
              : "Scanning..."}
          </Text>
        </View>
      </View>

      <Modal
        visible={showProductModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Ionicons name="close" size={28} color={palette.text} />
            </TouchableOpacity>

            {product && (
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
                    <NutrimentRow label="Energy" value={product.nutriments.energy} unit="kcal" />
                    <NutrimentRow label="Fat" value={product.nutriments.fat} unit="g" />
                    <NutrimentRow label="Saturated Fat" value={product.nutriments.saturatedFat} unit="g" />
                    <NutrimentRow label="Carbs" value={product.nutriments.carbs} unit="g" />
                    <NutrimentRow label="Sugar" value={product.nutriments.sugar} unit="g" />
                    <NutrimentRow label="Protein" value={product.nutriments.protein} unit="g" />
                    <NutrimentRow label="Fiber" value={product.nutriments.fiber} unit="g" />
                    <NutrimentRow label="Salt" value={product.nutriments.salt} unit="g" />
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
            )}
          </View>
        </View>
      </Modal>
    </View>
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
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: palette.bg,
    padding: 32,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: "600",
    color: palette.text,
    marginTop: 16,
    marginBottom: 24,
    textAlign: "center",
  },
  button: {
    backgroundColor: palette.accent,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  middleRow: {
    flexDirection: "row",
    height: 250,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  scanArea: {
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: palette.accent,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  instructionText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 20,
  },
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
