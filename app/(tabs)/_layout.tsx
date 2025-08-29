import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2C6ECB',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#000000' : '#FFFFFF',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          height: 70,
          paddingBottom: 5,
        },
        headerStyle: {
          backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
        },
        headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
        <Tabs.Screen
            name="newsletter"
            options={{
            title: 'Newsletter',
            tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="article" size={size} color={color} />
            ),
            headerShown: false,
            }}
        />
        <Tabs.Screen
            name="nutricion"
            options={{
                title: 'Nutrición',
                tabBarIcon: ({ color, size }) => (
                <Ionicons name="nutrition" size={size} color={color} />
                ),
                headerShown: false,
            }}
        />
        <Tabs.Screen
            name="training"
            options={{
                title: 'Entrenamiento',
                tabBarIcon: ({ color, size }) => (
                <FontAwesome5 name="dumbbell" size={size} color={color} />
            ),
                headerShown: false,
            }}
        />
        <Tabs.Screen
            name="perfil"
            options={{
                title: 'Perfil',
                tabBarIcon: ({ color, size }) => (
                <Ionicons name="person" size={size} color={color} />
            ),
            headerShown: false,
            }}
        />
    </Tabs>
  );
}
