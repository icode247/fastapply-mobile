import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Platform,
  RefreshControl,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../src/components/ui/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { borderRadius, spacing, uiScale } from "../src/constants/theme";
import { useTheme } from "../src/hooks";

type NotificationType = "application" | "match" | "system";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
}

interface NotificationSection {
  title: string;
  data: Notification[];
}

const ICON_MAP: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  application: "briefcase",
  match: "sparkles",
  system: "information-circle",
};

const initialNotifications: Notification[] = [
  {
    id: "1",
    type: "application",
    title: "Application Submitted",
    description: "Your application to Google for Senior Engineer was submitted",
    timestamp: "2h ago",
    read: false,
  },
  {
    id: "2",
    type: "match",
    title: "New Jobs Match",
    description: "5 new jobs match your Software Engineer preferences",
    timestamp: "4h ago",
    read: false,
  },
  {
    id: "3",
    type: "application",
    title: "Application Viewed",
    description: "Amazon has viewed your application for Product Manager",
    timestamp: "Yesterday",
    read: false,
  },
  {
    id: "4",
    type: "application",
    title: "Interview Invitation",
    description:
      "You've been invited to interview at Meta for Frontend Developer",
    timestamp: "Yesterday",
    read: true,
  },
  {
    id: "5",
    type: "system",
    title: "Welcome to Scout",
    description: "Complete your profile to start applying",
    timestamp: "3d ago",
    read: true,
  },
  {
    id: "6",
    type: "system",
    title: "Credits Running Low",
    description:
      "You have 3 credits remaining. Earn more by referring friends",
    timestamp: "5d ago",
    read: true,
  },
];

function groupNotifications(items: Notification[]): NotificationSection[] {
  const today: Notification[] = [];
  const yesterday: Notification[] = [];
  const earlier: Notification[] = [];

  for (const n of items) {
    if (n.timestamp.includes("ago") && !n.timestamp.includes("d ago")) {
      today.push(n);
    } else if (n.timestamp === "Yesterday") {
      yesterday.push(n);
    } else {
      earlier.push(n);
    }
  }

  const sections: NotificationSection[] = [];
  if (today.length > 0) sections.push({ title: "Today", data: today });
  if (yesterday.length > 0)
    sections.push({ title: "Yesterday", data: yesterday });
  if (earlier.length > 0) sections.push({ title: "Earlier", data: earlier });
  return sections;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [notifications, setNotifications] =
    useState<Notification[]>(initialNotifications);
  const [refreshing, setRefreshing] = useState(false);

  const sections = groupNotifications(notifications);

  const toggleRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)),
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  }, []);

  const getIconColor = (type: NotificationType): string => {
    switch (type) {
      case "application":
        return colors.primary;
      case "match":
        return colors.success;
      case "system":
        return colors.secondary;
    }
  };

  const hasUnread = notifications.some((n) => !n.read);

  const renderItem = ({ item }: { item: Notification }) => {
    const iconColor = getIconColor(item.type);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => toggleRead(item.id)}
        style={[
          styles.notificationItem,
          {
            backgroundColor: item.read
              ? "transparent"
              : isDark
                ? colors.surfaceSecondary
                : colors.primary50,
          },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: iconColor + "20" }]}>
          <Ionicons
            name={ICON_MAP[item.type]}
            size={Math.round(20 * uiScale)}
            color={iconColor}
          />
        </View>
        <View style={styles.contentContainer}>
          <Text
            style={[styles.itemTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            style={[styles.itemDescription, { color: colors.textSecondary }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
          <Text style={[styles.itemTimestamp, { color: colors.textTertiary }]}>
            {item.timestamp}
          </Text>
        </View>
        {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({
    section,
  }: {
    section: NotificationSection;
  }) => (
    <View
      style={[styles.sectionHeader, { backgroundColor: colors.background }]}
    >
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        {section.title}
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing[3],
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="chevron-back"
            size={Math.round(24 * uiScale)}
            color={colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Notifications
        </Text>
        {hasUnread ? (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={[styles.markAllText, { color: colors.primary }]}>
              Mark all read
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.markAllBtn} />
        )}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={{
          paddingBottom: insets.bottom + spacing[6],
        }}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-off-outline"
              size={Math.round(48 * uiScale)}
              color={colors.textTertiary}
            />
            <Text
              style={[styles.emptyText, { color: colors.textSecondary }]}
            >
              No notifications yet
            </Text>
          </View>
        }
      />
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
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: Math.round(36 * uiScale),
    height: Math.round(36 * uiScale),
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    fontSize: Math.round(20 * uiScale),
    fontWeight: "700",
    textAlign: "center",
  },
  markAllBtn: {
    minWidth: Math.round(90 * uiScale),
    alignItems: "flex-end",
  },
  markAllText: {
    fontSize: Math.round(14 * uiScale),
    fontWeight: "600",
  },
  sectionHeader: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[2],
  },
  sectionTitle: {
    fontSize: Math.round(13 * uiScale),
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4],
  },
  iconCircle: {
    width: Math.round(40 * uiScale),
    height: Math.round(40 * uiScale),
    borderRadius: Math.round(20 * uiScale),
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    marginLeft: spacing[3],
    marginRight: spacing[3],
  },
  itemTitle: {
    fontSize: Math.round(15 * uiScale),
    fontWeight: "600",
  },
  itemDescription: {
    fontSize: Math.round(13 * uiScale),
    marginTop: 2,
    lineHeight: Math.round(18 * uiScale),
  },
  itemTimestamp: {
    fontSize: Math.round(12 * uiScale),
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: spacing[20],
    gap: spacing[3],
  },
  emptyText: {
    fontSize: Math.round(16 * uiScale),
    fontWeight: "500",
  },
});
