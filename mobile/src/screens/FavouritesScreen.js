import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { palette } from "../theme";
import { getFavorites, removeFavorite } from "../services/storage";
import ProductDetailModal from "../components/ProductDetailModal";

export default function FavouritesScreen() {
  const [favourites, setFavourites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const loadFavorites = async () => {
    setIsLoading(true);
    const favorites = await getFavorites();
    setFavourites(favorites);
    setIsLoading(false);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
    }, [])
  );

  const handleRemoveFavorite = async (productId) => {
    await removeFavorite(productId);
    await loadFavorites();
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
    loadFavorites(); // Refresh in case favorite status changed
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={favourites}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => handleProductPress(item)}
          >
            {item.image && (
              <Image source={{ uri: item.image }} style={styles.productImage} />
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={styles.productBrand} numberOfLines={1}>
                {item.brand}
              </Text>
              <Text style={styles.productCategory}>{item.category}</Text>
            </View>
            <View style={styles.actions}>
              <View
                style={[
                  styles.scoreBadge,
                  { backgroundColor: getScoreColor(item.score) },
                ]}
              >
                <Text style={styles.scoreText}>{item.score}</Text>
              </View>
              <TouchableOpacity
                style={styles.heartButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleRemoveFavorite(item.id);
                }}
              >
                <Ionicons name="heart" size={24} color={palette.danger} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={palette.muted} />
            <Text style={styles.emptyText}>No favourites yet</Text>
            <Text style={styles.emptySubtext}>
              Scan products and add them to your favourites
            </Text>
          </View>
        }
      />

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
    backgroundColor: palette.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: palette.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: "center",
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: palette.surface,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: "600",
    color: palette.text,
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 14,
    color: palette.muted,
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 12,
    color: palette.accent,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  scoreBadge: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  heartButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: palette.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: palette.muted,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
