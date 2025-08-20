/**
 * Utilidades para la navegación
 */
import { router } from 'expo-router';

/**
 * Navega a una ruta reemplazando la entrada actual del historial
 * para evitar la acumulación de historial en la pila de navegación
 * @param path Ruta a la que navegar
 */
export const navigateAndReplace = (path: string) => {
  router.replace(path);
};

/**
 * Navega a la pantalla de login
 * siempre reemplazando la entrada actual del historial
 */
export const navigateToAuth = () => {
  router.replace('/auth/login');
};

/**
 * Navega a la pantalla de inicio (home)
 * siempre reemplazando la entrada actual del historial
 */
export const navigateToHome = () => {
  router.replace('/');
};

/**
 * Resetea el historial de navegación y navega a la ruta especificada
 * Esto es útil cuando quieres asegurarte de que no hay ninguna ruta
 * anterior en el historial (por ejemplo, después de un inicio de sesión)
 */
export const resetNavigation = (path: string) => {
  // Aunque este método es similar a replace, es más explícito sobre
  // su intención y podría expandirse en el futuro con más funcionalidad
  router.replace(path);
};
