import Constants from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";
import userService from "./user.service";

// Check if running in Expo Go (where push notifications are not supported in SDK 53+)
const isExpoGo = Constants.appOwnership === "expo";

// Dynamically import notifications only when not in Expo Go
let Notifications: typeof import("expo-notifications") | null = null;

if (!isExpoGo) {
  Notifications = require("expo-notifications");

  // Configure notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} else {
  console.log(
    "expo-notifications: Running in Expo Go - push notifications disabled. Use a development build for full functionality."
  );
}

export const notificationService = {
  /**
   * Register device for push notifications
   * Returns the token if successful, null otherwise
   */
  async registerForPushNotificationsAsync(): Promise<string | null> {
    if (!Notifications) {
      console.log("Push notifications not available in Expo Go");
      return null;
    }

    let token = null;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#FF231F7C",
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("Failed to get push token for push notification!");
        return null;
      }

      try {
        const projectId =
          Constants?.expoConfig?.extra?.eas?.projectId ||
          Constants?.easConfig?.projectId;

        // Simplify web handling
        if (Platform.OS === "web") {
          console.log(
            "Push notifications on web require VAPID key. Skipping for now to avoid errors."
          );
          return null;
        }

        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId,
        });
        token = tokenData.data;
        console.log("Expo Push Token:", token);
      } catch (e: any) {
        console.log("Error fetching push token", e);
      }
    } else {
      console.log("Must use physical device for Push Notifications");
    }

    return token;
  },

  /**
   * Send token to backend
   */
  async updateServerToken(token: string) {
    try {
      await userService.updatePushToken(token);
      console.log("Push token updated on server");
    } catch (error) {
      console.log("Failed to update push token on server", error);
    }
  },

  /**
   * Add listener for incoming notifications (foreground)
   */
  addNotificationReceivedListener(
    callback: (notification: any) => void
  ): { remove: () => void } {
    if (!Notifications) {
      return { remove: () => {} };
    }
    return Notifications.addNotificationReceivedListener(callback);
  },

  /**
   * Add listener for user tapping notification
   */
  addNotificationResponseReceivedListener(
    callback: (response: any) => void
  ): { remove: () => void } {
    if (!Notifications) {
      return { remove: () => {} };
    }
    return Notifications.addNotificationResponseReceivedListener(callback);
  },

  /**
   * Reduce badge count
   */
  async clearBadge() {
    if (!Notifications) return;
    if (Platform.OS === "ios") {
      await Notifications.setBadgeCountAsync(0);
    }
  },
};
