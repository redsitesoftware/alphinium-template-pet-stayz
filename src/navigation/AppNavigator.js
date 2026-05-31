import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import HostScreen from '../screens/HostScreen';
import BookingScreen from '../screens/BookingScreen';
import { useStayz } from '../store/stayzStore';
import { colors, radius, shadows, spacing } from '../theme';

const CHIPS = [
 'Find boarding near me ',
 'Daycare this week ️',
 'Superhost near beach ️',
 'Build this for my business ',
];

function PipChatWidget() {
 const { state, dispatch } = useStayz();

 return (
 <>
 {state.chatOpen && (
 <View style={styles.chatShell}>
 <View style={styles.chatHeader}>
 <View>
 <Text style={styles.chatTitle}>Pip </Text>
 <Text style={styles.chatSubtitle}>Knows hosts for {state.checkIn} → {state.checkOut}</Text>
 </View>
 <Pressable onPress={() => dispatch({ type: 'TOGGLE_CHAT' })}>
 <Text style={styles.chatClose}></Text>
 </Pressable>
 </View>

 <ScrollView style={styles.chatMessages} showsVerticalScrollIndicator={false}>
 {state.chatMessages.map((message) => (
 <View key={message.id} style={[styles.messageBubble, message.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
 <Text style={[styles.messageText, message.role === 'user' && styles.userMessageText]}>{message.text}</Text>
 </View>
 ))}

 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
 {CHIPS.map((chip) => (
 <Pressable key={chip} style={styles.chatChip} onPress={() => dispatch({ type: 'SEND_CHAT_MESSAGE', text: chip })}>
 <Text style={styles.chatChipText}>{chip}</Text>
 </Pressable>
 ))}
 </ScrollView>
 </ScrollView>

 <View style={styles.chatInputRow}>
 <TextInput
 value={state.chatInput}
 onChangeText={(value) => dispatch({ type: 'SET_CHAT_INPUT', value })}
 placeholder="Ask Pip about boarding, daycare, or launch features"
 placeholderTextColor={colors.textMuted}
 style={styles.chatInput}
 />
 <Pressable style={styles.sendButton} onPress={() => dispatch({ type: 'SEND_CHAT_MESSAGE' })}>
 <Text style={styles.sendButtonText}>Send</Text>
 </Pressable>
 </View>
 </View>
 )}

 <Pressable style={styles.fab} onPress={() => dispatch({ type: 'TOGGLE_CHAT' })}>
 <Text style={styles.fabText}>Pip </Text>
 </Pressable>
 </>
 );
}

export default function AppNavigator() {
 const { state } = useStayz();

 return (
 <View style={styles.container}>
 {(state.phase === 'home' || state.phase === 'search') && <HomeScreen />}
 {state.phase === 'host' && <HostScreen />}
 {state.phase === 'booking' && <BookingScreen />}
 <PipChatWidget />
 </View>
 );
}

const styles = StyleSheet.create({
 container: {
 flex: 1,
 backgroundColor: colors.bg,
 },
 fab: {
 position: 'absolute',
 right: spacing.lg,
 bottom: spacing.lg,
 backgroundColor: colors.primary,
 paddingHorizontal: spacing.md,
 paddingVertical: 14,
 borderRadius: radius.round,
 ...shadows.card,
 },
 fabText: {
 color: colors.card,
 fontWeight: '800',
 },
 chatShell: {
 position: 'absolute',
 right: spacing.lg,
 bottom: 92,
 width: 360,
 maxWidth: '92%',
 maxHeight: '72%',
 backgroundColor: colors.card,
 borderRadius: radius.lg,
 borderWidth: 1,
 borderColor: colors.border,
 overflow: 'hidden',
 ...shadows.card,
 },
 chatHeader: {
 padding: spacing.md,
 backgroundColor: colors.softOrange,
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 },
 chatTitle: {
 fontSize: 18,
 fontWeight: '800',
 color: colors.text,
 },
 chatSubtitle: {
 color: colors.textMuted,
 marginTop: 4,
 },
 chatClose: {
 fontSize: 18,
 color: colors.textMuted,
 fontWeight: '700',
 },
 chatMessages: {
 paddingHorizontal: spacing.md,
 paddingTop: spacing.md,
 maxHeight: 360,
 },
 messageBubble: {
 marginBottom: spacing.sm,
 padding: spacing.sm,
 borderRadius: radius.md,
 },
 assistantBubble: {
 backgroundColor: '#FFF7ED',
 alignSelf: 'flex-start',
 },
 userBubble: {
 backgroundColor: colors.primary,
 alignSelf: 'flex-end',
 },
 messageText: {
 color: colors.text,
 lineHeight: 20,
 },
 userMessageText: {
 color: colors.card,
 },
 chipsRow: {
 gap: spacing.sm,
 paddingVertical: spacing.sm,
 paddingBottom: spacing.md,
 },
 chatChip: {
 paddingHorizontal: spacing.sm,
 paddingVertical: spacing.sm,
 backgroundColor: colors.chip,
 borderRadius: radius.round,
 borderWidth: 1,
 borderColor: colors.border,
 },
 chatChipText: {
 color: colors.text,
 fontSize: 12,
 fontWeight: '600',
 },
 chatInputRow: {
 flexDirection: 'row',
 padding: spacing.md,
 gap: spacing.sm,
 borderTopWidth: 1,
 borderTopColor: '#F5E7D7',
 },
 chatInput: {
 flex: 1,
 minHeight: 44,
 borderWidth: 1,
 borderColor: colors.border,
 borderRadius: radius.md,
 paddingHorizontal: spacing.sm,
 color: colors.text,
 backgroundColor: colors.bg,
 },
 sendButton: {
 backgroundColor: colors.primary,
 borderRadius: radius.md,
 justifyContent: 'center',
 paddingHorizontal: spacing.md,
 },
 sendButtonText: {
 color: colors.card,
 fontWeight: '700',
 },
});
