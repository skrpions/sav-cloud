export const ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
  },
  DASHBOARD: '/dashboard',
  ACTIVITIES: '/activities',
  COLLABORATORS: '/collaborators',
  HARVEST: '/harvest',
  PURCHASES: '/purchases',
  REPORTS: '/reports',
  SALES: '/sales',
  SETTINGS: '/settings',
  HOME: '/',
  PROFILE: '/profile',
} as const;

// Helper function to get auth routes
export const getAuthRoute = (type: 'login' | 'register' | 'forgot-password') => {
  return ROUTES.AUTH[type.toUpperCase() as keyof typeof ROUTES.AUTH];
};

// Helper function to check if current route is auth route
export const isAuthRoute = (route: string): boolean => {
  return Object.values(ROUTES.AUTH).includes(route as any);
}; 