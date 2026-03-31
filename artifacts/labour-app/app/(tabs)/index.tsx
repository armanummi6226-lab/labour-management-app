import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function DashboardScreen() {
  const colors = useColors();
  const { t, language, toggleLanguage } = useLanguage();
  const { labourers, calcStats, user } = useApp();
  const insets = useSafeAreaInsets();

  const stats = useMemo(() => {
    const activeLabourers = labourers.filter((l) => l.status === "active");
    let pendingAdvance = 0;
    let clearedThisMonth = 0;
    let alertsCount = 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const l of labourers) {
      const s = calcStats(l);
      if (s.isAdvancePending || s.isLeftWithAdvance) alertsCount++;
      if (s.remainingBalance < 0) pendingAdvance += Math.abs(s.remainingBalance);
      // cleared this month = payments made this month
      const monthPayments = l.payments
        .filter((p) => new Date(p.date) >= monthStart)
        .reduce((sum, p) => sum + p.amount, 0);
      clearedThisMonth += monthPayments;
    }

    return {
      totalActive: activeLabourers.length,
      pendingAdvance,
      clearedThisMonth,
      alertsCount,
    };
  }, [labourers, calcStats]);

  const recentLabourers = useMemo(
    () => [...labourers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5),
    [labourers]
  );

  const styles = makeStyles(colors, insets);

  const formatAmount = (n: number) =>
    `₹${n.toLocaleString("en-IN")}`;

  return (
    <View style={styles.root}>
      {/* Custom Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {language === "hi" ? "नमस्ते," : "Welcome,"}
          </Text>
          <Text style={styles.contractorName}>
            +91 {user?.phone ?? "Contractor"}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
            <Text style={styles.langBtnText}>{language === "en" ? "हि" : "EN"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard
            title={t("totalLabourers")}
            value={stats.totalActive.toString()}
            icon={<Ionicons name="people" size={22} color={colors.info} />}
            bg={colors.card}
            valueColor={colors.info}
            colors={colors}
          />
          <StatCard
            title={t("pendingAdvance")}
            value={formatAmount(stats.pendingAdvance)}
            icon={<MaterialCommunityIcons name="currency-inr" size={22} color={colors.destructive} />}
            bg={colors.card}
            valueColor={colors.destructive}
            colors={colors}
          />
          <StatCard
            title={t("clearedThisMonth")}
            value={formatAmount(stats.clearedThisMonth)}
            icon={<Ionicons name="checkmark-circle" size={22} color={colors.success} />}
            bg={colors.card}
            valueColor={colors.success}
            colors={colors}
          />
          <StatCard
            title={t("alertsCount")}
            value={stats.alertsCount.toString()}
            icon={<Ionicons name="warning" size={22} color={colors.warning} />}
            bg={colors.card}
            valueColor={colors.warning}
            colors={colors}
          />
        </View>

        {/* Recent Labourers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("labourers")}</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/labourers")}>
              <Text style={styles.seeAll}>{language === "hi" ? "सब देखें" : "See All"}</Text>
            </TouchableOpacity>
          </View>

          {recentLabourers.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="person-add-outline" size={40} color={colors.mutedForeground} />
              <Text style={styles.emptyTitle}>{t("noLabourers")}</Text>
              <Text style={styles.emptySubtitle}>{t("startAdding")}</Text>
            </View>
          ) : (
            recentLabourers.map((l) => {
              const s = calcStats(l);
              return (
                <TouchableOpacity
                  key={l.id}
                  style={styles.labourCard}
                  onPress={() => router.push(`/labour/${l.id}` as any)}
                  activeOpacity={0.75}
                >
                  <View style={styles.labourAvatar}>
                    <Text style={styles.labourAvatarText}>{l.name.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.labourInfo}>
                    <Text style={styles.labourName}>{l.name}</Text>
                    <Text style={styles.labourMeta}>{l.workType || t("workType")} • {s.daysWorked}d</Text>
                  </View>
                  <View style={styles.labourRight}>
                    {s.isLeftWithAdvance ? (
                      <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                        <Text style={styles.badgeText}>{t("leftWithAdvance")}</Text>
                      </View>
                    ) : s.isAdvancePending ? (
                      <View style={[styles.badge, { backgroundColor: colors.warning }]}>
                        <Text style={styles.badgeText}>{t("advancePendingBadge")}</Text>
                      </View>
                    ) : (
                      <Text style={[styles.balanceText, { color: s.remainingBalance >= 0 ? colors.success : colors.destructive }]}>
                        {s.remainingBalance >= 0 ? "+" : ""}{formatAmount(s.remainingBalance)}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/labour/add");
        }}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={30} color={colors.primaryForeground} />
      </TouchableOpacity>
    </View>
  );
}

function StatCard({
  title, value, icon, bg, valueColor, colors,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  bg: string;
  valueColor: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={[statStyles.card, { backgroundColor: bg, borderRadius: colors.radius }]}>
      <View style={statStyles.iconRow}>{icon}</View>
      <Text style={[statStyles.value, { color: valueColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[statStyles.label, { color: colors.mutedForeground }]}>{title}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 14,
    minWidth: "46%",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
  },
  iconRow: { marginBottom: 8 },
  value: { fontSize: 22, fontWeight: "800", fontFamily: "Inter_700Bold", marginBottom: 2 },
  label: { fontSize: 11, fontWeight: "500", fontFamily: "Inter_500Medium" },
});

const makeStyles = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>, insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12),
      paddingHorizontal: 20,
      paddingBottom: 16,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      backgroundColor: colors.background,
    },
    greeting: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    contractorName: {
      fontSize: 20,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    headerRight: { flexDirection: "row", gap: 10, alignItems: "center" },
    langBtn: {
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingHorizontal: 13,
      paddingVertical: 6,
    },
    langBtnText: {
      color: colors.primaryForeground,
      fontWeight: "700",
      fontSize: 13,
      fontFamily: "Inter_700Bold",
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingHorizontal: 16,
      paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90),
    },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      marginBottom: 24,
    },
    section: { marginBottom: 24 },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    seeAll: {
      fontSize: 14,
      color: colors.primary,
      fontFamily: "Inter_500Medium",
    },
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 32,
      alignItems: "center",
      gap: 8,
    },
    emptyTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
    },
    labourCard: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
      elevation: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    labourAvatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    labourAvatarText: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.primary,
      fontFamily: "Inter_700Bold",
    },
    labourInfo: { flex: 1 },
    labourName: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    labourMeta: {
      fontSize: 12,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    labourRight: { alignItems: "flex-end" },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: "#fff",
      fontFamily: "Inter_700Bold",
    },
    balanceText: {
      fontSize: 14,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
    },
    fab: {
      position: "absolute",
      right: 20,
      bottom: insets.bottom + (Platform.OS === "web" ? 100 : 80),
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      elevation: 6,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    },
  });
