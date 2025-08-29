import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RADII } from '../../styles/tokens';

interface WhiteSheetProps {
  children: React.ReactNode;
  style?: any;
}

export default function WhiteSheet({ children, style }: WhiteSheetProps) {
  return (
    <View style={[styles.sheet, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: RADII.panel,
    borderTopRightRadius: RADII.panel,
    marginTop: 12,
    overflow: 'hidden',
  },
});
