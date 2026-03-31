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

type Tab = "overview" | "attendance" | "advance" | "ledger";

export default function LabourDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { t } = useLanguage();
  const {
    getLabour,
    updateLabour,
    deleteLabour,
    markAttendance,
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

  const stats = useMemo(() => labour ? calcStats(labour) : null, [labour, calcStats]);

  if (!labour || !stats) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.mutedForeground }}>Labour not found</Text>
      </View>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const todayAttendance = labour.attendance.find((a) => a.date === today);
  const isTodayPresent = todayAttendance?.present ?? false;

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

  const styles = makeStyles(colors, insets);

  // Format date
  const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const fmtShort = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

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
        {(["overview", "attendance", "advance", "ledger"] as Tab[]).map((tb) => (
          <TouchableOpacity
            key={tb}
            style={[styles.tabItem, tab === tb && styles.tabItemActive]}
            onPress={() => setTab(tb)}
          >
            <Text style={[styles.tabText, tab === tb && styles.tabTextActive]}>
              {tb === "overview" ? t("dashboard")
                : tb === "attendance" ? t("attendance")
                : tb === "advance" ? t("advance")
                : t("ledger")}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* OVERVIEW TAB */}
        {tab === "overview" && (
          <View style={styles.overviewSection}>
            {/* Settle Payment */}
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

            {/* Add Advance Button */}
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

        {/* ATTENDANCE TAB */}
        {tab === "attendance" && (
          <View>
            {/* Today's Mark */}
            <View style={styles.todayCard}>
              <Text style={styles.todayLabel}>{t("todayPresent")}</Text>
              <View style={styles.attendanceBtns}>
                <TouchableOpacity
                  style={[styles.attBtn, isTodayPresent && styles.attBtnPresent]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    markAttendance(id as string, today, true);
                  }}
                >
                  <Ionicons name="checkmark" size={20} color={isTodayPresent ? colors.successForeground : colors.success} />
                  <Text style={[styles.attBtnText, isTodayPresent && { color: colors.successForeground }]}>{t("present")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.attBtn, !isTodayPresent && todayAttendance && styles.attBtnAbsent]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    markAttendance(id as string, today, false);
                  }}
                >
                  <Ionicons name="close" size={20} color={(!isTodayPresent && todayAttendance) ? colors.destructiveForeground : colors.destructive} />
                  <Text style={[styles.attBtnText, (!isTodayPresent && todayAttendance) && { color: colors.destructiveForeground }]}>{t("absent")}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* History */}
            <Text style={styles.histTitle}>{t("attendanceHistory")}</Text>
            {[...labour.attendance]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((a) => (
                <View key={a.id} style={styles.attRecord}>
                  <Text style={styles.attDate}>{fmt(a.date)}</Text>
                  <View style={[styles.attChip, { backgroundColor: a.present ? colors.success + "20" : colors.destructive + "20" }]}>
                    <Text style={[styles.attChipText, { color: a.present ? colors.success : colors.destructive }]}>
                      {a.present ? t("present") : t("absent")}
                    </Text>
                  </View>
                </View>
              ))}
            {labour.attendance.length === 0 && (
              <Text style={styles.emptyMsg}>{t("noLabourers")}</Text>
            )}
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
            {/* All entries sorted by date */}
            {[
              ...labour.attendance.filter((a) => a.present).map((a) => ({ type: "work" as const, date: a.date, id: a.id })),
              ...labour.advances.map((a) => ({ type: "advance" as const, date: a.date, id: a.id, amount: a.amount, note: a.note })),
              ...labour.payments.map((p) => ({ type: "payment" as const, date: p.date, id: p.id, amount: p.amount, note: p.note })),
            ]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((entry) => (
                <View key={entry.id} style={styles.ledgerRow}>
                  <View style={[styles.ledgerIcon, {
                    backgroundColor: entry.type === "work"
                      ? colors.success + "20"
                      : entry.type === "advance"
                      ? colors.warning + "20"
                      : colors.info + "20",
                  }]}>
                    {entry.type === "work"
                      ? <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                      : entry.type === "advance"
                      ? <MaterialCommunityIcons name="currency-inr" size={20} color={colors.warning} />
                      : <Ionicons name="cash" size={20} color={colors.info} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ledgerDate}>{fmt(entry.date)}</Text>
                    <Text style={styles.ledgerType}>
                      {entry.type === "work" ? t("dateWorked")
                        : entry.type === "advance" ? t("advanceTaken")
                        : t("paymentMade")}
                    </Text>
                    {(entry as any).note && <Text style={styles.ledgerNote}>{(entry as any).note}</Text>}
                  </View>
                  {entry.type !== "work" && (
                    <Text style={[styles.ledgerAmount, {
                      color: entry.type === "advance" ? colors.warning : colors.info,
                    }]}>
                      {entry.type === "advance" ? "-" : "+"}₹{(entry as any).amount?.toLocaleString("en-IN")}
                    </Text>
                  )}
                  {entry.type === "work" && (
                    <Text style={[styles.ledgerAmount, { color: colors.success }]}>
                      +₹{labour.ratePerDay.toLocaleString("en-IN")}
                    </Text>
                  )}
                </View>
              ))}
            {labour.attendance.length === 0 && labour.advances.length === 0 && labour.payments.length === 0 && (
              <Text style={styles.emptyMsg}>{t("noLabourers")}</Text>
            )}
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
    todayCard: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 16,
      marginBottom: 16,
    },
    todayLabel: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 12 },
    attendanceBtns: { flexDirection: "row", gap: 12 },
    attBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      borderRadius: colors.radius,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingVertical: 12,
      backgroundColor: colors.background,
    },
    attBtnPresent: { backgroundColor: colors.success, borderColor: colors.success },
    attBtnAbsent: { backgroundColor: colors.destructive, borderColor: colors.destructive },
    attBtnText: { fontSize: 14, fontWeight: "600", color: colors.foreground, fontFamily: "Inter_600SemiBold" },
    histTitle: { fontSize: 14, fontWeight: "700", color: colors.foreground, marginBottom: 10, fontFamily: "Inter_700Bold" },
    attRecord: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    attDate: { fontSize: 14, color: colors.foreground, fontFamily: "Inter_400Regular" },
    attChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    attChipText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
    ledgerRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      gap: 12,
    },
    ledgerIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
    ledgerDate: { fontSize: 13, fontWeight: "600", color: colors.foreground, fontFamily: "Inter_600SemiBold" },
    ledgerType: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    ledgerNote: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontStyle: "italic" },
    ledgerAmount: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
    emptyMsg: { fontSize: 14, color: colors.mutedForeground, textAlign: "center", paddingTop: 32, fontFamily: "Inter_400Regular" },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modal: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      paddingBottom: insets.bottom + 24,
    },
    modalTitle: { fontSize: 20, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold", marginBottom: 4 },
    modalSubtitle: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 16 },
    amountRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
    rupeeSign: { fontSize: 22, fontWeight: "700", color: colors.foreground, marginRight: 8, fontFamily: "Inter_700Bold" },
    modalInput: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: colors.radius,
      paddingHorizontal: 14,
      paddingVertical: 13,
      fontSize: 20,
      color: colors.foreground,
      fontFamily: "Inter_500Medium",
    },
    modalBtns: { flexDirection: "row", gap: 12 },
    modalCancel: {
      flex: 1,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: colors.radius,
      paddingVertical: 14,
      alignItems: "center",
    },
    modalCancelText: { fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
    modalConfirm: {
      flex: 1,
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      paddingVertical: 14,
      alignItems: "center",
    },
    modalConfirmText: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  });
