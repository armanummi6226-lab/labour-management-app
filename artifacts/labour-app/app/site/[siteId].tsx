import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";

import { Labour, SITE_COLORS, useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

type SiteTab = "labourers" | "expenses";

export default function SiteDetailScreen() {
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  const colors = useColors();
  const { t } = useLanguage();
  const {
    getSite, updateSite, deleteSite, deleteSiteExpense,
    getLaboursForSite, calcStats, calcSiteStats, addSiteExpense,
  } = useApp();
  const insets = useSafeAreaInsets();

  const site = getSite(siteId as string);
  const [tab, setTab] = useState<SiteTab>("labourers");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmt, setExpenseAmt] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(site?.name ?? "");
  const [editColor, setEditColor] = useState(site?.color ?? SITE_COLORS[0]);

  if (!site) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <Text style={{ color: colors.mutedForeground }}>Site not found</Text>
      </View>
    );
  }

  const labourers = getLaboursForSite(siteId as string);
  const ss = calcSiteStats(siteId as string);
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

  const handleAddExpense = () => {
    const amt = Number(expenseAmt);
    if (!amt || amt <= 0 || !expenseDesc.trim()) {
      Alert.alert("", "Please enter amount and description");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addSiteExpense(siteId as string, amt, expenseDesc.trim());
    setExpenseAmt("");
    setExpenseDesc("");
    setShowExpenseModal(false);
  };

  const handleDeleteExpense = (expId: string) => {
    Alert.alert("Delete Expense", "Remove this expense record?", [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("confirm"),
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          deleteSiteExpense(siteId as string, expId);
        },
      },
    ]);
  };

  const handleEditSite = () => {
    if (!editName.trim()) {
      Alert.alert("", "Site name is required");
      return;
    }
    updateSite(siteId as string, { name: editName.trim(), color: editColor });
    setShowEditModal(false);
  };

  const handleDeleteSite = () => {
    Alert.alert(t("deleteSite"), t("deleteSiteConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("confirm"),
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteSite(siteId as string);
          router.back();
        },
      },
    ]);
  };

  const styles = makeStyles(colors, insets);

  const renderLabour = ({ item }: { item: Labour }) => {
    const s = calcStats(item);
    return (
      <TouchableOpacity
        style={styles.labourCard}
        onPress={() => router.push(`/labour/${item.id}` as any)}
        activeOpacity={0.75}
      >
        <View style={styles.labourAvatar}>
          <Text style={styles.labourAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.labourInfo}>
          <Text style={styles.labourName}>{item.name}</Text>
          <Text style={styles.labourMeta}>{item.workType || "-"} • ₹{item.ratePerDay}/day • {s.daysWorked}d Hajri</Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          {s.isLeftWithAdvance ? (
            <View style={[styles.badge, { backgroundColor: colors.destructive }]}>
              <Text style={styles.badgeText}>{t("leftWithAdvance")}</Text>
            </View>
          ) : s.isAdvancePending ? (
            <View style={[styles.badge, { backgroundColor: colors.warning }]}>
              <Text style={styles.badgeText}>{t("advancePendingBadge")}</Text>
            </View>
          ) : (
            <Text style={{ fontSize: 13, fontWeight: "700", color: s.remainingBalance >= 0 ? colors.success : colors.destructive }}>
              {s.remainingBalance >= 0 ? "+" : ""}{fmt(s.remainingBalance)}
            </Text>
          )}
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} style={{ marginTop: 4 }} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: site.color + "40" }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={[styles.headerDot, { backgroundColor: site.color }]} />
            <Text style={styles.headerTitle} numberOfLines={1}>{site.name}</Text>
          </View>
          <Text style={styles.headerSub}>{labourers.length} labourers</Text>
        </View>
        <TouchableOpacity onPress={() => { setEditName(site.name); setEditColor(site.color); setShowEditModal(true); }} style={{ marginRight: 12 }}>
          <Feather name="edit-2" size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDeleteSite}>
          <Feather name="trash-2" size={20} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <SummaryTile label={t("siteLabourCost")} value={fmt(ss.labourCost)} color={colors.success} colors={colors} />
        <SummaryTile label={t("siteTotalAdvance")} value={fmt(ss.totalAdvance)} color={colors.warning} colors={colors} />
        <SummaryTile label={t("siteOtherExpense")} value={fmt(ss.otherExpenses)} color={colors.info} colors={colors} />
        <SummaryTile label={t("siteNetCost")} value={fmt(ss.netCost)} color={colors.foreground} colors={colors} />
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, tab === "labourers" && [styles.tabItemActive, { backgroundColor: site.color }]]}
          onPress={() => setTab("labourers")}
        >
          <Ionicons name="people" size={16} color={tab === "labourers" ? "#fff" : colors.mutedForeground} />
          <Text style={[styles.tabText, { color: tab === "labourers" ? "#fff" : colors.mutedForeground }]}>
            {t("labourers")} ({labourers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, tab === "expenses" && [styles.tabItemActive, { backgroundColor: site.color }]]}
          onPress={() => setTab("expenses")}
        >
          <Ionicons name="receipt" size={16} color={tab === "expenses" ? "#fff" : colors.mutedForeground} />
          <Text style={[styles.tabText, { color: tab === "expenses" ? "#fff" : colors.mutedForeground }]}>
            {t("siteOtherExpense")} ({site.expenses.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {tab === "labourers" && (
        <FlatList
          data={labourers}
          keyExtractor={(item) => item.id}
          renderItem={renderLabour}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={colors.mutedForeground} />
              <Text style={styles.emptyText}>{t("noLabourers")}</Text>
            </View>
          }
        />
      )}

      {tab === "expenses" && (
        <FlatList
          data={[...site.expenses].sort((a, b) => b.date.localeCompare(a.date))}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <TouchableOpacity style={styles.addExpBtn} onPress={() => setShowExpenseModal(true)}>
              <Ionicons name="add-circle" size={20} color={colors.info} />
              <Text style={styles.addExpText}>{t("addExpense")}</Text>
            </TouchableOpacity>
          }
          renderItem={({ item }) => (
            <View style={styles.expenseRow}>
              <View style={[styles.expIcon, { backgroundColor: colors.info + "20" }]}>
                <Ionicons name="receipt" size={18} color={colors.info} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.expDesc}>{item.description}</Text>
                <Text style={styles.expDate}>{fmtDate(item.date)}</Text>
              </View>
              <Text style={[styles.expAmt, { color: colors.info }]}>₹{item.amount.toLocaleString("en-IN")}</Text>
              <TouchableOpacity onPress={() => handleDeleteExpense(item.id)} style={{ paddingLeft: 12 }}>
                <Feather name="trash-2" size={16} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="receipt-outline" size={48} color={colors.mutedForeground} />
              <Text style={styles.emptyText}>{t("noExpenses")}</Text>
            </View>
          }
        />
      )}

      {/* FAB — Add Labourer */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: site.color }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push(`/labour/add?siteId=${siteId}` as any);
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <Modal visible={showExpenseModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t("addExpense")}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t("expenseDescPlaceholder")}
              placeholderTextColor={colors.mutedForeground}
              value={expenseDesc}
              onChangeText={setExpenseDesc}
              autoFocus
            />
            <View style={styles.amtRow}>
              <Text style={styles.rupee}>₹</Text>
              <TextInput
                style={styles.amtInput}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                value={expenseAmt}
                onChangeText={setExpenseAmt}
              />
            </View>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowExpenseModal(false); setExpenseAmt(""); setExpenseDesc(""); }}>
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.info }]} onPress={handleAddExpense}>
                <Text style={styles.confirmText}>{t("save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Site Modal */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t("editSite")}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder={t("siteNamePlaceholder")}
              placeholderTextColor={colors.mutedForeground}
              value={editName}
              onChangeText={setEditName}
              autoFocus
            />
            <Text style={[{ fontSize: 13, fontFamily: "Inter_500Medium", color: colors.mutedForeground, marginBottom: 10 }]}>{t("siteColor")}</Text>
            <View style={styles.colorRow}>
              {SITE_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, editColor === c && styles.colorDotSel]}
                  onPress={() => setEditColor(c)}
                >
                  {editColor === c && <Ionicons name="checkmark" size={14} color="#fff" />}
                </TouchableOpacity>
              ))}
            </View>
            <View style={[styles.modalBtns, { marginTop: 20 }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowEditModal(false)}>
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleEditSite}>
                <Text style={styles.confirmText}>{t("save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SummaryTile({ label, value, color, colors }: {
  label: string; value: string; color: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center", paddingVertical: 10 }}>
      <Text style={{ fontSize: 13, fontWeight: "800", color, fontFamily: "Inter_700Bold" }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={{ fontSize: 9, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>, insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12),
      paddingHorizontal: 16, paddingBottom: 12,
      flexDirection: "row", alignItems: "center",
      borderBottomWidth: 2, backgroundColor: colors.background,
    },
    backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center", marginRight: 10 },
    headerDot: { width: 12, height: 12, borderRadius: 6 },
    headerTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    headerSub: { fontSize: 12, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2, marginLeft: 20 },
    summaryRow: { flexDirection: "row", backgroundColor: colors.card, marginHorizontal: 16, borderRadius: colors.radius, marginTop: 12, marginBottom: 8, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
    tabBar: { flexDirection: "row", marginHorizontal: 16, gap: 8, marginBottom: 8 },
    tabItem: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: colors.radius, backgroundColor: colors.muted },
    tabItemActive: { elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 3 },
    tabText: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
    list: { paddingHorizontal: 16, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 100) },
    labourCard: { backgroundColor: colors.card, borderRadius: colors.radius, padding: 12, flexDirection: "row", alignItems: "center", marginBottom: 8, elevation: 1, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
    labourAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center", marginRight: 10 },
    labourAvatarText: { fontSize: 17, fontWeight: "700", color: colors.primary, fontFamily: "Inter_700Bold" },
    labourInfo: { flex: 1 },
    labourName: { fontSize: 14, fontWeight: "600", color: colors.foreground, fontFamily: "Inter_600SemiBold" },
    labourMeta: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
    badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
    badgeText: { fontSize: 9, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
    addExpBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.info, borderRadius: colors.radius, padding: 14, marginBottom: 12 },
    addExpText: { color: colors.info, fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
    expenseRow: { backgroundColor: colors.card, borderRadius: colors.radius, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
    expIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
    expDesc: { fontSize: 14, fontWeight: "600", color: colors.foreground, fontFamily: "Inter_600SemiBold" },
    expDate: { fontSize: 11, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    expAmt: { fontSize: 14, fontWeight: "700", fontFamily: "Inter_700Bold" },
    empty: { alignItems: "center", paddingTop: 60, gap: 12 },
    emptyText: { fontSize: 16, color: colors.mutedForeground, fontFamily: "Inter_400Regular" },
    fab: { position: "absolute", right: 20, bottom: insets.bottom + (Platform.OS === "web" ? 100 : 30), width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center", elevation: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modal: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold", marginBottom: 16 },
    modalInput: { backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border, borderRadius: colors.radius, padding: 14, fontSize: 16, color: colors.foreground, fontFamily: "Inter_500Medium", marginBottom: 12 },
    amtRow: { flexDirection: "row", alignItems: "center", gap: 8, borderBottomWidth: 2, borderBottomColor: colors.primary, marginBottom: 20 },
    rupee: { fontSize: 22, color: colors.foreground, fontFamily: "Inter_700Bold" },
    amtInput: { flex: 1, fontSize: 28, color: colors.foreground, fontFamily: "Inter_700Bold", paddingVertical: 4 },
    modalBtns: { flexDirection: "row", gap: 12 },
    cancelBtn: { flex: 1, paddingVertical: 14, alignItems: "center", borderRadius: colors.radius, backgroundColor: colors.muted },
    cancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    confirmBtn: { flex: 2, paddingVertical: 14, alignItems: "center", borderRadius: colors.radius, backgroundColor: colors.primary },
    confirmText: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
    colorRow: { flexDirection: "row", gap: 12, flexWrap: "wrap", marginBottom: 4 },
    colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
    colorDotSel: { borderColor: colors.foreground },
  });
