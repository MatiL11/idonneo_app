import { Stack } from 'expo-router';

export default function TrainingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="calendar/index" />
      <Stack.Screen name="calendar/edit" />
      <Stack.Screen name="exercise/[id]" />
      <Stack.Screen name="history/index" />
      <Stack.Screen name="program/[id]" />
      <Stack.Screen name="routine/[id]" />
      <Stack.Screen name="saved" />
      <Stack.Screen name="search" />
    </Stack>
  );
}
