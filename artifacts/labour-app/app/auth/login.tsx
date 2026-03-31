import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useLanguage } from "@/context/LanguageContext";
import { useColors } from "@/hooks/useColors";

type Step = "phone" | "otp";

export default function LoginScreen() {
  const colors = useColors();
  const { t, language, toggleLanguage } = useLanguage();
  const { login } = useApp();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const otpRef = useRef<TextInput>(null);

  const handleSendOtp = () => {
    if (phone.length !== 10) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("", t("invalidPhone"));
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep("otp");
    setTimeout(() => otpRef.current?.focus(), 300);
  };

  const handleVerify = async () => {
    if (otp !== "1234") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("", t("invalidOtp"));
      return;
    }
    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await login(phone);
    setLoading(false);
    router.replace("/(tabs)");
  };

  const styles = makeStyles(colors, insets);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.inner}>
        {/* Language Toggle */}
        <TouchableOpacity style={styles.langToggle} onPress={toggleLanguage}>
          <Text style={styles.langText}>{language === "en" ? "हि" : "EN"}</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>🪖</Text>
          </View>
          <Text style={styles.appName}>{t("appName")}</Text>
          <Text style={styles.subtitle}>
            {step === "phone" ? t("enterPhone") : `${t("otpSentTo")} +91 ${phone}`}
          </Text>
        </View>

        {/* Input */}
        <View style={styles.inputSection}>
          {step === "phone" ? (
            <View style={styles.phoneRow}>
              <View style={styles.prefix}>
                <Text style={styles.prefixText}>+91</Text>
              </View>
              <TextInput
                style={styles.phoneInput}
                placeholder={t("phonePlaceholder")}
                placeholderTextColor={colors.mutedForeground}
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
                onSubmitEditing={handleSendOtp}
              />
            </View>
          ) : (
            <TextInput
              ref={otpRef}
              style={styles.otpInput}
              placeholder="- - - -"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="numeric"
              maxLength={4}
              value={otp}
              onChangeText={setOtp}
              textAlign="center"
              onSubmitEditing={handleVerify}
            />
          )}

          <Text style={styles.demoHint}>{t("demoNote")}</Text>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={step === "phone" ? handleSendOtp : handleVerify}
          disabled={loading}
          activeOpacity={0.8}
        >
          <Text style={styles.btnText}>
            {step === "phone" ? t("sendOtp") : t("verify")}
          </Text>
        </TouchableOpacity>

        {step === "otp" && (
          <TouchableOpacity
            onPress={() => { setStep("phone"); setOtp(""); }}
          >
            <Text style={styles.backText}>← {t("resendOtp")}</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>, insets: { top: number; bottom: number }) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    inner: {
      flex: 1,
      paddingHorizontal: 28,
      paddingTop: insets.top + (Platform.OS === "web" ? 67 : 40),
      paddingBottom: insets.bottom + 24,
      alignItems: "center",
    },
    langToggle: {
      position: "absolute",
      top: insets.top + (Platform.OS === "web" ? 67 : 16),
      right: 28,
      backgroundColor: colors.primary,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 7,
    },
    langText: {
      color: colors.primaryForeground,
      fontWeight: "700",
      fontSize: 14,
    },
    header: {
      alignItems: "center",
      marginTop: 60,
      marginBottom: 40,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 24,
      backgroundColor: colors.accent,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    iconText: {
      fontSize: 40,
    },
    appName: {
      fontSize: 28,
      fontWeight: "800",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 15,
      color: colors.mutedForeground,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
    },
    inputSection: {
      width: "100%",
      marginBottom: 24,
    },
    phoneRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: colors.radius,
      backgroundColor: colors.card,
      overflow: "hidden",
      marginBottom: 12,
    },
    prefix: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      borderRightWidth: 1.5,
      borderColor: colors.border,
    },
    prefixText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.foreground,
      fontFamily: "Inter_600SemiBold",
    },
    phoneInput: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 16,
      fontSize: 18,
      color: colors.foreground,
      fontFamily: "Inter_500Medium",
      letterSpacing: 1,
    },
    otpInput: {
      borderWidth: 2,
      borderColor: colors.primary,
      borderRadius: colors.radius,
      backgroundColor: colors.card,
      paddingVertical: 20,
      fontSize: 28,
      fontWeight: "700",
      color: colors.foreground,
      fontFamily: "Inter_700Bold",
      letterSpacing: 12,
      marginBottom: 12,
    },
    demoHint: {
      fontSize: 13,
      color: colors.mutedForeground,
      textAlign: "center",
      fontFamily: "Inter_400Regular",
    },
    btn: {
      width: "100%",
      backgroundColor: colors.primary,
      paddingVertical: 17,
      borderRadius: colors.radius,
      alignItems: "center",
      marginBottom: 16,
    },
    btnDisabled: {
      opacity: 0.6,
    },
    btnText: {
      color: colors.primaryForeground,
      fontSize: 17,
      fontWeight: "700",
      fontFamily: "Inter_700Bold",
    },
    backText: {
      color: colors.primary,
      fontSize: 15,
      fontFamily: "Inter_500Medium",
      marginTop: 8,
    },
  });
