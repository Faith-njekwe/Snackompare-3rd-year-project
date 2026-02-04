import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Easing } from "react-native";
import { palette } from "../theme";

export function SkeletonBox({ width, height, borderRadius = 8, style }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.ease,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.6, 0.3],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <View style={styles.productCard}>
      <SkeletonBox width={70} height={70} borderRadius={12} />
      <View style={styles.productInfo}>
        <SkeletonBox width="80%" height={18} borderRadius={4} />
        <SkeletonBox width="50%" height={14} borderRadius={4} style={{ marginTop: 8 }} />
        <SkeletonBox width={60} height={20} borderRadius={6} style={{ marginTop: 8 }} />
      </View>
      <SkeletonBox width={48} height={48} borderRadius={24} />
    </View>
  );
}

export function ProductListSkeleton({ count = 5 }) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </View>
  );
}

export function SearchResultsSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonBox width={100} height={14} borderRadius={4} style={{ marginLeft: 4, marginBottom: 12 }} />
      <ProductListSkeleton count={6} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: palette.border,
  },
  container: {
    padding: 16,
    paddingTop: 8,
  },
  listContainer: {
    gap: 12,
  },
  productCard: {
    flexDirection: "row",
    backgroundColor: palette.card,
    padding: 14,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  productInfo: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
});
