import React, { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import HostScreen from '../screens/HostScreen';
import BookingScreen from '../screens/BookingScreen';
import { useStayz } from '../store/stayzStore';
import { colors } from '../theme';

export default function AppNavigator() {
  const { state, dispatch } = useStayz();

  const handleLogin = useCallback(({ guest, token, user }) => {
    dispatch({ type: 'COMPLETE_LOGIN', guest, token, user });
  }, [dispatch]);

  return (
    <View style={styles.container}>
      {state.phase === 'login' && <LoginScreen onLogin={handleLogin} />}
      {(state.phase === 'home' || state.phase === 'search') && <HomeScreen />}
      {state.phase === 'host' && <HostScreen />}
      {state.phase === 'booking' && <BookingScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
});
