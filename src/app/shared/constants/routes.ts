export const ROUTES = {
  // Authentication routes
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
  },
  
  // Dashboard and main application routes
  DASHBOARD: '/dashboard',
  
  // Main modules
  ACTIVITIES: '/activities',
  COLLABORATORS: '/collaborators',
  HARVEST: '/harvest',
  PURCHASES: '/purchases',
  REPORTS: '/reports',
  SALES: '/sales',
  SETTINGS: '/settings',
  
  // Common routes
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