import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    private platformId = inject(PLATFORM_ID);

    // Signal for current theme
    readonly theme = signal<'light' | 'dark'>('light');

    constructor() {
        if (isPlatformBrowser(this.platformId)) {
            // Load saved theme
            const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
            if (savedTheme) {
                this.theme.set(savedTheme);
            } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                this.theme.set('dark');
            }

            // Apply theme effect
            effect(() => {
                const currentTheme = this.theme();
                localStorage.setItem('theme', currentTheme);

                if (currentTheme === 'dark') {
                    document.body.classList.add('dark-theme');
                    document.body.classList.remove('light-theme');
                } else {
                    document.body.classList.add('light-theme');
                    document.body.classList.remove('dark-theme');
                }
            });
        }
    }

    toggleTheme() {
        this.theme.update(current => current === 'light' ? 'dark' : 'light');
    }
}
