import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { Labour, useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function LaboureursScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const { labourers, calcStats } = useApp();
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "left">("all");

  const filtered = useMemo(() => {
    let list = labourers;
    if (filter !== "all") list = list.filter((l) => l.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((l) =>
        l.name.toLowerCase().includes(q) || l.phone?.includes(q) || l.workType?.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [labourers, search, filter]);

  const styles = makeStyles(colors, insets);

  const renderItem = ({ item }: { item: Labour }) => {
    const s = calcStats(item);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          Haptics.selectionAsync();
          router.push(`/labour/${item.id}` as any);
        }}
        activeOpacity={0.75}
      >
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.meta}>
              {item.workType || "-"} • ₹{item.ratePerDay}/day
            </Text>
            {item.phone ? (
              <Text style={styles.phone}>{item.phone}</Text>
            ) : null}
          </View>
          <View style={styles.cardRight}>
            {item.status === "left" ? (
              <View style={[styles.chip, { backgroundColor: colors.muted }]}>
                <Text style={[styles.chipText, { color: colors.mutedForeground }]}>{t("leftWork")}</Text>
              </View>
            ) : (
              <View style={[styles.chip, { backgroundColor: colors.accent }]}>
                <Text style={[styles.chipText, { color: colors.primary }]}>{t("active")}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{s.daysWorked}</Text>
            <Text style={styles.statLabel}>{t("daysWorked")}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{s.totalEarned.toLocaleString("en-IN")}</Text>
            <Text style={styles.statLabel}>{t("totalEarned")}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.warning }]}>
              ₹{s.totalAdvance.toLocaleString("en-IN")}
            </Text>
            <Text style={styles.statLabel}>{t("totalAdvanceTaken")}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: s.remainingBalance >= 0 ? colors.success : colors.destructive }]}>
              ₹{Math.abs(s.remainingBalance).toLocaleString("en-IN")}
            </Text>
            <Text style={[styles.statLabel, { color: s.remainingBalance >= 0 ? colors.success : colors.destructive }]}>
              {t("remainingBalance")}
            </Text>
          </View>
        </View>

        {/* Alert badges */}
        {(s.isLeftWithAdvance || s.isAdvancePending) && (
          <View style={styles.alertRow}>
            {s.isLeftWithAdvance && (
              <View style={[styles.alertBadge, { backgroundColor: colors.destructive }]}>
                <Ionicons name="warning" size={12} color="#fff" />
                <Text style={styles.alertText}>{t("leftWithAdvance")}</Text>
              </View>
            )}
            {!s.isLeftWithAdvance && s.isAdvancePending && (
              <View style={[styles.alertBadge, { backgroundColor: colors.warning }]}>
                <MaterialCommunityIcons name="alert-circle" size={12} color="#fff" />
                <Text style={styles.alertText}>{t("advancePendingBadge")}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.headerBar}>
        <Text style={styles.screenTitle}>{t("labourers")}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push("/labour/add");
          }}
        >
          <Ionicons name="add" size={24} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={colors.mutedForeground} style={styles.searchIcon} />
        <TextInput
          style={styles.search}
          placeholder={`${t("name")}, ${t("workType")}...`}
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filters}>
        {(["all", "active", "left"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === "all" ? (t("labourers")) : f === "active" ? t("active") : t("leftWork")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        scrollEnabled={!!filtered.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
            <Text style={styles.emptyText}>{t("noLabourers")}</Text>
          </View>
        }
      />
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>, insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    headerBar: {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12),
      paddingHorizontal: 16,
      paddingBottom: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    screenTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    addBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: 16,
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      marginBottom: 12,
    },
    searchIcon: { marginRight: 8 },
    search: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.foreground,
      fontFamily: "Inter_400Regular",
    },
    filters: {
      flexDirection: "row",
      marginHorizontal: 16,
      marginBottom: 12,
      gap: 8,
    },
    filterBtn: {
      paddingHorizontal: 16,
      paddingVertical: 7,
      borderRadius: 20,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterBtnActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_500Medium",
    },
    filterTextActive: {
      color: colors.primaryForeground,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90),
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 14,
      marginBottom: 10,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.07,
      shadowRadius: 4,
    },
    cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    avatar: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    avatarText: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.primary,
      fontFamily: "Inter_700Bold",
    },
    cardInfo: { flex: 1 },
    name: { fontSize: 16, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    meta: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
    phone: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    cardRight: { alignItems: "flex-end" },
    chip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    chipText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10,
    },
    statItem: { alignItems: "center", flex: 1 },
    statValue: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    statLabel: {
      fontSize: 10,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
    },
    alertRow: { flexDirection: "row", gap: 6, marginTop: 8 },
    alertBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    alertText: { fontSize: 10, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
    empty: {
      alignItems: "center",
      paddingTop: 80,
      gap: 12,
    },
    emptyText: {
      fontSize: 16,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
  });
