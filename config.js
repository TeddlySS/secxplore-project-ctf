// config.js
export const APP_CONFIG = {
  // Base URL
  BASE_URL: 'https://secxplore.space',
  
  // Pages
  PAGES: {
    HOME: '/home.html',
    LOGIN: '/login.html',
    REGISTER: '/register.html',
    CHALLENGE: '/challenge.html',
    PROFILE: '/profile.html',
    LEADERBOARD: '/leaderboard.html',
    ADMIN: '/admin.html',
  },
  
  // OAuth Redirect
  OAUTH_REDIRECT: 'https://secxplore.space/challenge.html',
  
  // API Settings
  API_TIMEOUT: 10000,
  MAX_RETRIES: 3,
};

// Helper functions
export function getFullUrl(path) {
  return APP_CONFIG.BASE_URL + path;
}

export function getOAuthRedirect() {
  return APP_CONFIG.OAUTH_REDIRECT;
}

export function getPageUrl(pageName) {
  return APP_CONFIG.BASE_URL + APP_CONFIG.PAGES[pageName];
}