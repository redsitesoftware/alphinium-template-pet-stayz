import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getHostHomePhoto, getHostProfilePhoto } from '../media';
import { useStayz } from '../store/stayzStore';
import { colors, radius, shadows, spacing, typography } from '../theme';

function PetSelectorCard({ pet, selected, onSelect }) {
 return (
 <Pressable
  style={[styles.petSelectorCard, selected && styles.petSelectorCardActive]}
  onPress={() => onSelect(pet)}
 >
  <Text style={styles.petSelectorEmoji}>🐾</Text>
  <View style={styles.petSelectorBody}>
  <Text style={[styles.petSelectorName, selected && styles.petSelectorNameActive]}>{pet.name}</Text>
  <Text style={styles.petSelectorMeta}>
   {pet.species}{pet.breed ? ` · ${pet.breed}` : ''}
   {pet.age ? ` · ${pet.age}yr` : ''}
   {pet.weight ? ` · ${pet.weight}kg` : ''}
  </Text>
  </View>
  {selected && <Text style={styles.petSelectorCheck}>✓</Text>}
 </Pressable>
 );
}

function BookingInput({ label, value, onChangeText, multiline }) {
 return (
 <View style={styles.inputGroup}>
 <Text style={styles.inputLabel}>{label}</Text>
 <TextInput
 value={value}
 onChangeText={onChangeText}
 placeholder={label}
 placeholderTextColor={colors.textMuted}
 multiline={multiline}
 style={[styles.input, multiline && styles.textArea]}
 />
 </View>
 );
}

export default function BookingScreen() {
 const { state, dispatch } = useStayz();
 const host = state.selectedHost;

 if (!host) {
 return null;
 }

 const serviceFee = 10;
 const stayTotal = host.pricePerNight * state.nights;
 const grandTotal = stayTotal + serviceFee;

 return (
 <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
 <Pressable onPress={() => dispatch({ type: 'SET_PHASE', phase: 'host' })}>
 <Text style={styles.back}>← Back to host</Text>
 </Pressable>

 <View style={styles.heroCard}>
 <Image source={{ uri: getHostHomePhoto(host) }} style={styles.heroImage} />
 <View style={styles.heroBody}>
 <Image source={{ uri: getHostProfilePhoto(host) }} style={styles.heroAvatar} />
 <Text style={styles.title}>Book with {host.name}</Text>
 <Text style={styles.subtitle}>{state.checkIn} – {state.checkOut} · {state.nights} nights confirmed</Text>
 </View>
 </View>

 {state.bookingStep === 0 && (
 <View style={styles.card}>
 {/* Pet selector: shown when user has saved pets */}
 {state.pets && state.pets.length > 0 ? (
  <>
  <Text style={styles.sectionTitle}>Choose a pet</Text>
  {state.pets.map((pet) => (
   <PetSelectorCard
   key={pet.id}
   pet={pet}
   selected={state.bookingData.petId === pet.id}
   onSelect={(p) => dispatch({
    type: 'UPDATE_BOOKING_FIELD', key: 'petId', value: p.id,
   }) || [
    ['petName', p.name],
    ['breed', p.breed ?? ''],
    ['age', p.age ? String(p.age) : ''],
    ['size', p.weight ? (p.weight > 25 ? 'Large' : p.weight > 10 ? 'Medium' : 'Small') : 'Medium'],
    ['specialNeeds', p.specialCareNotes ?? ''],
   ].forEach(([key, value]) => dispatch({ type: 'UPDATE_BOOKING_FIELD', key, value }))}
   />
  ))}
  <Pressable onPress={() => dispatch({ type: 'SET_PHASE', phase: 'pets' })}>
  <Text style={styles.managePetsLink}>+ Manage / add pets</Text>
  </Pressable>
  <View style={styles.divider} />
  <Text style={styles.orLabel}>Or enter details manually</Text>
  </>
 ) : (
  <Pressable onPress={() => dispatch({ type: 'SET_PHASE', phase: 'pets' })}>
  <Text style={styles.managePetsLink}>+ Save a pet profile for faster booking</Text>
  </Pressable>
 )}

 <BookingInput label="Pet name" value={state.bookingData.petName} onChangeText={(value) => dispatch({ type: 'UPDATE_BOOKING_FIELD', key: 'petName', value })} />
 <BookingInput label="Breed" value={state.bookingData.breed} onChangeText={(value) => dispatch({ type: 'UPDATE_BOOKING_FIELD', key: 'breed', value })} />
 <BookingInput label="Age" value={state.bookingData.age} onChangeText={(value) => dispatch({ type: 'UPDATE_BOOKING_FIELD', key: 'age', value })} />
 <BookingInput label="Size" value={state.bookingData.size} onChangeText={(value) => dispatch({ type: 'UPDATE_BOOKING_FIELD', key: 'size', value })} />
 <BookingInput label="Any special needs / medications" value={state.bookingData.specialNeeds} onChangeText={(value) => dispatch({ type: 'UPDATE_BOOKING_FIELD', key: 'specialNeeds', value })} multiline />
 <BookingInput label="Notes for host" value={state.bookingData.notes} onChangeText={(value) => dispatch({ type: 'UPDATE_BOOKING_FIELD', key: 'notes', value })} multiline />

 <View style={styles.summaryBox}>
 <Text style={styles.summaryTitle}>Price summary</Text>
 <Text style={styles.summaryLine}>{state.nights} × ${host.pricePerNight} = ${stayTotal}</Text>
 <Text style={styles.summaryLine}>Service fee = ${serviceFee}</Text>
 <Text style={styles.summaryTotal}>Total = ${grandTotal}</Text>
 </View>

 <Pressable style={styles.primaryButton} onPress={() => dispatch({ type: 'NEXT_BOOKING_STEP' })}>
 <Text style={styles.primaryButtonText}>Review booking</Text>
 </Pressable>
 </View>
 )}

 {state.bookingStep === 1 && (
 <View style={styles.card}>
 <Text style={styles.sectionTitle}>Booking review</Text>
 <Text style={styles.reviewLine}>Host: {host.name}</Text>
 <Text style={styles.reviewLine}>Pet: {state.bookingData.petName || 'Your pet'} · {state.bookingData.breed || 'Breed not set'}</Text>
 <Text style={styles.reviewLine}>Age / size: {state.bookingData.age || 'Age not set'} · {state.bookingData.size || 'Size not set'}</Text>
 <Text style={styles.reviewLine}>Special needs: {state.bookingData.specialNeeds || 'None listed'}</Text>
 <Text style={styles.reviewLine}>Notes: {state.bookingData.notes || 'No extra notes'}</Text>

 <View style={styles.summaryBox}>
 <Text style={styles.summaryTitle}>Price summary</Text>
 <Text style={styles.summaryLine}>{state.nights} × ${host.pricePerNight} = ${stayTotal}</Text>
 <Text style={styles.summaryLine}>Service fee = ${serviceFee}</Text>
 <Text style={styles.summaryTotal}>Confirm & Pay ${grandTotal}</Text>
 </View>

 <View style={styles.callout}>
 <Text style={styles.calloutTitle}> alphinium-payments</Text>
 <Text style={styles.calloutText}>Real payment collection, host payouts, refund protection, and damage cover. One install.</Text>
 </View>

 <View style={styles.actionsRow}>
 <Pressable style={styles.secondaryButton} onPress={() => dispatch({ type: 'PREV_BOOKING_STEP' })}>
 <Text style={styles.secondaryButtonText}>Edit</Text>
 </Pressable>
 <Pressable style={styles.primaryButtonGrow} onPress={() => dispatch({ type: 'NEXT_BOOKING_STEP' })}>
 <Text style={styles.primaryButtonText}>Confirm & Pay ${grandTotal}</Text>
 </Pressable>
 </View>
 </View>
 )}

 {state.bookingStep === 2 && (
 <View style={styles.card}>
 <Text style={styles.celebrate}> Booking Confirmed!</Text>
 <View style={styles.confirmCard}>
 <Text style={styles.confirmTitle}>{host.name}</Text>
 <Text style={styles.confirmLine}>{state.checkIn} – {state.checkOut} · {state.nights} nights</Text>
 <Text style={styles.confirmLine}>Pet: {state.bookingData.petName || 'Your pet'} ({state.bookingData.breed || 'Breed'})</Text>
 <Text style={styles.confirmLine}>Total paid: ${grandTotal}</Text>
 <Text style={styles.confirmLine}>Availability and messaging ready via alphinium-booking + ChatInstance.</Text>
 </View>

 <View style={styles.callout}>
 <Text style={styles.calloutTitle}> alphinium-payments</Text>
 <Text style={styles.calloutText}>Real payment collection, host payouts, refund protection, and damage cover. One install.</Text>
 </View>

 <Pressable style={styles.primaryButton} onPress={() => dispatch({ type: 'RESET_BOOKING' })}>
 <Text style={styles.primaryButtonText}>Back to search</Text>
 </Pressable>
 </View>
 )}
 </ScrollView>
 );
}

const styles = StyleSheet.create({
 petSelectorCard: {
 flexDirection: 'row',
 alignItems: 'center',
 backgroundColor: colors.chip,
 borderRadius: radius.md,
 padding: spacing.sm,
 marginBottom: spacing.xs,
 borderWidth: 1.5,
 borderColor: colors.border,
 },
 petSelectorCardActive: {
 borderColor: colors.primary,
 backgroundColor: colors.softOrange,
 },
 petSelectorEmoji: { fontSize: 22, marginRight: spacing.sm },
 petSelectorBody: { flex: 1 },
 petSelectorName: { fontSize: 15, fontWeight: '700', color: colors.text },
 petSelectorNameActive: { color: colors.primary },
 petSelectorMeta: { fontSize: 13, color: colors.textMuted },
 petSelectorCheck: { fontSize: 18, color: colors.primary, fontWeight: '800' },
 managePetsLink: { color: colors.primary, fontWeight: '600', fontSize: 14, marginBottom: spacing.sm },
 divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
 orLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: spacing.sm },
 screen: {
 flex: 1,
 backgroundColor: colors.bg,
 },
 content: {
 padding: spacing.md,
 paddingTop: 56,
 paddingBottom: 120,
 },
 back: {
 color: colors.primary,
 fontWeight: '800',
 marginBottom: spacing.md,
 },
 heroCard: {
 backgroundColor: colors.card,
 borderRadius: radius.lg,
 overflow: 'hidden',
 marginBottom: spacing.lg,
 ...shadows.card,
 },
 heroImage: {
 width: '100%',
 height: 190,
 },
 heroBody: {
 padding: spacing.md,
 paddingTop: spacing.lg,
 },
 heroAvatar: {
 width: 60,
 height: 60,
 borderRadius: 30,
 marginTop: -44,
 borderWidth: 4,
 borderColor: colors.card,
 marginBottom: spacing.sm,
 },
 title: {
 ...typography.title,
 color: colors.text,
 },
 subtitle: {
 marginTop: 4,
 color: colors.textMuted,
 },
 card: {
 backgroundColor: colors.card,
 borderRadius: radius.lg,
 padding: spacing.md,
 ...shadows.card,
 },
 inputGroup: {
 marginBottom: spacing.md,
 },
 inputLabel: {
 color: colors.text,
 fontWeight: '700',
 marginBottom: spacing.sm,
 },
 input: {
 backgroundColor: colors.bg,
 borderWidth: 1,
 borderColor: colors.border,
 borderRadius: radius.md,
 paddingHorizontal: spacing.sm,
 paddingVertical: 12,
 color: colors.text,
 },
 textArea: {
 minHeight: 88,
 textAlignVertical: 'top',
 },
 summaryBox: {
 backgroundColor: '#FFF7ED',
 borderRadius: radius.md,
 padding: spacing.md,
 marginBottom: spacing.md,
 },
 summaryTitle: {
 color: colors.text,
 fontWeight: '800',
 marginBottom: spacing.sm,
 },
 summaryLine: {
 color: colors.textMuted,
 marginBottom: 6,
 },
 summaryTotal: {
 color: colors.primary,
 fontWeight: '800',
 fontSize: 18,
 marginTop: spacing.xs,
 },
 primaryButton: {
 backgroundColor: colors.primary,
 paddingVertical: 14,
 borderRadius: radius.md,
 alignItems: 'center',
 },
 primaryButtonGrow: {
 flex: 1,
 backgroundColor: colors.primary,
 paddingVertical: 14,
 borderRadius: radius.md,
 alignItems: 'center',
 },
 primaryButtonText: {
 color: colors.card,
 fontWeight: '800',
 },
 secondaryButton: {
 paddingHorizontal: spacing.md,
 justifyContent: 'center',
 alignItems: 'center',
 borderRadius: radius.md,
 borderWidth: 1,
 borderColor: colors.border,
 backgroundColor: colors.bg,
 },
 secondaryButtonText: {
 color: colors.text,
 fontWeight: '700',
 },
 sectionTitle: {
 color: colors.text,
 fontWeight: '800',
 fontSize: 18,
 marginBottom: spacing.md,
 },
 reviewLine: {
 color: colors.textMuted,
 lineHeight: 22,
 marginBottom: spacing.sm,
 },
 callout: {
 backgroundColor: colors.softOrange,
 borderRadius: radius.md,
 padding: spacing.md,
 marginBottom: spacing.md,
 },
 calloutTitle: {
 color: colors.text,
 fontWeight: '800',
 marginBottom: 6,
 },
 calloutText: {
 color: colors.textMuted,
 lineHeight: 21,
 },
 actionsRow: {
 flexDirection: 'row',
 gap: spacing.sm,
 },
 celebrate: {
 color: colors.green,
 fontWeight: '800',
 fontSize: 28,
 marginBottom: spacing.md,
 },
 confirmCard: {
 backgroundColor: colors.bg,
 borderRadius: radius.md,
 padding: spacing.md,
 borderWidth: 1,
 borderColor: colors.border,
 marginBottom: spacing.md,
 },
 confirmTitle: {
 color: colors.text,
 fontWeight: '800',
 fontSize: 18,
 marginBottom: spacing.sm,
 },
 confirmLine: {
 color: colors.textMuted,
 lineHeight: 22,
 marginBottom: 4,
 },
});
