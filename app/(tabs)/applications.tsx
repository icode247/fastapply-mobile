import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { borderRadius, spacing } from "../../src/constants/theme";
import { useTheme } from "../../src/hooks";
import { applicationService } from "../../src/services/application.service";
import { Application } from "../../src/types";

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
  | "submitted"
  | "failed"
  | "cancelled";

const FILTERS: { label: string; value: FilterStatus; color: string }[] = [
  { label: "All", value: "all", color: "#0ea5e9" },
  { label: "Pending", value: "pending", color: "#64748B" },
  { label: "Processing", value: "processing", color: "#3B82F6" },
  { label: "Submitted", value: "submitted", color: "#10B981" },
  { label: "Failed", value: "failed", color: "#EF4444" },
  { label: "Cancelled", value: "cancelled", color: "#9CA3AF" },
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
    applied: { color: "#3B82F6", label: "Applied", icon: "checkmark-circle" },
    reviewing: { color: "#F59E0B", label: "In Review", icon: "eye" },
    interview: { color: "#0284c7", label: "Interview", icon: "calendar" },
    offer: { color: "#10B981", label: "Offer", icon: "trophy" },
    rejected: { color: "#EF4444", label: "Rejected", icon: "close-circle" },
  };

  const config = statusConfig[status] || statusConfig.applied;

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
              <Ionicons name={config.icon} size={12} color={config.color} />
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
                size={14}
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
                  size={14}
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
          size={20}
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
          size={20}
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
              size={20}
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
          <Ionicons name="swap-vertical" size={18} color={colors.primary} />
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
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Stats State
  const [offerCount, setOfferCount] = useState(0);
  const [interviewCount, setInterviewCount] = useState(0);

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

  const fetchApplications = React.useCallback(
    async (reset = false) => {
      try {
        const currentPage = reset ? 1 : page;
        if (!reset && (!hasMore || isLoadingMore)) return;

        if (reset) setIsLoading(true);
        else setIsLoadingMore(true);

        const params: any = {
          page: currentPage,
          limit: 15,
          filters: {
            search: debouncedSearchQuery || undefined,
            status: activeFilter !== "all" ? activeFilter : undefined,
          },
        };

        const response = await applicationService.getApplications(params);

        // Also fetch stats if resetting to keep counts up to date
        if (reset) {
          const stats = await applicationService.getStats();
          setOfferCount(stats.completed || 0);
          setInterviewCount(stats.processing || 0);
        }

        const newApps = response.data;

        setApplications((prev) => (reset ? newApps : [...prev, ...newApps]));
        setTotalCount(response.total);
        setHasMore(response.page < response.totalPages);
        setPage(currentPage + 1);
      } catch (error) {
        console.error("Failed to fetch applications:", error);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
        setRefreshing(false);
      }
    },
    [page, hasMore, isLoadingMore, activeFilter, debouncedSearchQuery]
  );

  // Fetch when filters change
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchApplications(true);
  }, [activeFilter, debouncedSearchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchApplications(true);
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && !isLoading && hasMore) {
      fetchApplications();
    }
  };

  const renderFooter = () => {
    if (!isLoadingMore) return <View style={{ height: 100 + insets.bottom }} />;
    return (
      <View style={{ paddingVertical: 20, paddingBottom: 100 + insets.bottom }}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    return (
      <View
        style={{ alignItems: "center", paddingTop: 100, paddingBottom: 100 }}
      >
        <Ionicons
          name="document-text-outline"
          size={64}
          color={colors.textTertiary}
        />
        <Text style={{ color: colors.textSecondary, marginTop: 16 }}>
          No applications found
        </Text>
      </View>
    );
  };

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
        data={applications}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ApplicationItem
            id={item.id}
            company={item.company || "Unknown Company"}
            position={item.jobTitle || "Position Unknown"}
            location={item.jobLocation || "Remote"}
            salary={""} // Salary info not always in Application object
            status={(item.status as FilterStatus) || "submitted"}
            appliedAt={getRelativeTime(item.createdAt)}
            logo={(item.company || "C")[0].toUpperCase()}
            index={index}
            onPress={() => router.push(`/application/${item.id}`)}
          />
        )}
        ListHeaderComponent={
          <ApplicationsHeader
            totalCount={totalCount}
            offerCount={offerCount}
            interviewCount={interviewCount}
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
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
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
    fontSize: 32,
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
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    fontSize: 13,
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
    fontSize: 16,
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
    fontSize: 14,
    fontWeight: "600",
  },
  filterChipTextActive: {
    fontSize: 14,
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
    fontSize: 14,
    fontWeight: "500",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[1],
  },
  sortText: {
    fontSize: 14,
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
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 22,
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
    fontSize: 13,
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
    fontSize: 11,
    fontWeight: "700",
  },
  positionText: {
    fontSize: 16,
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
    fontSize: 13,
  },
  appliedText: {
    fontSize: 12,
  },
});
