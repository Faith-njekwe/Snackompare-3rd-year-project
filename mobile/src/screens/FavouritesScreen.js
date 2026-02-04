import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { palette, shadows } from "../theme";
import { getFavorites, removeFavorite } from "../services/storage";
import ProductDetailModal from "../components/ProductDetailModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SWIPE_THRESHOLD = -80;

function SwipeableCard({ item, onDelete, onPress, getScoreColor }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const itemHeight = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 20;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -100));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < SWIPE_THRESHOLD) {
          // Show delete confirmation
          Animated.spring(translateX, {
            toValue: -100,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleDelete = () => {
    Alert.alert(
      "Remove Favourite",
      `Remove "${item.name}" from favourites?`,
      [
        {
          text: "Cancel",
          onPress: () => {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          },
          style: "cancel",
        },
        {
          text: "Remove",
          onPress: () => {
            // Animate out
            Animated.parallel([
              Animated.timing(itemHeight, {
                toValue: 0,
                duration: 200,
                useNativeDriver: false,
              }),
              Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start(() => onDelete(item.id));
          },
          style: "destructive",
        },
      ]
    );
  };

  return (
    <Animated.View
      style={[
        styles.swipeContainer,
        {
          opacity,
          transform: [{ scaleY: itemHeight }],
        },
      ]}
    >
      <View style={styles.deleteAction}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[styles.cardWrapper, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.productCard}
          onPress={() => onPress(item)}
          activeOpacity={0.9}
        >
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Ionicons name="nutrition-outline" size={28} color={palette.muted} />
            </View>
          )}
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.name}
            </Text>
            <Text style={styles.productBrand} numberOfLines={1}>
              {item.brand || "Unknown brand"}
            </Text>
            {item.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.productCategory}>{item.category}</Text>
              </View>
            )}
          </View>
          <View style={styles.rightSection}>
            <View
              style={[
                styles.scoreBadge,
                { backgroundColor: getScoreColor(item.score) },
              ]}
            >
              <Text style={styles.scoreText}>{item.score}</Text>
            </View>
            <Ionicons name="heart" size={20} color={palette.danger} style={styles.heartIcon} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

export default function FavouritesScreen() {
  const [favourites, setFavourites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadFavorites = async (isRefresh = false) => {
    if (!isRefresh) {
      setIsLoading(true);
    }
    const favorites = await getFavorites();
    setFavourites(favorites);
    setIsLoading(false);
    setIsRefreshing(false);

    // Fade in animation
    if (!isRefresh) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadFavorites(true);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fadeAnim.setValue(0);
      loadFavorites();
    }, [])
  );

  const handleRemoveFavorite = async (productId) => {
    await removeFavorite(productId);
    setFavourites((prev) => prev.filter((item) => item.id !== productId));
  };

  const getScoreColor = (score) => {
    if (score >= 80) return palette.success;
    if (score >= 60) return palette.warning;
    return palette.danger;
  };

  const handleProductPress = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
    loadFavorites();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={["left", "right"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.accent} />
          <Text style={styles.loadingText}>Loading favourites...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {favourites.length > 0 && (
          <View style={styles.headerBar}>
            <Text style={styles.countText}>
              {favourites.length} {favourites.length === 1 ? "favourite" : "favourites"}
            </Text>
            <Text style={styles.hintText}>Swipe left to delete</Text>
          </View>
        )}

        <FlatList
          data={favourites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={palette.accent}
              colors={[palette.accent]}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View
              style={{
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20 * (index + 1), 0],
                    }),
                  },
                ],
              }}
            >
              <SwipeableCard
                item={item}
                onDelete={handleRemoveFavorite}
                onPress={handleProductPress}
                getScoreColor={getScoreColor}
              />
            </Animated.View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Ionicons name="heart-outline" size={48} color={palette.accent} />
              </View>
              <Text style={styles.emptyText}>No favourites yet</Text>
              <Text style={styles.emptySubtext}>
                Scan or search for products and tap the heart to save them here
              </Text>
            </View>
          }
        />
      </Animated.View>

      <ProductDetailModal
        visible={showModal}
        product={selectedProduct}
        onClose={handleCloseModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.surface,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: palette.muted,
  },
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: palette.card,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  countText: {
    fontSize: 15,
    fontWeight: "600",
    color: palette.text,
  },
  hintText: {
    fontSize: 12,
    color: palette.muted,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  swipeContainer: {
    marginBottom: 12,
    overflow: "hidden",
  },
  deleteAction: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: palette.danger,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  deleteText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
  },
  cardWrapper: {
    backgroundColor: palette.card,
    borderRadius: 16,
    ...shadows.card,
  },
  productCard: {
    flexDirection: "row",
    padding: 14,
    alignItems: "center",
    backgroundColor: palette.card,
    borderRadius: 16,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: palette.surface,
  },
  placeholderImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: palette.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.text,
    marginBottom: 4,
    lineHeight: 20,
  },
  productBrand: {
    fontSize: 13,
    color: palette.muted,
    marginBottom: 6,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: palette.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  productCategory: {
    fontSize: 11,
    color: palette.accent,
    fontWeight: "600",
  },
  rightSection: {
    alignItems: "center",
    marginLeft: 8,
  },
  scoreBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  heartIcon: {
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 100,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: palette.accentSoft,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: palette.text,
  },
  emptySubtext: {
    fontSize: 14,
    color: palette.muted,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 48,
    lineHeight: 20,
  },
});
