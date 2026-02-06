import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Text } from "../../src/components/ui/Text";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { borderRadius, spacing, uiScale } from "../../src/constants/theme";
import { useTheme } from "../../src/hooks";
import { automationService } from "../../src/services/automation.service";
import {
  getPendingSwipedJobs,
  PendingSwipedJob,
} from "../../src/services/pendingSwipes.service";
import {
  ensureCacheLoaded,
  getAllCachedJobs,
  SwipedJobDetails,
} from "../../src/services/swipedJobsCache.service";
import { AutomationUrl, UrlStatus } from "../../src/types/automation.types";

const { width } = Dimensions.get("window");

// Helper function to format relative time
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

type FilterStatus =
  | "all"
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "skipped";

const FILTERS: { label: string; value: FilterStatus; color: string }[] = [
  { label: "All", value: "all", color: "#0ea5e9" },
  { label: "Pending", value: "pending", color: "#F59E0B" },
  { label: "Processing", value: "processing", color: "#8B5CF6" },
  { label: "Completed", value: "completed", color: "#10B981" },
  { label: "Failed", value: "failed", color: "#EF4444" },
];

// Animated filter chip
const FilterChip: React.FC<{
  label: string;
  value: FilterStatus;
  color: string;
  isActive: boolean;
  onPress: () => void;
  delay: number;
}> = ({ label, value, color, isActive, onPress, delay }) => {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const { colors, isDark } = useTheme();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 500,
        delay,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.95,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[{ opacity, transform: [{ translateY }, { scale }] }]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {isActive ? (
          <LinearGradient
            colors={[color, color + "CC"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.filterChipActive}
          >
            <Text style={styles.filterChipTextActive}>{label}</Text>
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.filterChip,
              {
                backgroundColor: isDark
                  ? colors.surfaceSecondary
                  : colors.level1,
              },
            ]}
          >
            <Text
              style={[styles.filterChipText, { color: colors.textSecondary }]}
            >
              {label}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// Pending swipe item (local, not yet sent to backend)
const PendingSwipeItem: React.FC<{
  job: PendingSwipedJob;
  index: number;
}> = ({ job, index }) => {
  const translateX = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { colors, isDark } = useTheme();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 600,
        delay: 100 + index * 80,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: 100 + index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const swipedTimeAgo = getRelativeTime(new Date(job.swipedAt).toISOString());

  return (
    <Animated.View
      style={[
        styles.applicationItem,
        {
          opacity,
          transform: [{ translateX }],
          backgroundColor: isDark ? colors.surfaceSecondary : colors.surface,
        },
      ]}
    >
      <View style={styles.applicationItemInner}>
        {/* Company Logo */}
        <View
          style={[styles.companyLogo, { backgroundColor: "#64748B" + "20" }]}
        >
          <Text style={[styles.logoText, { color: "#64748B" }]}>
            {job.company[0]?.toUpperCase() || "?"}
          </Text>
        </View>

        {/* Main Info */}
        <View style={styles.mainInfo}>
          <View style={styles.topRow}>
            <Text
              style={[styles.companyName, { color: colors.text, flex: 1 }]}
              numberOfLines={1}
            >
              {job.company}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: "#64748B" + "20", flexShrink: 0 },
              ]}
            >
              <Ionicons
                name="time-outline"
                size={Math.round(12 * uiScale)}
                color="#64748B"
              />
              <Text style={[styles.statusText, { color: "#64748B" }]}>
                Queued
              </Text>
            </View>
          </View>
          <Text
            style={[styles.positionText, { color: colors.text }]}
            numberOfLines={1}
          >
            {job.title}
          </Text>
          <View style={styles.detailsRow}>
            <View style={[styles.detailItem, { flex: 1 }]}>
              <Ionicons
                name="globe-outline"
                size={Math.round(14 * uiScale)}
                color={colors.textTertiary}
              />
              <Text
                style={[
                  styles.detailText,
                  { color: colors.textSecondary, flex: 1 },
                ]}
                numberOfLines={1}
              >
                {job.platform || "Job Board"}
              </Text>
            </View>
          </View>
          <Text style={[styles.appliedText, { color: colors.textTertiary }]}>
            Swiped {swipedTimeAgo}
          </Text>
        </View>

        {/* Pending indicator instead of arrow */}
        <ActivityIndicator size="small" color="#64748B" />
      </View>
    </Animated.View>
  );
};

// Application list item
const ApplicationItem: React.FC<{
  id: string;
  company: string;
  position: string;
  location: string;
  salary: string;
  status: FilterStatus;
  appliedAt: string;
  logo: string;
  index: number;
  onPress: () => void;
}> = ({
  company,
  position,
  location,
  salary,
  status,
  appliedAt,
  logo,
  index,
  onPress,
}) => {
  const translateX = useRef(new Animated.Value(60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const { colors, isDark } = useTheme();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: 0,
        duration: 600,
        delay: 200 + index * 80,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: 200 + index * 80,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index]);

  const statusConfig: Record<
    string,
    { color: string; label: string; icon: keyof typeof Ionicons.glyphMap }
  > = {
    pending: { color: "#F59E0B", label: "Pending", icon: "time" },
    processing: { color: "#8B5CF6", label: "Processing", icon: "sync" },
    completed: { color: "#10B981", label: "Completed", icon: "checkmark-done-circle" },
    failed: { color: "#EF4444", label: "Failed", icon: "alert-circle" },
    skipped: { color: "#6B7280", label: "Skipped", icon: "remove-circle" },
    // Legacy statuses for backward compatibility
    applied: { color: "#3B82F6", label: "Applied", icon: "checkmark-circle" },
    submitted: { color: "#3B82F6", label: "Applied", icon: "checkmark-circle" },
  };

  const config = statusConfig[status] || statusConfig.pending;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.98,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      tension: 100,
      friction: 10,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.applicationItem,
        {
          opacity,
          transform: [{ translateX }, { scale }],
          backgroundColor: isDark ? colors.surfaceSecondary : colors.surface,
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.applicationItemInner}
      >
        {/* Company Logo */}
        <View
          style={[styles.companyLogo, { backgroundColor: config.color + "20" }]}
        >
          <Text style={[styles.logoText, { color: config.color }]}>{logo}</Text>
        </View>

        {/* Main Info */}
        <View style={styles.mainInfo}>
          <View style={styles.topRow}>
            <Text
              style={[styles.companyName, { color: colors.text, flex: 1 }]}
              numberOfLines={1}
            >
              {company}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: config.color + "20", flexShrink: 0 },
              ]}
            >
              <Ionicons name={config.icon} size={Math.round(12 * uiScale)} color={config.color} />
              <Text style={[styles.statusText, { color: config.color }]}>
                {config.label}
              </Text>
            </View>
          </View>
          <Text
            style={[styles.positionText, { color: colors.text }]}
            numberOfLines={1}
          >
            {position}
          </Text>
          <View style={styles.detailsRow}>
            <View style={[styles.detailItem, { flex: 1 }]}>
              <Ionicons
                name="location-outline"
                size={Math.round(14 * uiScale)}
                color={colors.textTertiary}
              />
              <Text
                style={[styles.detailText, { color: colors.textSecondary, flex: 1 }]}
                numberOfLines={1}
              >
                {location}
              </Text>
            </View>
            {salary ? (
              <View style={[styles.detailItem, { flex: 1 }]}>
                <Ionicons
                  name="cash-outline"
                  size={Math.round(14 * uiScale)}
                  color={colors.textTertiary}
                />
                <Text
                  style={[styles.detailText, { color: colors.textSecondary, flex: 1 }]}
                  numberOfLines={1}
                >
                  {salary}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.appliedText, { color: colors.textTertiary }]}>
            Applied {appliedAt}
          </Text>
        </View>

        {/* Arrow */}
        <Ionicons
          name="chevron-forward"
          size={Math.round(20 * uiScale)}
          color={colors.textTertiary}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};
const ApplicationsHeader: React.FC<{
  totalCount: number;
  offerCount: number;
  interviewCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeFilter: FilterStatus;
  setActiveFilter: (f: FilterStatus) => void;
  FILTERS: any[];
  headerOpacity: Animated.Value;
  searchScale: Animated.Value;
  colors: any;
  isDark: boolean;
}> = ({
  totalCount,
  offerCount,
  interviewCount,
  searchQuery,
  setSearchQuery,
  activeFilter,
  setActiveFilter,
  FILTERS,
  headerOpacity,
  searchScale,
  colors,
  isDark,
}) => {
  return (
    <View style={{ marginBottom: spacing[4] }}>
      {/* Header */}
      <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
        <Text style={[styles.title, { color: colors.text }]}>Applications</Text>
        <View style={styles.headerStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {totalCount}
            </Text>
            <Text
              style={[styles.statLabel, { color: colors.textSecondary }]}
            >
              Total
            </Text>
          </View>
          <View
            style={[
              styles.statDivider,
              {
                backgroundColor: colors.border,
              },
            ]}
          />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#10B981" }]}>
              {offerCount}
            </Text>
            <Text
              style={[styles.statLabel, { color: colors.textSecondary }]}
            >
              Completed
            </Text>
          </View>
          <View
            style={[
              styles.statDivider,
              {
                backgroundColor: colors.border,
              },
            ]}
          />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: "#0284c7" }]}>
              {interviewCount}
            </Text>
            <Text
              style={[styles.statLabel, { color: colors.textSecondary }]}
            >
              Processing
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Search */}
      <Animated.View
        style={[
          styles.searchContainer,
          {
            transform: [{ scale: searchScale }],
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={Math.round(20 * uiScale)}
          color={colors.textSecondary}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search companies or positions..."
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons
              name="close-circle"
              size={Math.round(20 * uiScale)}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersScroll}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTERS.map((filter, index) => (
          <FilterChip
            key={filter.value}
            label={filter.label}
            value={filter.value}
            color={filter.color}
            isActive={activeFilter === filter.value}
            onPress={() => setActiveFilter(filter.value)}
            delay={100 + index * 50}
          />
        ))}
      </ScrollView>

      {/* Results count */}
      <View style={styles.resultsHeader}>
        <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
          {totalCount} applications
        </Text>
        <TouchableOpacity style={styles.sortButton}>
          <Ionicons name="swap-vertical" size={Math.round(18 * uiScale)} color={colors.primary} />
          <Text style={[styles.sortText, { color: colors.primary }]}>Sort</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function ApplicationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  // State
  const [activeFilter, setActiveFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [urlEntries, setUrlEntries] = useState<AutomationUrl[]>([]);
  const [pendingSwipes, setPendingSwipes] = useState<PendingSwipedJob[]>([]);
  const [cachedJobs, setCachedJobs] = useState<Record<string, SwipedJobDetails>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Stats State
  const [completedCount, setCompletedCount] = useState(0);
  const [processingCount, setProcessingCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  // Debounce search
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Header animation
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const searchScale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(searchScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const fetchJobUrls = React.useCallback(
    async () => {
      try {
        setIsLoading(true);

        // Map filter to API status
        const statusFilter: UrlStatus | undefined =
          activeFilter !== "all" ? activeFilter as UrlStatus : undefined;

        // Ensure cache is loaded first
        await ensureCacheLoaded();

        // Fetch URLs, stats, local pending, and cached jobs in parallel
        const [urlsResponse, statsResponse, localPending, cached] = await Promise.all([
          automationService.getAllUserUrls(statusFilter),
          automationService.getUserUrlStats(),
          getPendingSwipedJobs(),
          getAllCachedJobs(),
        ]);

        // Update stats
        if (statsResponse) {
          setCompletedCount(statsResponse.completed || 0);
          setProcessingCount(statsResponse.processing || 0);
          setPendingCount(statsResponse.pending || 0);
          setFailedCount(statsResponse.failed || 0);
        }

        setPendingSwipes(localPending);
        setCachedJobs(cached);

        // Filter by search query if present (search in both backend data and cached data)
        let filteredUrls = urlsResponse.data || [];
        if (debouncedSearchQuery) {
          const query = debouncedSearchQuery.toLowerCase();
          filteredUrls = filteredUrls.filter((url) => {
            // Get cached job details for this URL
            const cachedJob = cached[url.jobUrl];
            const title = url.jobTitle || cachedJob?.title || "";
            const company = url.companyName || cachedJob?.company || "";

            return (
              title.toLowerCase().includes(query) ||
              company.toLowerCase().includes(query) ||
              url.jobUrl?.toLowerCase().includes(query)
            );
          });
        }

        setUrlEntries(filteredUrls);
        setTotalCount(filteredUrls.length);
      } catch (error) {
        console.error("Failed to fetch job URLs:", error);
      } finally {
        setIsLoading(false);
        setRefreshing(false);
      }
    },
    [activeFilter, debouncedSearchQuery]
  );

  // Fetch when filters change
  useEffect(() => {
    fetchJobUrls();
  }, [activeFilter, debouncedSearchQuery]);

  // Refresh pending swipes when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const refreshPendingSwipes = async () => {
        const localPending = await getPendingSwipedJobs();
        setPendingSwipes(localPending);
      };
      refreshPendingSwipes();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchJobUrls();
  };

  const renderFooter = () => {
    return <View style={{ height: 100 + insets.bottom }} />;
  };

  // Filter pending swipes based on search query
  const filteredPendingSwipes = React.useMemo(() => {
    if (activeFilter !== "all" && activeFilter !== "pending") {
      return [];
    }
    if (!debouncedSearchQuery) {
      return pendingSwipes;
    }
    const query = debouncedSearchQuery.toLowerCase();
    return pendingSwipes.filter(
      (job) =>
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query)
    );
  }, [pendingSwipes, activeFilter, debouncedSearchQuery]);

  // Combined data: pending swipes first, then URL entries
  type ListItem =
    | { type: "pending"; data: PendingSwipedJob }
    | { type: "url"; data: AutomationUrl };

  const combinedData = React.useMemo<ListItem[]>(() => {
    const pending: ListItem[] = filteredPendingSwipes.map((job) => ({
      type: "pending" as const,
      data: job,
    }));
    const urls: ListItem[] = urlEntries.map((entry) => ({
      type: "url" as const,
      data: entry,
    }));
    return [...pending, ...urls];
  }, [filteredPendingSwipes, urlEntries]);

  const renderEmpty = () => {
    if (isLoading) return null;
    if (combinedData.length > 0) return null;
    return (
      <View
        style={{ alignItems: "center", paddingTop: 100, paddingBottom: 100 }}
      >
        <Ionicons
          name="document-text-outline"
          size={Math.round(64 * uiScale)}
          color={colors.textTertiary}
        />
        <Text style={{ color: colors.textSecondary, marginTop: 16 }}>
          No applications found
        </Text>
      </View>
    );
  };

  // Calculate display total count (including local pending)
  const displayTotalCount = totalCount + filteredPendingSwipes.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Status bar background */}
      <View
        style={[
          styles.statusBarBackground,
          { backgroundColor: colors.background, height: insets.top },
        ]}
      />
      {/* Header gradient */}
      <LinearGradient
        colors={[colors.background, colors.background]}
        style={[styles.headerGradient, { top: insets.top }]}
      />

      <FlatList
        data={combinedData}
        keyExtractor={(item) =>
          item.type === "pending"
            ? `pending-${item.data.id}`
            : `url-${item.data.id}`
        }
        renderItem={({ item, index }) => {
          if (item.type === "pending") {
            return <PendingSwipeItem job={item.data} index={index} />;
          }
          const urlEntry = item.data;
          // Get cached job details if backend data is missing
          const cached = cachedJobs[urlEntry.jobUrl];
          const company = urlEntry.companyName || cached?.company || "Unknown Company";
          const position = urlEntry.jobTitle || cached?.title || "Position Unknown";
          const location = cached?.location || urlEntry.platform || "Job Board";
          const salary = cached?.salary || "";

          return (
            <ApplicationItem
              id={urlEntry.id}
              company={company}
              position={position}
              location={location}
              salary={salary}
              status={(urlEntry.status as FilterStatus) || "pending"}
              appliedAt={getRelativeTime(urlEntry.createdAt || new Date().toISOString())}
              logo={company[0].toUpperCase()}
              index={index}
              onPress={() => {}}
            />
          );
        }}
        ListHeaderComponent={
          <ApplicationsHeader
            totalCount={displayTotalCount}
            offerCount={completedCount}
            interviewCount={processingCount}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
            FILTERS={FILTERS}
            headerOpacity={headerOpacity}
            searchScale={searchScale}
            colors={colors}
            isDark={isDark}
          />
        }
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={{ height: spacing[4] }} />}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBarBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 200,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[6],
  },
  header: {
    marginBottom: spacing[6],
  },
  title: {
    fontSize: Math.round(32 * uiScale),
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: spacing[4],
  },
  headerStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    paddingHorizontal: spacing[4],
  },
  statNumber: {
    fontSize: Math.round(24 * uiScale),
    fontWeight: "800",
  },
  statLabel: {
    fontSize: Math.round(13 * uiScale),
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  searchContainer: {
    marginBottom: spacing[5],
    borderRadius: borderRadius.xl,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3] + 2,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: Math.round(16 * uiScale),
    marginLeft: spacing[3],
  },
  filtersScroll: {
    marginHorizontal: -spacing[6],
    marginBottom: spacing[5],
  },
  filtersContent: {
    paddingHorizontal: spacing[6],
    gap: spacing[3],
    flexDirection: "row",
  },
  filterChip: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 2,
    borderRadius: borderRadius.full,
  },
  filterChipActive: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2] + 2,
    borderRadius: borderRadius.full,
  },
  filterChipText: {
    fontSize: Math.round(14 * uiScale),
    fontWeight: "600",
  },
  filterChipTextActive: {
    fontSize: Math.round(14 * uiScale),
    fontWeight: "700",
    color: "#FFFFFF",
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing[4],
  },
  resultsCount: {
    fontSize: Math.round(14 * uiScale),
    fontWeight: "500",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  sortText: {
    fontSize: Math.round(14 * uiScale),
    fontWeight: "600",
  },
  applicationsList: {
    gap: spacing[4],
  },
  applicationItem: {
    borderRadius: borderRadius.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  applicationItemInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing[4],
  },
  companyLogo: {
    width: Math.round(52 * uiScale),
    height: Math.round(52 * uiScale),
    borderRadius: Math.round(16 * uiScale),
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: Math.round(22 * uiScale),
    fontWeight: "800",
  },
  mainInfo: {
    flex: 1,
    marginLeft: spacing[4],
    marginRight: spacing[2],
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  companyName: {
    fontSize: Math.round(13 * uiScale),
    fontWeight: "600",
    opacity: 0.7,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing[2],
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    gap: 4,
  },
  statusText: {
    fontSize: Math.round(11 * uiScale),
    fontWeight: "700",
  },
  positionText: {
    fontSize: Math.round(16 * uiScale),
    fontWeight: "700",
    marginBottom: 6,
  },
  detailsRow: {
    flexDirection: "row",
    gap: spacing[3],
    marginBottom: 4,
    overflow: "hidden",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: Math.round(13 * uiScale),
  },
  appliedText: {
    fontSize: Math.round(12 * uiScale),
  },
});
