import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Linking,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppUpdateInfo, ChangelogItem, MobileUpdateService } from '@/services/updates';
import { BlueTokens } from '@/constants/Colors';

interface UpdateNotificationModalProps {
  visible: boolean;
  updateInfo: AppUpdateInfo | null;
  onClose: () => void;
  onInstall?: () => void;
}

export const UpdateNotificationModal: React.FC<UpdateNotificationModalProps> = ({
  visible,
  updateInfo,
  onClose,
  onInstall,
}) => {
  if (!visible || !updateInfo) return null;

  const handleOpenGitHub = () => {
    if (updateInfo.releaseUrl) {
      Linking.openURL(updateInfo.releaseUrl).catch(() => {});
    }
  };

  const handleInstallUpdate = () => {
    if (onInstall) {
      onInstall();
      return;
    }
    if (updateInfo.apkDownloadUrl) {
      Linking.openURL(updateInfo.apkDownloadUrl).catch(() => {
        // Fallback to release page if direct APK link fails
        if (updateInfo.releaseUrl) {
          Linking.openURL(updateInfo.releaseUrl).catch(() => {});
        }
      });
    } else if (updateInfo.releaseUrl) {
      Linking.openURL(updateInfo.releaseUrl).catch(() => {});
    }
  };

  const handleDismiss = async () => {
    if (updateInfo.latestVersion) {
      await MobileUpdateService.dismissUpdate(updateInfo.latestVersion);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        {/* Tap outside backdrop to dismiss */}
        <Pressable
          style={styles.backdropPressable}
          onPress={handleDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss update"
        />

        {/* Bottom Sheet Card */}
        <View style={styles.bottomSheetContainer}>
          {/* Top Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Top Header Row */}
          <View style={styles.headerRow}>
            {/* Update Available Badge */}
            <View style={styles.updateBadge}>
              <Ionicons name="sparkles" size={12} color="#0284C7" style={styles.badgeIcon} />
              <Text style={styles.updateBadgeText}>UPDATE AVAILABLE</Text>
            </View>

            {/* Circular Close Button */}
            <Pressable
              onPress={handleDismiss}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close update modal"
            >
              <Ionicons name="close" size={18} color="#1E293B" />
            </Pressable>
          </View>

          {/* Hero App & Version Row */}
          <View style={styles.heroRow}>
            <View style={styles.appIconContainer}>
              <MaterialCommunityIcons name="cellphone-arrow-down" size={32} color="#0284C7" />
            </View>

            <View style={styles.heroTextCol}>
              <Text style={styles.appTitle}>
                {updateInfo.releaseTitle || `Cashflow v${updateInfo.latestVersion}`}
              </Text>
              <View style={styles.versionRow}>
                <Text style={styles.currentVersionText}>v{updateInfo.currentVersion}</Text>
                <Text style={styles.versionArrow}>→</Text>
                <Text style={styles.latestVersionText}>v{updateInfo.latestVersion}</Text>
              </View>
            </View>
          </View>

          {/* 3-Column Spec Cards (Target ABI, Package Size, Official Source) */}
          <View style={styles.specGrid}>
            {/* Card 1: Target ABI */}
            <View style={styles.specCard}>
              <Ionicons name="hardware-chip" size={19} color="#0284C7" />
              <Text style={styles.specValue}>{updateInfo.targetAbi || 'Universal'}</Text>
              <Text style={styles.specLabel}>Target ABI</Text>
            </View>

            {/* Card 2: Package Size */}
            <View style={styles.specCard}>
              <Ionicons name="download" size={19} color="#0284C7" />
              <Text style={styles.specValue}>{updateInfo.apkSize || '98.2 MB'}</Text>
              <Text style={styles.specLabel}>Package Size</Text>
            </View>

            {/* Card 3: Source */}
            <View style={styles.specCard}>
              <Ionicons name="checkmark-circle" size={19} color="#0284C7" />
              <Text style={styles.specValue}>Official</Text>
              <Text style={styles.specLabel}>GitHub</Text>
            </View>
          </View>

          {/* Changelog Section */}
          <View style={styles.changelogBox}>
            <Text style={styles.changelogTitle}>
              Changelog • v{updateInfo.latestVersion}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Ionicons name="flash" size={13} color="#D97706" />
              <Text style={styles.changelogSubTitle}>
                {updateInfo.changelogTitle || 'Fixes & Improvements'}
              </Text>
            </View>

            <ScrollView
              style={styles.changelogScroll}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {updateInfo.changelog.map((item, index) => (
                <View key={index} style={styles.changelogItemRow}>
                  <Text style={styles.bulletDot}>•</Text>
                  <Text style={styles.changelogItemText}>
                    <Text style={styles.changelogItemBold}>{item.title}: </Text>
                    {item.description}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Status Banner */}
          <View style={styles.statusBanner}>
            <Ionicons name="checkmark-circle" size={16} color="#0284C7" style={{ marginRight: 6 }} />
            <Text style={styles.statusBannerText}>
              {updateInfo.statusText || 'Ready to Download • Official APK verified'}
            </Text>
          </View>

          {/* Bottom Action Buttons */}
          <View style={styles.actionRow}>
            {/* GitHub Button */}
            <Pressable
              onPress={handleOpenGitHub}
              style={({ pressed }) => [
                styles.githubButton,
                pressed && { backgroundColor: '#F1F5F9', transform: [{ scale: 0.98 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="View release on GitHub"
            >
              <Ionicons name="open-outline" size={15} color="#0F172A" style={{ marginRight: 6 }} />
              <Text style={styles.githubButtonText}>GitHub</Text>
            </Pressable>

            {/* Install Update Primary Action Button */}
            <Pressable
              onPress={handleInstallUpdate}
              style={({ pressed }) => [
                styles.installButton,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Install update"
            >
              <MaterialCommunityIcons
                name="cellphone-arrow-down"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.installButtonText}>Install Update</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

/**
 * Clean Top Banner to announce updates when bottom sheet is dismissed
 */
export const UpdateNoticeBanner: React.FC<{
  updateInfo: AppUpdateInfo | null;
  onPress: () => void;
}> = ({ updateInfo, onPress }) => {
  if (!updateInfo || !updateInfo.hasUpdate) return null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.topNoticeBanner,
        pressed && { opacity: 0.9, transform: [{ scale: 0.99 }] },
      ]}
      accessibilityRole="button"
      accessibilityLabel="Open update modal"
    >
      <View style={styles.noticeLeft}>
        <View style={styles.noticeIconCircle}>
          <Ionicons name="sparkles" size={13} color="#0284C7" />
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.noticeTitle}>
            Update Available • v{updateInfo.latestVersion}
          </Text>
          <Text style={styles.noticeSub} numberOfLines={1}>
            Tap to view changelog and install standalone APK
          </Text>
        </View>
      </View>
      <View style={styles.noticeCtaPill}>
        <Text style={styles.noticeCtaText}>View</Text>
        <Ionicons name="chevron-forward" size={12} color="#0284C7" />
      </View>
    </Pressable>
  );
};

/**
 * Bottom Sheet Modal shown when the user is already running the current / latest version
 */
export const UpToDateModal: React.FC<{
  visible: boolean;
  updateInfo: AppUpdateInfo | null;
  onClose: () => void;
}> = ({ visible, updateInfo, onClose }) => {
  if (!visible) return null;

  const currentVersion = updateInfo?.currentVersion || '1.3.0';
  const releaseUrl =
    updateInfo?.releaseUrl ||
    'https://github.com/Thabisomaqhawengwenya/cashflow-mate/releases';

  const handleOpenGitHub = () => {
    Linking.openURL(releaseUrl).catch(() => {});
  };

  const defaultHighlights: ChangelogItem[] = [
    {
      title: 'Supabase Cloud Sync',
      description: 'Multi-user tenant isolation with PostgreSQL Row-Level Security.',
    },
    {
      title: '3-Drawer Market Till',
      description: 'Simultaneous cashbox drawers for USD Cash, EcoCash ZiG & ZAR Rand.',
    },
    {
      title: 'EcoCash & InnBucks SMS Parser',
      description: 'Instant regex parsing of mobile payment notifications into records.',
    },
    {
      title: 'Offline Market Till Shield',
      description: 'Local SQLite offline persistence with 4-digit till PIN security.',
    },
  ];

  const highlights =
    updateInfo?.changelog && updateInfo.changelog.length > 0
      ? updateInfo.changelog
      : defaultHighlights;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalBackdrop}>
        {/* Tap outside backdrop to dismiss */}
        <Pressable
          style={styles.backdropPressable}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss modal"
        />

        {/* Bottom Sheet Card */}
        <View style={styles.bottomSheetContainer}>
          {/* Top Drag Handle */}
          <View style={styles.dragHandle} />

          {/* Top Header Row */}
          <View style={styles.headerRow}>
            {/* Up to Date Badge */}
            <View style={styles.upToDateBadge}>
              <Ionicons name="checkmark-circle" size={13} color="#16A34A" style={styles.badgeIcon} />
              <Text style={styles.upToDateBadgeText}>CURRENT VERSION</Text>
            </View>

            {/* Circular Close Button */}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close modal"
            >
              <Ionicons name="close" size={18} color="#1E293B" />
            </Pressable>
          </View>

          {/* Hero App & Version Row */}
          <View style={styles.heroRow}>
            <View style={[styles.appIconContainer, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="shield-checkmark" size={32} color="#16A34A" />
            </View>

            <View style={styles.heroTextCol}>
              <Text style={styles.appTitle}>Cashflow is Up to Date</Text>
              <View style={styles.versionRow}>
                <Text style={styles.upToDateVersion}>v{currentVersion}</Text>
                <Text style={styles.versionArrow}>•</Text>
                <Text style={styles.upToDateSubText}>Latest Official Release</Text>
              </View>
            </View>
          </View>

          {/* 3-Column Spec Cards */}
          <View style={styles.specGrid}>
            {/* Card 1: Target ABI */}
            <View style={styles.specCard}>
              <Ionicons name="hardware-chip" size={19} color="#16A34A" />
              <Text style={styles.specValue}>{updateInfo?.targetAbi || 'Universal'}</Text>
              <Text style={styles.specLabel}>Architecture</Text>
            </View>

            {/* Card 2: Package Size */}
            <View style={styles.specCard}>
              <Ionicons name="download" size={19} color="#16A34A" />
              <Text style={styles.specValue}>{updateInfo?.apkSize || '98.2 MB'}</Text>
              <Text style={styles.specLabel}>Package Size</Text>
            </View>

            {/* Card 3: Source */}
            <View style={styles.specCard}>
              <Ionicons name="checkmark-circle" size={19} color="#16A34A" />
              <Text style={styles.specValue}>Official</Text>
              <Text style={styles.specLabel}>GitHub</Text>
            </View>
          </View>

          {/* Changelog / Release Highlights Section */}
          <View style={styles.changelogBox}>
            <Text style={styles.changelogTitle}>Release Highlights • v{currentVersion}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Ionicons name="checkmark-circle" size={13} color="#15803D" />
              <Text style={[styles.changelogSubTitle, { color: '#15803D' }]}>
                Production Engine Active
              </Text>
            </View>

            <ScrollView
              style={styles.changelogScroll}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {highlights.map((item, index) => (
                <View key={index} style={styles.changelogItemRow}>
                  <Text style={[styles.bulletDot, { color: '#16A34A' }]}>•</Text>
                  <Text style={styles.changelogItemText}>
                    <Text style={styles.changelogItemBold}>{item.title}: </Text>
                    {item.description}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Status Banner */}
          <View style={[styles.statusBanner, { backgroundColor: '#DCFCE7' }]}>
            <Ionicons name="checkmark-circle" size={16} color="#16A34A" style={{ marginRight: 6 }} />
            <Text style={[styles.statusBannerText, { color: '#15803D' }]}>
              System Up to Date • No newer release available
            </Text>
          </View>

          {/* Bottom Action Buttons */}
          <View style={styles.actionRow}>
            {/* GitHub Button */}
            <Pressable
              onPress={handleOpenGitHub}
              style={({ pressed }) => [
                styles.githubButton,
                pressed && { backgroundColor: '#F1F5F9', transform: [{ scale: 0.98 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="View release notes on GitHub"
            >
              <Ionicons name="open-outline" size={15} color="#0F172A" style={{ marginRight: 6 }} />
              <Text style={styles.githubButtonText}>GitHub</Text>
            </Pressable>

            {/* Done Primary Action Button */}
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.doneButton,
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Dismiss modal"
            >
              <Ionicons name="checkmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bottomSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
    maxWidth: 540,
    width: '100%',
    alignSelf: 'center',
  },
  dragHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  updateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  badgeIcon: {
    marginRight: 5,
  },
  updateBadgeText: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  appIconContainer: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  heroTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  currentVersionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  versionArrow: {
    fontSize: 13,
    color: '#94A3B8',
    marginHorizontal: 6,
  },
  latestVersionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0284C7',
  },
  specGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  specCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  specValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 4,
  },
  specLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  changelogBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 14,
  },
  changelogTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  changelogSubTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
    marginBottom: 8,
  },
  changelogScroll: {
    maxHeight: 140,
  },
  changelogItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bulletDot: {
    fontSize: 13,
    color: '#0284C7',
    fontWeight: '800',
    marginRight: 6,
    lineHeight: 18,
  },
  changelogItemText: {
    flex: 1,
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
  },
  changelogItemBold: {
    fontWeight: '700',
    color: '#0F172A',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  statusBannerText: {
    color: '#0369A1',
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  githubButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  githubButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  installButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F4C81',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#0F4C81',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  installButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  topNoticeBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  noticeLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noticeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  noticeSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  noticeCtaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    marginLeft: 8,
  },
  noticeCtaText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284C7',
    marginRight: 2,
  },
  upToDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
  },
  upToDateBadgeText: {
    color: '#16A34A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  upToDateVersion: {
    fontSize: 13,
    fontWeight: '800',
    color: '#16A34A',
  },
  upToDateSubText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  doneButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#06152E',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: '#06152E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
