import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import Colors, { EmeraldTokens, BlueTokens } from '@/constants/Colors';
import { DesignTokens } from '@/constants/DesignTokens';
import { useColorScheme } from '@/components/useColorScheme';
import { MobileStorageService, BusinessProfile, CurrencyCode } from '@/services/storage';
import { MobileAuthService, UserSession } from '@/services/auth';
import { M3Button } from '@/components/M3/M3Button';
import { M3Input } from '@/components/M3/M3Input';
import { useLanguage } from '@/context/LanguageContext';
import { useAppearance } from '@/context/AppearanceContext';

export interface AvatarPreset {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  bgColor: string;
  iconColor: string;
}

const PRESET_AVATARS: AvatarPreset[] = [
  {
    id: 'tuckshop_boss',
    title: 'Tuckshop Boss',
    subtitle: 'Daily Grocery & Provisions',
    icon: 'storefront',
    bgColor: '#0C3E35',
    iconColor: '#34D399',
  },
  {
    id: 'executive_trader',
    title: 'Executive Trader',
    subtitle: 'Wholesale & Enterprise',
    icon: 'briefcase',
    bgColor: '#06152E',
    iconColor: '#38BDF8',
  },
  {
    id: 'musika_produce',
    title: 'Produce Merchant',
    subtitle: 'Mbare Musika Fresh Farm',
    icon: 'nutrition',
    bgColor: '#D97706',
    iconColor: '#FEF3C7',
  },
  {
    id: 'ecocash_agent',
    title: 'EcoCash Agent',
    subtitle: 'Cash-In & Float Booth',
    icon: 'phone-portrait',
    bgColor: '#0284C7',
    iconColor: '#E0F2FE',
  },
  {
    id: 'cbd_boutique',
    title: 'Boutique Stylist',
    subtitle: 'Apparel, Bales & Shoes',
    icon: 'shirt',
    bgColor: '#7E22CE',
    iconColor: '#F3E8FF',
  },
  {
    id: 'cross_border',
    title: 'Border Runner',
    subtitle: 'ZAR Float & Beitbridge',
    icon: 'bus',
    bgColor: '#EA580C',
    iconColor: '#FFEDD5',
  },
];

const BUSINESS_TYPES = [
  'Tuckshop & Grocery',
  'Clothing & Boutique',
  'Electronics & Phones',
  'Fresh Farm Produce',
  'Wholesale & Bales',
  'Services & Salon',
];

const POPULAR_LOCATIONS = [
  'Harare (Mbare Musika)',
  'Bulawayo (CBD)',
  'Gweru',
  'Mutare (Sakubva)',
  'Masvingo',
  'Beitbridge (Border)',
  'Chitungwiza',
];

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const { language, setLanguage, t } = useLanguage();
  const { palette } = useAppearance();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [business, setBusiness] = useState<BusinessProfile | null>(null);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [stallName, setStallName] = useState('');
  const [businessType, setBusinessType] = useState('Tuckshop & Grocery');
  const [city, setCity] = useState('Harare (Mbare Musika)');
  const [tagline, setTagline] = useState('');
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
      setBusinessType(biz?.businessType || 'Tuckshop & Grocery');
      setCity(biz?.city || sess?.city || 'Harare (Mbare Musika)');
      setTagline(biz?.tagline || 'Fresh quality provisions and wholesale trading.');
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

      // On Web, read as Base64 data URL so image permanently persists in storage
      if (Platform.OS === 'web' && (asset as any).file) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64Uri = reader.result as string;
          setAvatarUri(base64Uri);
          setSelectedPresetId(null);
        };
        reader.readAsDataURL((asset as any).file);
      } else {
        setAvatarUri(asset.uri);
        setSelectedPresetId(null);
      }
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

    try {
      const cleanUsername = username.trim().replace(/^@/, '');
      const updatedProfile: Partial<BusinessProfile> = {
        name: stallName.trim(),
        ownerName: fullName.trim(),
        username: cleanUsername,
        avatarUri: avatarUri || undefined,
        avatarPreset: selectedPresetId || undefined,
        phone: phone.trim(),
        email: email.trim(),
        city: city.trim(),
        businessType: businessType.trim(),
        tagline: tagline.trim(),
        currency,
        preferredLanguage: language,
        updatedAt: new Date().toISOString(),
      };

      await MobileStorageService.updateBusiness(updatedProfile);

      // Sync active session
      if (session) {
        await MobileAuthService.updateSession({
          name: fullName.trim(),
          username: cleanUsername,
          businessName: stallName.trim(),
          currency,
          avatarUri: avatarUri || undefined,
          avatarPreset: selectedPresetId || undefined,
          phone: phone.trim(),
          city: city.trim(),
          tagline: tagline.trim(),
        });
      }

      setSaving(false);

      Alert.alert(
        'Profile Saved',
        'Your profile picture and business information have been updated.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (err: any) {
      setSaving(false);
      Alert.alert('Save Failed', err.message || 'Could not save profile.');
    }
  };

  const activePreset = PRESET_AVATARS.find((p) => p.id === selectedPresetId);

  if (loading) {
    return (
      <View style={[styles.screenWrapper, styles.center]}>
        <ActivityIndicator size="large" color={EmeraldTokens.mintCta} />
      </View>
    );
  }

  return (
    <View style={styles.screenWrapper}>
      {/* 1. Deep Forest Emerald Header */}
      <View style={styles.emeraldHeader}>
        <View style={styles.topNavRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.iconButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
          </Pressable>

          <Text style={styles.headerTitle}>Edit Profile</Text>

          <Pressable
            onPress={handleSaveProfile}
            disabled={saving}
            style={styles.headerSaveBtn}
            accessibilityRole="button"
            accessibilityLabel="Save profile changes"
          >
            {saving ? (
              <ActivityIndicator size="small" color={EmeraldTokens.deepPine} />
            ) : (
              <Text style={styles.headerSaveBtnText}>SAVE</Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.headerSubtitle}>
          Update your trader avatar, identity, and tuckshop enterprise details.
        </Text>
      </View>

      {/* 2. White Curved Scroll Sheet */}
      <ScrollView
        style={styles.sheetContainer}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar & Photo Studio Card (Pinterest Style) */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarFrameContainer}>
            <View style={styles.avatarHaloRing}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : activePreset ? (
                <View
                  style={[
                    styles.avatarPresetCircle,
                    { backgroundColor: activePreset.bgColor },
                  ]}
                >
                  <Ionicons
                    name={activePreset.icon}
                    size={48}
                    color={activePreset.iconColor}
                  />
                </View>
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>
                    {fullName.trim().slice(0, 2).toUpperCase() || 'MQ'}
                  </Text>
                </View>
              )}
            </View>

            {/* Floating Camera Badge Button */}
            <Pressable
              onPress={handlePickImage}
              style={styles.cameraBadgePill}
              accessibilityRole="button"
              accessibilityLabel="Upload profile photo"
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text style={styles.avatarCardTitle}>{fullName || 'Trader'}</Text>
          <Text style={styles.avatarCardSubtitle}>
            @{username || 'mrq_mbare'} &bull; {city}
          </Text>

          {/* Photo Action Buttons */}
          <View style={styles.avatarActionRow}>
            <Pressable
              onPress={handlePickImage}
              style={styles.avatarActionBtn}
              accessibilityRole="button"
              accessibilityLabel="Choose photo from device"
            >
              <Ionicons name="image-outline" size={15} color={EmeraldTokens.deepPine} />
              <Text style={styles.avatarActionBtnText}>Upload Photo</Text>
            </Pressable>

            {(avatarUri || selectedPresetId) && (
              <Pressable
                onPress={handleRemovePhoto}
                style={styles.avatarRemoveBtn}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
              >
                <Ionicons name="trash-outline" size={15} color="#DC2626" />
                <Text style={styles.avatarRemoveBtnText}>Remove</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Preset Avatars Carousel */}
        <Text style={styles.sectionHeading}>Instant Trader Presets</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.presetsRow}
        >
          {PRESET_AVATARS.map((preset) => {
            const isSelected = selectedPresetId === preset.id && !avatarUri;
            return (
              <Pressable
                key={preset.id}
                onPress={() => handleSelectPreset(preset)}
                style={[
                  styles.presetChipCard,
                  isSelected && styles.presetChipCardActive,
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
                <Text style={styles.presetChipTitle}>{preset.title}</Text>
                <Text style={styles.presetChipSub} numberOfLines={1}>
                  {preset.subtitle}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Card 1: Personal Identity */}
        <Text style={styles.sectionHeading}>Personal Identity</Text>
        <View style={styles.formCard}>
          <M3Input
            label="Full Name / Display Name"
            placeholder="e.g. Mr Q"
            value={fullName}
            onChangeText={setFullName}
          />

          <View style={{ marginTop: 12 }}>
            <M3Input
              label="Trader Handle / Username"
              placeholder="e.g. mrq_mbare"
              prefix="@"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={{ marginTop: 12 }}>
            <M3Input
              label="WhatsApp & Phone Number"
              placeholder="+263 77 123 4567"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={{ marginTop: 12 }}>
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
        <Text style={styles.sectionHeading}>Tuckshop & Stall Details</Text>
        <View style={styles.formCard}>
          <M3Input
            label="Business / Stall Name"
            placeholder="e.g. Mbare Fresh Produce & Tuckshop"
            value={stallName}
            onChangeText={setStallName}
          />

          {/* Business Sector Selection Chips */}
          <Text style={styles.chipFieldLabel}>Business Type / Sector</Text>
          <View style={styles.chipsContainer}>
            {BUSINESS_TYPES.map((type) => {
              const active = businessType === type;
              return (
                <Pressable
                  key={type}
                  onPress={() => setBusinessType(type)}
                  style={[
                    styles.selectionPill,
                    active && styles.selectionPillActive,
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
          <Text style={styles.chipFieldLabel}>City / Market Location</Text>
          <View style={styles.chipsContainer}>
            {POPULAR_LOCATIONS.map((loc) => {
              const active = city === loc;
              return (
                <Pressable
                  key={loc}
                  onPress={() => setCity(loc)}
                  style={[
                    styles.selectionPill,
                    active && styles.selectionPillActive,
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
              label="Tagline / Business Motto"
              placeholder="e.g. Fresh produce daily from Domboshava farmers"
              value={tagline}
              onChangeText={setTagline}
            />
          </View>
        </View>

        {/* Card 3: Regional & Currency Defaults */}
        <Text style={styles.sectionHeading}>Regional & Till Defaults</Text>
        <View style={styles.formCard}>
          <Text style={styles.chipFieldLabel}>Default Till Currency</Text>
          <View style={styles.chipsContainer}>
            {[
              { id: 'USD', label: 'USD ($ Cash Drawer)' },
              { id: 'ZWG', label: 'ZiG (EcoCash / ZWG)' },
              { id: 'ZAR', label: 'ZAR (Rand Float)' },
            ].map((cur) => {
              const active = currency === cur.id;
              return (
                <Pressable
                  key={cur.id}
                  onPress={() => setCurrency(cur.id as CurrencyCode)}
                  style={[
                    styles.selectionPill,
                    active && styles.selectionPillActive,
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
                  style={[
                    styles.selectionPill,
                    active && styles.selectionPillActive,
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

        {/* 5. Bottom Save CTA Button */}
        <View style={styles.saveCtaContainer}>
          <M3Button
            label={saving ? 'SAVING CHANGES...' : 'SAVE PROFILE CHANGES'}
            variant="mint"
            size="lg"
            icon={<Ionicons name="checkmark-circle" size={20} color={EmeraldTokens.mintDarkText} />}
            disabled={saving}
            onPress={handleSaveProfile}
          />
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
    paddingBottom: 20,
  },
  topNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  headerSaveBtn: {
    backgroundColor: EmeraldTokens.mintCta,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  headerSaveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: EmeraldTokens.mintDarkText,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.72)',
    lineHeight: 18,
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

  // Avatar Hero Card
  avatarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BlueTokens.borders,
    shadowColor: BlueTokens.darkNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  avatarFrameContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarHaloRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 3.5,
    borderColor: EmeraldTokens.mintCta,
    padding: 3,
    backgroundColor: '#FFFFFF',
    shadowColor: EmeraldTokens.mintCta,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
  },
  avatarPresetCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 50,
    backgroundColor: EmeraldTokens.deepPine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  cameraBadgePill: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: EmeraldTokens.deepPine,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  avatarCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
    marginTop: 4,
  },
  avatarCardSubtitle: {
    fontSize: 12,
    color: EmeraldTokens.textMuted,
    marginTop: 2,
  },
  avatarActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  avatarActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F1F5F3',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  avatarRemoveBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },

  // Presets Row
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
    marginBottom: 10,
    marginLeft: 4,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 4,
    marginBottom: 20,
  },
  presetChipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    width: 140,
    borderWidth: 1.5,
    borderColor: BlueTokens.borders,
    alignItems: 'center',
  },
  presetChipCardActive: {
    borderColor: EmeraldTokens.mintCta,
    backgroundColor: '#F0FDF4',
  },
  presetMiniIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  presetChipTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: EmeraldTokens.textSlate,
    textAlign: 'center',
  },
  presetChipSub: {
    fontSize: 10,
    color: EmeraldTokens.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },

  // Form Cards
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    marginBottom: 20,
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
    fontWeight: '600',
    color: EmeraldTokens.textSlate,
    marginTop: 12,
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
    borderColor: 'rgba(0, 0, 0, 0.06)',
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
    marginTop: 6,
    marginBottom: 30,
  },
});
