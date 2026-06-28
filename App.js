import React, { useEffect } from 'react';
import { StatusBar, StyleSheet, View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { StayzProvider } from './src/store/stayzStore';
import { colors } from './src/theme';
import { initGA } from './src/utils/analytics';

export default function App() {
  useEffect(() => {
    initGA();
  }, []);

  return (
    <StayzProvider>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.bg} />
        <AppNavigator />
      </View>
    </StayzProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
