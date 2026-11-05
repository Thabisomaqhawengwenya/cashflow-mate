import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import QRCode from 'qrcode';

export interface RealQRCodeProps {
  /** Text or URL payload encoded inside the QR Code */
  value: string;
  /** Size in pixels (width & height) */
  size?: number;
  /** Color of dark modules */
  color?: string;
  /** Background fill color */
  backgroundColor?: string;
  /** Quiet zone padding in module units (default 2) */
  quietZone?: number;
  /** Optional container style */
  style?: any;
  /** Optional tap handler (e.g. to open full-screen counter display) */
  onPress?: () => void;
}

/**
 * High-performance, 100% Vector SVG QR Code Generator for Cashflow Merchant Tills.
 * Uses ISO/IEC 18004 Reed-Solomon Error Correction.
 * Scannable by any smartphone camera or banking scanner app.
 */
export const RealQRCode: React.FC<RealQRCodeProps> = ({
  value,
  size = 72,
  color = '#0F172A',
  backgroundColor = '#FFFFFF',
  quietZone = 2,
  style,
  onPress,
}) => {
  const qrData = useMemo(() => {
    try {
      const payload = value && value.trim() ? value.trim() : 'cashflow://merchant/till';
      const qr = QRCode.create(payload, {
        errorCorrectionLevel: 'M',
      });
      const moduleCount = qr.modules.size;
      const totalUnits = moduleCount + quietZone * 2;

      // Construct a single consolidated SVG path for maximum render performance
      let d = '';
      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.modules.get(r, c)) {
            const x = c + quietZone;
            const y = r + quietZone;
            d += `M${x},${y}h1v1h-1z `;
          }
        }
      }

      return { path: d, totalUnits };
    } catch {
      return null;
    }
  }, [value, quietZone]);

  if (!qrData) {
    return <View style={[{ width: size, height: size, backgroundColor }, style]} />;
  }

  const content = (
    <View
      style={[
        styles.wrapper,
        {
          width: size,
          height: size,
          backgroundColor,
        },
        style,
      ]}
    >
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${qrData.totalUnits} ${qrData.totalUnits}`}
      >
        <Rect
          x={0}
          y={0}
          width={qrData.totalUnits}
          height={qrData.totalUnits}
          fill={backgroundColor}
        />
        <Path d={qrData.path} fill={color} />
      </Svg>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => pressed && { opacity: 0.85 }}>
        {content}
      </Pressable>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    overflow: 'hidden',
  },
});
