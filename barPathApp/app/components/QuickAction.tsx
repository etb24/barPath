import React from 'react';
import { Pressable, Text, View, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';

export type QuickActionProps = {
  title: string;
  subtitle?: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  onPress: () => void;
};

export default function QuickAction({ title, subtitle, icon, onPress }: QuickActionProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      android_ripple={{ color: 'rgba(0,0,0,0.15)' }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      hitSlop={8}
    >
      <View style={styles.iconWrap}>
        <Feather name={icon} size={20} color={'#C2FD4E'} />
      </View>
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <Feather name = "chevron-right" size={18} color = "#8C8C8C" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#161616',
    borderColor: '#242424',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    ...Platform.select({
      ios: { shadowColor: '#000', 
        shadowOpacity: 0.18, 
        shadowRadius: 10, 
        shadowOffset: { 
          width: 0, 
          height: 6 
        } 
      },
      android: { elevation: 2 },
    }),
  },
  pressed: { transform: [{ scale: 0.99 }] },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#1F1F1F',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A2A2A',
  },
  texts: { flex: 1 },
  title: { 
    color: '#EDEDED', 
    fontSize: 14.5, 
    fontWeight: '800', 
    letterSpacing: 0.2 
  },
  subtitle: { 
    color: '#9A9A9A', 
    fontSize: 12, 
    marginTop: 2, 
    letterSpacing: 0.2 
  },
});
