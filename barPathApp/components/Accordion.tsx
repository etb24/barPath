import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, LayoutAnimation, UIManager, ViewStyle, TextStyle, } from 'react-native';

// enable layout animation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type AccordionProps = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  containerStyle?: ViewStyle;
  headerStyle?: ViewStyle;
  bodyStyle?: ViewStyle;
  titleStyle?: TextStyle;
  chevronStyle?: TextStyle;
  androidRippleColor?: string;
};

export default function Accordion({
  title,
  children,
  defaultOpen = false,
  containerStyle,
  headerStyle,
  bodyStyle,
  titleStyle,
  chevronStyle,
  androidRippleColor = 'rgba(0,0,0,0.15)',
}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const toggle = () => {
    LayoutAnimation.easeInEaseOut();
    setOpen(v => !v);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Pressable
        onPress={toggle}
        android_ripple={{ color: androidRippleColor }}
        style={({ pressed }) => [styles.header, pressed && styles.pressed, headerStyle]}
      >
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        <Text style={[styles.chevron, chevronStyle]}>{open ? '⌄' : '›'}</Text>
      </Pressable>

      {open && <View style={[styles.body, bodyStyle]}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161616',
    borderColor: '#242424',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    marginTop: 10,
    overflow: 'hidden',
  },
  header: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: { transform: [{ scale: 0.98 }] },
  title: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  chevron: { color: '#A0A0A0', fontSize: 18 },
  body: { paddingHorizontal: 14, paddingBottom: 12 },
});