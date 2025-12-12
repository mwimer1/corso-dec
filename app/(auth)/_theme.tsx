import RouteThemeProvider from '@/app/providers/route-theme-provider';

// Ensures auth theme tokens are applied at the <html> root level during client runtime
export default function RouteThemeAuth() {
  return <RouteThemeProvider theme="auth" />;
}


