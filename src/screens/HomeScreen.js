import React, { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Location from 'expo-location';
import { getHostHomePhoto, getHostProfilePhoto, PET_STAYZ_IMAGES } from '../media';
import { haversineKm } from '../utils/geo';
import { useStayz } from '../store/stayzStore';
import { colors, radius, shadows, spacing, typography } from '../theme';

const TYPE_OPTIONS = ['All', 'Boarding', 'Daycare', 'Drop-in'];
const PET_OPTIONS = ['All', 'Dogs', 'Cats', 'Small animals'];
const SORT_OPTIONS = ['Distance', 'Rating', 'Price ↑'];
const SIZE_OPTIONS = ['Any', 'Small (<10kg)', 'Medium', 'Large', 'Any size'];

function FilterPill({ label, active, onPress }) {
 return (
 <Pressable style={[styles.pill, active && styles.pillActive]} onPress={onPress}>
 <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
 </Pressable>
 );
}

function HostCard({ host, nights, onView, onToggleSaved, userLocation }) {
 const displayDistance = (userLocation && host.latitude != null)
  ? haversineKm(userLocation.lat, userLocation.lng, host.latitude, host.longitude).toFixed(1)
  : host.distance?.toFixed(1) ?? '?';
 return (
 <View style={styles.card}>
 <Image source={{ uri: getHostHomePhoto(host) }} style={styles.homePhoto} />
 <View style={styles.cardTop}>
 <Image source={{ uri: getHostProfilePhoto(host) }} style={styles.profilePhoto} />
 <Pressable style={styles.saveButton} onPress={() => onToggleSaved(host.id)}>
 <Text style={[styles.saveIcon, host.saved && styles.saveIconActive]}>{host.saved ? '️' : ''}</Text>
 </Pressable>
 </View>

 <View style={styles.hostHeaderRow}>
 {host.badge ? <Text style={[styles.badge, { backgroundColor: host.badgeColor }]}>{host.badge}</Text> : <View />}
 </View>

 <Text style={styles.hostName}>{host.name}</Text>
 <Text style={styles.meta}> {host.suburb} · {displayDistance}km</Text>
 <Text style={styles.homeType}>{host.homeType}</Text>

 <View style={styles.inlineWrap}>
 {host.type.map((item) => (
 <Text key={item} style={styles.tag}>{item}</Text>
 ))}
 </View>

 <Text style={styles.meta}>Pets: {host.petTypes.map((pet) => (pet === 'Dogs' ? '' : pet === 'Cats' ? '' : '')).join(' ')}</Text>
 <Text style={styles.meta}> {host.rating} · ({host.reviewCount} reviews) · Hosting since {host.hostingSince}</Text>
 <Text style={[styles.meta, styles.available]}> Available: {host.availableFrom}</Text>
 <Text style={styles.meta}>Capacity: {host.maxDogs} dogs · {host.maxSize}</Text>
 <Text style={styles.price}>${host.pricePerNight}/night · ${host.priceDaycare}/daycare</Text>
 <Text style={styles.total}>{nights} nights: ${host.pricePerNight * nights} total</Text>

 <Pressable style={styles.ctaButton} onPress={onView}>
 <Text style={styles.ctaText}>View & Book</Text>
 </Pressable>
 </View>
 );
}

function SuperhostCard({ host, onPress }) {
 return (
 <Pressable style={styles.featuredCard} onPress={onPress}>
 <Image source={{ uri: getHostHomePhoto(host) }} style={styles.featuredImage} />
 <Image source={{ uri: getHostProfilePhoto(host) }} style={styles.featuredAvatar} />
 <Text style={styles.featuredName}>{host.name}</Text>
 <Text style={styles.featuredMeta}>{host.suburb} · {host.rating}</Text>
 <Text style={styles.featuredPrice}>From ${host.pricePerNight}/night</Text>
 </Pressable>
 );
}

function AlphiniumCallout({ title, body }) {
 return (
 <View style={styles.calloutCard}>
 <Text style={styles.calloutTitle}>{title}</Text>
 <Text style={styles.calloutBody}>{body}</Text>
 </View>
 );
}

export default function HomeScreen() {
 const { state, dispatch, filteredHosts, savedCount, featuredHosts } = useStayz();
 const [localCheckIn, setLocalCheckIn] = useState(state.checkIn);
 const [localCheckOut, setLocalCheckOut] = useState(state.checkOut);
 const [localNights, setLocalNights] = useState(String(state.nights));
 const [petSummary, setPetSummary] = useState(state.petSummary);
 const isSearchOpen = state.phase === 'search';
 const nearMeActive = state.filters.sortBy === 'Distance' && state.userLocation != null;

 async function requestNearMe() {
  if (nearMeActive) {
   dispatch({ type: 'SET_USER_LOCATION', location: null });
   return;
  }
  try {
   const { status } = await Location.requestForegroundPermissionsAsync();
   if (status !== 'granted') {
    Alert.alert('Location Unavailable', 'Enable location permission to sort hosts by distance from you.');
    return;
   }
   const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
   dispatch({ type: 'SET_USER_LOCATION', location: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
   dispatch({ type: 'UPDATE_FILTER', key: 'sortBy', value: 'Distance' });
  } catch {
   Alert.alert('Location Unavailable', 'Could not retrieve your location. Please try again.');
  }
 }

 const resultsLabel = useMemo(() => `${filteredHosts.length} hosts available · Fri 6 – Mon 9 June`, [filteredHosts.length]);

 return (
 <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
 <View style={styles.headerCard}>
 <Image source={{ uri: PET_STAYZ_IMAGES.hero }} style={styles.heroImage} />
 <View style={styles.titleRow}>
 <View>
 <Text style={styles.logo}> Pet Stayz</Text>
 <Text style={styles.subtitle}>Where pets love to stay</Text>
 </View>
 <View style={styles.headerActions}>
  <Pressable style={styles.petsButton} onPress={() => dispatch({ type: 'SET_PHASE', phase: 'pets' })}>
  <Text style={styles.petsButtonText}>🐾 My Pets</Text>
  </Pressable>
  <Pressable style={styles.savedBadge} onPress={() => dispatch({ type: 'FILTER_SAVED' })}>
 <Text style={styles.savedBadgeText}>️ {savedCount}</Text>
 </Pressable>
 </View>
 </View>

 <Pressable
 style={styles.searchBar}
 onPress={() => dispatch(isSearchOpen ? { type: 'SET_PHASE', phase: 'home' } : { type: 'OPEN_SEARCH' })}
 >
 <Text style={styles.searchPrimary}> Check-in: {state.checkIn} → Check-out: {state.checkOut} ({state.nights} nights)</Text>
 <View style={styles.searchBottomRow}>
 <Text style={styles.searchSecondary}> {state.petSummary}</Text>
 <View style={styles.searchButton}><Text style={styles.searchButtonText}>Search</Text></View>
 </View>
 </Pressable>

 {isSearchOpen && (
 <View style={styles.searchPanel}>
 <Text style={styles.sectionTitle}>Trip setup</Text>
 <TextInput value={localCheckIn} onChangeText={setLocalCheckIn} placeholder="Check-in" placeholderTextColor={colors.textMuted} style={styles.input} />
 <TextInput value={localCheckOut} onChangeText={setLocalCheckOut} placeholder="Check-out" placeholderTextColor={colors.textMuted} style={styles.input} />
 <TextInput value={localNights} onChangeText={setLocalNights} placeholder="Nights" keyboardType="numeric" placeholderTextColor={colors.textMuted} style={styles.input} />
 <TextInput value={petSummary} onChangeText={setPetSummary} placeholder="Pet summary" placeholderTextColor={colors.textMuted} style={styles.input} />
 <TextInput value={state.searchText} onChangeText={(value) => dispatch({ type: 'SET_SEARCH_TEXT', value })} placeholder="Search suburb, host, beach, cats…" placeholderTextColor={colors.textMuted} style={styles.input} />
 <Pressable
 style={styles.applyButton}
 onPress={() => dispatch({ type: 'SET_DATES', checkIn: localCheckIn, checkOut: localCheckOut, nights: Number(localNights) || 1, petSummary })}
 >
 <Text style={styles.applyButtonText}>Apply search</Text>
 </Pressable>
 </View>
 )}
 </View>

 <View style={styles.sectionBlock}>
 <Text style={styles.filterLabel}>Stay type</Text>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
 {TYPE_OPTIONS.map((option) => (
 <FilterPill
 key={option}
 label={option === 'Boarding' ? ' Boarding' : option === 'Daycare' ? '️ Daycare' : option === 'Drop-in' ? ' Drop-in Visit' : option}
 active={state.filters.type === option}
 onPress={() => dispatch({ type: 'UPDATE_FILTER', key: 'type', value: option })}
 />
 ))}
 </ScrollView>

 <Text style={styles.filterLabel}>Pet</Text>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
 {PET_OPTIONS.map((option) => (
 <FilterPill
 key={option}
 label={option === 'Dogs' ? ' Dogs' : option === 'Cats' ? ' Cats' : option === 'Small animals' ? ' Small Animals' : option}
 active={state.filters.petType === option}
 onPress={() => dispatch({ type: 'UPDATE_FILTER', key: 'petType', value: option })}
 />
 ))}
 </ScrollView>

 <Text style={styles.filterLabel}>Sort</Text>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
 {SORT_OPTIONS.map((option) => (
 <FilterPill
 key={option}
 label={option}
 active={state.filters.sortBy === option}
 onPress={() => dispatch({ type: 'UPDATE_FILTER', key: 'sortBy', value: option })}
 />
 ))}
 <Pressable style={[styles.nearMePill, nearMeActive && styles.nearMePillActive]} onPress={requestNearMe}>
  <Text style={[styles.nearMePillText, nearMeActive && styles.nearMePillTextActive]}>
  {nearMeActive ? '📍Near Me ✓' : '📍Near Me'}
  </Text>
 </Pressable>
 </ScrollView>

 <Text style={styles.filterLabel}>Size</Text>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
 {SIZE_OPTIONS.map((option) => (
 <FilterPill
 key={option}
 label={option}
 active={state.filters.size === option}
 onPress={() => dispatch({ type: 'UPDATE_FILTER', key: 'size', value: option })}
 />
 ))}
 </ScrollView>
 </View>

 <View style={styles.resultsRow}>
 <Text style={styles.resultsText}>{resultsLabel}</Text>
 <Pressable style={styles.mapToggle}><Text style={styles.mapToggleText}>️ Map</Text></Pressable>
 </View>

 <View style={styles.featuredSection}>
 <View style={styles.sectionHeadingRow}>
 <Text style={styles.sectionTitle}> Superhosts near you</Text>
 <Pressable onPress={() => dispatch({ type: 'FILTER_SAVED' })}>
 <Text style={styles.savedLink}>️ {savedCount} saved</Text>
 </Pressable>
 </View>
 <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredRow}>
 {featuredHosts.map((host) => (
 <SuperhostCard key={host.id} host={host} onPress={() => dispatch({ type: 'SELECT_HOST', host })} />
 ))}
 </ScrollView>
 </View>

 <View style={styles.integrationsSection}>
 <Text style={styles.sectionTitle}>alphinium + ChatInstance stack</Text>
 <AlphiniumCallout title=" alphinium-payments" body="Collect deposits, capture full payment, automate host payouts, refunds, and damage cover." />
 <AlphiniumCallout title=" alphinium-booking" body="Availability calendar management for hosts with instant booking windows and date blocking." />
 <AlphiniumCallout title=" ChatInstance" body="Pip helps guests discover the right host, answer questions, and move into booking." />
 <AlphiniumCallout title="️ alphinium-maps" body="Map view for host discovery, suburb browse, and geo-aware search experiences." />
 </View>

 <View style={styles.listSection}>
 {filteredHosts.map((host) => (
 <HostCard
 key={host.id}
 host={host}
 nights={state.nights}
 onView={() => dispatch({ type: 'SELECT_HOST', host })}
 onToggleSaved={(id) => dispatch({ type: 'TOGGLE_SAVED', id })}
 userLocation={state.userLocation}
 />
 ))}
 </View>
 </ScrollView>
 );
}

const styles = StyleSheet.create({
 screen: {
 flex: 1,
 backgroundColor: colors.bg,
 },
 content: {
 padding: spacing.md,
 paddingTop: 56,
 paddingBottom: 120,
 },
 headerCard: {
 backgroundColor: colors.card,
 borderRadius: radius.lg,
 padding: spacing.md,
 ...shadows.card,
 },
 heroImage: {
 width: '100%',
 height: 220,
 borderRadius: radius.lg,
 marginBottom: spacing.md,
 },
 titleRow: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'flex-start',
 marginBottom: spacing.md,
 },
 logo: {
 ...typography.title,
 color: colors.primary,
 },
 subtitle: {
 marginTop: 4,
 color: colors.textMuted,
 fontSize: 15,
 },
 savedBadge: {
 backgroundColor: '#FFF1F2',
 paddingHorizontal: spacing.sm,
 paddingVertical: 10,
 borderRadius: radius.round,
 },
 savedBadgeText: {
 color: colors.accent,
 fontWeight: '800',
 },
 headerActions: {
 flexDirection: 'row',
 alignItems: 'center',
 gap: spacing.xs,
 },
 petsButton: {
 backgroundColor: colors.softOrange,
 paddingHorizontal: spacing.sm,
 paddingVertical: 8,
 borderRadius: radius.round,
 },
 petsButtonText: {
 color: colors.primary,
 fontWeight: '700',
 fontSize: 13,
 },
 searchBar: {
 backgroundColor: colors.bg,
 borderRadius: radius.lg,
 padding: spacing.md,
 borderWidth: 1,
 borderColor: colors.border,
 },
 searchPrimary: {
 color: colors.text,
 fontWeight: '700',
 lineHeight: 22,
 },
 searchBottomRow: {
 marginTop: spacing.sm,
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 },
 searchSecondary: {
 color: colors.textMuted,
 fontWeight: '600',
 },
 searchButton: {
 backgroundColor: colors.primary,
 paddingHorizontal: spacing.md,
 paddingVertical: 10,
 borderRadius: radius.round,
 },
 searchButtonText: {
 color: colors.card,
 fontWeight: '800',
 },
 searchPanel: {
 marginTop: spacing.md,
 gap: spacing.sm,
 },
 sectionBlock: {
 marginTop: spacing.lg,
 },
 filterLabel: {
 marginBottom: spacing.sm,
 color: colors.text,
 fontWeight: '700',
 },
 pillRow: {
 gap: spacing.sm,
 paddingBottom: spacing.sm,
 },
 pill: {
 backgroundColor: colors.chip,
 borderWidth: 1,
 borderColor: colors.border,
 paddingHorizontal: spacing.md,
 paddingVertical: 10,
 borderRadius: radius.round,
 },
 pillActive: {
 backgroundColor: colors.primary,
 borderColor: colors.primary,
 },
 pillText: {
 color: colors.text,
 fontWeight: '700',
 },
 pillTextActive: {
 color: colors.card,
 },
 nearMePill: {
 backgroundColor: colors.card,
 borderWidth: 1,
 borderColor: colors.primary,
 paddingHorizontal: spacing.md,
 paddingVertical: 10,
 borderRadius: radius.round,
 marginLeft: spacing.sm,
 },
 nearMePillActive: {
 backgroundColor: colors.primary,
 },
 nearMePillText: {
 color: colors.primary,
 fontWeight: '700',
 },
 nearMePillTextActive: {
 color: colors.card,
 },
 resultsRow: {
 marginTop: spacing.md,
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 },
 resultsText: {
 color: colors.text,
 fontWeight: '700',
 },
 mapToggle: {
 backgroundColor: colors.card,
 borderRadius: radius.round,
 paddingHorizontal: spacing.md,
 paddingVertical: 10,
 borderWidth: 1,
 borderColor: colors.border,
 },
 mapToggleText: {
 color: colors.text,
 fontWeight: '700',
 },
 featuredSection: {
 marginTop: spacing.lg,
 },
 sectionHeadingRow: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 marginBottom: spacing.sm,
 },
 sectionTitle: {
 ...typography.heading,
 color: colors.text,
 },
 savedLink: {
 color: colors.accent,
 fontWeight: '700',
 },
 featuredRow: {
 gap: spacing.sm,
 },
 featuredCard: {
 width: 200,
 backgroundColor: colors.card,
 borderRadius: radius.lg,
 padding: spacing.md,
 ...shadows.card,
 },
 featuredImage: {
 width: '100%',
 height: 110,
 borderRadius: radius.md,
 },
 featuredAvatar: {
 width: 52,
 height: 52,
 borderRadius: 26,
 marginTop: -26,
 marginLeft: 12,
 borderWidth: 3,
 borderColor: colors.card,
 },
 featuredName: {
 marginTop: spacing.sm,
 color: colors.text,
 fontWeight: '800',
 },
 featuredMeta: {
 marginTop: 4,
 color: colors.textMuted,
 },
 featuredPrice: {
 marginTop: spacing.sm,
 color: colors.primary,
 fontWeight: '700',
 },
 integrationsSection: {
 marginTop: spacing.lg,
 gap: spacing.sm,
 },
 calloutCard: {
 backgroundColor: colors.card,
 borderRadius: radius.md,
 padding: spacing.md,
 borderWidth: 1,
 borderColor: colors.border,
 },
 calloutTitle: {
 color: colors.text,
 fontWeight: '800',
 marginBottom: 4,
 },
 calloutBody: {
 color: colors.textMuted,
 lineHeight: 21,
 },
 listSection: {
 marginTop: spacing.lg,
 gap: spacing.md,
 },
 card: {
 backgroundColor: colors.card,
 borderRadius: radius.lg,
 padding: spacing.md,
 ...shadows.card,
 },
 homePhoto: {
 width: '100%',
 height: 190,
 borderRadius: radius.lg,
 marginBottom: spacing.md,
 },
 cardTop: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'flex-start',
 },
 profilePhoto: {
 width: 72,
 height: 72,
 borderRadius: 36,
 marginTop: -50,
 borderWidth: 4,
 borderColor: colors.card,
 },
 saveButton: {
 padding: spacing.xs,
 },
 saveIcon: {
 fontSize: 22,
 },
 saveIconActive: {
 transform: [{ scale: 1.05 }],
 },
 hostHeaderRow: {
 marginTop: spacing.sm,
 minHeight: 24,
 },
 badge: {
 alignSelf: 'flex-start',
 color: colors.card,
 fontWeight: '800',
 paddingHorizontal: spacing.sm,
 paddingVertical: 6,
 borderRadius: radius.round,
 overflow: 'hidden',
 },
 hostName: {
 marginTop: spacing.sm,
 color: colors.text,
 fontSize: 22,
 fontWeight: '800',
 },
 meta: {
 marginTop: 6,
 color: colors.textMuted,
 },
 homeType: {
 marginTop: 6,
 color: colors.text,
 fontWeight: '600',
 },
 inlineWrap: {
 marginTop: spacing.sm,
 flexDirection: 'row',
 flexWrap: 'wrap',
 gap: spacing.sm,
 },
 tag: {
 backgroundColor: colors.chip,
 borderRadius: radius.round,
 paddingHorizontal: spacing.sm,
 paddingVertical: 6,
 color: colors.text,
 fontWeight: '600',
 },
 available: {
 color: colors.green,
 fontWeight: '700',
 },
 price: {
 marginTop: spacing.md,
 color: colors.text,
 fontWeight: '800',
 fontSize: 16,
 },
 total: {
 marginTop: 4,
 color: colors.primary,
 fontWeight: '700',
 },
 ctaButton: {
 marginTop: spacing.md,
 backgroundColor: colors.primary,
 borderRadius: radius.md,
 paddingVertical: 14,
 alignItems: 'center',
 },
 ctaText: {
 color: colors.card,
 fontWeight: '800',
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
 applyButton: {
 backgroundColor: colors.primary,
 paddingVertical: 14,
 borderRadius: radius.md,
 alignItems: 'center',
 },
 applyButtonText: {
 color: colors.card,
 fontWeight: '800',
 },
});
