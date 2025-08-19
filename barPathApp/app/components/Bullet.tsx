import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

export type BulletProps = {
  text: string;
  dot?: string;
  dotColor?: string; 
  textColor?: string;
  containerStyle?: ViewStyle;
  textStyle?: TextStyle;
};

export default function Bullet({
  text,
  dot = '•',
  dotColor = '#C2FD4E',
  textColor = '#B9B9B9',
  containerStyle,
  textStyle,
}: BulletProps) {
  return (
    <View style={[styles.row, containerStyle]}>
      <Text style={[styles.dot, { color: dotColor }]}>{dot}</Text>
      <Text style={[styles.text, { color: textColor }, textStyle]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { 
    flexDirection: 'row', 
    gap: 10, 
    paddingVertical: 6 
},
  dot: { 
    width: 20, 
    textAlign: 'center', 
    fontSize: 14, 
    marginTop: 1 
},
  text: { 
    fontSize: 13.5, 
    flex: 1, 
    lineHeight: 19 
},

});