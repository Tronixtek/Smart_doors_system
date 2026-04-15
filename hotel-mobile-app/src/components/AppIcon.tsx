import React from 'react';
import { Text, TextStyle } from 'react-native';

type IconName =
  | 'add'
  | 'arrow-back'
  | 'battery-charging'
  | 'battery-dead'
  | 'battery-full'
  | 'battery-half'
  | 'bluetooth'
  | 'card'
  | 'checkmark-circle'
  | 'finger-print'
  | 'keypad'
  | 'lock-closed'
  | 'lock-closed-outline'
  | 'lock-open'
  | 'scan'
  | 'shield-checkmark'
  | 'stop-circle'
  | 'time'
  | 'trash'
  | 'warning'
  | 'wifi';

const iconMap: Record<IconName, string> = {
  add: '+',
  'arrow-back': '<',
  'battery-charging': '[~]',
  'battery-dead': '[ ]',
  'battery-full': '[|||]',
  'battery-half': '[|| ]',
  bluetooth: 'BT',
  card: 'ID',
  'checkmark-circle': 'OK',
  'finger-print': 'FP',
  keypad: '#',
  'lock-closed': 'L',
  'lock-closed-outline': 'L',
  'lock-open': 'U',
  scan: '[]',
  'shield-checkmark': 'S',
  'stop-circle': 'X',
  time: 'T',
  trash: 'DEL',
  warning: '!',
  wifi: 'WiFi',
};

interface AppIconProps {
  name: IconName;
  size: number;
  color: string;
  style?: TextStyle;
}

export default function AppIcon({ name, size, color, style }: AppIconProps) {
  return (
    <Text
      style={[
        {
          color,
          fontSize: Math.max(12, size * 0.55),
          fontWeight: '700',
          includeFontPadding: false,
          textAlign: 'center',
          minWidth: size,
        },
        style,
      ]}
    >
      {iconMap[name] || '?'}
    </Text>
  );
}
