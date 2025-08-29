import { Stack } from 'expo-router';

export default function NutricionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="calendar/index" />
    </Stack>
  );
}
