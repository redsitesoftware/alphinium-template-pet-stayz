import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { createPet } from '../services/PetService';
import { useStayz } from '../store/stayzStore';
import { colors, radius, shadows, spacing, typography } from '../theme';

const SPECIES_OPTIONS = ['Dog', 'Cat', 'Rabbit', 'Bird', 'Other'];

const EMPTY_FORM = {
  name: '',
  species: 'Dog',
  breed: '',
  age: '',
  weight: '',
  temperament: '',
  vaccinations: '',
  vet_name: '',
  vet_phone: '',
  special_care_notes: '',
};

function FormInput({ label, value, onChangeText, multiline, keyboardType }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={label}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        keyboardType={keyboardType ?? 'default'}
        style={[styles.input, multiline && styles.textArea]}
      />
    </View>
  );
}

function PetCard({ pet }) {
  return (
    <View style={styles.petCard}>
      <View style={styles.petCardRow}>
        <Text style={styles.petEmoji}>🐾</Text>
        <View style={styles.petCardBody}>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petMeta}>
            {pet.species}{pet.breed ? ` · ${pet.breed}` : ''}
            {pet.age ? ` · ${pet.age}yr` : ''}
            {pet.weight ? ` · ${pet.weight}kg` : ''}
          </Text>
          {pet.specialCareNotes ? (
            <Text style={styles.petNotes}>⚠️ {pet.specialCareNotes}</Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function PetsScreen() {
  const { state, dispatch } = useStayz();
  const [showForm, setShowForm] = useState(state.pets.length === 0);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    if (!form.name.trim() || !form.species.trim()) {
      setError('Pet name and species are required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const petPayload = {
        name: form.name.trim(),
        species: form.species.trim(),
        breed: form.breed.trim() || undefined,
        age: form.age ? parseFloat(form.age) : undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        temperament: form.temperament.trim() || undefined,
        vaccinations: form.vaccinations.trim() || undefined,
        vet_name: form.vet_name.trim() || undefined,
        vet_phone: form.vet_phone.trim() || undefined,
        special_care_notes: form.special_care_notes.trim() || undefined,
      };

      let newPet;
      if (state.authToken) {
        const apiResult = await createPet(petPayload, state.authToken);
        newPet = {
          id: apiResult?.id ? `api-${apiResult.id}` : `local-${Date.now()}`,
          name: form.name.trim(),
          species: form.species.trim(),
          breed: form.breed.trim(),
          age: form.age ? parseFloat(form.age) : null,
          weight: form.weight ? parseFloat(form.weight) : null,
          temperament: form.temperament.trim(),
          vaccinations: form.vaccinations.trim(),
          vetName: form.vet_name.trim(),
          vetPhone: form.vet_phone.trim(),
          specialCareNotes: form.special_care_notes.trim(),
          photos: [],
        };
      } else {
        // Guest mode — store locally only
        newPet = {
          id: `local-${Date.now()}`,
          name: form.name.trim(),
          species: form.species.trim(),
          breed: form.breed.trim(),
          age: form.age ? parseFloat(form.age) : null,
          weight: form.weight ? parseFloat(form.weight) : null,
          temperament: form.temperament.trim(),
          vaccinations: form.vaccinations.trim(),
          vetName: form.vet_name.trim(),
          vetPhone: form.vet_phone.trim(),
          specialCareNotes: form.special_care_notes.trim(),
          photos: [],
        };
      }

      dispatch({ type: 'ADD_PET', pet: newPet });
      setForm(EMPTY_FORM);
      setShowForm(false);
    } catch {
      setError('Could not save pet. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={() => dispatch({ type: 'SET_PHASE', phase: 'home' })}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <Text style={styles.pageTitle}>🐾 My Pets</Text>

      {/* Saved pets list */}
      {state.petsLoading && (
        <ActivityIndicator color={colors.primary} style={styles.loader} />
      )}

      {!state.petsLoading && state.pets.length === 0 && !showForm && (
        <Text style={styles.empty}>No pets saved yet. Add your first pet below!</Text>
      )}

      {state.pets.map((pet) => (
        <PetCard key={pet.id} pet={pet} />
      ))}

      {/* Add pet toggle */}
      {!showForm && (
        <Pressable style={styles.addButton} onPress={() => setShowForm(true)}>
          <Text style={styles.addButtonText}>+ Add a pet</Text>
        </Pressable>
      )}

      {/* Add pet form */}
      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add a pet</Text>

          <FormInput label="Pet name *" value={form.name} onChangeText={(v) => setField('name', v)} />

          {/* Species picker */}
          <Text style={styles.inputLabel}>Species *</Text>
          <View style={styles.speciesRow}>
            {SPECIES_OPTIONS.map((s) => (
              <Pressable
                key={s}
                style={[styles.speciesPill, form.species === s && styles.speciesPillActive]}
                onPress={() => setField('species', s)}
              >
                <Text style={[styles.speciesPillText, form.species === s && styles.speciesPillTextActive]}>
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>

          <FormInput label="Breed" value={form.breed} onChangeText={(v) => setField('breed', v)} />
          <FormInput label="Age (years)" value={form.age} onChangeText={(v) => setField('age', v)} keyboardType="decimal-pad" />
          <FormInput label="Weight (kg)" value={form.weight} onChangeText={(v) => setField('weight', v)} keyboardType="decimal-pad" />
          <FormInput label="Temperament" value={form.temperament} onChangeText={(v) => setField('temperament', v)} multiline />
          <FormInput label="Vaccinations" value={form.vaccinations} onChangeText={(v) => setField('vaccinations', v)} multiline />
          <FormInput label="Vet name" value={form.vet_name} onChangeText={(v) => setField('vet_name', v)} />
          <FormInput label="Vet phone" value={form.vet_phone} onChangeText={(v) => setField('vet_phone', v)} keyboardType="phone-pad" />
          <FormInput
            label="Special care notes (medications, allergies…)"
            value={form.special_care_notes}
            onChangeText={(v) => setField('special_care_notes', v)}
            multiline
          />

          {/* Photos placeholder — requires expo-image-picker when added as dependency */}
          <View style={styles.photosPlaceholder}>
            <Text style={styles.photosPlaceholderText}>📷 Photo upload available once expo-image-picker is installed</Text>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.formActions}>
            <Pressable style={styles.cancelButton} onPress={() => { setShowForm(false); setError(''); }}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.saveButton} onPress={handleSubmit} disabled={saving}>
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveButtonText}>Save pet</Text>
              }
            </Pressable>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: spacing.xl * 2 },
  back: { color: colors.primary, fontSize: 15, fontWeight: '600', marginBottom: spacing.md },
  pageTitle: { ...typography.title, color: colors.text, marginBottom: spacing.lg },
  loader: { marginVertical: spacing.lg },
  empty: { color: colors.textMuted, fontSize: 15, marginBottom: spacing.lg, textAlign: 'center' },

  petCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.card,
  },
  petCardRow: { flexDirection: 'row', alignItems: 'flex-start' },
  petEmoji: { fontSize: 28, marginRight: spacing.sm },
  petCardBody: { flex: 1 },
  petName: { ...typography.heading, color: colors.text },
  petMeta: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  petNotes: { color: colors.primary, fontSize: 13, marginTop: 4 },

  addButton: {
    backgroundColor: colors.softOrange,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  addButtonText: { color: colors.primary, fontWeight: '700', fontSize: 16 },

  formCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    ...shadows.card,
  },
  formTitle: { ...typography.heading, color: colors.text, marginBottom: spacing.md },

  inputGroup: { marginBottom: spacing.sm },
  inputLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '600', marginBottom: 4 },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    fontSize: 15,
    color: colors.text,
  },
  textArea: { minHeight: 72, textAlignVertical: 'top' },

  speciesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  speciesPill: {
    backgroundColor: colors.chip,
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  speciesPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  speciesPillText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  speciesPillTextActive: { color: '#fff' },

  photosPlaceholder: {
    backgroundColor: colors.chip,
    borderRadius: radius.sm,
    padding: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  photosPlaceholderText: { color: colors.textMuted, fontSize: 13 },

  errorText: { color: '#DC2626', fontSize: 13, marginBottom: spacing.sm },

  formActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.chip,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: { color: colors.textMuted, fontWeight: '700', fontSize: 15 },
  saveButton: {
    flex: 2,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.sm,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
