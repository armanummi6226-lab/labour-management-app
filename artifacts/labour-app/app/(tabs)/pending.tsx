import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { Labour, useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function PendingScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const { labourers, calcStats } = useApp();
  const insets = useSafeAreaInsets();

  const pendingList = useMemo(() => {
    return labourers.filter((l) => {
      const s = calcStats(l);
      return s.isLeftWithAdvance || s.isAdvancePending;
    });
  }, [labourers, calcStats]);

  const styles = makeStyles(colors, insets);

  const renderItem = ({ item }: { item: Labour }) => {
    const s = calcStats(item);
    const isLeftWithAdv = s.isLeftWithAdvance;

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: isLeftWithAdv ? colors.destructive : colors.warning, borderLeftWidth: 4 }]}
        onPress={() => router.push(`/labour/${item.id}` as any)}
        activeOpacity={0.8}
      >
        <View style={styles.cardRow}>
          <View style={[styles.icon, { backgroundColor: isLeftWithAdv ? colors.destructive + "20" : colors.warning + "20" }]}>
            {isLeftWithAdv ? (
              <Ionicons name="warning" size={24} color={colors.destructive} />
            ) : (
              <MaterialCommunityIcons name="currency-inr" size={24} color={colors.warning} />
            )}
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.alertMsg}>
              {isLeftWithAdv ? t("leftWithAdvanceAlert") : t("advancePendingAlert")}
            </Text>
            <Text style={styles.meta}>
              {item.workType || "-"} • ₹{item.ratePerDay}/day
            </Text>
          </View>
          <View style={styles.right}>
            <Text style={[styles.amount, { color: isLeftWithAdv ? colors.destructive : colors.warning }]}>
              ₹{s.totalAdvance.toLocaleString("en-IN")}
            </Text>
            <Text style={styles.amountLabel}>{t("totalAdvanceTaken")}</Text>
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.detailRow}>
          <DetailStat label={t("totalEarned")} value={`₹${s.totalEarned.toLocaleString("en-IN")}`} color={colors.success} colors={colors} />
          <DetailStat label={t("totalAdvanceTaken")} value={`₹${s.totalAdvance.toLocaleString("en-IN")}`} color={colors.warning} colors={colors} />
          <DetailStat
            label={t("remainingBalance")}
            value={`₹${Math.abs(s.remainingBalance).toLocaleString("en-IN")}`}
            color={s.remainingBalance < 0 ? colors.destructive : colors.success}
            colors={colors}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>{t("pendingList")}</Text>
        {pendingList.length > 0 && (
          <View style={[styles.countBadge, { backgroundColor: colors.destructive }]}>
            <Text style={styles.countText}>{pendingList.length}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={pendingList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        scrollEnabled={!!pendingList.length}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
            <Text style={styles.emptyTitle}>{t("noPending")}</Text>
            <Text style={styles.emptySubtitle}>{t("allClear")}</Text>
          </View>
        }
      />
    </View>
  );
}

function DetailStat({
  label,
  value,
  color,
  colors,
}: {
  label: string;
  value: string;
  color: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={{ fontSize: 13, fontWeight: "700", color, fontFamily: "Inter_700Bold" }}>{value}</Text>
      <Text style={{ fontSize: 10, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" }}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>, insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12),
      paddingHorizontal: 16,
      paddingBottom: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.background,
    },
    screenTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    countBadge: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
    },
    countText: {
      color: "#fff",
      fontSize: 13,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90),
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 14,
      marginBottom: 12,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    cardRow: { flexDirection: "row", alignItems: "center" },
    icon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
    },
    info: { flex: 1 },
    name: { fontSize: 16, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    alertMsg: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
    meta: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    right: { alignItems: "flex-end" },
    amount: { fontSize: 16, fontWeight: "800", fontFamily: "Inter_700Bold" },
    amountLabel: { fontSize: 10, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    separator: { height: 1, backgroundColor: colors.border, marginVertical: 10 },
    detailRow: { flexDirection: "row", justifyContent: "space-between" },
    empty: {
      alignItems: "center",
      paddingTop: 100,
      gap: 12,
    },
    emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    emptySubtitle: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
  });
