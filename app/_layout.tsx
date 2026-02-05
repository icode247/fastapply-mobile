import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as NavigationBar from "expo-navigation-bar";
import * as Notifications from "expo-notifications";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LoadingScreen } from "../src/components";
import { useTheme } from "../src/hooks";
import { notificationService } from "../src/services";
import { useAuthStore, useThemeStore } from "../src/stores";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function RootLayoutNav() {
  const router = useRouter();
  const segments = useSegments();

  const { isAuthenticated, isInitialized, hasCompletedOnboarding, initialize } =
    useAuthStore();
  const { initialize: initTheme, activeTheme } = useThemeStore();
  const { colors } = useTheme();

  const notificationListener = useRef<Notifications.Subscription | undefined>(
    undefined,
  );
  const responseListener = useRef<Notifications.Subscription | undefined>(
    undefined,
  );

  // Initialize stores on mount
  useEffect(() => {
    const init = async () => {
      await Promise.all([initialize(), initTheme()]);
    };
    init();
  }, []);

  // Set Android navigation bar color to match theme
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync(colors.background);
      NavigationBar.setButtonStyleAsync(
        activeTheme === "dark" ? "light" : "dark",
      );
    }
  }, [colors.background, activeTheme]);

  // Handle navigation based on auth state
  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inOnboardingGroup = segments[0] === "(onboarding)";

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to welcome screen if not authenticated
      router.replace("/(auth)/welcome");
    } else if (
      isAuthenticated &&
      !hasCompletedOnboarding &&
      !inOnboardingGroup
    ) {
      // Redirect to onboarding if authenticated but not completed onboarding
      router.replace("/(onboarding)/upload-resume");
    } else if (
      isAuthenticated &&
      hasCompletedOnboarding &&
      (inAuthGroup || inOnboardingGroup)
    ) {
      // Redirect to main app if authenticated and completed onboarding
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isInitialized, hasCompletedOnboarding, segments]);

  // Push Notifications Setup
  useEffect(() => {
    let isMounted = true;

    const registerForPushNotifications = async () => {
      if (isAuthenticated) {
        const token =
          await notificationService.registerForPushNotificationsAsync();
        if (token && isMounted) {
          await notificationService.updateServerToken(token);
        }
      }
    };

    registerForPushNotifications();

    notificationListener.current =
      notificationService.addNotificationReceivedListener((notification) => {
        // Handle foreground notification
        console.log("Notification received:", notification);
      });

    responseListener.current =
      notificationService.addNotificationResponseReceivedListener(
        (response) => {
          // Handle notification tap
          console.log("Notification tapped:", response);
          const data = response.notification.request.content.data;
          if (data?.url) {
            router.push((data as any).url);
          }
        },
      );

    return () => {
      isMounted = false;
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [isAuthenticated]);

  // Don't show loader during init - let native splash screen handle it
  // This prevents the loader from flashing on the welcome screen
  if (!isInitialized) {
    return null;
  }

  return (
    <>
      <StatusBar style={activeTheme === "dark" ? "light" : "dark"} />
      <ThemeProvider value={activeTheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
            headerStyle: {
              backgroundColor: colors.background,
            },
            headerTintColor: colors.text,
            headerTitleStyle: {
              fontWeight: "bold",
            },
            contentStyle: {
              backgroundColor: colors.background,
            },
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="application/[id]"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="profile/[id]"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="profile/edit/[id]"
            options={{
              headerShown: false,
            }}
          />
        </Stack>
      </ThemeProvider>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <RootLayoutNav />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
