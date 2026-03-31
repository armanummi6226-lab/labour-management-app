import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";

import { useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

type Tab = "overview" | "hajri" | "advance" | "ledger";

export default function LabourDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { t } = useLanguage();
  const {
    getLabour,
    updateLabour,
    deleteLabour,
    setHajri,
    addAdvance,
    settlePayment,
    calcStats,
  } = useApp();
  const insets = useSafeAreaInsets();

  const labour = getLabour(id as string);
  const [tab, setTab] = useState<Tab>("overview");
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [settleAmount, setSettleAmount] = useState("");
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [hajriInput, setHajriInput] = useState("");

  const stats = useMemo(() => labour ? calcStats(labour) : null, [labour, calcStats]);

  if (!labour || !stats) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.mutedForeground }}>Labour not found</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(t("delete"), t("deleteConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("confirm"),
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteLabour(id as string);
          router.back();
        },
      },
    ]);
  };

  const handleAddAdvance = () => {
    const amt = Number(advanceAmount);
    if (!amt || amt <= 0) {
      Alert.alert("", t("rateRequired"));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addAdvance(id as string, amt);
    setAdvanceAmount("");
    setShowAdvanceModal(false);
  };

  const handleSettle = () => {
    const amt = Number(settleAmount);
    if (!amt || amt <= 0) {
      Alert.alert("", t("rateRequired"));
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    settlePayment(id as string, amt);
    setSettleAmount("");
    setShowSettleModal(false);
  };

  const handleUpdateHajri = () => {
    const val = Number(hajriInput);
    if (!hajriInput || isNaN(val) || val < 0) {
      Alert.alert("", "Kripya sahi number darj karein");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHajri(id as string, val);
    setHajriInput("");
  };

  const styles = makeStyles(colors, insets);

  const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview", label: t("dashboard") },
    { key: "hajri", label: t("attendance") },
    { key: "advance", label: t("advance") },
    { key: "ledger", label: t("ledger") },
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.labourName} numberOfLines={1}>{labour.name}</Text>
          <Text style={styles.labourMeta}>{labour.workType || "-"} • ₹{labour.ratePerDay}/day</Text>
        </View>
        <TouchableOpacity onPress={handleDelete}>
          <Feather name="trash-2" size={20} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      {/* Status + Badges */}
      <View style={styles.badgeRow}>
        <View style={[styles.statusChip, { backgroundColor: labour.status === "active" ? colors.accent : colors.muted }]}>
          <Text style={[styles.statusChipText, { color: labour.status === "active" ? colors.primary : colors.mutedForeground }]}>
            {labour.status === "active" ? t("active") : t("leftWork")}
          </Text>
        </View>
        {stats.isLeftWithAdvance && (
          <View style={[styles.statusChip, { backgroundColor: colors.destructive }]}>
            <Ionicons name="warning" size={12} color="#fff" />
            <Text style={[styles.statusChipText, { color: "#fff" }]}> {t("leftWithAdvance")}</Text>
          </View>
        )}
        {!stats.isLeftWithAdvance && stats.isAdvancePending && (
          <View style={[styles.statusChip, { backgroundColor: colors.warning }]}>
            <Text style={[styles.statusChipText, { color: "#fff" }]}>{t("advancePendingBadge")}</Text>
          </View>
        )}
        <View style={styles.statusToggle}>
          <Text style={styles.statusToggleLabel}>
            {labour.status === "active" ? t("active") : t("leftWork")}
          </Text>
          <Switch
            value={labour.status === "active"}
            onValueChange={(v) => {
              Haptics.selectionAsync();
              updateLabour(id as string, { status: v ? "active" : "left" });
            }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <SummaryCard label={t("daysWorked")} value={stats.daysWorked.toString()} color={colors.info} colors={colors} />
        <SummaryCard label={t("totalEarned")} value={`₹${stats.totalEarned.toLocaleString("en-IN")}`} color={colors.success} colors={colors} />
        <SummaryCard label={t("totalAdvanceTaken")} value={`₹${stats.totalAdvance.toLocaleString("en-IN")}`} color={colors.warning} colors={colors} />
        <SummaryCard
          label={t("remainingBalance")}
          value={`₹${Math.abs(stats.remainingBalance).toLocaleString("en-IN")}`}
          color={stats.remainingBalance >= 0 ? colors.success : colors.destructive}
          colors={colors}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tabItem, tab === key && styles.tabItemActive]}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <View style={styles.overviewSection}>
            {stats.remainingBalance > 0 && (
              <TouchableOpacity
                style={styles.settleBtn}
                onPress={() => setShowSettleModal(true)}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="cash-check" size={22} color={colors.successForeground} />
                <Text style={styles.settleBtnText}>{t("settlePayment")} — ₹{stats.remainingBalance.toLocaleString("en-IN")}</Text>
              </TouchableOpacity>
            )}
            <InfoRow label={t("addedOn")} value={fmt(labour.createdAt)} colors={colors} />
            {labour.phone && <InfoRow label={t("phone")} value={labour.phone} colors={colors} />}
            {labour.notes && <InfoRow label={t("notes")} value={labour.notes} colors={colors} />}
            <TouchableOpacity
              style={styles.addAdvBtn}
              onPress={() => setShowAdvanceModal(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={20} color={colors.warning} />
              <Text style={styles.addAdvBtnText}>{t("addAdvance")}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* HAJRI TAB */}
        {tab === "hajri" && (
          <View>
            {/* Current Hajri Display */}
            <View style={styles.hajriCard}>
              <Text style={styles.hajriCardLabel}>{t("hajriLabel")}</Text>
              <Text style={styles.hajriBigNumber}>{labour.totalHajri}</Text>
              <Text style={styles.hajriSubtext}>
                {t("daysWorked")} × ₹{labour.ratePerDay} = ₹{stats.totalEarned.toLocaleString("en-IN")}
              </Text>
            </View>

            {/* +/- Quick Adjust */}
            <View style={styles.hajriAdjRow}>
              <TouchableOpacity
                style={[styles.hajriAdjBtn, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setHajri(id as string, Math.max(0, labour.totalHajri - 1));
                }}
              >
                <Ionicons name="remove" size={26} color={colors.destructive} />
              </TouchableOpacity>
              <View style={styles.hajriCounterDisplay}>
                <Text style={styles.hajriCounterText}>{labour.totalHajri}</Text>
                <Text style={styles.hajriCounterLabel}>{t("daysWorked")}</Text>
              </View>
              <TouchableOpacity
                style={[styles.hajriAdjBtn, { backgroundColor: colors.success + "15", borderColor: colors.success }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setHajri(id as string, labour.totalHajri + 1);
                }}
              >
                <Ionicons name="add" size={26} color={colors.success} />
              </TouchableOpacity>
            </View>

            {/* Manual Entry */}
            <View style={styles.hajriManualCard}>
              <Text style={styles.hajriManualLabel}>{t("hajriHint")}</Text>
              <View style={styles.hajriInputRow}>
                <TextInput
                  style={styles.hajriInput}
                  placeholder={t("hajriPlaceholder")}
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="numeric"
                  value={hajriInput}
                  onChangeText={setHajriInput}
                />
                <TouchableOpacity
                  style={styles.hajriSaveBtn}
                  onPress={handleUpdateHajri}
                  activeOpacity={0.85}
                >
                  <Text style={styles.hajriSaveBtnText}>{t("hajriUpdate")}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Info Note */}
            <View style={[styles.hajriInfoBox, { backgroundColor: colors.info + "15", borderColor: colors.info + "40" }]}>
              <Ionicons name="information-circle" size={18} color={colors.info} />
              <Text style={[styles.hajriInfoText, { color: colors.info }]}>
                {"  "}Total Hajri × ₹{labour.ratePerDay}/day = ₹{stats.totalEarned.toLocaleString("en-IN")} {t("totalEarned")}
              </Text>
            </View>
          </View>
        )}

        {/* ADVANCE TAB */}
        {tab === "advance" && (
          <View>
            <TouchableOpacity
              style={styles.addAdvBtn}
              onPress={() => setShowAdvanceModal(true)}
              activeOpacity={0.85}
            >
              <Ionicons name="add-circle" size={20} color={colors.warning} />
              <Text style={styles.addAdvBtnText}>{t("addAdvance")}</Text>
            </TouchableOpacity>

            <Text style={styles.histTitle}>{t("totalAdvanceTaken")}: ₹{stats.totalAdvance.toLocaleString("en-IN")}</Text>
            {[...labour.advances]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((a) => (
                <View key={a.id} style={styles.ledgerRow}>
                  <View style={[styles.ledgerIcon, { backgroundColor: colors.warning + "20" }]}>
                    <MaterialCommunityIcons name="currency-inr" size={20} color={colors.warning} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ledgerDate}>{fmt(a.date)}</Text>
                    {a.note && <Text style={styles.ledgerNote}>{a.note}</Text>}
                  </View>
                  <Text style={[styles.ledgerAmount, { color: colors.warning }]}>-₹{a.amount.toLocaleString("en-IN")}</Text>
                </View>
              ))}
            {labour.advances.length === 0 && (
              <Text style={styles.emptyMsg}>{t("noLabourers")}</Text>
            )}
          </View>
        )}

        {/* LEDGER TAB */}
        {tab === "ledger" && (
          <View>
            {/* Hajri summary row */}
            <View style={[styles.ledgerRow, { backgroundColor: colors.success + "12", borderRadius: colors.radius, marginBottom: 4 }]}>
              <View style={[styles.ledgerIcon, { backgroundColor: colors.success + "20" }]}>
                <Ionicons name="calendar" size={20} color={colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ledgerDate}>{t("daysWorked")}</Text>
                <Text style={styles.ledgerType}>{labour.totalHajri} days × ₹{labour.ratePerDay}</Text>
              </View>
              <Text style={[styles.ledgerAmount, { color: colors.success }]}>
                +₹{stats.totalEarned.toLocaleString("en-IN")}
              </Text>
            </View>

            {/* Advances */}
            {[...labour.advances]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((a) => (
                <View key={a.id} style={styles.ledgerRow}>
                  <View style={[styles.ledgerIcon, { backgroundColor: colors.warning + "20" }]}>
                    <MaterialCommunityIcons name="currency-inr" size={20} color={colors.warning} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ledgerDate}>{fmt(a.date)}</Text>
                    <Text style={styles.ledgerType}>{t("advanceTaken")}</Text>
                    {a.note && <Text style={styles.ledgerNote}>{a.note}</Text>}
                  </View>
                  <Text style={[styles.ledgerAmount, { color: colors.warning }]}>-₹{a.amount.toLocaleString("en-IN")}</Text>
                </View>
              ))}

            {/* Payments */}
            {[...labour.payments]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((p) => (
                <View key={p.id} style={styles.ledgerRow}>
                  <View style={[styles.ledgerIcon, { backgroundColor: colors.info + "20" }]}>
                    <Ionicons name="cash" size={20} color={colors.info} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ledgerDate}>{fmt(p.date)}</Text>
                    <Text style={styles.ledgerType}>{t("paymentMade")}</Text>
                    {p.note && <Text style={styles.ledgerNote}>{p.note}</Text>}
                  </View>
                  <Text style={[styles.ledgerAmount, { color: colors.info }]}>+₹{p.amount.toLocaleString("en-IN")}</Text>
                </View>
              ))}

            {labour.advances.length === 0 && labour.payments.length === 0 && (
              <Text style={styles.emptyMsg}>{t("noLabourers")}</Text>
            )}

            {/* Balance Summary */}
            <View style={[styles.ledgerRow, {
              backgroundColor: stats.remainingBalance >= 0 ? colors.success + "12" : colors.destructive + "12",
              borderRadius: colors.radius,
              marginTop: 8,
            }]}>
              <View style={[styles.ledgerIcon, { backgroundColor: stats.remainingBalance >= 0 ? colors.success + "30" : colors.destructive + "30" }]}>
                <Ionicons name="wallet" size={20} color={stats.remainingBalance >= 0 ? colors.success : colors.destructive} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.ledgerDate, { fontWeight: "700" }]}>{t("remainingBalance")}</Text>
                <Text style={styles.ledgerType}>Earned - Advance - Paid</Text>
              </View>
              <Text style={[styles.ledgerAmount, { color: stats.remainingBalance >= 0 ? colors.success : colors.destructive, fontSize: 15 }]}>
                ₹{Math.abs(stats.remainingBalance).toLocaleString("en-IN")}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Advance Modal */}
      <Modal visible={showAdvanceModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t("addAdvance")}</Text>
            <View style={styles.amountRow}>
              <Text style={styles.rupeeSign}>₹</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={t("advancePlaceholder")}
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={advanceAmount}
                onChangeText={setAdvanceAmount}
                autoFocus
              />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowAdvanceModal(false); setAdvanceAmount(""); }}>
                <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleAddAdvance}>
                <Text style={styles.modalConfirmText}>{t("save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Settle Modal */}
      <Modal visible={showSettleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t("settlePayment")}</Text>
            <Text style={styles.modalSubtitle}>{t("remainingBalance")}: ₹{stats.remainingBalance.toLocaleString("en-IN")}</Text>
            <View style={styles.amountRow}>
              <Text style={styles.rupeeSign}>₹</Text>
              <TextInput
                style={styles.modalInput}
                placeholder={stats.remainingBalance.toString()}
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={settleAmount}
                onChangeText={setSettleAmount}
                autoFocus
              />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => { setShowSettleModal(false); setSettleAmount(""); }}>
                <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalConfirm, { backgroundColor: colors.success }]} onPress={handleSettle}>
                <Text style={styles.modalConfirmText}>{t("markPaid")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SummaryCard({ label, value, color, colors }: { label: string; value: string; color: string; colors: ReturnType<typeof import("@/hooks/useColors").useColors> }) {
  return (
    <View style={{ flex: 1, alignItems: "center", padding: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: "800", color, fontFamily: "Inter_700Bold" }}>{value}</Text>
      <Text style={{ fontSize: 9, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" }}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof import("@/hooks/useColors").useColors> }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={{ fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>{label}</Text>
      <Text style={{ fontSize: 14, color: colors.foreground, fontFamily: "Inter_500Medium", flex: 1, textAlign: "right" }}>{value}</Text>
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
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.muted,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 10,
    },
    headerCenter: { flex: 1 },
    labourName: { fontSize: 18, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    labourMeta: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    badgeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      paddingHorizontal: 16,
      paddingVertical: 10,
      alignItems: "center",
    },
    statusChip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
    statusChipText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
    statusToggle: { flexDirection: "row", alignItems: "center", gap: 6, marginLeft: "auto" },
    statusToggleLabel: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    summaryRow: {
      flexDirection: "row",
      backgroundColor: colors.card,
      marginHorizontal: 16,
      borderRadius: colors.radius,
      marginBottom: 12,
      paddingVertical: 12,
      elevation: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    tabBar: {
      flexDirection: "row",
      marginHorizontal: 16,
      backgroundColor: colors.muted,
      borderRadius: colors.radius,
      marginBottom: 12,
      padding: 4,
    },
    tabItem: {
      flex: 1,
      paddingVertical: 8,
      alignItems: "center",
      borderRadius: colors.radius - 2,
    },
    tabItemActive: {
      backgroundColor: colors.card,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    tabText: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
    tabTextActive: { color: colors.primary, fontWeight: "700", fontFamily: "Inter_700Bold" },
    content: {
      paddingHorizontal: 16,
      paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 40),
    },
    overviewSection: { gap: 0 },
    settleBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.success,
      borderRadius: colors.radius,
      padding: 16,
      marginBottom: 16,
    },
    settleBtnText: {
      color: colors.successForeground,
      fontSize: 15,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
      flex: 1,
    },
    addAdvBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.card,
      borderWidth: 1.5,
      borderColor: colors.warning,
      borderRadius: colors.radius,
      padding: 14,
      marginBottom: 16,
    },
    addAdvBtnText: {
      color: colors.warning,
      fontSize: 15,
      fontWeight: "600",
      fontFamily: "Inter_600SemiBold",
    },

    // Hajri styles
    hajriCard: {
      backgroundColor: colors.primary + "15",
      borderWidth: 1.5,
      borderColor: colors.primary + "40",
      borderRadius: colors.radius,
      padding: 20,
      alignItems: "center",
      marginBottom: 16,
    },
    hajriCardLabel: {
      fontSize: 13,
      color: colors.primary,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    hajriBigNumber: {
      fontSize: 64,
      fontWeight: "900",
      color: colors.primary,
      fontFamily: "Inter_700Bold",
      lineHeight: 72,
    },
    hajriSubtext: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 4,
    },
    hajriAdjRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      marginBottom: 16,
      justifyContent: "center",
    },
    hajriAdjBtn: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
    },
    hajriCounterDisplay: {
      alignItems: "center",
      flex: 1,
    },
    hajriCounterText: {
      fontSize: 36,
      fontWeight: "800",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    hajriCounterLabel: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    hajriManualCard: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 16,
      marginBottom: 12,
    },
    hajriManualLabel: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginBottom: 12,
    },
    hajriInputRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
    },
    hajriInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: colors.radius - 2,
      padding: 12,
      fontSize: 16,
      color: colors.foreground,
      fontFamily: "Inter_500Medium",
    },
    hajriSaveBtn: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius - 2,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    hajriSaveBtnText: {
      color: "#fff",
      fontSize: 14,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
    },
    hajriInfoBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      borderWidth: 1,
      borderRadius: colors.radius,
      padding: 12,
    },
    hajriInfoText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      flex: 1,
    },

    histTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginBottom: 12,
    },
    ledgerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    ledgerIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    ledgerDate: {
      fontSize: 13,
      color: colors.foreground,
      fontFamily: "Inter_500Medium",
    },
    ledgerType: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    ledgerNote: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      fontStyle: "italic",
    },
    ledgerAmount: {
      fontSize: 14,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
    },
    emptyMsg: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      paddingVertical: 32,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modal: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 24,
      paddingBottom: 40,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginBottom: 8,
    },
    modalSubtitle: {
      fontSize: 14,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginBottom: 16,
    },
    amountRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 20,
    },
    rupeeSign: {
      fontSize: 24,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    modalInput: {
      flex: 1,
      fontSize: 28,
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      borderBottomWidth: 2,
      borderBottomColor: colors.primary,
      paddingVertical: 4,
    },
    modalBtns: {
      flexDirection: "row",
      gap: 12,
    },
    modalCancel: {
      flex: 1,
      paddingVertical: 14,
      alignItems: "center",
      borderRadius: colors.radius,
      backgroundColor: colors.muted,
    },
    modalCancelText: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
    },
    modalConfirm: {
      flex: 2,
      paddingVertical: 14,
      alignItems: "center",
      borderRadius: colors.radius,
      backgroundColor: colors.primary,
    },
    modalConfirmText: {
      color: "#fff",
      fontSize: 15,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
    },
  });
