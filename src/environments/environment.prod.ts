export const environment = {
    production: true,
    apiUrl: '/api',
    useMock: false,

    // GitHub OAuth config
    githubClientId: 'YOUR_GITHUB_CLIENT_ID',
    githubOAuthUrl: 'https://github.com/login/oauth/authorize', // Change to your GHE URL
    callbackUrl: 'https://your-production-domain.com/auth/callback',

    // Always false in production
    useMockGitHub: false,
};
