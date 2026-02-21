import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { of, delay, tap, Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface GitHubUser {
    login: string;
    name: string;
    email: string;
    avatar_url: string;
}

export interface AppUser {
    username: string;
    name: string;
    email: string;
    avatarUrl: string;
    provider: 'github' | 'email';
}

// Mock GitHub user returned in dev mode (no real backend needed)
const MOCK_GITHUB_USER: AppUser = {
    username: 'octocat',
    name: 'The Octocat',
    email: 'octocat@github.com',
    avatarUrl: 'https://avatars.githubusercontent.com/u/583231?v=4',
    provider: 'github',
};

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private router = inject(Router);
    private http = inject(HttpClient);

    readonly currentUser = signal<AppUser | null>(null);

    constructor() {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            this.currentUser.set(JSON.parse(savedUser));
        }
    }

    // ─── Email / Password login (existing mock) ──────────────────────────────
    login(username: string, password: string) {
        return of(true).pipe(
            delay(500),
            tap(() => {
                const user: AppUser = {
                    username,
                    name: username,
                    email: username,
                    avatarUrl: '',
                    provider: 'email',
                };
                this._saveUser(user);
                this.router.navigate(['/']);
            })
        );
    }

    // ─── GitHub OAuth ─────────────────────────────────────────────────────────

    /**
     * Starts the GitHub OAuth flow.
     * - Mock mode: navigates to /auth/callback?code=mock_code directly (no real redirect)
     * - Real mode: redirects browser to GitHub authorize URL
     */
    initiateGitHubLogin(): void {
        if (environment.useMockGitHub) {
            // Simulate the OAuth callback locally
            this.router.navigate(['/auth/callback'], { queryParams: { code: 'mock_code' } });
            return;
        }

        const state = crypto.randomUUID(); // CSRF protection
        sessionStorage.setItem('oauth_state', state);

        const params = new URLSearchParams({
            client_id: environment.githubClientId,
            redirect_uri: environment.callbackUrl,
            scope: 'user:email read:user',
            state,
        });
        window.location.href = `${environment.githubOAuthUrl}?${params.toString()}`;
    }

    /**
     * Handles the callback: exchanges code for a session token.
     * - Mock mode: returns a fake user after a short delay
     * - Real mode: calls the backend POST /api/auth/github
     */
    loginWithGitHub(code: string): Observable<AppUser> {
        if (environment.useMockGitHub) {
            return of(MOCK_GITHUB_USER).pipe(
                delay(800), // Simulate network latency
                tap(user => {
                    this._saveUser(user);
                    // Don't navigate here — CallbackComponent handles it
                })
            );
        }

        return this.http
            .post<{ token: string; user: AppUser }>(`${environment.apiUrl}/auth/github`, { code })
            .pipe(
                tap(res => {
                    localStorage.setItem('token', res.token);
                    this._saveUser(res.user);
                }),
                map(res => res.user)
            );
    }

    // ─── Common ───────────────────────────────────────────────────────────────
    logout() {
        this.currentUser.set(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        this.router.navigate(['/login']);
    }

    isAuthenticated() {
        return !!this.currentUser();
    }

    private _saveUser(user: AppUser) {
        this.currentUser.set(user);
        localStorage.setItem('user', JSON.stringify(user));
    }
}
