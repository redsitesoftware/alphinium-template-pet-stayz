export const HOST_PROFILE_PHOTOS = {
 h1: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
 h2: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
 h3: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
 h4: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80',
 h5: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80',
 h6: 'https://images.unsplash.com/photo-1506795660187-77922d0b1b3c?auto=format&fit=crop&w=900&q=80',
 h7: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=900&q=80',
 h8: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f?auto=format&fit=crop&w=900&q=80',
 h9: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
 h10: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=900&q=80',
 h11: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=900&q=80',
 h12: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&w=900&q=80',
};

export const HOST_HOME_PHOTOS = {
 h1: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80',
 h2: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80',
 h3: 'https://images.unsplash.com/photo-1502784444185-1d4517dfb1fb?auto=format&fit=crop&w=1400&q=80',
 h4: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80',
 h5: 'https://images.unsplash.com/photo-1505692952047-1a78307da8f2?auto=format&fit=crop&w=1400&q=80',
 h6: 'https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=1400&q=80',
 h7: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80',
 h8: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&w=1400&q=80',
 h9: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1400&q=80',
 h10: 'https://images.unsplash.com/photo-1472224371017-08207f84aaae?auto=format&fit=crop&w=1400&q=80',
 h11: 'https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?auto=format&fit=crop&w=1400&q=80',
 h12: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80',
};

export const PET_STAYZ_IMAGES = {
 hero: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1400&q=80',
};

export function getHostProfilePhoto(host) {
  if (typeof host === 'object' && host?.profilePhotoUrl) return host.profilePhotoUrl;
  const id = typeof host === 'string' ? host : host?.id;
  return HOST_PROFILE_PHOTOS[id] || PET_STAYZ_IMAGES.hero;
}

export function getHostHomePhoto(host) {
  if (typeof host === 'object' && host?.homePhotoUrl) return host.homePhotoUrl;
  const id = typeof host === 'string' ? host : host?.id;
  return HOST_HOME_PHOTOS[id] || PET_STAYZ_IMAGES.hero;
}
