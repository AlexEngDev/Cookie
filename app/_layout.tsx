import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

/**
 * Корневой layout приложения с навигацией expo-router.
 * Скрываем стандартный заголовок для игрового интерфейса.
 */
export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#1a1a2e' },
          animation: 'fade',
        }}
      />
    </>
  );
}
