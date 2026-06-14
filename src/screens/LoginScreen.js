import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { makeRedirectUri, ResponseType } from 'expo-auth-session';
import * as Facebook from 'expo-auth-session/providers/facebook';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useStayz } from '../store/stayzStore';
import { colors, radius, shadows, spacing, typography } from '../theme';

WebBrowser.maybeCompleteAuthSession();

const STORAGE_KEY = 'pet-stayz.social-token';
const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const facebookAppId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;
const redirectUri = makeRedirectUri({
 scheme: process.env.EXPO_PUBLIC_APP_SCHEME || 'petstayz',
 path: 'auth',
});

function SocialButton({ label, loadingLabel, disabled, loading, onPress }) {
 return (
 <Pressable
 style={[styles.socialButton, disabled ? styles.socialButtonDisabled : null]}
 disabled={disabled}
 onPress={onPress}
 >
 {loading ? <ActivityIndicator color="#FFFFFF" /> : null}
 <Text style={styles.socialButtonText}>{loading ? loadingLabel : label}</Text>
 </Pressable>
 );
}

function GoogleLoginButton({ disabled, onError, onSuccess }) {
 const [loading, setLoading] = useState(false);
 const [request, response, promptAsync] = Google.useAuthRequest({
 webClientId: googleClientId,
 responseType: ResponseType.Token,
 scopes: ['profile', 'email'],
 redirectUri,
 });

 useEffect(() => {
 if (response?.type === 'success') {
 const token = response.authentication?.accessToken || response.params?.access_token || response.params?.id_token;
 if (token) {
 void onSuccess('google', token);
 } else {
 onError('Google login did not return a token.');
 }
 setLoading(false);
 return;
 }

 if (response?.type === 'error') {
 onError(response.error?.message || 'Google login failed.');
 setLoading(false);
 return;
 }

 if (response?.type === 'dismiss' || response?.type === 'cancel') {
 setLoading(false);
 }
 }, [onError, onSuccess, response]);

 return (
 <SocialButton
 label="Continue with Google"
 loadingLabel="Opening Google..."
 disabled={!request || disabled}
 loading={loading}
 onPress={async () => {
 setLoading(true);
 await promptAsync();
 }}
 />
 );
}

function FacebookLoginButton({ disabled, onError, onSuccess }) {
 const [loading, setLoading] = useState(false);
 const [request, response, promptAsync] = Facebook.useAuthRequest({
 clientId: facebookAppId,
 responseType: ResponseType.Token,
 scopes: ['public_profile', 'email'],
 redirectUri,
 });

 useEffect(() => {
 if (response?.type === 'success') {
 const token = response.authentication?.accessToken || response.params?.access_token;
 if (token) {
 void onSuccess('facebook', token);
 } else {
 onError('Facebook login did not return a token.');
 }
 setLoading(false);
 return;
 }

 if (response?.type === 'error') {
 onError(response.error?.message || 'Facebook login failed.');
 setLoading(false);
 return;
 }

 if (response?.type === 'dismiss' || response?.type === 'cancel') {
 setLoading(false);
 }
 }, [onError, onSuccess, response]);

 return (
 <SocialButton
 label="Continue with Facebook"
 loadingLabel="Opening Facebook..."
 disabled={!request || disabled}
 loading={loading}
 onPress={async () => {
 setLoading(true);
 await promptAsync();
 }}
 />
 );
}

export default function LoginScreen() {
 const { dispatch } = useStayz();
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState('');
 const hasGoogle = Boolean(googleClientId);
 const hasFacebook = Boolean(facebookAppId);

 const handleLogin = useCallback(async (provider, token) => {
 setError('');
 setSaving(true);

 try {
 await AsyncStorage.setItem(
 STORAGE_KEY,
 JSON.stringify({
 provider,
 token,
 savedAt: new Date().toISOString(),
 }),
 );
 dispatch({ type: 'SET_PHASE', phase: 'home' });
 } catch (storageError) {
 setError('We could not save your login yet. Please try again.');
 } finally {
 setSaving(false);
 }
 }, [dispatch]);

 const handleGuest = useCallback(() => {
 setError('');
 dispatch({ type: 'SET_PHASE', phase: 'home' });
 }, [dispatch]);

 return (
 <View style={styles.container}>
 <View style={styles.card}>
 <Text style={styles.brand}>PetStayz</Text>
 <Text style={styles.heading}>Sign in to continue</Text>
 <Text style={styles.body}>Choose a social login or skip ahead as a guest.</Text>

 <View style={styles.buttonGroup}>
 {hasGoogle ? <GoogleLoginButton disabled={saving} onError={setError} onSuccess={handleLogin} /> : null}
 {hasFacebook ? <FacebookLoginButton disabled={saving} onError={setError} onSuccess={handleLogin} /> : null}
 {!hasGoogle && !hasFacebook ? (
 <View style={styles.placeholderCard}>
 <Text style={styles.placeholderTitle}>Login coming soon</Text>
 <Text style={styles.placeholderText}>Add a Google or Facebook App ID to switch on social login for this demo.</Text>
 </View>
 ) : null}
 </View>

 {error ? <Text style={styles.errorText}>{error}</Text> : null}

 <Pressable style={styles.guestButton} onPress={handleGuest}>
 <Text style={styles.guestButtonText}>Continue as guest</Text>
 </Pressable>
 </View>
 </View>
 );
}

const styles = StyleSheet.create({
 container: {
 flex: 1,
 justifyContent: 'center',
 padding: spacing.lg,
 backgroundColor: colors.bg,
 },
 card: {
 borderRadius: radius.xl,
 padding: spacing.lg,
 backgroundColor: colors.card,
 borderWidth: 1,
 borderColor: colors.border,
 gap: spacing.sm,
 ...shadows.card,
 },
 brand: {
 ...typography.hero,
 color: colors.primary,
 textAlign: 'center',
 },
 heading: {
 ...typography.title,
 color: colors.text,
 textAlign: 'center',
 },
 body: {
 ...typography.body,
 color: colors.textMuted,
 textAlign: 'center',
 },
 buttonGroup: {
 marginTop: spacing.sm,
 gap: spacing.sm,
 },
 socialButton: {
 minHeight: 54,
 borderRadius: radius.md,
 backgroundColor: colors.primary,
 alignItems: 'center',
 justifyContent: 'center',
 flexDirection: 'row',
 gap: 10,
 paddingHorizontal: spacing.md,
 },
 socialButtonDisabled: {
 opacity: 0.65,
 },
 socialButtonText: {
 fontSize: 16,
 fontWeight: '800',
 color: '#FFFFFF',
 },
 placeholderCard: {
 borderRadius: radius.md,
 borderWidth: 1,
 borderColor: colors.border,
 backgroundColor: colors.softOrange,
 padding: spacing.md,
 gap: spacing.xs,
 },
 placeholderTitle: {
 ...typography.heading,
 color: colors.text,
 textAlign: 'center',
 },
 placeholderText: {
 ...typography.body,
 color: colors.textMuted,
 textAlign: 'center',
 },
 errorText: {
 ...typography.caption,
 color: '#DC2626',
 textAlign: 'center',
 marginTop: spacing.xs,
 },
 guestButton: {
 alignItems: 'center',
 paddingVertical: spacing.sm,
 marginTop: spacing.xs,
 },
 guestButtonText: {
 fontSize: 15,
 fontWeight: '700',
 color: colors.primary,
 },
});
