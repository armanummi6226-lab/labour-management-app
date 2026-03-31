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
  const { labourers, sites, calcStats, calcSiteStats, user } = useApp();
  const insets = useSafeAreaInsets();

  const globalStats = useMemo(() => {
    let totalActive = 0;
    let pendingAdvance = 0;
    let alertsCount = 0;
    let totalSiteExpense = 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    let clearedThisMonth = 0;

    for (const l of labourers) {
      const s = calcStats(l);
      if (l.status === "active") totalActive++;
      if (s.isAdvancePending || s.isLeftWithAdvance) alertsCount++;
      if (s.totalAdvance > 0) pendingAdvance += s.totalAdvance;
      const monthPayments = l.payments
        .filter((p) => new Date(p.date) >= monthStart)
        .reduce((sum, p) => sum + p.amount, 0);
      clearedThisMonth += monthPayments;
    }

    for (const site of sites) {
      const ss = calcSiteStats(site.id);
      totalSiteExpense += ss.netCost;
    }

    return { totalActive, pendingAdvance, clearedThisMonth, alertsCount, totalSiteExpense };
  }, [labourers, sites, calcStats, calcSiteStats]);

  // Monthly spending (last 6 months)
  const monthlyData = useMemo(() => {
    const months: { label: string; amount: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-IN", { month: "short" });
      let amount = 0;
      for (const l of labourers) {
        amount += l.payments
          .filter((p) => {
            const pd = new Date(p.date);
            return pd.getMonth() === d.getMonth() && pd.getFullYear() === d.getFullYear();
          })
          .reduce((s, p) => s + p.amount, 0);
      }
      months.push({ label, amount });
    }
    return months;
  }, [labourers]);

  const maxMonthly = Math.max(...monthlyData.map((m) => m.amount), 1);

  const styles = makeStyles(colors, insets);
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const recentLabourers = useMemo(
    () => [...labourers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 4),
    [labourers]
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{language === "hi" ? "नमस्ते," : "Welcome,"}</Text>
          <Text style={styles.contractorName}>+91 {user?.phone ?? "Contractor"}</Text>
        </View>
        <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
          <Text style={styles.langBtnText}>{language === "en" ? "हि" : "EN"}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard title={t("totalSites")} value={sites.length.toString()} icon={<MaterialCommunityIcons name="office-building" size={20} color={colors.info} />} color={colors.info} colors={colors} />
          <StatCard title={t("totalLabourers")} value={globalStats.totalActive.toString()} icon={<Ionicons name="people" size={20} color={colors.primary} />} color={colors.primary} colors={colors} />
          <StatCard title={t("pendingAdvance")} value={fmt(globalStats.pendingAdvance)} icon={<MaterialCommunityIcons name="currency-inr" size={20} color={colors.warning} />} color={colors.warning} colors={colors} />
          <StatCard title={t("totalSiteExpense")} value={fmt(globalStats.totalSiteExpense)} icon={<Ionicons name="receipt" size={20} color={colors.destructive} />} color={colors.destructive} colors={colors} />
        </View>

        {/* Monthly Spending Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{t("monthlySpend")}</Text>
          <View style={styles.chartBars}>
            {monthlyData.map((m, i) => {
              const heightPct = m.amount / maxMonthly;
              const barH = Math.max(4, heightPct * 80);
              return (
                <View key={i} style={styles.barCol}>
                  <Text style={styles.barAmount} numberOfLines={1}>
                    {m.amount > 0 ? `₹${(m.amount / 1000).toFixed(0)}k` : ""}
                  </Text>
                  <View style={styles.barBg}>
                    <View style={[styles.bar, { height: barH, backgroundColor: i === 5 ? colors.primary : colors.primary + "50" }]} />
                  </View>
                  <Text style={styles.barLabel}>{m.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Sites Summary */}
        {sites.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("sites")}</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/labourers")}>
                <Text style={styles.seeAll}>{language === "hi" ? "सब देखें" : "See All"}</Text>
              </TouchableOpacity>
            </View>
            {sites.slice(0, 3).map((site) => {
              const ss = calcSiteStats(site.id);
              return (
                <TouchableOpacity
                  key={site.id}
                  style={styles.siteCard}
                  onPress={() => router.push(`/site/${site.id}` as any)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.siteDot, { backgroundColor: site.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.siteName}>{site.name}</Text>
                    <Text style={styles.siteMeta}>{ss.activeCount} active • {fmt(ss.labourCost)} labour</Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[styles.siteNet, { color: colors.foreground }]}>{fmt(ss.netCost)}</Text>
                    {ss.alertCount > 0 && (
                      <View style={[styles.alertDot, { backgroundColor: colors.destructive }]}>
                        <Text style={styles.alertDotText}>{ss.alertCount}</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Recent Labourers */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t("recentActivity")}</Text>
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
              const site = sites.find((si) => si.id === l.siteId);
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
                    <Text style={styles.labourMeta}>
                      {site ? site.name : "-"} • {s.daysWorked}d
                    </Text>
                  </View>
                  <View>
                    {s.isLeftWithAdvance ? (
                      <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
                        <Text style={styles.badgeText}>{t("leftWithAdvance")}</Text>
                      </View>
                    ) : s.isAdvancePending ? (
                      <View style={[styles.badge, { backgroundColor: colors.warning }]}>
                        <Text style={styles.badgeText}>{t("advancePendingBadge")}</Text>
                      </View>
                    ) : (
                      <Text style={{ color: s.remainingBalance >= 0 ? colors.success : colors.destructive, fontWeight: "700", fontSize: 13 }}>
                        {s.remainingBalance >= 0 ? "+" : ""}{fmt(s.remainingBalance)}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function StatCard({ title, value, icon, color, colors }: {
  title: string; value: string; icon: React.ReactNode; color: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={[sc.card, { backgroundColor: colors.card, borderRadius: colors.radius }]}>
      <View style={[sc.iconBox, { backgroundColor: color + "18" }]}>{icon}</View>
      <Text style={[sc.value, { color }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={[sc.label, { color: colors.mutedForeground }]}>{title}</Text>
    </View>
  );
}

const sc = StyleSheet.create({
  card: { flex: 1, padding: 14, minWidth: "46%", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 4 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  value: { fontSize: 20, fontWeight: "800", fontFamily: "Inter_700Bold", marginBottom: 2 },
  label: { fontSize: 11, fontFamily: "Inter_400Regular" },
});

const makeStyles = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>, insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12),
      paddingHorizontal: 20, paddingBottom: 16,
      flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
      backgroundColor: colors.background,
    },
    greeting: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    contractorName: { fontSize: 19, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    langBtn: { backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 6 },
    langBtnText: { color: colors.primaryForeground, fontWeight: "700", fontSize: 13, fontFamily: "Inter_700Bold" },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) },
    statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 16 },
    chartCard: {
      backgroundColor: colors.card, borderRadius: colors.radius,
      padding: 16, marginBottom: 20,
      elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
    },
    chartTitle: { fontSize: 15, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold", marginBottom: 12 },
    chartBars: { flexDirection: "row", alignItems: "flex-end", gap: 6, height: 110 },
    barCol: { flex: 1, alignItems: "center" },
    barAmount: { fontSize: 9, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 2 },
    barBg: { width: "100%", height: 80, justifyContent: "flex-end", alignItems: "center" },
    bar: { width: "80%", borderRadius: 4, minHeight: 4 },
    barLabel: { fontSize: 10, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 4 },
    section: { marginBottom: 20 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    sectionTitle: { fontSize: 17, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    seeAll: { fontSize: 14, color: colors.primary, fontFamily: "Inter_500Medium" },
    siteCard: {
      backgroundColor: colors.card, borderRadius: colors.radius,
      padding: 14, flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8,
      elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
    },
    siteDot: { width: 12, height: 12, borderRadius: 6 },
    siteName: { fontSize: 15, fontWeight: "600", color: colors.foreground, fontFamily: "Inter_600SemiBold" },
    siteMeta: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    siteNet: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
    alertDot: { marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
    alertDotText: { fontSize: 10, color: "#fff", fontWeight: "700", fontFamily: "Inter_700Bold" },
    emptyCard: { backgroundColor: colors.card, borderRadius: colors.radius, padding: 32, alignItems: "center", gap: 8 },
    emptyTitle: { fontSize: 16, fontWeight: "600", color: colors.foreground, fontFamily: "Inter_600SemiBold" },
    emptySubtitle: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" },
    labourCard: {
      backgroundColor: colors.card, borderRadius: colors.radius,
      padding: 12, flexDirection: "row", alignItems: "center", marginBottom: 8,
      elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3,
    },
    labourAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", marginRight: 12 },
    labourAvatarText: { fontSize: 17, fontWeight: "700", color: colors.primary, fontFamily: "Inter_700Bold" },
    labourInfo: { flex: 1 },
    labourName: { fontSize: 14, fontWeight: "600", color: colors.foreground, fontFamily: "Inter_600SemiBold" },
    labourMeta: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
    badgeText: { fontSize: 9, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  });
