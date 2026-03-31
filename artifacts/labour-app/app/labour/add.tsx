import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

const WORK_TYPES = [
  "Mason / राजमिस्त्री",
  "Helper / सहायक",
  "Carpenter / बढ़ई",
  "Electrician / बिजली मिस्त्री",
  "Plumber / प्लंबर",
  "Painter / पेंटर",
  "Welder / वेल्डर",
  "Loader / लोडर",
];

export default function AddLabourScreen() {
  const colors = useColors();
  const { t } = useLanguage();
  const { addLabour, sites } = useApp();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ siteId?: string }>();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [workType, setWorkType] = useState("");
  const [ratePerDay, setRatePerDay] = useState("");
  const [notes, setNotes] = useState("");
  const [showWorkTypes, setShowWorkTypes] = useState(false);
  const [showSitePicker, setShowSitePicker] = useState(false);

  // Pre-select site if coming from site detail
  const defaultSiteId = params.siteId ?? sites[0]?.id ?? "";
  const [selectedSiteId, setSelectedSiteId] = useState(defaultSiteId);

  const selectedSite = sites.find((s) => s.id === selectedSiteId);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("", t("nameRequired"));
      return;
    }
    if (!ratePerDay || isNaN(Number(ratePerDay)) || Number(ratePerDay) <= 0) {
      Alert.alert("", t("rateRequired"));
      return;
    }
    if (!selectedSiteId) {
      Alert.alert("", "Please select a site first");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addLabour({
      name: name.trim(),
      phone: phone.trim() || undefined,
      workType: workType.trim() || undefined,
      ratePerDay: Number(ratePerDay),
      notes: notes.trim() || undefined,
      status: "active",
      totalHajri: 0,
      siteId: selectedSiteId,
    });
    router.back();
  };

  const styles = makeStyles(colors, insets);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("addLabour")}</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{t("save")}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Site Selector */}
        <Field label={t("selectSite")} required>
          <TouchableOpacity
            style={[styles.dropdown, selectedSite && { borderColor: selectedSite.color }]}
            onPress={() => setShowSitePicker(!showSitePicker)}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {selectedSite && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: selectedSite.color }} />}
              <Text style={[styles.dropdownText, !selectedSite && { color: colors.mutedForeground }]}>
                {selectedSite?.name ?? "Select site..."}
              </Text>
            </View>
            <Ionicons name={showSitePicker ? "chevron-up" : "chevron-down"} size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
          {showSitePicker && (
            <View style={styles.dropdownList}>
              {sites.length === 0 ? (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => { setShowSitePicker(false); router.push("/(tabs)/labourers"); }}
                >
                  <Text style={[styles.dropdownItemText, { color: colors.primary }]}>+ Create a site first</Text>
                </TouchableOpacity>
              ) : (
                sites.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.dropdownItem, selectedSiteId === s.id && { backgroundColor: s.color + "15" }]}
                    onPress={() => { setSelectedSiteId(s.id); setShowSitePicker(false); }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: s.color }} />
                      <Text style={[styles.dropdownItemText, selectedSiteId === s.id && { color: s.color, fontWeight: "700" }]}>{s.name}</Text>
                    </View>
                    {selectedSiteId === s.id && <Ionicons name="checkmark" size={16} color={s.color} />}
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </Field>

        <Field label={t("name")} required>
          <TextInput
            style={styles.input}
            placeholder={t("namePlaceholder")}
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
          />
        </Field>

        <Field label={t("phone")}>
          <TextInput
            style={styles.input}
            placeholder={t("phonePlaceholderShort")}
            placeholderTextColor={colors.mutedForeground}
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
          />
        </Field>

        <Field label={t("workType")}>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowWorkTypes(!showWorkTypes)}>
            <Text style={[styles.dropdownText, !workType && { color: colors.mutedForeground }]}>
              {workType || t("workTypePlaceholder")}
            </Text>
            <Ionicons name={showWorkTypes ? "chevron-up" : "chevron-down"} size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
          {showWorkTypes && (
            <View style={styles.dropdownList}>
              {WORK_TYPES.map((w) => (
                <TouchableOpacity key={w} style={styles.dropdownItem} onPress={() => { setWorkType(w); setShowWorkTypes(false); }}>
                  <Text style={styles.dropdownItemText}>{w}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TextInput
            style={[styles.input, { marginTop: 8 }]}
            placeholder={t("workTypePlaceholder")}
            placeholderTextColor={colors.mutedForeground}
            value={workType}
            onChangeText={setWorkType}
          />
        </Field>

        <Field label={t("ratePerDay")} required>
          <View style={styles.amountRow}>
            <Text style={styles.rupeeSign}>₹</Text>
            <TextInput
              style={[styles.input, styles.amountInput]}
              placeholder={t("ratePlaceholder")}
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              value={ratePerDay}
              onChangeText={setRatePerDay}
            />
          </View>
        </Field>

        <Field label={t("notes")}>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder={t("notesPlaceholder")}
            placeholderTextColor={colors.mutedForeground}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </Field>
      </ScrollView>
    </View>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  const colors = useColors();
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontSize: 14, fontWeight: "600", color: colors.foreground, marginBottom: 8, fontFamily: "Inter_600SemiBold" }}>
        {label}{required && <Text style={{ color: colors.destructive }}> *</Text>}
      </Text>
      {children}
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>, insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12),
      paddingHorizontal: 16, paddingBottom: 16,
      flexDirection: "row", alignItems: "center",
      backgroundColor: colors.background,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.muted, alignItems: "center", justifyContent: "center", marginRight: 12 },
    title: { flex: 1, fontSize: 20, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" },
    saveBtn: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 9, borderRadius: colors.radius },
    saveBtnText: { color: colors.primaryForeground, fontSize: 15, fontWeight: "700", fontFamily: "Inter_700Bold" },
    content: { padding: 20, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 40) },
    input: {
      backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
      borderRadius: colors.radius, paddingHorizontal: 14, paddingVertical: 13,
      fontSize: 16, color: colors.foreground, fontFamily: "Inter_400Regular",
    },
    textarea: { height: 100 },
    amountRow: { flexDirection: "row", alignItems: "center" },
    rupeeSign: { fontSize: 20, fontWeight: "700", color: colors.foreground, marginRight: 8, fontFamily: "Inter_700Bold" },
    amountInput: { flex: 1 },
    dropdown: {
      backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.border,
      borderRadius: colors.radius, paddingHorizontal: 14, paddingVertical: 13,
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    },
    dropdownText: { fontSize: 16, color: colors.foreground, fontFamily: "Inter_400Regular" },
    dropdownList: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: colors.radius, marginTop: 4, overflow: "hidden" },
    dropdownItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    dropdownItemText: { fontSize: 15, color: colors.foreground, fontFamily: "Inter_400Regular" },
  });
