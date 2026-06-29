import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getHostHomePhoto, getHostProfilePhoto } from '../media';
import { useAuth } from '../hooks/useAuth';
import { createBooking, getAvailability } from '../services/BookingService';
import { useStayz } from '../store/stayzStore';
import { colors, radius, shadows, spacing, typography } from '../theme';
import { calculateStayPrice } from '../utils/pricing';

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
 const { session } = useAuth();
 const authToken = session?.access_token ?? state.authToken;
 const host = state.selectedHost;

 const [unavailableDates, setUnavailableDates] = useState([]);
 const [availabilityWarning, setAvailabilityWarning] = useState(null);
 const [submitting, setSubmitting] = useState(false);
 const [submitError, setSubmitError] = useState(null);

 // ── Derive ISO date strings from store display strings ─────────────────────
 // checkIn/checkOut in store are display strings like "Fri 6 June".
 // We pass them directly to the backend; if they're already YYYY-MM-DD they work as-is.
 // When the date picker is upgraded to ISO dates this will be seamless.
 const checkInISO = state.checkIn;
 const checkOutISO = state.checkOut;

 // ── 1. Load availability on mount and whenever dates change ────────────────
 const loadAvailability = useCallback(async () => {
  if (!host?.id) return;
  // Only attempt if dates look like YYYY-MM-DD
  if (!checkInISO || !checkOutISO) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(checkInISO) || !/^\d{4}-\d{2}-\d{2}$/.test(checkOutISO)) return;

  try {
   const result = await getAvailability(host.id, checkInISO, checkOutISO);
   setUnavailableDates(result.unavailable ?? []);
   if ((result.unavailable ?? []).length > 0) {
    setAvailabilityWarning(
     `⚠️ Some nights are already booked: ${result.unavailable.join(', ')}`
    );
   } else {
    setAvailabilityWarning(null);
   }
  } catch {
   // Availability check is best-effort — don't block the UI if API is unreachable
   setUnavailableDates([]);
   setAvailabilityWarning(null);
  }
 }, [host?.id, checkInISO, checkOutISO]);

 useEffect(() => {
  loadAvailability();
 }, [loadAvailability]);

 // ── Auth guard ─────────────────────────────────────────────────────────────
 if (!host) return null;

 if (!authToken) {
  return (
   <View style={styles.authPrompt}>
    <Text style={styles.authPromptTitle}>Sign in to book</Text>
    <Text style={styles.authPromptText}>You need to be logged in to request a booking.</Text>
    <Pressable style={styles.primaryButton} onPress={() => dispatch({ type: 'LOGOUT' })}>
     <Text style={styles.primaryButtonText}>Go to login</Text>
    </Pressable>
   </View>
  );
 }

 const serviceFee = 10;
 const { total: stayTotal, breakdown } = calculateStayPrice(host, state.checkIn, state.checkOut);
 const grandTotal = stayTotal + serviceFee;
 const hasVariableRates = breakdown.some(d => d.label !== 'Standard');

 // ── 2. Submit booking via BookingService ────────────────────────────────────
 async function handleConfirmBooking() {
  setSubmitError(null);
  setSubmitting(true);
  try {
   const petIds = state.bookingData.petId ? [state.bookingData.petId] : [];
   const created = await createBooking(
    {
     check_in: checkInISO,
     check_out: checkOutISO,
     pet_ids: petIds,
     message: [
      state.bookingData.specialNeeds,
      state.bookingData.notes,
     ].filter(Boolean).join('\n') || null,
     host: host.id,
     total_price: grandTotal,
    },
    authToken
   );

   const attrs = created?.attributes ?? created ?? {};
   dispatch({
    type: 'BOOKING_CONFIRMED',
    confirmation: {
     id: created?.id ?? null,
     status: attrs.status ?? 'pending',
     total_price: attrs.total_price ?? grandTotal,
    },
   });
  } catch (err) {
   setSubmitError(err.message ?? 'Something went wrong. Please try again.');
  } finally {
   setSubmitting(false);
  }
 }

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
 {/* Availability warning */}
 {availabilityWarning && (
  <View style={styles.warningBox}>
   <Text style={styles.warningText}>{availabilityWarning}</Text>
  </View>
 )}
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
 <Text style={styles.summaryLine}>
  {state.nights} nights = ${stayTotal}{hasVariableRates ? ' (variable rates)' : ` × $${host.pricePerNight}/night`}
 </Text>
 {hasVariableRates && (
  <View style={styles.rateBreakdown}>
   {[...new Set(breakdown.map(d => d.label))].map(label => {
    const rate = breakdown.find(d => d.label === label).rate;
    const count = breakdown.filter(d => d.label === label).length;
    return (
     <Text key={label} style={styles.rateBreakdownLine}>
      {label}: {count} night{count > 1 ? 's' : ''} × ${rate}
     </Text>
    );
   })}
  </View>
 )}
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
 <Text style={styles.summaryLine}>
  {state.nights} nights = ${stayTotal}{hasVariableRates ? ' (variable rates)' : ` × $${host.pricePerNight}/night`}
 </Text>
 {hasVariableRates && (
  <View style={styles.rateBreakdown}>
   {[...new Set(breakdown.map(d => d.label))].map(label => {
    const rate = breakdown.find(d => d.label === label).rate;
    const count = breakdown.filter(d => d.label === label).length;
    return (
     <Text key={label} style={styles.rateBreakdownLine}>
      {label}: {count} night{count > 1 ? 's' : ''} × ${rate}
     </Text>
    );
   })}
  </View>
 )}
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
 <Pressable
  style={[styles.primaryButtonGrow, submitting && styles.buttonDisabled]}
  onPress={handleConfirmBooking}
  disabled={submitting}
 >
  {submitting ? (
   <ActivityIndicator color={colors.card} />
  ) : (
   <Text style={styles.primaryButtonText}>Confirm & Pay ${grandTotal}</Text>
  )}
 </Pressable>
 </View>
 {submitError && (
  <View style={styles.errorBox}>
   <Text style={styles.errorText}>{submitError}</Text>
  </View>
 )}
 </View>
 )}

 {state.bookingStep === 2 && (
 <View style={styles.card}>
 <Text style={styles.celebrate}> Booking Confirmed!</Text>
 <View style={styles.confirmCard}>
 <Text style={styles.confirmTitle}>{host.name}</Text>
 <Text style={styles.confirmLine}>{state.checkIn} – {state.checkOut} · {state.nights} nights</Text>
 <Text style={styles.confirmLine}>Pet: {state.bookingData.petName || 'Your pet'} ({state.bookingData.breed || 'Breed'})</Text>
 <Text style={styles.confirmLine}>Total paid: ${state.bookingConfirmation?.total_price ?? grandTotal}</Text>
 {state.bookingConfirmation?.id && (
  <Text style={styles.confirmLine}>Booking ID: #{state.bookingConfirmation.id} · Status: {state.bookingConfirmation.status}</Text>
 )}
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
 rateBreakdown: {
 marginTop: 4,
 paddingLeft: 8,
 },
 rateBreakdownLine: {
 fontSize: 12,
 color: '#666',
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
 warningBox: {
 backgroundColor: '#FEF3C7',
 borderRadius: radius.md,
 padding: spacing.sm,
 marginBottom: spacing.md,
 borderWidth: 1,
 borderColor: '#F59E0B',
 },
 warningText: {
 color: '#92400E',
 fontSize: 13,
 lineHeight: 18,
 },
 errorBox: {
 backgroundColor: '#FEE2E2',
 borderRadius: radius.md,
 padding: spacing.sm,
 marginTop: spacing.sm,
 borderWidth: 1,
 borderColor: '#F87171',
 },
 errorText: {
 color: '#991B1B',
 fontSize: 13,
 lineHeight: 18,
 },
 buttonDisabled: {
 opacity: 0.6,
 },
 authPrompt: {
 flex: 1,
 alignItems: 'center',
 justifyContent: 'center',
 padding: spacing.lg,
 backgroundColor: colors.bg,
 },
 authPromptTitle: {
 ...typography.title,
 color: colors.text,
 marginBottom: spacing.sm,
 },
 authPromptText: {
 color: colors.textMuted,
 textAlign: 'center',
 marginBottom: spacing.lg,
 lineHeight: 22,
 },
});
