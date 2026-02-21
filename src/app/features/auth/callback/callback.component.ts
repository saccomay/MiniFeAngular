import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
    selector: 'app-callback',
    standalone: true,
    imports: [CommonModule, MatProgressSpinnerModule, MatIconModule],
    template: `
        <div class="callback-wrapper">
            @if (status() === 'loading') {
                <div class="state-block">
                    <mat-spinner diameter="48"></mat-spinner>
                    <p class="state-text">Signing you in with GitHub...</p>
                </div>
            }
            @if (status() === 'error') {
                <div class="state-block error">
                    <mat-icon class="error-icon">error_outline</mat-icon>
                    <p class="state-text">Authentication failed. Redirecting to login...</p>
                </div>
            }
        </div>
    `,
    styles: [`
        .callback-wrapper {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            width: 100%;
            background-color: var(--mat-app-background-color, #f9fafb);
        }
        .state-block {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;

            &.error { color: #FF4842; }
        }
        .state-text {
            font-size: 1rem;
            color: #637381;
            margin: 0;
        }
        .error-icon {
            font-size: 48px;
            width: 48px;
            height: 48px;
        }
    `]
})
export class CallbackComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private authService = inject(AuthService);

    status = signal<'loading' | 'error'>('loading');

    ngOnInit() {
        const code = this.route.snapshot.queryParamMap.get('code');

        if (!code) {
            this.status.set('error');
            setTimeout(() => this.router.navigate(['/login']), 2000);
            return;
        }

        this.authService.loginWithGitHub(code).subscribe({
            next: () => {
                this.router.navigate(['/']);
            },
            error: (_err: unknown) => {
                this.status.set('error');
                setTimeout(() => this.router.navigate(['/login']), 2000);
            }
        });
    }
}
