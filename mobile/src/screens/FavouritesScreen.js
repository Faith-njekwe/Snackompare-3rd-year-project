import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { palette, shadows } from "../theme";
import { getFavorites, removeFavorite } from "../services/storage";
import ProductDetailModal from "../components/ProductDetailModal";

function FavouriteCard({ item, onDelete, onPress, getScoreColor }) {
  const handleDelete = () => {
    Alert.alert(
      "Remove Favourite",
      `Remove "${item.name}" from favourites?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          onPress: () => onDelete(item.id),
          style: "destructive",
        },
      ]
    );
  };

  const energy = item.nutriments?.energy ?? item.energy ?? null;

  return (
    <View style={styles.cardWrapper}>
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => onPress(item)}
        activeOpacity={0.9}
      >
        {item.image ? (
          <Image
            source={item.image}
            style={styles.productImage}
            contentFit="cover"
            transition={200}
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
          {energy != null && (
            <Text style={styles.energyText}>{Math.round(energy)} kcal/100g</Text>
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
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={18} color={palette.text} />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
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
            <Text style={styles.hintText}>Tap to view details</Text>
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
              <FavouriteCard
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
  cardWrapper: {
    marginBottom: 12,
    backgroundColor: palette.card,
    borderRadius: 16,
    ...shadows.card,
  },
  deleteBtn: {
    padding: 8,
    marginLeft: 6,
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
  energyText: {
    fontSize: 11,
    color: palette.muted,
    marginTop: 4,
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
