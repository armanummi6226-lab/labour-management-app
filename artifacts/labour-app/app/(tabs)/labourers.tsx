import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { Site, SITE_COLORS, useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function SitesScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const { sites, addSite, deleteSite, calcSiteStats } = useApp();
  const insets = useSafeAreaInsets();

  const [showAddModal, setShowAddModal] = useState(false);
  const [siteName, setSiteName] = useState("");
  const [selectedColor, setSelectedColor] = useState(SITE_COLORS[1]);
  const [search, setSearch] = useState("");

  const handleAddSite = () => {
    if (!siteName.trim()) {
      Alert.alert("", "Site name is required");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addSite(siteName.trim(), selectedColor);
    setSiteName("");
    setSelectedColor(SITE_COLORS[1]);
    setShowAddModal(false);
  };

  const handleDeleteSite = (site: Site) => {
    Alert.alert(t("deleteSite"), t("deleteSiteConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("confirm"),
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteSite(site.id);
        },
      },
    ]);
  };

  const filteredSites = useMemo(() => {
    if (!search.trim()) return sites;
    const q = search.toLowerCase();
    return sites.filter((s) => s.name.toLowerCase().includes(q));
  }, [sites, search]);

  const styles = makeStyles(colors, insets);

  const renderSite = ({ item }: { item: Site }) => {
    const ss = calcSiteStats(item.id);
    const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
    return (
      <TouchableOpacity
        style={styles.siteCard}
        onPress={() => {
          Haptics.selectionAsync();
          router.push(`/site/${item.id}` as any);
        }}
        onLongPress={() => handleDeleteSite(item)}
        activeOpacity={0.75}
      >
        <View style={[styles.siteColorBar, { backgroundColor: item.color }]} />
        <View style={styles.siteContent}>
          <View style={styles.siteTopRow}>
            <View style={[styles.siteDot, { backgroundColor: item.color }]} />
            <Text style={styles.siteName}>{item.name}</Text>
            {ss.alertCount > 0 && (
              <View style={[styles.alertBadge, { backgroundColor: colors.destructive }]}>
                <Ionicons name="warning" size={10} color="#fff" />
                <Text style={styles.alertBadgeText}>{ss.alertCount}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.arrowBtn}
              onPress={() => router.push(`/site/${item.id}` as any)}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View style={styles.siteStats}>
            <StatPill label={t("totalLabourers")} value={ss.activeCount.toString()} color={colors.info} colors={colors} />
            <StatPill label={t("siteLabourCost")} value={fmt(ss.labourCost)} color={colors.success} colors={colors} />
            <StatPill label={t("siteTotalAdvance")} value={fmt(ss.totalAdvance)} color={colors.warning} colors={colors} />
            <StatPill label={t("siteOtherExpense")} value={fmt(ss.otherExpenses)} color={colors.mutedForeground} colors={colors} />
          </View>

          <View style={styles.siteNetRow}>
            <Text style={styles.siteNetLabel}>{t("siteNetCost")}</Text>
            <Text style={[styles.siteNetValue, { color: colors.foreground }]}>{fmt(ss.netCost)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{t("sites")}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowAddModal(true);
          }}
        >
          <Ionicons name="add" size={24} color={colors.primaryForeground} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={17} color={colors.mutedForeground} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search sites..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={17} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredSites}
        keyExtractor={(item) => item.id}
        renderItem={renderSite}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="office-building-outline" size={52} color={colors.mutedForeground} />
            <Text style={styles.emptyTitle}>{t("noSites")}</Text>
            <Text style={styles.emptySubtitle}>{t("startAddingSite")}</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add-circle" size={18} color={colors.primaryForeground} />
              <Text style={styles.emptyBtnText}>{t("addSite")}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add Site Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{t("addSite")}</Text>

            <TextInput
              style={styles.input}
              placeholder={t("siteNamePlaceholder")}
              placeholderTextColor={colors.mutedForeground}
              value={siteName}
              onChangeText={setSiteName}
              autoFocus
            />

            <Text style={[styles.colorLabel, { color: colors.mutedForeground }]}>{t("siteColor")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <View style={styles.colorRow}>
                {SITE_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotSelected]}
                    onPress={() => setSelectedColor(c)}
                  >
                    {selectedColor === c && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => { setShowAddModal(false); setSiteName(""); }}
              >
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleAddSite}>
                <Text style={styles.confirmText}>{t("save")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatPill({ label, value, color, colors }: {
  label: string; value: string; color: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={{ fontSize: 12, fontWeight: "700", color, fontFamily: "Inter_700Bold" }} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={{ fontSize: 9, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" }}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>, insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12),
      paddingHorizontal: 16, paddingBottom: 12,
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    },
    title: { fontSize: 24, fontWeight: "800", color: colors.foreground, fontFamily: "Inter_700Bold" },
    addBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    searchRow: {
      flexDirection: "row", alignItems: "center", gap: 10,
      marginHorizontal: 16, marginBottom: 10,
      backgroundColor: colors.card, borderRadius: colors.radius,
      borderWidth: 1.5, borderColor: colors.border,
      paddingHorizontal: 14, paddingVertical: 10,
    },
    searchInput: { flex: 1, fontSize: 15, color: colors.foreground, fontFamily: "Inter_400Regular" },
    list: { paddingHorizontal: 16, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90) },
    siteCard: {
      backgroundColor: colors.card, borderRadius: colors.radius,
      marginBottom: 12, overflow: "hidden", flexDirection: "row",
      elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6,
    },
    siteColorBar: { width: 5 },
    siteContent: { flex: 1, padding: 14 },
    siteTopRow: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 8 },
    siteDot: { width: 10, height: 10, borderRadius: 5 },
    siteName: { flex: 1, fontSize: 17, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    alertBadge: { flexDirection: "row", alignItems: "center", gap: 3, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
    alertBadgeText: { fontSize: 10, color: "#fff", fontWeight: "700", fontFamily: "Inter_700Bold" },
    arrowBtn: { padding: 4 },
    siteStats: { flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginBottom: 10, gap: 4 },
    siteNetRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    siteNetLabel: { fontSize: 13, color: colors.mutedForeground, fontFamily: "Inter_500Medium" },
    siteNetValue: { fontSize: 16, fontWeight: "800", fontFamily: "Inter_700Bold" },
    empty: { alignItems: "center", paddingTop: 80, gap: 12 },
    emptyTitle: { fontSize: 18, fontWeight: "600", color: colors.foreground, fontFamily: "Inter_600SemiBold" },
    emptySubtitle: { fontSize: 14, color: colors.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" },
    emptyBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primary, borderRadius: colors.radius, paddingHorizontal: 20, paddingVertical: 12, marginTop: 8 },
    emptyBtnText: { color: colors.primaryForeground, fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
    modal: { backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
    modalTitle: { fontSize: 18, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold", marginBottom: 16 },
    input: {
      backgroundColor: colors.background, borderWidth: 1.5, borderColor: colors.border,
      borderRadius: colors.radius, padding: 14, fontSize: 16,
      color: colors.foreground, fontFamily: "Inter_500Medium", marginBottom: 16,
    },
    colorLabel: { fontSize: 13, fontFamily: "Inter_500Medium", marginBottom: 10 },
    colorRow: { flexDirection: "row", gap: 12, paddingHorizontal: 2 },
    colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "transparent" },
    colorDotSelected: { borderColor: colors.foreground },
    modalBtns: { flexDirection: "row", gap: 12 },
    cancelBtn: { flex: 1, paddingVertical: 14, alignItems: "center", borderRadius: colors.radius, backgroundColor: colors.muted },
    cancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
    confirmBtn: { flex: 2, paddingVertical: 14, alignItems: "center", borderRadius: colors.radius, backgroundColor: colors.primary },
    confirmText: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
  });
