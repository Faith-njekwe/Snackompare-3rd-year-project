import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";

import HomeScreen from "./screens/HomeScreen";
import SearchProductsScreen from "./screens/SearchProductsScreen";
import FavouritesScreen from "./screens/FavouritesScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AIChatbotScreen from "./screens/AIChatbotScreen";
import TakePhotoScreen from "./screens/TakePhotoScreen";
import MealPhotoCameraScreen from "./screens/MealPhotoCameraScreen";
import { palette } from "./theme";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {

          let iconName = "ellipse"; // fallback

          if (route.name === "Home") {
            iconName = focused ? "apps" : "apps-outline";
          } else if (route.name === "Favourites") {
            iconName = focused ? "heart" : "heart-outline";
          } else if (route.name === "CalorieTracker") {
            iconName = focused ? "camera" : "camera-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "Chatbot") {
            iconName = focused ? "chatbubbles" : "chatbubbles-outline";
          }


          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.muted,
        tabBarStyle: {
          backgroundColor: palette.card,
          borderTopColor: palette.border,
          height: Platform.OS === "ios" ? 88 : 65,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 8,
        },
        headerStyle: {
          backgroundColor: palette.card,
        },
        headerTintColor: palette.text,
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ title: "SnacKompare", headerShown: false }}
      />
      <Tab.Screen
        name="Favourites"
        component={FavouritesScreen}
        options={{ title: "Favourites" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profile" }}
      />
      <Tab.Screen
        name="Chatbot"
        component={AIChatbotScreen}
        options={{ title: "Chatbot" }}
      />
      {/* Got rid of assistant screen in the navbar for now */}
      <Tab.Screen
        name="CalorieTracker"
        component={CalorieTrackerStack}
        options={{ title: "Calorie Tracker", headerShown: false }}
      />
    </Tab.Navigator>
  );
}

function CalorieTrackerStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TakePhoto"
        component={TakePhotoScreen}
        options={{
          title: "Calorie Tracker",
          headerStyle: { backgroundColor: palette.card },
          headerTintColor: palette.text,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="MealPhotoCameraScreen"
        component={MealPhotoCameraScreen}
        options={{
          title: "Capture Meal",
          headerShown: true,
          headerStyle: { backgroundColor: "#000" },
          headerTintColor: "#fff",
        }}
      />
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SearchProducts"
        component={SearchProductsScreen}
        options={{
          title: "Search Products",
          headerStyle: {
            backgroundColor: palette.card,
          },
          headerTintColor: palette.text,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="Scan"
        component={require("./screens/ScanScreen").default}
        options={{
          title: "Scan Barcode",
          headerStyle: { backgroundColor: palette.card },
          headerTintColor: palette.text,
          headerShadowVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
}
