import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Path, Rect, Circle, G, Text as SvgText, Defs, LinearGradient, Stop } from 'react-native-svg';

interface LogoProps {
  size?: number;
  style?: ViewStyle;
}

/**
 * Authentic EcoCash Brand Logo (Vector SVG)
 * Royal Blue & Cyan mobile money emblem
 */
export const EcoCashLogo: React.FC<LogoProps> = ({ size = 32, style }) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Defs>
          <LinearGradient id="ecoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#0B4DA2" />
            <Stop offset="100%" stopColor="#0284C7" />
          </LinearGradient>
        </Defs>
        {/* Squircle Badge */}
        <Rect width="48" height="48" rx="14" fill="url(#ecoGrad)" />
        {/* EcoCash Iconic Lowercase 'e' with Signal Waves */}
        <Path
          d="M24 12C17.37 12 12 17.37 12 24C12 30.63 17.37 36 24 36C28.5 36 32.4 33.5 34.4 29.8H29.5C28.2 31.4 26.2 32.4 24 32.4C19.7 32.4 16.2 29.2 15.8 25.1H35.8C35.9 24.4 36 23.7 36 23C36 16.9 30.6 12 24 12ZM16 21.8C16.8 17.9 20.1 15.2 24 15.2C27.9 15.2 31.2 17.9 32 21.8H16Z"
          fill="#FFFFFF"
        />
        {/* Radiating Mobile Signal Dot */}
        <Circle cx="35" cy="13" r="3.5" fill="#55D7FF" />
      </Svg>
    </View>
  );
};

/**
 * Authentic InnBucks Brand Logo (Vector SVG)
 * Simbisa Brands InnBucks Gold & Dark Navy Coin Emblem
 */
export const InnBucksLogo: React.FC<LogoProps> = ({ size = 32, style }) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Defs>
          <LinearGradient id="innGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#F59E0B" />
            <Stop offset="100%" stopColor="#D97706" />
          </LinearGradient>
        </Defs>
        {/* Outer Round Coin */}
        <Rect width="48" height="48" rx="14" fill="#06152E" />
        <Circle cx="24" cy="24" r="18" fill="url(#innGrad)" />
        {/* InnBucks Stylized "B" Chevron Cut */}
        <Path
          d="M18 14H27C29.76 14 32 16.24 32 19C32 20.8 31 22.37 29.5 23.18C31.5 24 33 25.8 33 28C33 30.76 30.76 33 28 33H18V14ZM22 21.5H26.5C27.88 21.5 29 20.38 29 19C29 17.62 27.88 16.5 26.5 16.5H22V21.5ZM22 30.5H27.5C28.88 30.5 30 29.38 30 28C30 26.62 28.88 25.5 27.5 25.5H22V30.5Z"
          fill="#FFFFFF"
        />
      </Svg>
    </View>
  );
};

/**
 * Authentic CABS Bank Brand Logo (Vector SVG)
 * Blue & Green Dual Geometric Shield
 */
export const CabsLogo: React.FC<LogoProps> = ({ size = 32, style }) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Rect width="48" height="48" rx="14" fill="#002B66" />
        <Path d="M12 16H24V28H12V16Z" fill="#16803C" />
        <Path d="M24 20H36V32H24V20Z" fill="#1565D8" />
        <SvgText
          x="24"
          y="42"
          textAnchor="middle"
          fontSize="9"
          fontWeight="bold"
          fill="#FFFFFF"
          letterSpacing="0.5"
        >
          CABS
        </SvgText>
      </Svg>
    </View>
  );
};

/**
 * Authentic Bakers Inn Bread Brand Logo (Vector SVG)
 * Golden Yellow & Royal Blue Loaf / Baker's Hat Emblem
 */
export const BakersInnLogo: React.FC<LogoProps> = ({ size = 32, style }) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Rect width="48" height="48" rx="14" fill="#FFC72C" />
        {/* Baker's Toque / Bread Loaf Crown */}
        <Path
          d="M16 26C14.34 26 13 24.66 13 23C13 21.5 14.1 20.25 15.55 20.05C15.35 19.4 15.25 18.72 15.25 18C15.25 14.69 17.94 12 21.25 12C22.37 12 23.42 12.31 24.32 12.85C25.35 11.71 26.85 11 28.5 11C31.54 11 34 13.46 34 16.5C34 16.9 33.95 17.29 33.86 17.67C35.08 18.42 35.9 19.74 35.9 21.25C35.9 23.32 34.22 25 32.15 25H16V26Z"
          fill="#0B3280"
        />
        {/* Loaf Base */}
        <Rect x="15" y="27" width="18" height="7" rx="3.5" fill="#0B3280" />
        <SvgText
          x="24"
          y="42"
          textAnchor="middle"
          fontSize="7"
          fontWeight="bold"
          fill="#0B3280"
          letterSpacing="0.2"
        >
          BAKERS INN
        </SvgText>
      </Svg>
    </View>
  );
};

/**
 * Authentic National Foods Brand Logo (Vector SVG)
 * Red & Gold Wheat Sheaf Corporate Emblem
 */
export const NationalFoodsLogo: React.FC<LogoProps> = ({ size = 32, style }) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Rect width="48" height="48" rx="14" fill="#C8102E" />
        {/* Stylized Golden Wheat Stalks */}
        <Path
          d="M24 12C24 16 20 20 20 24C20 28 24 32 24 36M24 12C24 16 28 20 28 24C28 28 24 32 24 36"
          stroke="#F59E0B"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <Path
          d="M17 18C20 20 24 22 24 26M31 18C28 20 24 22 24 26"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <SvgText
          x="24"
          y="43"
          textAnchor="middle"
          fontSize="7"
          fontWeight="900"
          fill="#FFFFFF"
          letterSpacing="0.4"
        >
          NATFOODS
        </SvgText>
      </Svg>
    </View>
  );
};

/**
 * Mukando & Supplier Credit Logo (Vector SVG)
 * Cooperative Rotational Lending Shield
 */
export const MukandoLogo: React.FC<LogoProps> = ({ size = 32, style }) => {
  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
        <Rect width="48" height="48" rx="14" fill="#1565D8" />
        <Circle cx="24" cy="20" r="6" stroke="#55D7FF" strokeWidth="2.5" fill="none" />
        <Path
          d="M14 34C14 28.48 18.48 24 24 24C29.52 24 34 28.48 34 34"
          stroke="#FFFFFF"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <Circle cx="35" cy="18" r="4" stroke="#55D7FF" strokeWidth="1.8" fill="none" />
        <Circle cx="13" cy="18" r="4" stroke="#55D7FF" strokeWidth="1.8" fill="none" />
      </Svg>
    </View>
  );
};

/**
 * Intelligent Brand Resolver:
 * Takes any transaction description, vendor name, or provider ID and renders the matching authentic logo!
 */
export const CompanyBrandLogo: React.FC<{
  identifier: string;
  size?: number;
  fallbackIcon?: React.ReactNode;
  style?: ViewStyle;
}> = ({ identifier, size = 32, fallbackIcon, style }) => {
  const norm = (identifier || '').toLowerCase();

  if (norm.includes('ecocash') || norm.includes('econet')) {
    return <EcoCashLogo size={size} style={style} />;
  }
  if (norm.includes('innbucks') || norm.includes('simbisa') || norm.includes('chicken inn') || norm.includes('pizza inn')) {
    return <InnBucksLogo size={size} style={style} />;
  }
  if (norm.includes('cabs') || norm.includes('old mutual')) {
    return <CabsLogo size={size} style={style} />;
  }
  if (norm.includes('bakers inn') || norm.includes('baker') || norm.includes('bread')) {
    return <BakersInnLogo size={size} style={style} />;
  }
  if (norm.includes('national foods') || norm.includes('natfoods') || norm.includes('gloria') || norm.includes('red seal')) {
    return <NationalFoodsLogo size={size} style={style} />;
  }
  if (norm.includes('mukando') || norm.includes('credit') || norm.includes('pool') || norm.includes('society')) {
    return <MukandoLogo size={size} style={style} />;
  }

  // If a custom fallback was supplied, use it
  if (fallbackIcon) {
    return <View style={style}>{fallbackIcon}</View>;
  }

  // Default clean geometric financial badge
  return (
    <View style={[styles.defaultBadge, { width: size, height: size, borderRadius: size * 0.3 }, style]}>
      <Svg width={size * 0.6} height={size * 0.6} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 2L3 7V17L12 22L21 17V7L12 2Z"
          stroke="#1565D8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M12 6V18M18 9.5L6 14.5M6 9.5L18 14.5"
          stroke="#55D7FF"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  defaultBadge: {
    backgroundColor: 'rgba(21, 101, 216, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(85, 215, 255, 0.25)',
  },
});
