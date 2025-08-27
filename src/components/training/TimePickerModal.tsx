import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (seconds: number) => void;
  currentTime: number;
}

const TIME_OPTIONS = [
  { label: '30 seg', value: 30 },
  { label: '45 seg', value: 45 },
  { label: '1 min', value: 60 },
  { label: '1:15 min', value: 75 },
  { label: '1:30 min', value: 90 },
  { label: '1:45 min', value: 105 },
  { label: '2 min', value: 120 },
  { label: '2:30 min', value: 150 },
  { label: '3 min', value: 180 },
  { label: '3:30 min', value: 210 },
  { label: '4 min', value: 240 },
  { label: '5 min', value: 300 },
  { label: '6 min', value: 360 },
  { label: '7 min', value: 420 },
  { label: '8 min', value: 480 },
  { label: '9 min', value: 540 },
  { label: '10 min', value: 600 },
];

export default function TimePickerModal({
  visible,
  onClose,
  onSelectTime,
  currentTime,
}: TimePickerModalProps) {
  const handleSelectTime = (seconds: number) => {
    onSelectTime(seconds);
    onClose();
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    if (remainingSeconds === 0) {
      return `${minutes}m`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Seleccionar Tiempo</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Current Time Display */}
        <View style={styles.currentTimeContainer}>
          <Text style={styles.currentTimeLabel}>Tiempo actual:</Text>
          <Text style={styles.currentTimeValue}>{formatTime(currentTime)}</Text>
        </View>

        {/* Time Options */}
        <ScrollView style={styles.optionsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.optionsGrid}>
            {TIME_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.timeOption,
                  currentTime === option.value && styles.selectedTimeOption,
                ]}
                onPress={() => handleSelectTime(option.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.timeOptionText,
                    currentTime === option.value && styles.selectedTimeOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  currentTimeContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  currentTimeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  currentTimeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  timeOption: {
    width: '48%',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedTimeOption: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  timeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedTimeOptionText: {
    color: '#fff',
  },
});
