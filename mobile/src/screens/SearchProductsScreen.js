import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
  RefreshControl,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { palette, shadows } from "../theme";
import { searchProducts, formatProductForApp } from "../services/openFoodFacts";
import ProductDetailModal from "../components/ProductDetailModal";
import { SearchResultsSkeleton } from "../components/SkeletonLoader";

export default function SearchProductsScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [isFocused, setIsFocused] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const inputRef = useRef(null);
  const compareBarAnim = useRef(new Animated.Value(0)).current;

  const performSearch = useCallback(async (isRefresh = false) => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length < 2) {
      return;
    }

    if (!isRefresh) {
      Keyboard.dismiss();
      setIsLoading(true);
    }
    setHasSearched(true);

    try {
      const results = await searchProducts(trimmedQuery, 25);
      const formattedProducts = results
        .map(formatProductForApp)
        .filter((p) => p !== null);
      setProducts(formattedProducts);
    } catch (error) {
      console.error("Search error:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery]);

  const handleRefresh = useCallback(() => {
    if (hasSearched && searchQuery.trim().length >= 2) {
      setIsRefreshing(true);
      performSearch(true);
    }
  }, [hasSearched, searchQuery, performSearch]);

  const handleClear = () => {
    setSearchQuery("");
    setProducts([]);
    setHasSearched(false);
    // Don't clear compare list - user might want to keep their selections
    inputRef.current?.focus();
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

  const animateCompareBar = (show) => {
    Animated.spring(compareBarAnim, {
      toValue: show ? 1 : 0,
      useNativeDriver: true,
      damping: 15,
    }).start();
  };

  const toggleCompare = (product) => {
    setCompareList((prev) => {
      const isInList = prev.some((p) => p.id === product.id);
      let newList;
      if (isInList) {
        newList = prev.filter((p) => p.id !== product.id);
      } else if (prev.length < 3) {
        newList = [...prev, product];
      } else {
        return prev;
      }
      animateCompareBar(newList.length > 0);
      return newList;
    });
  };

  const isInCompareList = (productId) => {
    return compareList.some((p) => p.id === productId);
  };

  const goToCompare = () => {
    if (compareList.length >= 2) {
      navigation.navigate("CompareProducts", { products: compareList });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["left", "right"]}>
      <View style={styles.searchWrapper}>
        <View style={[styles.searchContainer, isFocused && styles.searchContainerFocused]}>
          <Ionicons name="search" size={20} color={isFocused ? palette.accent : palette.muted} style={styles.searchIcon} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search for products..."
            placeholderTextColor={palette.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={() => performSearch(false)}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={palette.muted} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.searchButton,
            searchQuery.trim().length < 2 && styles.searchButtonDisabled,
          ]}
          onPress={() => performSearch(false)}
          disabled={searchQuery.trim().length < 2}
        >
          <Ionicons name="search" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <SearchResultsSkeleton />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContainer,
            compareList.length > 0 && { paddingBottom: 100 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={palette.accent}
              colors={[palette.accent]}
            />
          }
          ListHeaderComponent={
            hasSearched && products.length > 0 ? (
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>
                  {products.length} {products.length === 1 ? "result" : "results"} found
                </Text>
                <View style={styles.compareHintBox}>
                  <Ionicons name="git-compare-outline" size={14} color={palette.accent} />
                  <Text style={styles.compareHint}>Hold to compare</Text>
                </View>
              </View>
            ) : null
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.productCard,
                isInCompareList(item.id) && styles.productCardSelected,
              ]}
              onPress={() => handleProductPress(item)}
              onLongPress={() => toggleCompare(item)}
              activeOpacity={0.7}
              delayLongPress={300}
            >
              {isInCompareList(item.id) ? (
                <View style={styles.compareCheckmark}>
                  <Ionicons name="checkmark-circle" size={22} color={palette.accent} />
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.addCompareButton}
                  onPress={() => toggleCompare(item)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="add-circle-outline" size={20} color={palette.muted} />
                </TouchableOpacity>
              )}
              {getImageSource(item.image, item.id) ? (
                <Image
                  source={getImageSource(item.image, item.id)?.uri}
                  style={styles.productImage}
                  contentFit="cover"
                  transition={200}
                  onError={() => markImageError(item.id)}
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
              <View style={styles.emptyIconContainer}>
                <Ionicons
                  name={hasSearched ? "sad-outline" : "search-outline"}
                  size={48}
                  color={palette.accent}
                />
              </View>
              <Text style={styles.emptyText}>
                {hasSearched ? "No products found" : "Search for products"}
              </Text>
              <Text style={styles.emptySubtext}>
                {hasSearched
                  ? "Try a different search term"
                  : "Enter a product name and tap search"}
              </Text>
            </View>
          }
        />
      )}

      {/* Compare Bar */}
      <Animated.View
        style={[
          styles.compareBar,
          {
            transform: [
              {
                translateY: compareBarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [150, 0],
                }),
              },
            ],
          },
        ]}
      >
        {/* Selected Products Preview */}
        <View style={styles.selectedProductsRow}>
          {compareList.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.selectedProductChip}
              onPress={() => toggleCompare(product)}
              activeOpacity={0.7}
            >
              {product.image ? (
                <Image source={product.image} style={styles.chipImage} />
              ) : (
                <View style={styles.chipImagePlaceholder}>
                  <Ionicons name="nutrition-outline" size={14} color={palette.muted} />
                </View>
              )}
              <Text style={styles.chipName} numberOfLines={1}>{product.name}</Text>
              <View style={styles.chipRemove}>
                <Ionicons name="close" size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          ))}
          {compareList.length < 3 && (
            <View style={styles.addMoreChip}>
              <Ionicons name="add" size={18} color={palette.muted} />
              <Text style={styles.addMoreText}>Add more</Text>
            </View>
          )}
        </View>

        <View style={styles.compareBarContent}>
          <View style={styles.compareInfo}>
            <Text style={styles.compareTitle}>
              {compareList.length} product{compareList.length !== 1 ? "s" : ""} selected
            </Text>
            <Text style={styles.compareSubtitle}>
              {compareList.length < 2 ? "Select at least 2 to compare" : "Ready to compare!"}
            </Text>
          </View>
          <View style={styles.compareActions}>
            <TouchableOpacity
              style={styles.compareClearButton}
              onPress={() => {
                setCompareList([]);
                animateCompareBar(false);
              }}
            >
              <Text style={styles.clearText}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.compareButton,
                compareList.length < 2 && styles.compareButtonDisabled,
              ]}
              onPress={goToCompare}
              disabled={compareList.length < 2}
            >
              <Ionicons name="git-compare-outline" size={20} color="#FFFFFF" />
              <Text style={styles.compareButtonText}>Compare</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
    backgroundColor: palette.card,
    borderBottomWidth: 1,
    borderBottomColor: palette.border,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surface,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: palette.border,
  },
  searchContainerFocused: {
    borderColor: palette.accent,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: palette.text,
    paddingVertical: 14,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: palette.accent,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.card,
  },
  searchButtonDisabled: {
    backgroundColor: palette.muted,
    opacity: 0.5,
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  resultsCount: {
    fontSize: 13,
    color: palette.muted,
  },
  compareHintBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
  },
  compareHint: {
    fontSize: 12,
    color: palette.accent,
    fontWeight: "500",
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: palette.card,
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    alignItems: "center",
    ...shadows.card,
  },
  productCardSelected: {
    borderWidth: 2,
    borderColor: palette.accent,
  },
  compareCheckmark: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
  },
  addCompareButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
    padding: 2,
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
  scoreBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
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
    paddingHorizontal: 32,
  },
  compareBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: palette.card,
    borderTopWidth: 1,
    borderTopColor: palette.border,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
    ...shadows.card,
    shadowOffset: { width: 0, height: -4 },
  },
  selectedProductsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
    flexWrap: "wrap",
  },
  selectedProductChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.accentSoft,
    borderRadius: 20,
    paddingLeft: 4,
    paddingRight: 8,
    paddingVertical: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: palette.accent,
  },
  chipImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.surface,
  },
  chipImagePlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  chipName: {
    fontSize: 13,
    fontWeight: "500",
    color: palette.text,
    maxWidth: 80,
  },
  chipRemove: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: palette.accent,
    justifyContent: "center",
    alignItems: "center",
  },
  addMoreChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: palette.border,
    borderStyle: "dashed",
  },
  addMoreText: {
    fontSize: 12,
    color: palette.muted,
  },
  compareBarContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  compareInfo: {
    flex: 1,
  },
  compareTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: palette.text,
  },
  compareSubtitle: {
    fontSize: 12,
    color: palette.muted,
    marginTop: 2,
  },
  compareActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  compareClearButton: {
    padding: 8,
  },
  clearText: {
    fontSize: 14,
    color: palette.danger,
    fontWeight: "500",
  },
  compareButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: palette.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  compareButtonDisabled: {
    backgroundColor: palette.muted,
  },
  compareButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
