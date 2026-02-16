import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Platform,
  StyleSheet,
  Modal,
  Alert,
  TextInput 
} from "react-native";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import { Ionicons } from "@expo/vector-icons";
import { palette, shadows } from "../theme";
import { API_BASE_URL } from "../config";
import { useCalorieTotal } from "../context/CalorieTotalContext";

// used API_BASE_URL from config.js so as to not hardcode the URL here (hosted on railway)
console.log("API BASE URL:", API_BASE_URL);
const API_URL = `${API_BASE_URL}/api/meals/photo-calories/`;

export default function MealPhotoCameraScreen({ navigation }) {
  const device = useCameraDevice("back");
  const cameraRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === "granted");
    })();
  }, []);

  async function takePhoto() {
    if (!cameraRef.current) return;

    setLoading(true);
    try {
      const photo = await cameraRef.current.takePhoto({
        flash: "off",
      });

      // Format the path correctly for the networking layer
      //const uri = Platform.OS === "android" ? `file://${photo.path}` : photo.path;
      const photoPath = photo.path;
      const uri = photoPath.startsWith('file://') ? photoPath : `file://${photoPath}`;

      const formData = new FormData();
      // @ts-ignore
      formData.append("image", {
        uri: uri,
        name: "meal-upload.jpg",
        type: "image/jpeg",
      });

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
        headers: {
          "Accept": "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json?.error || "Server error");
      }

      if (!json?.items || json.items.length === 0) {
        Alert.alert(
          "No Food Detected",
          "We couldn't detect any food in your photo. Try taking a clearer picture with the food centered in the frame.",
          [{ text: "Try Again" }]
        );
        return;
      }

      setResult(json);
      setShowModal(true);
    } catch (e) {
      console.error("Capture/Upload Error:", e);
      Alert.alert("Something went wrong", e.message || "Failed to analyze photo. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text>No access to camera</Text>
        <TouchableOpacity 
           onPress={async () => setHasPermission((await Camera.requestCameraPermission()) === "granted")}
           style={{ marginTop: 20, padding: 10, backgroundColor: palette.accent, borderRadius: 8 }}
        >
          <Text style={{ color: "#fff" }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={palette.accent} />
        <Text>Loading Camera...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!loading && !showModal}
        photo={true}
      />

      {/* Back button */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={32} color="#fff" />
      </TouchableOpacity>

      {/* Capture button */}
      <View style={styles.captureContainer}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={takePhoto}
          disabled={loading}
        >
          <Ionicons name="camera" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Analyzing meal…</Text>
        </View>
      )}

      <MealCaloriesModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        data={result}
      />
    </View>
  );
}

function MealCaloriesModal({ visible, onClose, data }) {
  const { addFoodItem } = useCalorieTotal();
  const items = data?.items || [];
  const [editableItems, setEditableItems] = useState([]);

  useEffect(() => {
    if (!visible) return;

    // Initialize editable items
    const mapped = items.map((item) => {
      const estG = Number(item.estimated_grams || 0);
      const cal = Number(item.calories || 0);

      // Get kcal per gram from the model output
      const kcalPerGram = estG > 0 ? cal / estG : 0;

      return {
        ...item,
        gramsText: String(Math.round(estG)), // for TextInput
        grams: estG,                        
        kcalPerGram,
      };
    });

    setEditableItems(mapped);
  }, [visible, data]);

  const updateGrams = (idx, text) => {
    // allow empty while typing and digits only
    const cleaned = text.replace(/[^\d]/g, "");

    setEditableItems((prev) =>
      prev.map((item, i) => {
        if (i !== idx) return item;

        const gramsNum = cleaned === "" ? 0 : Number(cleaned);
        return {
          ...item,
          gramsText: cleaned,
          grams: gramsNum,
        };
      })
    );
  };

  const itemCalories = (item) => {
    const grams = Number(item.grams || 0);
    const kcalPerGram = Number(item.kcalPerGram || 0);
    return grams * kcalPerGram;
  };

  const totalCalories = editableItems.reduce(
    (sum, item) => sum + itemCalories(item),
    0
  );

  
  return (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color={palette.text} />
        </TouchableOpacity>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="always">
          <View style={styles.modalHeader}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="flame" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.modalTitle}>Calorie Estimation</Text>
            <Text style={styles.modalSubtitle}>
              {editableItems.length} item{editableItems.length !== 1 ? "s" : ""} detected
            </Text>
          </View>

          {editableItems.map((item, idx) => {
            const cal = itemCalories(item);
            const confidence = Number(item.confidence || 0);

            return (
              <View key={idx} style={styles.itemCard}>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={styles.itemIconCircle}>
                    <Ionicons name="nutrition" size={18} color="#f97316" />
                  </View>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.itemMeta}>
                      <View style={styles.calBadge}>
                        <Text style={styles.calBadgeText}>{Math.round(cal)} kcal</Text>
                      </View>
                      <Text style={styles.itemConfidence}>
                        {(confidence * 100).toFixed(0)}% confidence
                      </Text>
                    </View>
                  </View>

                  <View style={styles.gramsBox}>
                    <TextInput
                      value={item.gramsText}
                      onChangeText={(t) => updateGrams(idx, t)}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      style={styles.gramsInput}
                      placeholder="0"
                      placeholderTextColor={palette.muted}
                    />
                    <Text style={styles.gramsUnit}>g</Text>
                  </View>
                </View>
              </View>
            );
          })}

          <View style={styles.totalBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Calories</Text>
              <Text style={styles.totalCalories}>
                {Math.round(totalCalories)} kcal
              </Text>
            </View>
            <Text style={styles.totalConfidence}>
              Overall confidence: {(Number(data?.overall_confidence || 0) * 100).toFixed(0)}%
            </Text>
          </View>

          <TouchableOpacity
            style={styles.addToCounterBtn}
            onPress={() => {
              editableItems.forEach((item) => {
                addFoodItem(item.name, itemCalories(item));
              });
              onClose();
            }}
          >
            <Ionicons name="add-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.addToCounterBtnText}>
              Add to Calorie Counter
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  </Modal>
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

    modalHeader: {
    alignItems: "center",
    marginBottom: 20,
    paddingTop: 4,
    },

    modalIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    },

    modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: palette.text,
    marginBottom: 4,
    },

    modalSubtitle: {
    fontSize: 14,
    color: palette.muted,
    },
    captureContainer: {
    position: "absolute",
    bottom: 40,
    width: "100%",
    alignItems: "center",
    },

    captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: palette.accent,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    },

    loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    },

    loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
    },

    itemCard: {
    backgroundColor: palette.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 10,
    ...shadows.card,
    },

    itemIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF7ED",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    },

    itemName: {
    fontSize: 15,
    fontWeight: "700",
    color: palette.text,
    marginBottom: 6,
    },

    itemMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    },

    calBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    },

    calBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#D97706",
    },

    itemConfidence: {
    fontSize: 12,
    color: palette.muted,
    },

    totalBox: {
    marginTop: 8,
    backgroundColor: palette.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 4,
    },

    totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    },

    totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.text,
    },

    totalCalories: {
    fontSize: 22,
    fontWeight: "800",
    color: palette.text,
    },

    totalConfidence: {
    fontSize: 13,
    color: palette.muted,
    },

    gramsBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    backgroundColor: palette.surface,
  },

  gramsInput: {
    fontSize: 15,
    fontWeight: "600",
    color: palette.text,
    textAlign: "right",
    minWidth: 44,
    paddingVertical: 0,
    paddingHorizontal: 0,
  },

  gramsUnit: {
    fontSize: 14,
    color: palette.muted,
    marginLeft: 4,
  },

  addToCounterBtn: {
  marginTop: 14,
  marginBottom: 8,
  backgroundColor: palette.accent,
  borderRadius: 14,
  paddingVertical: 16,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
},
addToCounterBtnText: {
  color: "#fff",
  fontWeight: "700",
  fontSize: 16,
},

});
