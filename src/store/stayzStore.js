import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getHosts, mapHost } from '../services/HostService';
import { getMyPets } from '../services/PetService';
import { sortByDistance } from '../utils/geo';

const HOSTS = [
 {
 id: 'h1', name: 'Sarah & Tom', emoji: '‍', suburb: 'Mosman',
 distance: 2.1, rating: 4.98, reviewCount: 156, hostingSince: '2022',
 pricePerNight: 55, priceDaycare: 35,
 type: ['Boarding', 'Daycare'],
 petTypes: ['Dogs'],
 maxDogs: 2, maxSize: 'Any size',
 badge: 'Superhost', badgeColor: '#EA580C',
 homeType: 'House with garden ',
 bio: 'We have a large fenced garden and have hosted 200+ dogs. Our golden retriever Max loves company!',
 amenities: [' Large fenced garden', '️ Dog sleeps on bed', ' Own bathroom/shower area', ' Daily park visits', ' Daily photo updates'],
 availableFrom: 'Tonight',
 saved: true,
 latitude: -33.8269, longitude: 151.2439,
 verified: true,
 reviews: [
 { name: 'Emma K.', stars: 5, text: 'Sarah and Tom are absolute legends. Bella had the time of her life!' },
 { name: 'James M.', stars: 5, text: 'Best boarding experience ever. Daily photos, updates, and a very happy dog.' },
 ],
 },
 {
 id: 'h2', name: 'Jessica Park', emoji: '‍', suburb: 'Newtown',
 distance: 0.8, rating: 4.95, reviewCount: 89, hostingSince: '2023',
 pricePerNight: 45, priceDaycare: 28,
 type: ['Boarding', 'Daycare', 'Drop-in'],
 petTypes: ['Dogs', 'Cats'],
 maxDogs: 1, maxSize: 'Up to 25kg',
 badge: 'Top Rated', badgeColor: '#F59E0B',
 homeType: 'Apartment with balcony ',
 bio: 'Vet nurse by day, passionate dog lover always. I treat every pet like my own.',
 amenities: [' Vet nurse background', ' Walks twice daily', ' Cats welcome', ' Morning & evening updates'],
 availableFrom: 'Today',
 saved: false,
 latitude: -33.8979, longitude: 151.1795,
 verified: false,
 reviews: [
 { name: 'Priya S.', stars: 5, text: 'Jessica is incredible. My cat actually seemed sad to come home!' },
 ],
 },
 {
 id: 'h3', name: 'Marcus & Lily', emoji: '‍', suburb: 'Manly',
 distance: 8.4, rating: 4.9, reviewCount: 201, hostingSince: '2021',
 pricePerNight: 65, priceDaycare: 40,
 type: ['Boarding', 'Daycare'],
 petTypes: ['Dogs'],
 maxDogs: 3, maxSize: 'Any size',
 badge: 'Beach Access', badgeColor: '#0EA5E9',
 homeType: 'House — beach 5 min walk ️',
 bio: 'Beach lifestyle for your pup! Daily beach runs, large backyard, and we work from home so dogs are never alone.',
 amenities: ['️ Beach walks daily', ' Large backyard', ' Work from home — never alone', ' 3 friendly resident dogs'],
 availableFrom: 'This weekend',
 saved: true,
 latitude: -33.7969, longitude: 151.285,
 verified: true,
 reviews: [
 { name: 'Tom A.', stars: 5, text: 'My dog went to the beach every day. I think he prefers Marcus to me now ' },
 ],
 },
 {
 id: 'h4', name: 'Priya Nair', emoji: '‍', suburb: 'Surry Hills',
 distance: 0.3, rating: 4.85, reviewCount: 67, hostingSince: '2024',
 pricePerNight: 40, priceDaycare: 25,
 type: ['Daycare', 'Drop-in'],
 petTypes: ['Dogs', 'Cats', 'Small animals'],
 maxDogs: 2, maxSize: 'Under 15kg',
 badge: 'New', badgeColor: '#10B981',
 homeType: 'Apartment ',
 bio: 'New to hosting but lifelong animal lover. Small pets and small dogs only — they get my full attention.',
 amenities: [' Small pets specialist', ' Hourly updates', ' Lots of play time'],
 availableFrom: 'Today',
 saved: false,
 latitude: -33.8867, longitude: 151.2094,
 verified: false,
 reviews: [],
 },
 {
 id: 'h5', name: 'The Cozy Kennel', emoji: '', suburb: 'Pymble',
 distance: 12.4, rating: 4.7, reviewCount: 445, hostingSince: '2019',
 pricePerNight: 48, priceDaycare: 32,
 type: ['Boarding', 'Daycare'],
 petTypes: ['Dogs'],
 maxDogs: 8, maxSize: 'Any size',
 badge: 'Professional', badgeColor: '#8B5CF6',
 homeType: 'Acreage property ',
 bio: 'Licensed pet boarding facility on 2 acres. Individual runs, play groups, webcam access for owners.',
 amenities: [' Webcam access', ' 2-acre property', ' Dog pool', ' Medication management', ' Vet on call'],
 availableFrom: 'Tonight',
 saved: false,
 latitude: -33.7635, longitude: 151.139,
 verified: true,
 reviews: [
 { name: 'Rachel T.', stars: 5, text: 'Best facility we have found. Webcam access means I never worry.' },
 ],
 },
 {
 id: 'h6', name: 'Alex & Sam', emoji: '‍‍', suburb: 'Balmain',
 distance: 3.7, rating: 4.92, reviewCount: 134, hostingSince: '2022',
 pricePerNight: 52, priceDaycare: 33,
 type: ['Boarding', 'Daycare'],
 petTypes: ['Dogs', 'Cats'],
 maxDogs: 2, maxSize: 'Any size',
 badge: null, badgeColor: null,
 homeType: 'House with yard ',
 bio: 'Two dog dads who love all animals. Our two labs are great with other dogs.',
 amenities: [' 2 friendly resident labs', ' Fully fenced yard', ' Bathed before pickup'],
 availableFrom: 'Tomorrow',
 saved: false,
 latitude: -33.862, longitude: 151.18,
 verified: false,
 reviews: [],
 },
 {
 id: 'h7', name: 'Nina Wu', emoji: '‍', suburb: 'Bondi',
 distance: 6.2, rating: 4.96, reviewCount: 118, hostingSince: '2021',
 pricePerNight: 68, priceDaycare: 42,
 type: ['Boarding', 'Daycare'],
 petTypes: ['Dogs'],
 maxDogs: 2, maxSize: 'Up to 35kg',
 badge: 'Ocean Walks', badgeColor: '#06B6D4',
 homeType: 'Townhouse near beach ',
 bio: 'Structured care, sunrise walks, enrichment games, and constant company from a work-from-home household.',
 amenities: [' Coastal walks', ' Enrichment games', ' Work from home', ' Live photo journal'],
 availableFrom: 'Tomorrow',
 saved: false,
 latitude: -33.8915, longitude: 151.2767,
 verified: false,
 reviews: [
 { name: 'Leah P.', stars: 5, text: 'Every update felt premium. Our lab came back calm and very loved.' },
 ],
 },
 {
 id: 'h8', name: 'Oliver Grant', emoji: '‍', suburb: 'Richmond',
 distance: 5.5, rating: 4.88, reviewCount: 76, hostingSince: '2023',
 pricePerNight: 50, priceDaycare: 31,
 type: ['Boarding', 'Drop-in'],
 petTypes: ['Dogs', 'Small animals'],
 maxDogs: 2, maxSize: 'Any size',
 badge: 'Garden Host', badgeColor: '#22C55E',
 homeType: 'Cottage with courtyard ',
 bio: 'Ideal for pets who love a relaxed rhythm, sunny nap spots, and lots of one-on-one attention.',
 amenities: [' Sunny courtyard', ' Rabbit-friendly routines', ' Pickup available', ' Daily updates'],
 availableFrom: 'Tonight',
 saved: false,
 latitude: -37.8148, longitude: 144.9963,
 verified: false,
 reviews: [
 { name: 'Mia J.', stars: 5, text: 'Oliver made our rescue dog feel safe immediately.' },
 ],
 },
 {
 id: 'h9', name: 'Coastal Paws Collective', emoji: '', suburb: 'Fremantle',
 distance: 4.9, rating: 4.93, reviewCount: 223, hostingSince: '2020',
 pricePerNight: 58, priceDaycare: 36,
 type: ['Boarding', 'Daycare', 'Drop-in'],
 petTypes: ['Dogs', 'Cats'],
 maxDogs: 4, maxSize: 'Any size',
 badge: 'Superhost', badgeColor: '#EA580C',
 homeType: 'Designer home + play yard ',
 bio: 'A boutique team of experienced carers with separate calm zones for cats and playful dogs.',
 amenities: [' Separate cat suite', ' Secure play yard', ' Video check-ins', ' Medication support'],
 availableFrom: 'Today',
 saved: false,
 latitude: -32.0569, longitude: 115.747,
 verified: false,
 reviews: [
 { name: 'Sophie R.', stars: 5, text: 'The perfect balance of professional and homey.' },
 { name: 'Dan H.', stars: 5, text: 'Their cat setup is better than most catteries.' },
 ],
 },
 {
 id: 'h10', name: 'Harper Family Stay', emoji: '‍‍', suburb: 'Paddington',
 distance: 1.4, rating: 4.87, reviewCount: 94, hostingSince: '2022',
 pricePerNight: 57, priceDaycare: 34,
 type: ['Boarding', 'Daycare'],
 petTypes: ['Dogs'],
 maxDogs: 2, maxSize: 'Up to 25kg',
 badge: 'Family Favourite', badgeColor: '#F97316',
 homeType: 'Terrace home ️',
 bio: 'Perfect for sociable dogs who love cuddles, school-run walks, and a true family environment.',
 amenities: [' Gentle kids used to dogs', ' Three walks daily', '️ Couch cuddles welcome', ' Bedtime photo updates'],
 availableFrom: 'This weekend',
 saved: false,
 latitude: -33.8848, longitude: 151.2268,
 verified: false,
 reviews: [
 { name: 'Chris W.', stars: 5, text: 'Our cavoodle adored staying with the Harper family.' },
 ],
 },
 {
 id: 'h11', name: 'Mila Pet Retreat', emoji: '', suburb: 'South Yarra',
 distance: 7.1, rating: 4.99, reviewCount: 162, hostingSince: '2020',
 pricePerNight: 72, priceDaycare: 45,
 type: ['Boarding', 'Daycare'],
 petTypes: ['Dogs', 'Cats'],
 maxDogs: 2, maxSize: 'Any size',
 badge: 'Luxury', badgeColor: '#D97706',
 homeType: 'Premium apartment + pet concierge ',
 bio: 'High-touch care for pets who love routine, premium treats, and lots of direct communication with owners.',
 amenities: ['️ Luxury bedding', ' Premium meal prep', ' Concierge-style updates', ' Grooming add-ons'],
 availableFrom: 'Tomorrow',
 saved: false,
 latitude: -37.8389, longitude: 144.9894,
 verified: false,
 reviews: [
 { name: 'Anita L.', stars: 5, text: 'This is honestly a boutique hotel for pets.' },
 ],
 },
 {
 id: 'h12', name: 'Benji & Co.', emoji: '', suburb: 'Fortitude Valley',
 distance: 9.3, rating: 4.84, reviewCount: 58, hostingSince: '2024',
 pricePerNight: 44, priceDaycare: 27,
 type: ['Daycare', 'Drop-in'],
 petTypes: ['Dogs', 'Cats', 'Small animals'],
 maxDogs: 3, maxSize: 'Up to 20kg',
 badge: 'Flexible', badgeColor: '#A855F7',
 homeType: 'Loft studio + rooftop run ',
 bio: 'Great for city pets needing reliable daytime care, social play, and easy pickup after work.',
 amenities: [' Rooftop exercise area', '⏰ Extended pickup hours', ' Small pet safe room', ' Midday updates'],
 availableFrom: 'Today',
 saved: false,
 latitude: -27.4579, longitude: 153.0326,
 verified: false,
 reviews: [
 { name: 'Kylie N.', stars: 5, text: 'Exactly what we needed for weekday daycare.' },
 ],
 },
];

const JWT_KEY = 'alphinium_auth_token';

const initialState = {
  phase: 'login',
  authToken: null,
  authUser: null,
  isGuest: false,
 selectedHost: null,
 hosts: HOSTS,
 hostsLoading: false,
 filters: { type: 'All', petType: 'All', priceMax: 'Any', sortBy: 'Distance', size: 'Any', savedOnly: false, verifiedOnly: false },
 searchText: '',
 checkIn: 'Fri 6 June',
 checkOut: 'Mon 9 June',
 nights: 3,
 petSummary: '1 dog · Medium',
 bookingData: { petId: null, petName: '', breed: '', age: '', size: 'Medium', specialNeeds: '', notes: '' },
 bookingStep: 0,
 pets: [],
 petsLoading: false,
 userLocation: null,
};

const StayzContext = createContext(null);

function matchesSize(filter, host) {
 if (filter === 'Any') return true;
 if (filter === 'Any size') return host.maxSize === 'Any size';
 if (filter === 'Large') return host.maxSize === 'Any size';
 if (filter === 'Medium') return host.maxSize === 'Any size' || host.maxSize.includes('25kg') || host.maxSize.includes('35kg') || host.maxSize.includes('20kg');
 if (filter === 'Small (<10kg)' || filter === 'Small') return true;
 return true;
}

function sortHosts(hosts, sortBy) {
 return [...hosts].sort((a, b) => {
 if (sortBy === 'Rating') return b.rating - a.rating;
 if (sortBy === 'Price ↑') return a.pricePerNight - b.pricePerNight;
 return a.distance - b.distance;
 });
}

function getFilteredHosts(state) {
 const query = state.searchText.trim().toLowerCase();

 const filtered = state.hosts.filter((host) => {
  if (state.filters.savedOnly && !host.saved) return false;
  if (state.filters.verifiedOnly && !host.verified) return false;
  if (state.filters.type !== 'All' && !host.type.includes(state.filters.type)) return false;
  if (state.filters.petType !== 'All' && !host.petTypes.includes(state.filters.petType)) return false;
  if (state.filters.priceMax !== 'Any' && host.pricePerNight > Number(state.filters.priceMax)) return false;
  if (!matchesSize(state.filters.size, host)) return false;
  if (!query) return true;
  return [host.name, host.suburb, host.homeType, host.badge || '', host.bio, host.type.join(' '), host.petTypes.join(' ')]
   .join(' ')
   .toLowerCase()
   .includes(query);
 });

 if (state.filters.sortBy === 'Distance' && state.userLocation) {
  return sortByDistance(filtered, state.userLocation.lat, state.userLocation.lng);
 }
 return sortHosts(filtered, state.filters.sortBy);
}

function reducer(state, action) {
 switch (action.type) {
 case 'COMPLETE_LOGIN':
  return { ...state, phase: 'home', authToken: action.guest ? null : action.token ?? null, authUser: action.guest ? null : action.user ?? null, isGuest: Boolean(action.guest), selectedHost: null, bookingStep: 0 };
  case 'SET_PHASE':
 return { ...state, phase: action.phase };
 case 'SELECT_HOST':
 return { ...state, selectedHost: action.host, phase: 'host' };
 case 'OPEN_BOOKING':
 return { ...state, selectedHost: action.host || state.selectedHost, phase: 'booking', bookingStep: 0 };
 case 'BACK_HOME':
 return { ...state, phase: 'home', selectedHost: null, filters: { ...state.filters, savedOnly: false } };
 case 'TOGGLE_SAVED':
 return {
 ...state,
 hosts: state.hosts.map((host) => (host.id === action.id ? { ...host, saved: !host.saved } : host)),
 selectedHost: state.selectedHost && state.selectedHost.id === action.id ? { ...state.selectedHost, saved: !state.selectedHost.saved } : state.selectedHost,
 };
 case 'UPDATE_FILTER':
 return { ...state, filters: { ...state.filters, [action.key]: action.value } };
 case 'SET_SEARCH_TEXT':
 return { ...state, searchText: action.value };
 case 'SET_DATES':
 return {
 ...state,
 checkIn: action.checkIn ?? state.checkIn,
 checkOut: action.checkOut ?? state.checkOut,
 nights: action.nights ?? state.nights,
 petSummary: action.petSummary ?? state.petSummary,
 phase: 'home',
 };
 case 'OPEN_SEARCH':
 return { ...state, phase: 'search' };
 case 'FILTER_SAVED':
 return { ...state, phase: 'home', filters: { ...state.filters, savedOnly: !state.filters.savedOnly } };
 case 'UPDATE_BOOKING_FIELD':
 return { ...state, bookingData: { ...state.bookingData, [action.key]: action.value } };
 case 'NEXT_BOOKING_STEP':
 return { ...state, bookingStep: Math.min(state.bookingStep + 1, 2) };
 case 'PREV_BOOKING_STEP':
 return { ...state, bookingStep: Math.max(state.bookingStep - 1, 0) };
 case 'SET_HOSTS':
 return { ...state, hosts: action.hosts.length > 0 ? action.hosts : HOSTS, hostsLoading: false };
 case 'SET_HOSTS_LOADING':
 return { ...state, hostsLoading: action.loading };
 case 'SET_PETS':
 return { ...state, pets: action.pets, petsLoading: false };
 case 'ADD_PET':
 return { ...state, pets: [...state.pets, action.pet] };
 case 'SET_PETS_LOADING':
 return { ...state, petsLoading: action.loading };
 case 'SET_USER_LOCATION':
 return { ...state, userLocation: action.location };
 case 'RESET_BOOKING':
 return { ...state, bookingStep: 0, bookingData: initialState.bookingData, phase: 'home', selectedHost: null };
 case 'LOGOUT':
 return { ...state, phase: 'login', authToken: null, authUser: null, isGuest: false, selectedHost: null, bookingStep: 0 };
 default:
 return state;
 }
}

export function StayzProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadHosts = useCallback(async () => {
    dispatch({ type: 'SET_HOSTS_LOADING', loading: true });
    try {
      const rawHosts = await getHosts();
      const mapped = rawHosts.map(mapHost);
      dispatch({ type: 'SET_HOSTS', hosts: mapped });
    } catch {
      // API unreachable — fallback to demo data (SET_HOSTS with empty array keeps HOSTS)
      dispatch({ type: 'SET_HOSTS', hosts: [] });
    }
  }, []);

  // Load hosts on mount
  useEffect(() => {
    loadHosts();
  }, [loadHosts]);

  // Reload hosts after successful login
  useEffect(() => {
    if (state.phase === 'home' && state.authToken) {
      loadHosts();
    }
  }, [state.phase, state.authToken, loadHosts]);

  const loadMyPets = useCallback(async (authToken) => {
    if (!authToken) return;
    dispatch({ type: 'SET_PETS_LOADING', loading: true });
    try {
      const rawPets = await getMyPets(authToken);
      const pets = rawPets.map((item) => {
        const a = item.attributes ?? item;
        return {
          id: item.id ? `api-${item.id}` : a.id,
          name: a.name ?? '',
          species: a.species ?? '',
          breed: a.breed ?? '',
          age: a.age ?? null,
          weight: a.weight ?? null,
          temperament: a.temperament ?? '',
          vaccinations: a.vaccinations ?? '',
          vetName: a.vet_name ?? a.vetName ?? '',
          vetPhone: a.vet_phone ?? a.vetPhone ?? '',
          specialCareNotes: a.special_care_notes ?? a.specialCareNotes ?? '',
          photos: a.photos?.data ?? a.photos ?? [],
        };
      });
      dispatch({ type: 'SET_PETS', pets });
    } catch {
      // API unreachable — silently keep empty pets array, no crash
      dispatch({ type: 'SET_PETS_LOADING', loading: false });
    }
  }, []);

  // Load pets whenever authToken is set (login / session restore)
  useEffect(() => {
    if (state.authToken) {
      loadMyPets(state.authToken);
    }
  }, [state.authToken, loadMyPets]);

  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(JWT_KEY);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  }, [dispatch]);

  const value = useMemo(() => {
  const filteredHosts = getFilteredHosts(state);
  const savedCount = state.hosts.filter((host) => host.saved).length;
  const featuredHosts = state.hosts.filter((host) => host.badge === 'Superhost');
  return { state, dispatch, logout, loadHosts, loadMyPets, filteredHosts, savedCount, featuredHosts };
  }, [loadHosts, loadMyPets, logout, state]);

  return <StayzContext.Provider value={value}>{children}</StayzContext.Provider>;
}

export function useStayz() {
 const context = useContext(StayzContext);
 if (!context) {
 throw new Error('useStayz must be used within StayzProvider');
 }
 return context;
}
