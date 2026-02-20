import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { Platform, ActivityIndicator, View } from "react-native";
import { useState, useEffect } from "react";

import GoalScreen from "./onboard/GoalScreen";
import DietScreen from "./onboard/DietScreen";
import { getOnboardingCompleteFromCloud } from "./services/storage";
import AuthScreen from "./screens/AuthScreen";
import HomeScreen from "./screens/HomeScreen";
import SearchProductsScreen from "./screens/SearchProductsScreen";
import CompareProductsScreen from "./screens/CompareProductsScreen";
import FavouritesScreen from "./screens/FavouritesScreen";
import SettingsScreen from "./screens/SettingsScreen";
import AIChatbotScreen from "./screens/AIChatbotScreen";
import TakePhotoScreen from "./screens/TakePhotoScreen";
import MealPhotoCameraScreen from "./screens/MealPhotoCameraScreen";
import CalorieCountScreen from "./screens/CalorieCountScreen";
import ScanScreen from "./screens/ScanScreen";
import { CalorieTotalProvider } from "./context/CalorieTotalContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { palette } from "./theme";
import StatsActivityScreen from "./onboard/StatsActivityScreen";

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
          } else if (route.name === "CalorieCounter") {
            iconName = focused ? "flame" : "flame-outline";
          } else if (route.name === "MealTracker") {
            iconName = focused ? "camera" : "camera-outline";
          } else if (route.name === "Profile") {
            iconName = focused ? "person" : "person-outline";
          } else if (route.name === "DietCoach") {
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
        name="CalorieCounter"
        component={CalorieCountScreen}
        options={{ title: "Calorie Counter" }}
      />
      <Tab.Screen
        name="MealTracker"
        component={MealTrackerStack}
        options={{ title: "Meal Tracker", headerShown: false }}
      />
      <Tab.Screen
        name="DietCoach"
        component={AIChatbotScreen}
        options={{ title: "Diet Coach" }}
      />
    </Tab.Navigator>
  );
}

function MealTrackerStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="TakePhoto"
        component={TakePhotoScreen}
        options={{
          title: "Meal Tracker",
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
          title: "",
          headerStyle: {
            backgroundColor: palette.card,
          },
          headerTintColor: palette.text,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="Scan"
        component={ScanScreen}
        options={{
          title: "Scan Barcode",
          headerStyle: { backgroundColor: palette.card },
          headerTintColor: palette.text,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="Favourites"
        component={FavouritesScreen}
        options={{
          title: "Favourites",
          headerStyle: { backgroundColor: palette.card },
          headerTintColor: palette.text,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="CompareProducts"
        component={CompareProductsScreen}
        options={{
          title: "Compare Products",
          headerTitleAlign: "center",
          headerStyle: { backgroundColor: palette.card },
          headerTintColor: palette.text,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Profile",
          headerStyle: { backgroundColor: palette.card },
          headerTintColor: palette.text,
          headerShadowVisible: false,
        }}
      />
    </Stack.Navigator>
  );
}

function OnboardingStack({ onComplete }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OnboardingGoal" component={GoalScreen} />
      <Stack.Screen name="OnboardingStatsActivity" component={StatsActivityScreen} />
      <Stack.Screen name="OnboardingDiet">
        {(props) => <DietScreen {...props} onComplete={onComplete} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}


function AppContent() {
  // Check auth state and onboarding status
  const { user, loading } = useAuth();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!user) {
        setOnboardingComplete(false);
        setCheckingOnboarding(false);
        return;
      }

       // We have a user, so check Firestore
      setCheckingOnboarding(true);
      const done = await getOnboardingCompleteFromCloud();
      if (!cancelled) {
        setOnboardingComplete(done);
        setCheckingOnboarding(false);
      }
    }

    if (!loading) run();
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  //loading spinning while we check auth and onboarding status
  if (loading || checkingOnboarding) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: palette.bg }}>
        <ActivityIndicator size="large" color={palette.accent} />
      </View>
    );
  }

  //if onboarding is not complete, show the onboarding else show the main app
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : !onboardingComplete ? (
        <Stack.Screen name="Onboarding">
          {(props) => (
            <OnboardingStack
              {...props}
              onComplete={() => setOnboardingComplete(true)}
            />
          )}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Main" component={TabNavigator} />
      )}
    </Stack.Navigator>
  );
}



export default function App() {
  return (
    <AuthProvider>
      <CalorieTotalProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </CalorieTotalProvider>
    </AuthProvider>
  );
}
