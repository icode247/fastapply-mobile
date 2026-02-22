import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Maximize2, Minimize2, MonitorPlay } from "lucide-react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "../src/components/ui/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { spacing, typography, uiScale } from "../src/constants/theme";
import { useTheme } from "../src/hooks";
import { automationService } from "../src/services/automation.service";
import { LiveSession } from "../src/types/automation.types";

export default function LiveSessionsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const webViewRef = useRef<WebView>(null);

  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(
    null,
  );
  const [playerLoading, setPlayerLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await automationService.getLiveSessions();
      setSessions(data);

      // Auto-select first active session if none selected
      if (!selectedSession && data.length > 0) {
        const active = data.find((s) => s.status === "active");
        if (active) {
          setSelectedSession(active);
          setPlayerLoading(true);
        }
      }
    } catch (error) {
      console.error("Failed to fetch live sessions:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedSession]);

  useEffect(() => {
    fetchSessions();
  }, []);

  // Poll for session updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      const data = await automationService.getLiveSessions();
      setSessions(data);

      // If selected session disconnected, clear it
      if (selectedSession) {
        const updated = data.find((s) => s.id === selectedSession.id);
        if (updated && updated.status === "disconnected") {
          setSelectedSession(null);
          setIsFullscreen(false);
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedSession]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchSessions();
  }, [fetchSessions]);

  const handleSelectSession = useCallback((session: LiveSession) => {
    setSelectedSession(session);
    setPlayerLoading(true);
  }, []);

  const handleBack = useCallback(() => {
    if (isFullscreen) {
      setIsFullscreen(false);
      return;
    }
    router.back();
  }, [router, isFullscreen]);

  // Build the live view URL with navbar hidden
  const getLiveViewUrl = (session: LiveSession) => {
    const url = session.liveViewUrl;
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}navbar=false`;
  };

  const getStatusColor = (status: LiveSession["status"]) => {
    switch (status) {
      case "active":
        return colors.success;
      case "completed":
        return colors.primary;
      case "disconnected":
        return colors.textTertiary;
    }
  };

  const activeSessions = sessions.filter((s) => s.status === "active");
  const pastSessions = sessions.filter((s) => s.status !== "active");

  // Fullscreen mode - WebView takes over the entire screen
  if (isFullscreen && selectedSession) {
    return (
      <View style={[styles.container, { backgroundColor: "#000" }]}>
        <StatusBar hidden />
        <WebView
          ref={webViewRef}
          source={{ uri: getLiveViewUrl(selectedSession) }}
          style={styles.fullscreenWebView}
          javaScriptEnabled
          domStorageEnabled
          allowsInlineMediaPlayback
          mediaPlaybackRequiresUserAction={false}
          onLoadStart={() => setPlayerLoading(true)}
          onLoadEnd={() => setPlayerLoading(false)}
          onMessage={(event) => {
            if (event.nativeEvent.data === "browserbase-disconnected") {
              setSelectedSession(null);
              setIsFullscreen(false);
            }
          }}
          injectedJavaScript={`
            window.addEventListener("message", function(event) {
              if (event.data === "browserbase-disconnected") {
                window.ReactNativeWebView.postMessage("browserbase-disconnected");
              }
            });
            true;
          `}
        />

        {playerLoading && (
          <View style={styles.playerLoadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text
              style={[styles.playerLoadingText, { color: "#FFFFFF" }]}
            >
              Connecting to session...
            </Text>
          </View>
        )}

        {/* Floating top bar */}
        <View
          style={[
            styles.fullscreenTopBar,
            { paddingTop: insets.top + 4 },
          ]}
        >
          <Pressable
            style={styles.fullscreenButton}
            onPress={() => setIsFullscreen(false)}
          >
            <Minimize2 size={20} color="#FFFFFF" strokeWidth={2} />
          </Pressable>

          <View style={styles.fullscreenInfo}>
            <View style={[styles.nowPlayingDot, { backgroundColor: colors.success }]} />
            <Text style={styles.fullscreenTitle} numberOfLines={1}>
              {selectedSession.jobTitle || "Applying..."}
            </Text>
            <Text style={styles.fullscreenSubtitle} numberOfLines={1}>
              {selectedSession.companyName || "Unknown"}
            </Text>
          </View>

          <Pressable
            style={styles.fullscreenButton}
            onPress={handleBack}
          >
            <Ionicons name="close" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Ionicons
            name="chevron-back"
            size={Math.round(24 * uiScale)}
            color={colors.text}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Live Sessions
        </Text>
        <View style={styles.backButton} />
      </View>

      {/* Player area */}
      <View
        style={[
          styles.playerContainer,
          { backgroundColor: isDark ? "#0B0D0E" : "#F0F4F8" },
        ]}
      >
        {selectedSession ? (
          <>
            <WebView
              ref={webViewRef}
              source={{ uri: getLiveViewUrl(selectedSession) }}
              style={styles.webView}
              javaScriptEnabled
              domStorageEnabled
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              onLoadStart={() => setPlayerLoading(true)}
              onLoadEnd={() => setPlayerLoading(false)}
              onMessage={(event) => {
                if (event.nativeEvent.data === "browserbase-disconnected") {
                  setSelectedSession(null);
                }
              }}
              injectedJavaScript={`
                window.addEventListener("message", function(event) {
                  if (event.data === "browserbase-disconnected") {
                    window.ReactNativeWebView.postMessage("browserbase-disconnected");
                  }
                });
                true;
              `}
            />
            {playerLoading && (
              <View style={styles.playerLoadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text
                  style={[styles.playerLoadingText, { color: colors.textSecondary }]}
                >
                  Connecting to session...
                </Text>
              </View>
            )}
            {/* Now playing bar */}
            <View
              style={[
                styles.nowPlaying,
                { backgroundColor: isDark ? "#171A1C" : "#FFFFFF" },
              ]}
            >
              <View
                style={[styles.nowPlayingDot, { backgroundColor: colors.success }]}
              />
              <View style={styles.nowPlayingInfo}>
                <Text
                  style={[styles.nowPlayingTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {selectedSession.jobTitle || "Applying..."}
                </Text>
                <Text
                  style={[
                    styles.nowPlayingSubtitle,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {selectedSession.companyName || "Unknown company"}
                  {selectedSession.platform
                    ? ` · ${selectedSession.platform}`
                    : ""}
                </Text>
              </View>
              <Pressable
                style={styles.fullscreenToggle}
                onPress={() => setIsFullscreen(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Maximize2 size={18} color={colors.textSecondary} strokeWidth={2} />
              </Pressable>
            </View>
          </>
        ) : (
          <View style={styles.emptyPlayer}>
            <MonitorPlay
              size={48}
              color={colors.textTertiary}
              strokeWidth={1.2}
            />
            <Text
              style={[styles.emptyPlayerText, { color: colors.textTertiary }]}
            >
              {isLoading
                ? "Loading sessions..."
                : sessions.length === 0
                  ? "No active sessions"
                  : "Select a session to watch"}
            </Text>
          </View>
        )}
      </View>

      {/* Session list */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : sessions.length === 0 ? (
          <View style={styles.emptyList}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Sessions
            </Text>
            <Text
              style={[styles.emptySubtitle, { color: colors.textSecondary }]}
            >
              Sessions appear here when automations are running. Swipe right on
              jobs to queue them for automation.
            </Text>
          </View>
        ) : (
          <>
            {/* Active sessions */}
            {activeSessions.length > 0 && (
              <>
                <Text
                  style={[styles.sectionTitle, { color: colors.textSecondary }]}
                >
                  ACTIVE ({activeSessions.length})
                </Text>
                {activeSessions.map((session) => (
                  <Pressable
                    key={session.id}
                    style={[
                      styles.sessionCard,
                      {
                        backgroundColor: isDark
                          ? colors.surfaceSecondary
                          : colors.surface,
                        borderColor:
                          selectedSession?.id === session.id
                            ? colors.primary
                            : colors.border,
                        borderWidth:
                          selectedSession?.id === session.id ? 1.5 : 1,
                      },
                    ]}
                    onPress={() => handleSelectSession(session)}
                  >
                    <View style={styles.sessionRow}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: getStatusColor(session.status),
                          },
                        ]}
                      />
                      <View style={styles.sessionInfo}>
                        <Text
                          style={[styles.sessionTitle, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {session.jobTitle || "Processing application"}
                        </Text>
                        <Text
                          style={[
                            styles.sessionSubtitle,
                            { color: colors.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {session.companyName || "Unknown"}
                          {session.platform
                            ? ` · ${session.platform}`
                            : ""}
                        </Text>
                      </View>
                      {selectedSession?.id === session.id && (
                        <View
                          style={[
                            styles.playingBadge,
                            { backgroundColor: colors.primary + "20" },
                          ]}
                        >
                          <Text
                            style={[
                              styles.playingBadgeText,
                              { color: colors.primary },
                            ]}
                          >
                            WATCHING
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                ))}
              </>
            )}

            {/* Past sessions */}
            {pastSessions.length > 0 && (
              <>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: colors.textSecondary, marginTop: spacing[4] },
                  ]}
                >
                  RECENT ({pastSessions.length})
                </Text>
                {pastSessions.map((session) => (
                  <Pressable
                    key={session.id}
                    style={[
                      styles.sessionCard,
                      {
                        backgroundColor: isDark
                          ? colors.surfaceSecondary
                          : colors.surface,
                        borderColor: colors.border,
                        opacity: session.status === "disconnected" ? 0.6 : 1,
                      },
                    ]}
                    onPress={() => {
                      if (session.status === "completed") {
                        handleSelectSession(session);
                      }
                    }}
                  >
                    <View style={styles.sessionRow}>
                      <View
                        style={[
                          styles.statusDot,
                          {
                            backgroundColor: getStatusColor(session.status),
                          },
                        ]}
                      />
                      <View style={styles.sessionInfo}>
                        <Text
                          style={[styles.sessionTitle, { color: colors.text }]}
                          numberOfLines={1}
                        >
                          {session.jobTitle || "Application"}
                        </Text>
                        <Text
                          style={[
                            styles.sessionSubtitle,
                            { color: colors.textSecondary },
                          ]}
                          numberOfLines={1}
                        >
                          {session.companyName || "Unknown"}
                          {session.platform
                            ? ` · ${session.platform}`
                            : ""}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.sessionStatus,
                          { color: getStatusColor(session.status) },
                        ]}
                      >
                        {session.status === "completed"
                          ? "Replay"
                          : "Disconnected"}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </>
            )}
          </>
        )}

        {/* Bottom spacing */}
        <View style={{ height: insets.bottom + 20 }} />
      </ScrollView>
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
    paddingBottom: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
  },

  // Player
  playerContainer: {
    height: 260,
    position: "relative",
  },
  webView: {
    flex: 1,
  },
  playerLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  playerLoadingText: {
    fontSize: typography.fontSize.sm,
  },
  nowPlaying: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    gap: spacing[2],
  },
  nowPlayingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nowPlayingInfo: {
    flex: 1,
  },
  nowPlayingTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
  },
  nowPlayingSubtitle: {
    fontSize: typography.fontSize.xs,
    marginTop: 1,
  },
  fullscreenToggle: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyPlayer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyPlayerText: {
    fontSize: typography.fontSize.sm,
  },

  // Fullscreen
  fullscreenWebView: {
    flex: 1,
    backgroundColor: "#000",
  },
  fullscreenTopBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[3],
    paddingBottom: spacing[2],
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  fullscreenButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  fullscreenInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[2],
  },
  fullscreenTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: "600",
    color: "#FFFFFF",
    flexShrink: 1,
  },
  fullscreenSubtitle: {
    fontSize: typography.fontSize.xs,
    color: "rgba(255,255,255,0.7)",
    flexShrink: 1,
  },

  // List
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[4],
  },
  loadingContainer: {
    paddingVertical: spacing[8],
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: spacing[2],
  },
  sessionCard: {
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    marginBottom: spacing[2],
    borderWidth: 1,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[3],
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: "600",
  },
  sessionSubtitle: {
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  sessionStatus: {
    fontSize: typography.fontSize.xs,
    fontWeight: "600",
  },
  playingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  playingBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Empty state
  emptyList: {
    paddingVertical: spacing[12],
    alignItems: "center",
    paddingHorizontal: spacing[6],
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: "700",
    marginBottom: spacing[2],
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    textAlign: "center",
    lineHeight: 20,
  },
});
