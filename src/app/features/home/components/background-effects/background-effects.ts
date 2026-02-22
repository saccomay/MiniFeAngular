import { Component, OnDestroy, OnInit, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-background-effects',
  standalone: true,
  imports: [],
  templateUrl: './background-effects.html',
  styleUrl: './background-effects.scss',
})
export class BackgroundEffectsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private platformId = inject(PLATFORM_ID);

  prefersReducedMotion = signal<boolean>(false);

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkReducedMotion();
    }
  }

  private checkReducedMotion() {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.prefersReducedMotion.set(mediaQuery.matches);

    fromEvent<MediaQueryListEvent>(mediaQuery, 'change')
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        this.prefersReducedMotion.set(event.matches);
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
