import React, { memo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../../src/styles/tokens';

type Props = {
  onBack: () => void;
  saving: boolean;
  loading: boolean;
  hasUnsaved: boolean;
  onSave: () => void;
};

function HeaderBarCmp({ onBack, saving, loading, hasUnsaved, onSave }: Props) {
  return (
    <View style={styles.topHeader}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Ionicons name="chevron-back" size={20} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Editar plan</Text>

      <TouchableOpacity
        style={[
          styles.savePill,
          hasUnsaved && { backgroundColor: '#ffc107' },
          (saving || loading) && { opacity: 0.8 },
        ]}
        onPress={onSave}
        disabled={saving || loading}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          {saving || loading ? (
            <ActivityIndicator size="small" color="#0A0A0A" />
          ) : (
            <Ionicons name={hasUnsaved ? 'alert' : 'checkmark'} size={16} color="#0A0A0A" />
          )}
          <Text style={styles.savePillText}>
            {saving ? 'Guardando' : loading ? 'Cargando…' : hasUnsaved ? 'Guardar cambios' : 'Guardar'}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export const HeaderBar = memo(HeaderBarCmp);

const styles = StyleSheet.create({
  topHeader: {
    backgroundColor: COLORS.black,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e1e1e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700', flex: 1 },
  savePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#A7F3D0',
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
  },
  savePillText: { color: '#0A0A0A', fontWeight: '700' },
});
