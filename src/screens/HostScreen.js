import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getHostHomePhoto, getHostProfilePhoto } from '../media';
import { useStayz } from '../store/stayzStore';
import { colors, radius, shadows, spacing, typography } from '../theme';

export default function HostScreen() {
 const { state, dispatch } = useStayz();
 const host = state.selectedHost;

 if (!host) {
 return null;
 }

 return (
 <View style={styles.shell}>
 <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
 <Pressable onPress={() => dispatch({ type: 'BACK_HOME' })}>
 <Text style={styles.back}>← All Hosts</Text>
 </Pressable>

 <View style={styles.heroCard}>
 <View style={styles.heroBanner}>
 <Image source={{ uri: getHostHomePhoto(host) }} style={styles.heroImage} />
 <Image source={{ uri: getHostProfilePhoto(host) }} style={styles.heroAvatar} />
 </View>

 <View style={styles.heroBody}>
 <View style={styles.heroHeader}>
 <View style={{ flex: 1 }}>
 <Text style={styles.name}>{host.name}</Text>
 <Text style={styles.location}>{host.suburb} · {host.distance.toFixed(1)}km away</Text>
 </View>
 <Pressable onPress={() => dispatch({ type: 'TOGGLE_SAVED', id: host.id })}>
 <Text style={styles.saveText}>{host.saved ? '️ Saved' : ' Save'}</Text>
 </Pressable>
 </View>

 {host.badge ? <Text style={[styles.badge, { backgroundColor: host.badgeColor }]}> {host.badge}</Text> : null}
 <Text style={styles.homeType}>{host.homeType}</Text>
 <Text style={styles.bio}>{host.bio}</Text>

 <Text style={styles.sectionTitle}>Amenities</Text>
 {host.amenities.map((amenity) => (
 <Text key={amenity} style={styles.listItem}> {amenity}</Text>
 ))}

 <Text style={styles.sectionTitle}>Capacity</Text>
 <Text style={styles.bodyText}>Up to {host.maxDogs} dogs · {host.maxSize}</Text>

 <Text style={styles.sectionTitle}>Pricing</Text>
 <Text style={styles.bodyText}>${host.pricePerNight}/night · ${host.priceDaycare}/daycare day</Text>
 <Text style={styles.total}>{state.nights} nights ({state.checkIn} – {state.checkOut}): ${host.pricePerNight * state.nights}</Text>

 <Text style={styles.sectionTitle}>Reviews</Text>
 {host.reviews.length ? host.reviews.slice(0, 3).map((review) => (
 <View key={review.name} style={styles.reviewCard}>
 <Text style={styles.reviewStars}>{''.repeat(review.stars)}</Text>
 <Text style={styles.reviewName}>{review.name}</Text>
 <Text style={styles.reviewText}>{review.text}</Text>
 </View>
 )) : <Text style={styles.bodyText}>New listing — first reviews coming soon.</Text>}
 </View>
 </View>
 </ScrollView>

 <View style={styles.footerBar}>
 <View>
 <Text style={styles.footerPrice}>${host.pricePerNight * state.nights}</Text>
 <Text style={styles.footerMeta}>{state.nights} nights · {state.checkIn} – {state.checkOut}</Text>
 </View>
 <Pressable style={styles.bookButton} onPress={() => dispatch({ type: 'OPEN_BOOKING', host })}>
 <Text style={styles.bookButtonText}>Book Now</Text>
 </Pressable>
 </View>
 </View>
 );
}

const styles = StyleSheet.create({
 shell: {
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
 ...shadows.card,
 },
 heroBanner: {
 minHeight: 220,
 justifyContent: 'flex-end',
 },
 heroImage: {
 width: '100%',
 height: 240,
 },
 heroAvatar: {
 position: 'absolute',
 left: spacing.md,
 bottom: -32,
 width: 72,
 height: 72,
 borderRadius: 36,
 borderWidth: 4,
 borderColor: colors.card,
 },
 heroBody: {
 padding: spacing.md,
 paddingTop: spacing.xl,
 },
 heroHeader: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'flex-start',
 gap: spacing.md,
 },
 name: {
 ...typography.title,
 color: colors.text,
 },
 location: {
 marginTop: 4,
 color: colors.textMuted,
 },
 saveText: {
 color: colors.accent,
 fontWeight: '800',
 },
 badge: {
 alignSelf: 'flex-start',
 color: colors.card,
 paddingHorizontal: spacing.sm,
 paddingVertical: 8,
 borderRadius: radius.round,
 overflow: 'hidden',
 fontWeight: '800',
 marginTop: spacing.md,
 },
 homeType: {
 marginTop: spacing.md,
 color: colors.text,
 fontWeight: '700',
 fontSize: 16,
 },
 bio: {
 marginTop: spacing.sm,
 color: colors.textMuted,
 lineHeight: 22,
 },
 sectionTitle: {
 marginTop: spacing.lg,
 marginBottom: spacing.sm,
 color: colors.text,
 fontWeight: '800',
 fontSize: 18,
 },
 listItem: {
 color: colors.text,
 marginBottom: spacing.sm,
 },
 bodyText: {
 color: colors.textMuted,
 lineHeight: 21,
 },
 total: {
 marginTop: spacing.sm,
 color: colors.primary,
 fontWeight: '800',
 },
 reviewCard: {
 backgroundColor: colors.bg,
 borderRadius: radius.md,
 padding: spacing.md,
 marginBottom: spacing.sm,
 borderWidth: 1,
 borderColor: colors.border,
 },
 reviewStars: {
 color: colors.gold,
 marginBottom: 4,
 },
 reviewName: {
 color: colors.text,
 fontWeight: '700',
 marginBottom: 6,
 },
 reviewText: {
 color: colors.textMuted,
 lineHeight: 20,
 },
 footerBar: {
 position: 'absolute',
 left: 0,
 right: 0,
 bottom: 0,
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 paddingHorizontal: spacing.md,
 paddingVertical: spacing.md,
 backgroundColor: colors.card,
 borderTopWidth: 1,
 borderTopColor: colors.border,
 },
 footerPrice: {
 color: colors.text,
 fontWeight: '800',
 fontSize: 20,
 },
 footerMeta: {
 color: colors.textMuted,
 marginTop: 4,
 },
 bookButton: {
 backgroundColor: colors.primary,
 paddingHorizontal: spacing.lg,
 paddingVertical: 14,
 borderRadius: radius.md,
 },
 bookButtonText: {
 color: colors.card,
 fontWeight: '800',
 },
});
