import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Image,
  ScrollView,
  Animated,
  Easing,
  Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, useCameraDevice, useCodeScanner } from "react-native-vision-camera";
import { Ionicons } from "@expo/vector-icons";
import { palette, shadows } from "../theme";
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
  const [notFound, setNotFound] = useState(false);
  const device = useCameraDevice("back");

  // Animations
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const modalSlide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === "granted");
    })();
  }, []);

  // Scanning line animation
  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanLineAnim.setValue(0);
    }
  }, [isScanning]);

  // Corner pulse animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const fetchProductData = async (barcode) => {
    setIsLoadingProduct(true);
    setNotFound(false);
    try {
      const rawProduct = await getProductByBarcode(barcode);
      if (rawProduct) {
        const formattedProduct = formatProductForApp(rawProduct);
        setProduct(formattedProduct);

        const favoriteStatus = await isFavorite(formattedProduct.id);
        setIsFavorited(favoriteStatus);

        // Animate modal in
        setShowProductModal(true);
        Animated.spring(modalSlide, {
          toValue: 1,
          useNativeDriver: true,
          damping: 15,
        }).start();
      } else {
        setProduct(null);
        setNotFound(true);
        Vibration.vibrate(100);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setProduct(null);
      setNotFound(true);
    } finally {
      setIsLoadingProduct(false);
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

  const codeScanner = useCodeScanner({
    codeTypes: ["qr", "ean-13", "ean-8", "code-128", "code-39", "upc-a", "upc-e"],
    onCodeScanned: (codes) => {
      if (codes.length > 0 && isActive) {
        const code = codes[0];
        if (code.value) {
          setIsActive(false);
          setScannedCode(code.value);
          setIsScanning(false);
          Vibration.vibrate(50);

          fetchProductData(code.value);

          setTimeout(() => {
            setIsActive(true);
            setIsScanning(true);
            setScannedCode(null);
            setNotFound(false);
          }, 3000);
        }
      }
    },
  });

  const closeModal = () => {
    Animated.timing(modalSlide, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowProductModal(false);
      setProduct(null);
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

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <View style={styles.permissionIcon}>
            <Ionicons name="camera-outline" size={48} color={palette.accent} />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need camera permission to scan product barcodes
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={async () => {
              const status = await Camera.requestCameraPermission();
              setHasPermission(status === "granted");
            }}
          >
            <Ionicons name="shield-checkmark-outline" size={20} color="#FFFFFF" />
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
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
          <Text style={styles.loadingText}>Initializing camera...</Text>
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
        <View style={styles.topOverlay}>
          <View style={styles.topContent}>
            <Ionicons name="scan" size={24} color="#FFFFFF" />
            <Text style={styles.topTitle}>Scan Barcode</Text>
          </View>
        </View>

        <View style={styles.middleRow}>
          <View style={styles.sideOverlay} />
          <View style={styles.scanArea}>
            <Animated.View style={[styles.corner, styles.topLeft, { transform: [{ scale: pulseAnim }] }]} />
            <Animated.View style={[styles.corner, styles.topRight, { transform: [{ scale: pulseAnim }] }]} />
            <Animated.View style={[styles.corner, styles.bottomLeft, { transform: [{ scale: pulseAnim }] }]} />
            <Animated.View style={[styles.corner, styles.bottomRight, { transform: [{ scale: pulseAnim }] }]} />

            {isScanning && (
              <Animated.View
                style={[
                  styles.scanLine,
                  {
                    transform: [
                      {
                        translateY: scanLineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 230],
                        }),
                      },
                    ],
                  },
                ]}
              />
            )}
          </View>
          <View style={styles.sideOverlay} />
        </View>

        <View style={styles.bottomOverlay}>
          {isLoadingProduct ? (
            <View style={styles.statusContainer}>
              <ActivityIndicator size="small" color={palette.accent} />
              <Text style={styles.statusText}>Looking up product...</Text>
            </View>
          ) : notFound ? (
            <View style={styles.statusContainer}>
              <Ionicons name="alert-circle" size={24} color={palette.warning} />
              <Text style={styles.statusText}>Product not found</Text>
              <Text style={styles.statusSubtext}>Try scanning again</Text>
            </View>
          ) : (
            <View style={styles.instructionContainer}>
              <Text style={styles.instructionText}>
                Point your camera at a product barcode
              </Text>
              <Text style={styles.instructionSubtext}>
                The scanner will detect it automatically
              </Text>
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={showProductModal}
        animationType="none"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [
                  {
                    translateY: modalSlide.interpolate({
                      inputRange: [0, 1],
                      outputRange: [600, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <View style={styles.modalHandle} />
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Ionicons name="close" size={24} color={palette.text} />
            </TouchableOpacity>

            {product && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {(product.imageFull || product.image) && (
                  <Image
                    source={{ uri: product.imageFull || product.image }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                )}

                <View style={styles.modalHeader}>
                  <View style={styles.modalTitleSection}>
                    <Text style={styles.modalTitle}>{product.name}</Text>
                    <Text style={styles.modalBrand}>{product.brand}</Text>
                  </View>
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
                    <NutrimentRow label="Calories" value={product.nutriments.energy} unit="kcal" icon="flame-outline" />
                    <NutrimentRow label="Fat" value={product.nutriments.fat} unit="g" icon="water-outline" />
                    <NutrimentRow label="Saturated" value={product.nutriments.saturatedFat} unit="g" icon="ellipse-outline" indent />
                    <NutrimentRow label="Carbs" value={product.nutriments.carbs} unit="g" icon="cube-outline" />
                    <NutrimentRow label="Sugar" value={product.nutriments.sugar} unit="g" icon="cafe-outline" indent />
                    <NutrimentRow label="Protein" value={product.nutriments.protein} unit="g" icon="barbell-outline" />
                    <NutrimentRow label="Fiber" value={product.nutriments.fiber} unit="g" icon="leaf-outline" />
                    <NutrimentRow label="Salt" value={product.nutriments.salt} unit="g" icon="snow-outline" />
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
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
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
  permissionIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: palette.accentSoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 8,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 15,
    color: palette.muted,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  permissionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    ...shadows.card,
  },
  permissionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: palette.muted,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
    paddingBottom: 20,
  },
  topContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  topTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  middleRow: {
    flexDirection: "row",
    height: 250,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  scanArea: {
    width: 250,
    height: 250,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 50,
    height: 50,
    borderColor: palette.accent,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },
  scanLine: {
    position: "absolute",
    left: 20,
    right: 20,
    height: 3,
    backgroundColor: palette.accent,
    borderRadius: 2,
    shadowColor: palette.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  bottomOverlay: {
    flex: 1.2,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingTop: 30,
  },
  statusContainer: {
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  statusSubtext: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
  instructionContainer: {
    alignItems: "center",
  },
  instructionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  instructionSubtext: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    marginTop: 6,
  },
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
