import { Stack } from 'expo-router';

export default function RoutineLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false,
          title: 'Editar Rutina'
        }} 
      />
      <Stack.Screen 
        name="view" 
        options={{ 
          headerShown: false,
          title: 'Detalle de Rutina'
        }} 
      />
      <Stack.Screen 
        name="session-config/index" 
        options={{ 
          headerShown: false,
          headerTitle: '',
        }} 
      />
      <Stack.Screen 
        name="warmup/index" 
        options={{ 
          headerShown: false,
          headerTitle: '',
        }} 
      />
      <Stack.Screen 
        name="session/index" 
        options={{ 
          headerShown: false,
          headerTitle: '',
        }} 
      />
      <Stack.Screen 
        name="completed/index" 
        options={{ 
          headerShown: false,
          headerTitle: '',
        }} 
      />
    </Stack>
  );
}
