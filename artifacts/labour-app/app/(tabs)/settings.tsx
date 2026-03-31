import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";

import { useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

export default function SettingsScreen() {
  const colors = useColors();
  const { t, language, setLanguage } = useLanguage();
  const { user, logout, labourers } = useApp();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    Alert.alert(t("logout"), t("logoutConfirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("logout"),
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          logout();
        },
      },
    ]);
  };

  const styles = makeStyles(colors, insets);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Ionicons name="person" size={28} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.profilePhone}>+91 {user?.phone}</Text>
          <Text style={styles.profileRole}>{t("contractor")}</Text>
        </View>
      </View>

      {/* Language */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t("language")}</Text>
        <View style={styles.langRow}>
          <TouchableOpacity
            style={[styles.langBtn, language === "en" && styles.langBtnActive]}
            onPress={() => setLanguage("en")}
          >
            <Text style={[styles.langBtnText, language === "en" && styles.langBtnTextActive]}>
              English
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, language === "hi" && styles.langBtnActive]}
            onPress={() => setLanguage("hi")}
          >
            <Text style={[styles.langBtnText, language === "hi" && styles.langBtnTextActive]}>
              हिन्दी
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t("totalRecords")}</Text>
        <View style={styles.statsCard}>
          <StatRow label={t("labourers")} value={labourers.length.toString()} icon={<Ionicons name="people" size={18} color={colors.primary} />} colors={colors} />
          <StatRow label={t("active")} value={labourers.filter((l) => l.status === "active").length.toString()} icon={<Ionicons name="checkmark-circle" size={18} color={colors.success} />} colors={colors} />
          <StatRow label={t("leftWork")} value={labourers.filter((l) => l.status === "left").length.toString()} icon={<Ionicons name="exit" size={18} color={colors.warning} />} colors={colors} />
        </View>
      </View>

      {/* App Info */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{t("version")}</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>Labour & Advance Manager v1.0.0</Text>
          <Text style={styles.infoSubText}>Built for Contractors & Labour Masters</Text>
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <Feather name="log-out" size={18} color={colors.destructive} />
        <Text style={styles.logoutText}>{t("logout")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatRow({
  label, value, icon, colors,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 10 }}>
      {icon}
      <Text style={{ flex: 1, fontSize: 15, color: colors.foreground, fontFamily: "Inter_400Regular" }}>{label}</Text>
      <Text style={{ fontSize: 15, fontWeight: "700", color: colors.foreground, fontFamily: "Inter_700Bold" }}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>, insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: {
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
      paddingHorizontal: 16,
      paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 90),
    },
    profileCard: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      marginBottom: 24,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.07,
      shadowRadius: 4,
    },
    profileAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
    },
    profilePhone: {
      fontSize: 18,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
    },
    profileRole: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
    },
    section: { marginBottom: 20 },
    sectionLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.mutedForeground,
      fontFamily: "Inter_600SemiBold",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 10,
    },
    langRow: { flexDirection: "row", gap: 10 },
    langBtn: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: colors.radius,
      backgroundColor: colors.card,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: "center",
    },
    langBtnActive: {
      borderColor: colors.primary,
      backgroundColor: colors.accent,
    },
    langBtnText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.mutedForeground,
      fontFamily: "Inter_600SemiBold",
    },
    langBtnTextActive: {
      color: colors.primary,
    },
    statsCard: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      paddingHorizontal: 16,
      paddingVertical: 4,
      elevation: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    },
    infoCard: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      padding: 16,
    },
    infoText: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    infoSubText: {
      fontSize: 13,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      marginTop: 4,
    },
    logoutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1.5,
      borderColor: colors.destructive,
      paddingVertical: 14,
      marginTop: 8,
    },
    logoutText: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.destructive,
      fontFamily: "Inter_700Bold",
    },
  });
