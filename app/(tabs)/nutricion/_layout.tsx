import { Stack } from 'expo-router';

export default function NutricionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="calendar/index" />
      <Stack.Screen name="calendar/edit" />
      <Stack.Screen name="saved/index" />
      <Stack.Screen name="saved/create-recipe" />
      <Stack.Screen name="saved/create-board" />
    </Stack>
  );
}
