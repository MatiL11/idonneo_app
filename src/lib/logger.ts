/**
 * Utilidad para manejar logs de forma segura en producción
 */

// Determinar si la app está en modo producción
// En una aplicación Expo/React Native, podemos usar process.env.NODE_ENV
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Logger seguro que evita mostrar errores técnicos en producción
 */
export const logger = {
  /**
   * Log informativo - siempre se muestra
   */
  log: (message: string, ...data: any[]) => {
    console.log(message, ...data);
  },

  /**
   * Log de advertencia - siempre se muestra
   */
  warn: (message: string, ...data: any[]) => {
    console.warn(message, ...data);
  },

  /**
   * Log de error - en producción no muestra los detalles técnicos
   */
  error: (message: string, error?: any) => {
    if (isProduction) {
      // En producción, solo registramos el mensaje sin detalles técnicos
      console.error(message);
    } else {
      // En desarrollo, mostramos todos los detalles
      console.error(message, error);
    }
  }
};
