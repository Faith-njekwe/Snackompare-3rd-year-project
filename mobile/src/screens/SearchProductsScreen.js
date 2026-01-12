import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { palette } from "../theme";
import { searchProducts, formatProductForApp } from "../services/openFoodFacts";
import ProductDetailModal from "../components/ProductDetailModal";

export default function SearchProductsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length > 2) {
        performSearch();
      } else {
        setProducts([]);
        setHasSearched(false);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const performSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      const results = await searchProducts(searchQuery, 10);
      const formattedProducts = results
        .map(formatProductForApp)
        .filter((p) => p !== null);
      setProducts(formattedProducts);
    } catch (error) {
      console.error("Search error:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return palette.success;
    if (score >= 60) return palette.warning;
    return palette.danger;
  };

  const sanitizeImageUri = (uri) => {
    if (!uri) return null;
    if (uri.startsWith("http://")) return `https://${uri.slice(7)}`;
    return uri;
  };

  const getImageSource = (uri, id) => {
    if (imageErrors[id]) return null;
    const safeUri = sanitizeImageUri(uri);
    return safeUri ? { uri: safeUri } : null;
  };

  const markImageError = (id) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const handleProductPress = (product) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedProduct(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={palette.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for products..."
          placeholderTextColor={palette.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={palette.accent} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.productCard}
              onPress={() => handleProductPress(item)}
            >
              {getImageSource(item.image, item.id) ? (
                <Image
                  source={getImageSource(item.image, item.id)}
                  style={styles.productImage}
                  resizeMode="cover"
                  progressiveRenderingEnabled
                  onError={() => markImageError(item.id)}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="image-outline" size={28} color={palette.muted} />
                </View>
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
              <View
                style={[
                  styles.scoreBadge,
                  { backgroundColor: getScoreColor(item.score) },
                ]}
              >
                <Text style={styles.scoreText}>{item.score}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={64} color={palette.muted} />
              <Text style={styles.emptyText}>
                {hasSearched ? "No products found" : "Search for products"}
              </Text>
              <Text style={styles.emptySubtext}>
                {hasSearched
                  ? "Try a different search term"
                  : "Type at least 3 characters to search"}
              </Text>
            </View>
          }
        />
      )}

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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.card,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: palette.text,
    paddingVertical: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 64,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: palette.muted,
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
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: palette.surface,
    justifyContent: "center",
    alignItems: "center",
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
