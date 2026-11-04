import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Colors, { EmeraldTokens, BlueTokens } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { MobileStorageService, BusinessProfile, CurrencyCode } from '@/services/storage';
import { MobileAuthService, UserSession } from '@/services/auth';
import { M3Button } from '@/components/M3/M3Button';
import { M3Input } from '@/components/M3/M3Input';
import { useLanguage } from '@/context/LanguageContext';
import { useAppearance } from '@/context/AppearanceContext';
import { PRESET_AVATARS, AvatarPreset, getPresetById } from '@/constants/Presets';
import { TraderAvatar } from '@/components/TraderAvatar';
import { compressAvatarForStorage } from '@/utils/imageCompressor';

const BUSINESS_TYPES = [
  'Tuckshop & Grocery',
  'Fresh Farm Produce',
  'Clothing & Bales',
  'Electronics & Phones',
  'Wholesale & Distribution',
  'EcoCash & Money Agency',
  'Hardware & Spares',
  'Salon & Cosmetics',
];

const POPULAR_LOCATIONS = [
  'Harare (Mbare Musika)',
  'Harare (CBD)',
  'Bulawayo (CBD)',
  'Bulawayo (Renkini)',
  'Gweru (Kwekwe Road)',
  'Mutare (Sakubva)',
  'Masvingo (Mucheke)',
  'Beitbridge Border',
  'Chitungwiza (Makoni)',
];

const OPERATING_HOURS_OPTIONS = [
  '6:00 AM - 6:00 PM (Mon - Sat)',
  '7:00 AM - 8:00 PM (Daily)',
  '6:00 AM - 1:00 PM (Market Morning)',
  '8:00 AM - 5:00 PM (Weekdays)',
  '24/7 Continuous Booth',
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const { language, setLanguage, t } = useLanguage();
  const { palette } = useAppearance();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'edit' | 'pass'>('edit');
  const [session, setSession] = useState<UserSession | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [stallName, setStallName] = useState('');
  const [stallNumber, setStallNumber] = useState('');
  const [merchantTillNumber, setMerchantTillNumber] = useState('');
  const [businessType, setBusinessType] = useState('Tuckshop & Grocery');
  const [city, setCity] = useState('Harare (Mbare Musika)');
  const [tagline, setTagline] = useState('');
  const [operatingHours, setOperatingHours] = useState('6:00 AM - 6:00 PM (Mon - Sat)');
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const [sess, biz] = await Promise.all([
        MobileAuthService.getSession(),
        MobileStorageService.getBusiness(),
      ]);

      setSession(sess);
      setBusiness(biz);

      const name = sess?.name || biz?.ownerName || 'Mr Q';
      const usr = sess?.username || biz?.username || name.toLowerCase().replace(/\s+/g, '_');
      const stall = biz?.name || sess?.businessName || 'Mbare Fresh Produce & Tuckshop';

      setFullName(name);
      setUsername(usr.startsWith('@') ? usr.slice(1) : usr);
      setPhone(biz?.phone || sess?.phone || '+263 77 123 4567');
      setEmail(sess?.email || biz?.email || 'demo@cashflowmate.co.zw');
      setStallName(stall);
      setStallNumber(biz?.stallNumber || sess?.stallNumber || 'Stall #14, Vegetable Shed');
      setMerchantTillNumber(biz?.merchantTillNumber || sess?.merchantTillNumber || 'EcoCash: 194827');
      setBusinessType(biz?.businessType || 'Tuckshop & Grocery');
      setCity(biz?.city || sess?.city || 'Harare (Mbare Musika)');
      setTagline(biz?.tagline || sess?.tagline || 'Fresh quality produce and cold drinks daily.');
      setOperatingHours(biz?.operatingHours || sess?.operatingHours || '6:00 AM - 6:00 PM (Mon - Sat)');
      setCurrency(biz?.currency || sess?.currency || 'USD');
      setAvatarUri(biz?.avatarUri || sess?.avatarUri || null);
      setSelectedPresetId(biz?.avatarPreset || sess?.avatarPreset || null);

      setLoading(false);
    })();
  }, []);

  const handlePickImage = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'image/webp', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];

      // Compress and resize avatar photo (guarantees safe storage under localStorage 5MB limit)
      const compressedUri = await compressAvatarForStorage(asset);
      setAvatarUri(compressedUri);
      setSelectedPresetId(null);
    } catch (err: any) {
      Alert.alert('Photo Selection Error', err.message || 'Could not select image.');
    }
  };

  const handleSelectPreset = (preset: AvatarPreset) => {
    setSelectedPresetId(preset.id);
    setAvatarUri(null);
  };

  const handleRemovePhoto = () => {
    setAvatarUri(null);
    setSelectedPresetId(null);
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Please enter your name.');
      return;
    }
    if (!stallName.trim()) {
      Alert.alert('Validation Error', 'Please enter your business or stall name.');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);

    try {
      const cleanUsername = username.trim().replace(/^@/, '');
      const finalAvatarUri = avatarUri ? avatarUri : '';
      const finalAvatarPreset = selectedPresetId ? selectedPresetId : '';

      const updatedProfile: Partial<BusinessProfile> = {
        name: stallName.trim(),
        ownerName: fullName.trim(),
        username: cleanUsername,
        avatarUri: finalAvatarUri,
        avatarPreset: finalAvatarPreset,
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(),
        stallNumber: stallNumber.trim(),
        merchantTillNumber: merchantTillNumber.trim(),
        operatingHours: operatingHours.trim(),
        businessType: businessType.trim(),
        tagline: tagline.trim(),
        currency,
        preferredLanguage: language,
        updatedAt: new Date().toISOString(),
      };

      await MobileStorageService.updateBusiness(updatedProfile);

      // Sync active session and registered user store
      if (session) {
        await MobileAuthService.updateSession({
          name: fullName.trim(),
          username: cleanUsername,
          businessName: stallName.trim(),
          currency,
          avatarUri: finalAvatarUri,
          avatarPreset: finalAvatarPreset,
          phone: phone.trim(),
          city: city.trim(),
          stallNumber: stallNumber.trim(),
          merchantTillNumber: merchantTillNumber.trim(),
          operatingHours: operatingHours.trim(),
          tagline: tagline.trim(),
        });
      }

      // Notify web runtime to update open tabs immediately
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cashflow_profile_sync'));
      }

      setSaving(false);
      setSaveSuccess(true);

      // Smooth feedback and navigation
      if (Platform.OS === 'web') {
        setTimeout(() => {
          router.replace('/modal' as any);
        }, 850);
      } else {
        Alert.alert(
          'Profile Saved',
          'Your profile picture, stall details, and till settings have been updated across all screens.',
          [
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (err: any) {
      setSaving(false);
      setSaveSuccess(false);
      Alert.alert(
        'Save Failed',
        err.message || 'Could not save profile. Please check device storage.'
      );
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your Cashflow account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await MobileAuthService.logout();
            if (Platform.OS === 'web' && typeof window !== 'undefined') {
              window.location.assign('/login');
              return;
            }
            router.replace('/login' as any);
          },
        },
      ]
    );
  };

  const activePreset = getPresetById(selectedPresetId);

  if (loading) {
    return (
      <View style={[styles.screenWrapper, styles.center]}>
        <ActivityIndicator size="large" color={EmeraldTokens.mintCta} />
      </View>
    );
  }

  return (
    <View style={styles.screenWrapper}>
      {/* 1. Deep Forest Emerald Header with Top Nav */}
      <View style={styles.emeraldHeader}>
        <View style={styles.topNavRow}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.iconButton,
              pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <View style={styles.verifiedRow}>
              <View style={styles.verifiedDot} />
              <Text style={styles.verifiedText}>ZIM TILL PASS</Text>
            </View>
          </View>

          <Pressable
            onPress={handleSaveProfile}
            disabled={saving}
            style={({ pressed }) => [
              styles.headerSaveBtn,
              saveSuccess && styles.headerSaveBtnSuccess,
              pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Save profile changes"
          >
            {saving ? (
              <ActivityIndicator size="small" color={EmeraldTokens.mintDarkText} />
            ) : saveSuccess ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                <Text style={[styles.headerSaveBtnText, { color: '#FFFFFF' }]}>SAVED</Text>
              </View>
            ) : (
              <Text style={styles.headerSaveBtnText}>SAVE</Text>
            )}
          </Pressable>
        </View>

        {/* Success Toast Banner */}
        {saveSuccess && (
          <View style={styles.saveToastBanner}>
            <Ionicons name="checkmark-circle" size={16} color={EmeraldTokens.mintCta} />
            <Text style={styles.saveToastText}>
              Profile & Stall Pass saved! Syncing across all screens...
            </Text>
          </View>
        )}

        {/* View Mode Toggle: Edit Mode vs Stall Pass Preview */}
        <View style={styles.modeToggleContainer}>
          <Pressable
            onPress={() => setViewMode('edit')}
            style={[
              styles.modeToggleBtn,
              viewMode === 'edit' && styles.modeToggleBtnActive,
            ]}
          >
            <Ionicons
              name="create-outline"
              size={15}
              color={viewMode === 'edit' ? EmeraldTokens.deepPine : '#FFFFFF'}
            />
            <Text
              style={[
                styles.modeToggleBtnText,
                viewMode === 'edit' && styles.modeToggleBtnTextActive,
              ]}
            >
              Edit Information
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setViewMode('pass')}
            style={[
              styles.modeToggleBtn,
              viewMode === 'pass' && styles.modeToggleBtnActive,
            ]}
          >
            <Ionicons
              name="card-outline"
              size={15}
              color={viewMode === 'pass' ? EmeraldTokens.deepPine : '#FFFFFF'}
            />
            <Text
              style={[
                styles.modeToggleBtnText,
                viewMode === 'pass' && styles.modeToggleBtnTextActive,
              ]}
            >
              Stall Pass Preview
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 2. White Curved Scroll Sheet */}
      <ScrollView
        style={styles.sheetContainer}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentConstrained}>
          {viewMode === 'edit' ? (
            <>
              {/* Avatar & Photo Studio Hero Card (Pinterest Board Style) */}
              <View style={styles.avatarCard}>
                {/* Decorative Top Banner */}
                <View style={styles.avatarCardBanner}>
                  <View style={styles.bannerBadge}>
                    <Ionicons name="sparkles" size={12} color="#FBBF24" />
                    <Text style={styles.bannerBadgeText}>
                      {activePreset ? activePreset.badgeLabel : 'VERIFIED TRADER'}
                    </Text>
                  </View>
                </View>

                {/* Overlapping Avatar Frame Container */}
                <View style={styles.avatarOverlapWrapper}>
                  <TraderAvatar
                    size={106}
                    avatarUri={avatarUri}
                    avatarPreset={selectedPresetId}
                    name={fullName}
                    borderWidth={3.5}
                    borderColor={EmeraldTokens.mintCta}
                    showHalo={true}
                  />

                  {/* Floating Camera Badge Button */}
                  <Pressable
                    onPress={handlePickImage}
                    style={({ pressed }) => [
                      styles.cameraBadgePill,
                      pressed && { transform: [{ scale: 0.92 }] },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Upload profile photo"
                  >
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                  </Pressable>
                </View>

                {/* Trader Name & Meta */}
                <Text style={styles.avatarCardTitle}>{fullName || 'Trader'}</Text>
                <Text style={styles.avatarCardHandle}>@{username || 'mrq_mbare'}</Text>
                <Text style={styles.avatarCardStall}>
                  {stallName || 'Mbare Fresh Produce & Tuckshop'} &bull; {city}
                </Text>

                {/* Photo Action Buttons */}
                <View style={styles.avatarActionRow}>
                  <Pressable
                    onPress={handlePickImage}
                    style={({ pressed }) => [
                      styles.avatarActionBtn,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Upload photo from device"
                  >
                    <Ionicons name="image-outline" size={16} color={EmeraldTokens.deepPine} />
                    <Text style={styles.avatarActionBtnText}>Upload Photo</Text>
                  </Pressable>

                  {(avatarUri || selectedPresetId) && (
                    <Pressable
                      onPress={handleRemovePhoto}
                      style={({ pressed }) => [
                        styles.avatarRemoveBtn,
                        pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Remove photo"
                    >
                      <Ionicons name="trash-outline" size={15} color="#DC2626" />
                      <Text style={styles.avatarRemoveBtnText}>Remove</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              {/* Instant Zimbabwean Trader Presets */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>PRESETS</Text>
                </View>
                <Text style={styles.sectionHeading}>Instant Trader Avatars</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                Select an authentic preset matching your daily market enterprise.
              </Text>

              <View style={styles.presetsGrid}>
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = selectedPresetId === preset.id && !avatarUri;
                  return (
                    <Pressable
                      key={preset.id}
                      onPress={() => handleSelectPreset(preset)}
                      style={({ pressed }) => [
                        styles.presetGridCard,
                        isSelected && styles.presetGridCardActive,
                        pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
                      ]}
                    >
                      <View
                        style={[
                          styles.presetMiniIcon,
                          { backgroundColor: preset.bgColor },
                        ]}
                      >
                        <Ionicons name={preset.icon} size={22} color={preset.iconColor} />
                      </View>
                      <View style={styles.presetTextCol}>
                        <View style={styles.presetTitleRow}>
                          <Text style={styles.presetGridTitle}>{preset.title}</Text>
                          {isSelected && (
                            <Ionicons
                              name="checkmark-circle"
                              size={16}
                              color={EmeraldTokens.mintCta}
                            />
                          )}
                        </View>
                        <Text style={styles.presetGridSub} numberOfLines={1}>
                          {preset.subtitle}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Card 1: Personal Identity */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>01</Text>
                </View>
                <Text style={styles.sectionHeading}>Personal Identity</Text>
              </View>

              <View style={styles.formCard}>
                <M3Input
                  label="Full Name / Display Name"
                  placeholder="e.g. Mr Q"
                  value={fullName}
                  onChangeText={setFullName}
                />

                <View style={{ marginTop: 14 }}>
                  <M3Input
                    label="Trader Username / Handle"
                    placeholder="mrq_mbare"
                    prefix="@"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={{ marginTop: 14 }}>
                  <M3Input
                    label="WhatsApp Hotline & Phone"
                    placeholder="+263 77 123 4567"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={{ marginTop: 14 }}>
                  <M3Input
                    label="Email Address"
                    placeholder="trader@cashflowmate.co.zw"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Card 2: Business & Stall Enterprise */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>02</Text>
                </View>
                <Text style={styles.sectionHeading}>Tuckshop & Stall Enterprise</Text>
              </View>

              <View style={styles.formCard}>
                <M3Input
                  label="Business / Stall Name"
                  placeholder="e.g. Mbare Fresh Produce & Tuckshop"
                  value={stallName}
                  onChangeText={setStallName}
                />

                <View style={{ marginTop: 14 }}>
                  <M3Input
                    label="Market Stall / Booth / Shop #"
                    placeholder="e.g. Stall #14, Vegetable Shed A"
                    value={stallNumber}
                    onChangeText={setStallNumber}
                  />
                </View>

                <View style={{ marginTop: 14 }}>
                  <M3Input
                    label="EcoCash / InnBucks Till Code"
                    placeholder="e.g. EcoCash Till: 194827"
                    value={merchantTillNumber}
                    onChangeText={setMerchantTillNumber}
                  />
                </View>

                {/* Business Sector Selection Chips */}
                <Text style={styles.chipFieldLabel}>Trading Sector</Text>
                <View style={styles.chipsContainer}>
                  {BUSINESS_TYPES.map((type) => {
                    const active = businessType === type;
                    return (
                      <Pressable
                        key={type}
                        onPress={() => setBusinessType(type)}
                        style={({ pressed }) => [
                          styles.selectionPill,
                          active && styles.selectionPillActive,
                          pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectionPillText,
                            active && styles.selectionPillTextActive,
                          ]}
                        >
                          {type}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Location Selection Chips */}
                <Text style={styles.chipFieldLabel}>Market Location / Town</Text>
                <View style={styles.chipsContainer}>
                  {POPULAR_LOCATIONS.map((loc) => {
                    const active = city === loc;
                    return (
                      <Pressable
                        key={loc}
                        onPress={() => setCity(loc)}
                        style={({ pressed }) => [
                          styles.selectionPill,
                          active && styles.selectionPillActive,
                          pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectionPillText,
                            active && styles.selectionPillTextActive,
                          ]}
                        >
                          {loc}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={{ marginTop: 14 }}>
                  <M3Input
                    label="Store Motto / Tagline"
                    placeholder="e.g. Fresh farm produce delivered daily from Domboshava"
                    value={tagline}
                    onChangeText={setTagline}
                  />
                </View>
              </View>

              {/* Card 3: Operating Hours & Till Defaults */}
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>03</Text>
                </View>
                <Text style={styles.sectionHeading}>Operating Hours & Defaults</Text>
              </View>

              <View style={styles.formCard}>
                <Text style={styles.chipFieldLabel}>Operating Hours</Text>
                <View style={styles.chipsContainer}>
                  {OPERATING_HOURS_OPTIONS.map((opt) => {
                    const active = operatingHours === opt;
                    return (
                      <Pressable
                        key={opt}
                        onPress={() => setOperatingHours(opt)}
                        style={({ pressed }) => [
                          styles.selectionPill,
                          active && styles.selectionPillActive,
                          pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectionPillText,
                            active && styles.selectionPillTextActive,
                          ]}
                        >
                          {opt}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={[styles.chipFieldLabel, { marginTop: 14 }]}>
                  Primary Till Currency
                </Text>
                <View style={styles.chipsContainer}>
                  {[
                    { id: 'USD', label: 'USD ($ Cash Drawer)', flag: '$' },
                    { id: 'ZWG', label: 'ZiG (EcoCash / ZWG)', flag: 'ZiG' },
                    { id: 'ZAR', label: 'ZAR (Rand Float)', flag: 'R' },
                  ].map((cur) => {
                    const active = currency === cur.id;
                    return (
                      <Pressable
                        key={cur.id}
                        onPress={() => setCurrency(cur.id as CurrencyCode)}
                        style={({ pressed }) => [
                          styles.selectionPill,
                          active && styles.selectionPillActive,
                          pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectionPillText,
                            active && styles.selectionPillTextActive,
                          ]}
                        >
                          {cur.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Text style={[styles.chipFieldLabel, { marginTop: 14 }]}>
                  Preferred Language
                </Text>
                <View style={styles.chipsContainer}>
                  {[
                    { id: 'en', label: 'English' },
                    { id: 'sn', label: 'ChiShona' },
                    { id: 'nd', label: 'SiNdebele' },
                  ].map((lang) => {
                    const active = language === lang.id;
                    return (
                      <Pressable
                        key={lang.id}
                        onPress={() => setLanguage(lang.id as any)}
                        style={({ pressed }) => [
                          styles.selectionPill,
                          active && styles.selectionPillActive,
                          pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] },
                        ]}
                      >
                        <Text
                          style={[
                            styles.selectionPillText,
                            active && styles.selectionPillTextActive,
                          ]}
                        >
                          {lang.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Bottom Sticky Save CTA Container */}
              <View style={styles.saveCtaContainer}>
                <M3Button
                  label={
                    saving
                      ? 'SAVING CHANGES...'
                      : saveSuccess
                      ? 'SAVED SUCCESSFULLY ✓'
                      : 'SAVE PROFILE CHANGES'
                  }
                  variant={saveSuccess ? 'tonal' : 'mint'}
                  size="lg"
                  icon={
                    <Ionicons
                      name={saveSuccess ? 'checkmark-circle' : 'save-outline'}
                      size={20}
                      color={EmeraldTokens.mintDarkText}
                    />
                  }
                  disabled={saving}
                  onPress={handleSaveProfile}
                />

                <View style={{ marginTop: 14 }}>
                  <Pressable
                    onPress={handleLogout}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#FEF2F2',
                      borderWidth: 1.5,
                      borderColor: '#FECACA',
                      paddingVertical: 14,
                      borderRadius: 9999,
                      gap: 8,
                    }}
                    accessibilityRole="button"
                    accessibilityLabel="Log out of Cashflow"
                  >
                    <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#EF4444', letterSpacing: 0.5 }}>
                      LOG OUT OF CASHFLOW
                    </Text>
                  </Pressable>
                </View>
              </View>
            </>
          ) : (
            /* Interactive Live Stall Pass Preview (Pinterest Style) */
            <View style={styles.passCardWrapper}>
              <View style={styles.passCard}>
                {/* Stall Pass Top Ribbon */}
                <View style={styles.passHeader}>
                  <View style={styles.passGovSeal}>
                    <Ionicons name="shield-checkmark" size={16} color="#FBBF24" />
                    <Text style={styles.passGovText}>
                      REPUBLIC OF ZIMBABWE &bull; VERIFIED MARKET TILL
                    </Text>
                  </View>
                  <View style={styles.passStatusPill}>
                    <View style={styles.passStatusDot} />
                    <Text style={styles.passStatusText}>ACTIVE 2026</Text>
                  </View>
                </View>

                {/* Stall Pass Body */}
                <View style={styles.passBody}>
                  <View style={styles.passAvatarRing}>
                    <TraderAvatar
                      size={86}
                      avatarUri={avatarUri}
                      avatarPreset={selectedPresetId}
                      name={fullName}
                      borderWidth={2.5}
                      borderColor={EmeraldTokens.mintCta}
                    />
                  </View>

                  <Text style={styles.passBusinessName}>
                    {stallName || 'Mbare Fresh Produce & Tuckshop'}
                  </Text>
                  <Text style={styles.passOwnerName}>
                    Operated by {fullName || 'Mr Q'} &bull; @{username || 'mrq_mbare'}
                  </Text>

                  {tagline ? (
                    <Text style={styles.passTagline}>&ldquo;{tagline}&rdquo;</Text>
                  ) : null}

                  {/* Pass Details Grid */}
                  <View style={styles.passDetailsGrid}>
                    <View style={styles.passDetailItem}>
                      <Text style={styles.passDetailLabel}>LOCATION / CITY</Text>
                      <Text style={styles.passDetailValue}>{city}</Text>
                    </View>

                    <View style={styles.passDetailItem}>
                      <Text style={styles.passDetailLabel}>STALL IDENTIFIER</Text>
                      <Text style={styles.passDetailValue}>{stallNumber}</Text>
                    </View>

                    <View style={styles.passDetailItem}>
                      <Text style={styles.passDetailLabel}>TILL / ECOCASH</Text>
                      <Text style={[styles.passDetailValue, { color: '#38BDF8' }]}>
                        {merchantTillNumber}
                      </Text>
                    </View>

                    <View style={styles.passDetailItem}>
                      <Text style={styles.passDetailLabel}>WHATSAPP HOTLINE</Text>
                      <Text style={styles.passDetailValue}>{phone}</Text>
                    </View>

                    <View style={styles.passDetailItem}>
                      <Text style={styles.passDetailLabel}>TRADING HOURS</Text>
                      <Text style={styles.passDetailValue}>{operatingHours}</Text>
                    </View>

                    <View style={styles.passDetailItem}>
                      <Text style={styles.passDetailLabel}>BASE CURRENCY</Text>
                      <Text style={[styles.passDetailValue, { color: '#34D399' }]}>
                        {currency} Primary Drawer
                      </Text>
                    </View>
                  </View>

                  {/* Verified Till QR Code Placeholder */}
                  <View style={styles.qrCard}>
                    <Ionicons name="qr-code" size={54} color={EmeraldTokens.deepPine} />
                    <View style={styles.qrTextCol}>
                      <Text style={styles.qrTitle}>Instant Merchant QR Code</Text>
                      <Text style={styles.qrSub}>
                        Scan to transfer directly into this merchant's till.
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Stall Pass Footer */}
                <View style={styles.passFooter}>
                  <Text style={styles.passFooterText}>
                    CashFlow Mate Market OS &bull; Offline HMAC-SHA256 Cryptographic Pass
                  </Text>
                </View>
              </View>

              <View style={styles.passActionRow}>
                <Pressable
                  onPress={() => setViewMode('edit')}
                  style={styles.passActionReturnBtn}
                >
                  <Ionicons name="arrow-back" size={16} color="#FFFFFF" />
                  <Text style={styles.passActionReturnText}>Back to Edit Information</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: EmeraldTokens.deepPine,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emeraldHeader: {
    backgroundColor: EmeraldTokens.deepPine,
    paddingTop: Platform.OS === 'ios' ? 52 : 44,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleCol: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  verifiedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: EmeraldTokens.mintCta,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: EmeraldTokens.mintCta,
    letterSpacing: 0.8,
  },
  headerSaveBtn: {
    backgroundColor: EmeraldTokens.mintCta,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  headerSaveBtnSuccess: {
    backgroundColor: '#059669',
  },
  headerSaveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: EmeraldTokens.mintDarkText,
    letterSpacing: 0.5,
  },
  saveToastBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    borderWidth: 1,
    borderColor: EmeraldTokens.mintCta,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 8,
    alignSelf: 'center',
  },
  saveToastText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Segmented Pill Switcher
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    borderRadius: 999,
    padding: 3,
    marginTop: 4,
    maxWidth: 420,
    alignSelf: 'center',
    width: '100%',
  },
  modeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 999,
  },
  modeToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  modeToggleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  modeToggleBtnTextActive: {
    color: EmeraldTokens.deepPine,
    fontWeight: '700',
  },

  sheetContainer: {
    flex: 1,
    backgroundColor: EmeraldTokens.canvasLight,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 120,
  },
  contentConstrained: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },

  // Avatar Hero Card
  avatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: BlueTokens.borders,
    shadowColor: BlueTokens.darkNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarCardBanner: {
    width: '100%',
    height: 84,
    backgroundColor: EmeraldTokens.deepPine,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    padding: 12,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  bannerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.6,
  },
  avatarOverlapWrapper: {
    position: 'relative',
    marginTop: -48,
    marginBottom: 10,
  },
  cameraBadgePill: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: EmeraldTokens.deepPine,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarCardTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: EmeraldTokens.textSlate,
    textAlign: 'center',
  },
  avatarCardHandle: {
    fontSize: 13,
    color: EmeraldTokens.deepPine,
    fontWeight: '600',
    marginTop: 2,
  },
  avatarCardStall: {
    fontSize: 12,
    color: EmeraldTokens.textMuted,
    marginTop: 2,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  avatarActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    marginBottom: 18,
  },
  avatarActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E8F5EF',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#CDE9DE',
  },
  avatarActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: EmeraldTokens.deepPine,
  },
  avatarRemoveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: '#FEE2E2',
  },
  avatarRemoveBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },

  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
    paddingLeft: 4,
  },
  sectionBadge: {
    backgroundColor: '#E8F5EF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sectionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: EmeraldTokens.deepPine,
    letterSpacing: 0.5,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: EmeraldTokens.textMuted,
    marginBottom: 12,
    paddingLeft: 4,
  },

  // Presets Grid (2-column tactile squircles)
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  presetGridCard: {
    flexBasis: '48%',
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1.5,
    borderColor: BlueTokens.borders,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  presetGridCardActive: {
    borderColor: EmeraldTokens.mintCta,
    backgroundColor: '#F0FDF4',
    shadowColor: EmeraldTokens.mintCta,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  presetMiniIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetTextCol: {
    flex: 1,
    minWidth: 0,
  },
  presetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  presetGridTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
  },
  presetGridSub: {
    fontSize: 10,
    color: EmeraldTokens.textMuted,
    marginTop: 2,
  },

  // Form Cards
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: BlueTokens.borders,
    shadowColor: BlueTokens.darkNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  chipFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
    marginTop: 14,
    marginBottom: 8,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectionPill: {
    backgroundColor: '#F8FAF9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.07)',
  },
  selectionPillActive: {
    backgroundColor: EmeraldTokens.deepPine,
    borderColor: EmeraldTokens.deepPine,
  },
  selectionPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: EmeraldTokens.textSlate,
  },
  selectionPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Save CTA
  saveCtaContainer: {
    marginTop: 8,
    marginBottom: 36,
  },

  // Live Stall Pass Preview Card (Award-Winning Pass)
  passCardWrapper: {
    paddingVertical: 8,
  },
  passCard: {
    backgroundColor: '#0F1E19',
    borderRadius: 26,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  passHeader: {
    backgroundColor: '#07130F',
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  passGovSeal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  passGovText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FBBF24',
    letterSpacing: 0.6,
  },
  passStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  passStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: EmeraldTokens.mintCta,
  },
  passStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: EmeraldTokens.mintCta,
    letterSpacing: 0.5,
  },
  passBody: {
    padding: 22,
    alignItems: 'center',
  },
  passAvatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: EmeraldTokens.mintCta,
    padding: 3,
    backgroundColor: '#0F1E19',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  passBusinessName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  passOwnerName: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  passTagline: {
    fontSize: 12,
    fontStyle: 'italic',
    color: EmeraldTokens.mintCta,
    marginTop: 6,
    textAlign: 'center',
  },
  passDetailsGrid: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    padding: 14,
    marginTop: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  passDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passDetailLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.45)',
    letterSpacing: 0.5,
  },
  passDetailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  qrCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginTop: 18,
    width: '100%',
  },
  qrTextCol: {
    flex: 1,
  },
  qrTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
  },
  qrSub: {
    fontSize: 11,
    color: EmeraldTokens.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  passFooter: {
    backgroundColor: '#07130F',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  passFooterText: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
    fontWeight: '600',
  },
  passActionRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  passActionReturnBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
  },
  passActionReturnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
