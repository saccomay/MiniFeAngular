export const environment = {
    production: false,
    apiUrl: 'http://localhost:3000/api',
    useMock: true,

    // GitHub OAuth config
    // TODO: Replace with your real GitHub Enterprise Client ID when ready
    githubClientId: 'YOUR_GITHUB_CLIENT_ID',
    githubOAuthUrl: 'https://github.com/login/oauth/authorize', // Change to your GHE URL e.g. https://github.mycompany.com/login/oauth/authorize
    callbackUrl: 'http://localhost:4200/auth/callback',

    // Set to true to bypass the real GitHub OAuth redirect (for dev/testing)
    useMockGitHub: true,
};
