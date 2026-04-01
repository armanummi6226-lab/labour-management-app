import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  Share,
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
    getLabour, getSite, updateLabour, deleteLabour,
    setHajri, addAdvance, deleteAdvance, settleAndReset, calcStats,
  } = useApp();
  const insets = useSafeAreaInsets();

  const labour = getLabour(id as string);
  const stats = useMemo(() => labour ? calcStats(labour) : null, [labour, calcStats]);
  const site = labour ? getSite(labour.siteId) : undefined;

  const [tab, setTab] = useState<Tab>("overview");

  // Hajri
  const [hajriInput, setHajriInput] = useState("");
  const [hajriNote, setHajriNote] = useState("");

  // Advance
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advanceAmount, setAdvanceAmount] = useState("");
  const [advanceNote, setAdvanceNote] = useState("");

  // Settlement
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleNote, setSettleNote] = useState("");

  // Edit mode
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(labour?.name ?? "");
  const [editPhone, setEditPhone] = useState(labour?.phone ?? "");
  const [editWorkType, setEditWorkType] = useState(labour?.workType ?? "");
  const [editRate, setEditRate] = useState(labour?.ratePerDay.toString() ?? "");

  if (!labour || !stats) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.mutedForeground }}>Labour not found</Text>
      </View>
    );
  }

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  // ─── Settlement Case Info ─────────────────────────────────────────────────────
  const settleCase: "case1" | "case2" = stats.totalEarned >= stats.totalAdvance ? "case1" : "case2";
  const carryForwardAmount = settleCase === "case2" ? stats.totalAdvance - stats.totalEarned : 0;

  // ─── Handlers ─────────────────────────────────────────────────────────────────

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
    if (!amt || amt <= 0) { Alert.alert("", t("rateRequired")); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addAdvance(id as string, amt, advanceNote.trim() || undefined);
    setAdvanceAmount("");
    setAdvanceNote("");
    setShowAdvanceModal(false);
  };

  const handleDeleteAdvance = (advId: string, amt: number) => {
    Alert.alert(t("deleteAdvance"), t("deleteAdvanceConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("confirm"),
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          deleteAdvance(id as string, advId);
        },
      },
    ]);
  };

  const handleSettle = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const result = settleAndReset(id as string, settleNote.trim() || undefined);
    setSettleNote("");
    setShowSettleModal(false);
    const msg = result === "case1"
      ? `✅ Full settlement done!\nHajri & Advance reset to 0. Balance paid to worker.`
      : `⚠️ Advance carried forward!\nHajri reset. ₹${carryForwardAmount.toLocaleString("en-IN")} carry forward.`;
    Alert.alert("Settlement Complete", msg);
  };

  const handleUpdateHajri = () => {
    const val = Number(hajriInput);
    if (!hajriInput || isNaN(val) || val < 0) {
      Alert.alert("", "Please enter a valid number");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHajri(id as string, val, hajriNote.trim() || undefined);
    setHajriInput("");
    setHajriNote("");
  };

  const handleEditSave = () => {
    if (!editName.trim()) { Alert.alert("", t("nameRequired")); return; }
    const rate = Number(editRate);
    if (!rate || rate <= 0) { Alert.alert("", t("rateRequired")); return; }
    updateLabour(id as string, {
      name: editName.trim(),
      phone: editPhone.trim() || undefined,
      workType: editWorkType.trim() || undefined,
      ratePerDay: rate,
    });
    setShowEditModal(false);
  };

  const handleShare = async () => {
    const settleInfo = settleCase === "case1"
      ? `Balance due: ${fmt(stats.remainingBalance)}`
      : `Carry Forward Advance: ${fmt(carryForwardAmount)}`;

    const msg = [
      `*Labour Report — ${labour.name}*`,
      `Site: ${site?.name ?? "—"}`,
      `Work: ${labour.workType ?? "—"} | Rate: ₹${labour.ratePerDay}/day`,
      `Phone: ${labour.phone ?? "—"}`,
      ``,
      `📊 *Summary*`,
      `Total Hajri: ${stats.daysWorked} days`,
      `Total Earned: ${fmt(stats.totalEarned)}`,
      `Total Advance: ${fmt(stats.totalAdvance)}`,
      `Payments Made: ${fmt(stats.totalPaid)}`,
      `${settleInfo}`,
      ``,
      `_Sent via Labour Manager App_`,
    ].join("\n");

    try {
      await Share.share({ message: msg });
    } catch {
      // ignore
    }
  };

  const styles = makeStyles(colors, insets);

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
          <Text style={styles.labourMeta}>{labour.workType || "-"} • ₹{labour.ratePerDay}/day{site ? ` • ${site.name}` : ""}</Text>
        </View>
        <TouchableOpacity onPress={() => {
          setEditName(labour.name);
          setEditPhone(labour.phone ?? "");
          setEditWorkType(labour.workType ?? "");
          setEditRate(labour.ratePerDay.toString());
          setShowEditModal(true);
        }} style={{ marginRight: 12 }}>
          <Feather name="edit-2" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete}>
          <Feather name="trash-2" size={18} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      {/* Status Row */}
      <View style={styles.badgeRow}>
        <View style={[styles.chip, { backgroundColor: labour.status === "active" ? colors.accent : colors.muted }]}>
          <Text style={[styles.chipText, { color: labour.status === "active" ? colors.primary : colors.mutedForeground }]}>
            {labour.status === "active" ? t("active") : t("leftWork")}
          </Text>
        </View>
        {stats.isLeftWithAdvance && (
          <View style={[styles.chip, { backgroundColor: colors.destructive }]}>
            <Ionicons name="warning" size={12} color="#fff" />
            <Text style={[styles.chipText, { color: "#fff" }]}> {t("leftWithAdvance")}</Text>
          </View>
        )}
        {!stats.isLeftWithAdvance && stats.isAdvancePending && (
          <View style={[styles.chip, { backgroundColor: colors.warning }]}>
            <Text style={[styles.chipText, { color: "#fff" }]}>{t("advancePendingBadge")}</Text>
          </View>
        )}
        <View style={styles.statusToggle}>
          <Switch
            value={labour.status === "active"}
            onValueChange={(v) => { Haptics.selectionAsync(); updateLabour(id as string, { status: v ? "active" : "left" }); }}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <SummaryCard label={t("daysWorked")} value={stats.daysWorked.toString()} color={colors.info} colors={colors} />
        <SummaryCard label={t("totalEarned")} value={fmt(stats.totalEarned)} color={colors.success} colors={colors} />
        <SummaryCard label={t("totalAdvanceTaken")} value={fmt(stats.totalAdvance)} color={colors.warning} colors={colors} />
        <SummaryCard
          label={t("remainingBalance")}
          value={fmt(Math.abs(stats.remainingBalance))}
          color={stats.remainingBalance >= 0 ? colors.success : colors.destructive}
          colors={colors}
        />
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map(({ key, label }) => (
          <TouchableOpacity key={key} style={[styles.tabItem, tab === key && styles.tabItemActive]} onPress={() => setTab(key)}>
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <View>
            {/* Settle Button */}
            {(stats.daysWorked > 0 || stats.totalAdvance > 0) && (
              <TouchableOpacity style={styles.settleBtn} onPress={() => setShowSettleModal(true)} activeOpacity={0.85}>
                <MaterialCommunityIcons name="cash-check" size={22} color="#fff" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.settleBtnTitle}>{t("settlePayment")}</Text>
                  <Text style={styles.settleBtnSub}>
                    {settleCase === "case1" ? t("case1Info") : t("case2Info")}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </TouchableOpacity>
            )}

            {/* Share button */}
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.85}>
              <Ionicons name="share-social" size={18} color={colors.info} />
              <Text style={[styles.shareBtnText, { color: colors.info }]}>{t("shareSummary")}</Text>
            </TouchableOpacity>

            <InfoRow label={t("addedOn")} value={fmtDate(labour.createdAt)} colors={colors} />
            {labour.phone && <InfoRow label={t("phone")} value={labour.phone} colors={colors} />}
            {labour.notes && <InfoRow label={t("notes")} value={labour.notes} colors={colors} />}
            {labour.hajriNote && <InfoRow label="Hajri Note" value={labour.hajriNote} colors={colors} />}

            <TouchableOpacity style={styles.addAdvBtn} onPress={() => setShowAdvanceModal(true)} activeOpacity={0.85}>
              <Ionicons name="add-circle" size={20} color={colors.warning} />
              <Text style={styles.addAdvText}>{t("addAdvance")}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── HAJRI ────────────────────────────────────────────────────────── */}
        {tab === "hajri" && (
          <View>
            {/* Big number */}
            <View style={styles.hajriCard}>
              <Text style={styles.hajriCardLabel}>{t("hajriLabel")}</Text>
              <Text style={[styles.hajriBigNum, { color: colors.primary }]}>{labour.totalHajri}</Text>
              <Text style={styles.hajriCalc}>
                {labour.totalHajri} × ₹{labour.ratePerDay} = {fmt(stats.totalEarned)}
              </Text>
              {labour.hajriNote ? (
                <View style={[styles.hajriNoteBox, { backgroundColor: colors.muted }]}>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>📝 {labour.hajriNote}</Text>
                </View>
              ) : null}
            </View>

            {/* +/- Quick Adjust */}
            <View style={styles.adjRow}>
              <TouchableOpacity
                style={[styles.adjBtn, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setHajri(id as string, Math.max(0, labour.totalHajri - 1)); }}
              >
                <Ionicons name="remove" size={26} color={colors.destructive} />
              </TouchableOpacity>
              <View style={{ alignItems: "center", flex: 1 }}>
                <Text style={{ fontSize: 32, fontWeight: "800", color: colors.foreground, fontFamily: "Inter_700Bold" }}>{labour.totalHajri}</Text>
                <Text style={{ fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>{t("daysWorked")}</Text>
              </View>
              <TouchableOpacity
                style={[styles.adjBtn, { backgroundColor: colors.success + "15", borderColor: colors.success }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setHajri(id as string, labour.totalHajri + 1); }}
              >
                <Ionicons name="add" size={26} color={colors.success} />
              </TouchableOpacity>
            </View>

            {/* Manual entry with note */}
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
                <TouchableOpacity style={styles.hajriSaveBtn} onPress={handleUpdateHajri} activeOpacity={0.85}>
                  <Text style={styles.hajriSaveTxt}>{t("hajriUpdate")}</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.hajriInput, { marginTop: 8, fontSize: 14 }]}
                placeholder={t("hajriNote")}
                placeholderTextColor={colors.mutedForeground}
                value={hajriNote}
                onChangeText={setHajriNote}
              />
            </View>
          </View>
        )}

        {/* ── ADVANCE ──────────────────────────────────────────────────────── */}
        {tab === "advance" && (
          <View>
            <TouchableOpacity style={styles.addAdvBtn} onPress={() => setShowAdvanceModal(true)} activeOpacity={0.85}>
              <Ionicons name="add-circle" size={20} color={colors.warning} />
              <Text style={styles.addAdvText}>{t("addAdvance")}</Text>
            </TouchableOpacity>

            <Text style={styles.histTitle}>{t("totalAdvanceTaken")}: {fmt(stats.totalAdvance)}</Text>

            {[...labour.advances].sort((a, b) => b.date.localeCompare(a.date)).map((a) => (
              <View key={a.id} style={styles.ledgerRow}>
                <View style={[styles.ledgerIcon, { backgroundColor: colors.warning + "20" }]}>
                  <MaterialCommunityIcons name="currency-inr" size={20} color={colors.warning} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ledgerDate}>{fmtDate(a.date)}</Text>
                  {a.note ? <Text style={styles.ledgerNote}>📝 {a.note}</Text> : null}
                </View>
                <Text style={[styles.ledgerAmt, { color: colors.warning }]}>-₹{a.amount.toLocaleString("en-IN")}</Text>
                <TouchableOpacity onPress={() => handleDeleteAdvance(a.id, a.amount)} style={{ paddingLeft: 12 }}>
                  <Feather name="trash-2" size={16} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            ))}

            {labour.advances.length === 0 && <Text style={styles.emptyMsg}>{t("noLabourers")}</Text>}
          </View>
        )}

        {/* ── LEDGER ───────────────────────────────────────────────────────── */}
        {tab === "ledger" && (() => {
          // Build unified timeline: hajriHistory + advances + settlements, sorted newest first
          type LedgerEntry =
            | { kind: "hajri"; id: string; date: string; totalAfter: number; delta: number; note?: string }
            | { kind: "advance"; id: string; date: string; amount: number; note?: string; isCarry?: boolean }
            | { kind: "settlement"; id: string; date: string; case: "case1" | "case2"; balancePaid: number; carryForward: number; earnedAtSettle: number; advanceAtSettle: number; note?: string };

          const entries: LedgerEntry[] = [
            ...(labour.hajriHistory ?? []).map((h) => ({ kind: "hajri" as const, ...h })),
            ...(labour.advances ?? []).map((a) => ({ kind: "advance" as const, ...a, isCarry: a.note?.toLowerCase().includes("carry") })),
            ...(labour.settlements ?? []).map((s) => ({ kind: "settlement" as const, ...s })),
          ].sort((a, b) => b.date.localeCompare(a.date));

          const hasEntries = entries.length > 0 || labour.totalHajri > 0;

          return (
            <View>
              {/* Current Balance Summary */}
              <View style={[styles.balanceSummaryCard, {
                backgroundColor: stats.remainingBalance >= 0 ? colors.success + "12" : stats.remainingBalance === 0 ? colors.muted : colors.destructive + "12",
                borderColor: stats.remainingBalance >= 0 ? colors.success + "40" : stats.remainingBalance === 0 ? colors.border : colors.destructive + "40",
              }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.balanceSummaryLabel, { color: colors.mutedForeground }]}>{t("remainingBalance")}</Text>
                  <Text style={[styles.balanceSummaryValue, { color: stats.remainingBalance >= 0 ? colors.success : stats.remainingBalance === 0 ? colors.mutedForeground : colors.destructive }]}>
                    {stats.remainingBalance >= 0 ? "+" : ""}{fmt(stats.remainingBalance)}
                  </Text>
                  <Text style={{ fontSize: 10, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>
                    {stats.totalEarned > 0 || stats.totalAdvance > 0
                      ? `Earned ${fmt(stats.totalEarned)} − Advance ${fmt(stats.totalAdvance)}`
                      : "Start fresh after settlement"}
                  </Text>
                </View>
                <Ionicons name="wallet-outline" size={28} color={stats.remainingBalance >= 0 ? colors.success : stats.remainingBalance === 0 ? colors.mutedForeground : colors.destructive} />
              </View>

              {/* Timeline */}
              {entries.length === 0 && (
                <Text style={styles.emptyMsg}>No history yet. Add Hajri or Advance to get started.</Text>
              )}

              {entries.map((entry, idx) => {
                if (entry.kind === "hajri") {
                  return (
                    <View key={entry.id} style={styles.ledgerRow}>
                      <View style={[styles.ledgerIcon, { backgroundColor: colors.success + "20" }]}>
                        <Ionicons name="calendar" size={18} color={colors.success} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ledgerType}>Hajri Updated</Text>
                        <Text style={styles.ledgerDate}>{fmtDate(entry.date)}</Text>
                        <Text style={styles.ledgerSubInfo}>
                          {entry.delta >= 0 ? `+${entry.delta}` : entry.delta} days → Total: {entry.totalAfter} days
                        </Text>
                        {entry.note ? <Text style={styles.ledgerNote}>📝 {entry.note}</Text> : null}
                      </View>
                      <Text style={[styles.ledgerAmt, { color: colors.success }]}>
                        {entry.totalAfter} d
                      </Text>
                    </View>
                  );
                }

                if (entry.kind === "advance") {
                  return (
                    <View key={entry.id} style={[styles.ledgerRow, entry.isCarry && { backgroundColor: colors.warning + "08", borderRadius: 8 }]}>
                      <View style={[styles.ledgerIcon, { backgroundColor: colors.warning + "20" }]}>
                        <MaterialCommunityIcons name="currency-inr" size={18} color={colors.warning} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ledgerType}>{entry.isCarry ? t("carryForward") : t("advanceTaken")}</Text>
                        <Text style={styles.ledgerDate}>{fmtDate(entry.date)}</Text>
                        {entry.note && !entry.isCarry ? <Text style={styles.ledgerNote}>📝 {entry.note}</Text> : null}
                      </View>
                      <Text style={[styles.ledgerAmt, { color: colors.warning }]}>−{fmt(entry.amount)}</Text>
                    </View>
                  );
                }

                if (entry.kind === "settlement") {
                  return (
                    <View key={entry.id} style={[styles.ledgerRow, { backgroundColor: entry.case === "case1" ? colors.success + "10" : colors.warning + "10", borderRadius: 8 }]}>
                      <View style={[styles.ledgerIcon, { backgroundColor: (entry.case === "case1" ? colors.success : colors.warning) + "25" }]}>
                        <Ionicons name="checkmark-done-circle" size={18} color={entry.case === "case1" ? colors.success : colors.warning} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.ledgerType, { color: entry.case === "case1" ? colors.success : colors.warning }]}>
                          {t("settlement")} — {entry.case === "case1" ? t("settlePaymentCase1") : t("settlePaymentCase2")}
                        </Text>
                        <Text style={styles.ledgerDate}>{fmtDate(entry.date)}</Text>
                        <Text style={styles.ledgerSubInfo}>
                          Earned: {fmt(entry.earnedAtSettle)} | Advance: {fmt(entry.advanceAtSettle)}
                        </Text>
                        {entry.case === "case1" && entry.balancePaid > 0 && (
                          <Text style={[styles.ledgerSubInfo, { color: colors.success }]}>Paid to worker: {fmt(entry.balancePaid)}</Text>
                        )}
                        {entry.case === "case2" && (
                          <Text style={[styles.ledgerSubInfo, { color: colors.warning }]}>Carry forward: {fmt(entry.carryForward)}</Text>
                        )}
                        {entry.note ? <Text style={styles.ledgerNote}>📝 {entry.note}</Text> : null}
                      </View>
                      <Text style={[styles.ledgerAmt, { color: entry.case === "case1" ? colors.success : colors.warning, fontSize: 10, textAlign: "right" }]}>
                        RESET
                      </Text>
                    </View>
                  );
                }

                return null;
              })}
            </View>
          );
        })()}
      </ScrollView>

      {/* ── Advance Modal ─────────────────────────────────────────────────── */}
      <Modal visible={showAdvanceModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t("addAdvance")}</Text>
            <View style={styles.amtRow}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput
                style={styles.modalAmtInput}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={advanceAmount}
                onChangeText={setAdvanceAmount}
                autoFocus
              />
            </View>
            <TextInput
              style={styles.modalNoteInput}
              placeholder={t("transactionNotePlaceholder")}
              placeholderTextColor={colors.mutedForeground}
              value={advanceNote}
              onChangeText={setAdvanceNote}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAdvanceModal(false); setAdvanceAmount(""); setAdvanceNote(""); }}>
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.warning }]} onPress={handleAddAdvance}>
                <Text style={styles.confirmText}>{t("save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Settlement Modal ──────────────────────────────────────────────── */}
      <Modal visible={showSettleModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t("settlePayment")}</Text>

            {/* Case Info */}
            <View style={[styles.caseBox, { backgroundColor: settleCase === "case1" ? colors.success + "15" : colors.warning + "15", borderColor: settleCase === "case1" ? colors.success + "40" : colors.warning + "40" }]}>
              <Text style={[styles.caseIcon]}>{settleCase === "case1" ? "✅" : "⚠️"}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.caseTitle, { color: settleCase === "case1" ? colors.success : colors.warning }]}>
                  {settleCase === "case1" ? t("settlePaymentCase1") : t("settlePaymentCase2")}
                </Text>
                <Text style={[styles.caseSub, { color: colors.mutedForeground }]}>
                  {settleCase === "case1"
                    ? `Pay ₹${stats.remainingBalance.toLocaleString("en-IN")} to worker. Hajri & Advance → 0`
                    : `Carry ₹${carryForwardAmount.toLocaleString("en-IN")} forward. Hajri → 0`}
                </Text>
              </View>
            </View>

            <View style={styles.settleInfoGrid}>
              <SettleInfoItem label="Total Earned" value={fmt(stats.totalEarned)} color={colors.success} colors={colors} />
              <SettleInfoItem label="Total Advance" value={fmt(stats.totalAdvance)} color={colors.warning} colors={colors} />
            </View>

            <Text style={[styles.autoResetNote, { color: colors.mutedForeground }]}>⚡ {t("autoReset")}</Text>

            <TextInput
              style={styles.modalNoteInput}
              placeholder={t("settlementNote")}
              placeholderTextColor={colors.mutedForeground}
              value={settleNote}
              onChangeText={setSettleNote}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowSettleModal(false); setSettleNote(""); }}>
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: settleCase === "case1" ? colors.success : colors.warning }]} onPress={handleSettle}>
                <Text style={styles.confirmText}>{t("markPaid")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Edit Labour Modal ─────────────────────────────────────────────── */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t("editLabour")}</Text>
            <TextInput style={styles.editInput} placeholder={t("namePlaceholder")} placeholderTextColor={colors.mutedForeground} value={editName} onChangeText={setEditName} autoFocus />
            <TextInput style={styles.editInput} placeholder={t("phonePlaceholderShort")} placeholderTextColor={colors.mutedForeground} value={editPhone} onChangeText={setEditPhone} keyboardType="phone-pad" />
            <TextInput style={styles.editInput} placeholder={t("workTypePlaceholder")} placeholderTextColor={colors.mutedForeground} value={editWorkType} onChangeText={setEditWorkType} />
            <TextInput style={styles.editInput} placeholder={t("ratePlaceholder")} placeholderTextColor={colors.mutedForeground} value={editRate} onChangeText={setEditRate} keyboardType="numeric" />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleEditSave}>
                <Text style={styles.confirmText}>{t("save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SummaryCard({ label, value, color, colors }: { label: string; value: string; color: string; colors: any }) {
  return (
    <View style={{ flex: 1, alignItems: "center", padding: 8 }}>
      <Text style={{ fontSize: 13, fontWeight: "800", color, fontFamily: "Inter_700Bold" }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={{ fontSize: 9, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" }}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Text style={{ fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>{label}</Text>
      <Text style={{ fontSize: 14, color: colors.foreground, fontFamily: "Inter_500Medium", flex: 1, textAlign: "right" }}>{value}</Text>
    </View>
  );
}

function SettleInfoItem({ label, value, color, colors }: { label: string; value: string; color: string; colors: any }) {
  return (
    <View style={{ flex: 1, alignItems: "center", padding: 10, backgroundColor: colors.muted, borderRadius: 8, margin: 4 }}>
      <Text style={{ fontSize: 15, fontWeight: "800", color, fontFamily: "Inter_700Bold" }}>{value}</Text>
      <Text style={{ fontSize: 10, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 }}>{label}</Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const makeStyles = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>, insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12),
      paddingHorizontal: 16, paddingBottom: 12,
      flexDirection: "row", alignItems: "center",
      backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center", marginRight: 10 },
    headerCenter: { flex: 1 },
    labourName: { fontSize: 17, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    labourMeta: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 16, paddingVertical: 10, alignItems: "center" },
    chip: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
    chipText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
    statusToggle: { marginLeft: "auto" },
    summaryRow: { flexDirection: "row", backgroundColor: colors.card, marginHorizontal: 16, borderRadius: colors.radius, marginBottom: 10, paddingVertical: 10, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
    tabBar: { flexDirection: "row", marginHorizontal: 16, backgroundColor: colors.muted, borderRadius: colors.radius, marginBottom: 10, padding: 3 },
    tabItem: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: colors.radius - 2 },
    tabItemActive: { backgroundColor: colors.card, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    tabText: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
    tabTextActive: { color: colors.primary, fontWeight: "700", fontFamily: "Inter_700Bold" },
    content: { paddingHorizontal: 16, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 40) },

    // Overview
    settleBtn: {
      flexDirection: "row", alignItems: "center", gap: 10,
      backgroundColor: colors.success, borderRadius: colors.radius,
      padding: 16, marginBottom: 10,
    },
    settleBtnTitle: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
    settleBtnSub: { color: "#fff", fontSize: 11, fontFamily: "Inter_400Regular", opacity: 0.85, marginTop: 2 },
    shareBtn: {
      flexDirection: "row", alignItems: "center", gap: 8,
      backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.info + "60",
      borderRadius: colors.radius, padding: 12, marginBottom: 12,
    },
    shareBtnText: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
    addAdvBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.warning, borderRadius: colors.radius, padding: 14, marginTop: 12 },
    addAdvText: { color: colors.warning, fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },

    // Hajri
    hajriCard: { backgroundColor: colors.primary + "12", borderWidth: 1.5, borderColor: colors.primary + "40", borderRadius: colors.radius, padding: 20, alignItems: "center", marginBottom: 14 },
    hajriCardLabel: { fontSize: 12, color: colors.primary, fontFamily: "Inter_600SemiBold", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 4 },
    hajriBigNum: { fontSize: 60, fontWeight: "900", fontFamily: "Inter_700Bold", lineHeight: 68 },
    hajriCalc: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 4 },
    hajriNoteBox: { marginTop: 10, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
    adjRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 14, justifyContent: "center" },
    adjBtn: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", borderWidth: 2 },
    hajriManualCard: { backgroundColor: colors.card, borderRadius: colors.radius, padding: 14, marginBottom: 10 },
    hajriManualLabel: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 10 },
    hajriInputRow: { flexDirection: "row", gap: 8, alignItems: "center" },
    hajriInput: { flex: 1, backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border, borderRadius: colors.radius - 2, padding: 12, fontSize: 15, color: colors.foreground, fontFamily: "Inter_500Medium" },
    hajriSaveBtn: { backgroundColor: colors.primary, borderRadius: colors.radius - 2, paddingVertical: 12, paddingHorizontal: 14 },
    hajriSaveTxt: { color: "#fff", fontSize: 13, fontWeight: "700", fontFamily: "Inter_700Bold" },

    // Shared
    histTitle: { fontSize: 14, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold", marginBottom: 10 },
    ledgerRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    ledgerIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
    ledgerDate: { fontSize: 13, color: colors.foreground, fontFamily: "Inter_500Medium" },
    ledgerType: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    ledgerNote: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", fontStyle: "italic" },
    ledgerAmt: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
    emptyMsg: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 32 },
    ledgerSubInfo: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 1 },
    balanceSummaryCard: {
      flexDirection: "row", alignItems: "center",
      borderWidth: 1.5, borderRadius: colors.radius, padding: 14, marginBottom: 14,
    },
    balanceSummaryLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 2 },
    balanceSummaryValue: { fontSize: 26, fontWeight: "800", fontFamily: "Inter_700Bold" },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modal: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold", marginBottom: 16 },
    amtRow: { flexDirection: "row", alignItems: "center", gap: 8, borderBottomWidth: 2, borderBottomColor: colors.primary, marginBottom: 12 },
    rupee: { fontSize: 24, color: colors.foreground, fontFamily: "Inter_700Bold" },
    modalAmtInput: { flex: 1, fontSize: 28, color: colors.foreground, fontFamily: "Inter_700Bold", paddingVertical: 4 },
    modalNoteInput: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: colors.radius - 2, padding: 12, fontSize: 14, color: colors.foreground, fontFamily: "Inter_400Regular", marginBottom: 16 },
    caseBox: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderWidth: 1.5, borderRadius: colors.radius, padding: 12, marginBottom: 12 },
    caseIcon: { fontSize: 20 },
    caseTitle: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
    caseSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
    settleInfoGrid: { flexDirection: "row", marginBottom: 12 },
    autoResetNote: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 12 },
    editInput: { backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border, borderRadius: colors.radius - 2, padding: 12, fontSize: 15, color: colors.foreground, fontFamily: "Inter_500Medium", marginBottom: 10 },
    modalBtns: { flexDirection: "row", gap: 12 },
    cancelBtn: { flex: 1, paddingVertical: 14, alignItems: "center", borderRadius: colors.radius, backgroundColor: colors.muted },
    cancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    confirmBtn: { flex: 2, paddingVertical: 14, alignItems: "center", borderRadius: colors.radius, backgroundColor: colors.primary },
    confirmText: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  });
