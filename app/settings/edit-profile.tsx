import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Input } from "../../src/components";
import { spacing, typography } from "../../src/constants/theme";
import { useTheme } from "../../src/hooks";
import { userService } from "../../src/services";
import { User } from "../../src/types";

export default function EditProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const userData = await userService.getMe();
      setUser(userData);
      setName(userData.name || "");
    } catch (error) {
      console.error("Failed to fetch user:", error);
      Alert.alert("Error", "Failed to load user profile");
    } finally {
      setFetching(false);
    }
  };

  const handleUpdate = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    setLoading(true);
    try {
      await userService.updateMe({ name: name.trim() });
      Alert.alert("Success", "Profile updated successfully", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Failed to update profile:", error);
      Alert.alert("Error", "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing[2],
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + spacing[4] },
          ]}
        >
          {fetching ? (
            <Text style={{ color: colors.textSecondary, textAlign: "center" }}>
              Loading...
            </Text>
          ) : (
            <>
              <View style={styles.formGroup}>
                <Input
                  label="Full Name"
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.formGroup}>
                <Input
                  label="Email"
                  value={user?.email || ""}
                  editable={false}
                  placeholder="Email address"
                />
                <Text
                  style={[styles.helperText, { color: colors.textTertiary }]}
                >
                  Email cannot be changed
                </Text>
              </View>
            </>
          )}
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: insets.bottom + spacing[4],
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <Button
            title="Save Changes"
            onPress={handleUpdate}
            loading={loading}
            disabled={fetching || loading}
          />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    borderBottomWidth: 1,
  },
  backButton: {
    padding: spacing[1],
  },
  title: {
    fontSize: 18,
    fontFamily: typography.fontFamily.bold,
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: spacing[4],
  },
  formGroup: {
    marginBottom: spacing[6],
  },
  helperText: {
    marginTop: spacing[1],
    fontSize: 12,
    paddingLeft: spacing[1],
  },
  footer: {
    padding: spacing[4],
    borderTopWidth: 1,
  },
});
