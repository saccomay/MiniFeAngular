
import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon'; // For fallback icons if needed, though likely using SVGs/images

@Component({
    selector: 'app-tool-card',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    templateUrl: './tool-card.component.html',
    styleUrl: './tool-card.component.scss'
})
export class ToolCardComponent {
    @Input({ required: true }) name!: string;
    @Input({ required: true }) description!: string;
    @Input() logoUrl: string = ''; // Optional specific URL, otherwise fallback
    @Input({ required: true }) websiteUrl!: string;
    @Input() githubUrl: string = '';
    @Input() theme: 'light' | 'dark' | 'auto' = 'light';
    @Input() iconName: string = ''; // Added to support existing icon usage if logoUrl is missing.

    // Helper to determine accurate theme class if needed in logic,
    // currently handling theme via SCSS and host context/mixins is preferred,
    // but explicitly setting a class on host helps scope styles.
    get themeClass() {
        return `theme-${this.theme}`;
    }

    onCardClick() {
        if (this.websiteUrl) {
            window.open(this.websiteUrl, '_blank');
        }
    }

    onGithubClick(event: MouseEvent) {
        event.stopPropagation();
        if (this.githubUrl) {
            window.open(this.githubUrl, '_blank');
        }
    }

    onKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter' || event.key === ' ') {
            this.onCardClick();
        }
    }
}
