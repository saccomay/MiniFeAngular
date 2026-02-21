import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface TabOption {
  value: string;
  label: string;
  count?: number;
  color?: string;
}

@Component({
  selector: 'app-table-toolbar',
  standalone: true,
  imports: [CommonModule, MatCheckboxModule, MatIconModule, MatButtonModule],
  styleUrls: ['./table-toolbar.component.scss'],
  template: `
    <div class="toolbar-container">
      <div class="left-section">
        <!-- Tabs -->
        @if (tabs.length > 0) {
          <div class="tabs">
            <button
              *ngFor="let tab of tabs"
              class="tabButton"
              [class.active]="activeTab === tab.value"
              (click)="onTabClick(tab.value)"
            >
              {{ tab.label }}
              @if (tab.count !== undefined) {
                <span class="tab-badge" [ngStyle]="getBadgeStyle(tab)">
                  {{ tab.count }}
                </span>
              }
            </button>
          </div>
        }

        <!-- Show Only Me Checkbox -->
        @if (showOnlyMeToggle) {
          <mat-checkbox 
            color="primary" 
            [checked]="onlyMeActive"
            (change)="onOnlyMeChange($event.checked)"
            class="only-me-checkbox"
          >
            Show Only Me
          </mat-checkbox>
        }

        <!-- Clear Filters Button -->
        @if (activeFilterCount > 0) {
          <button mat-button color="warn" class="clear-filters-btn" (click)="onClearFilters()">
            <mat-icon>filter_alt_off</mat-icon>
            Clear filters ({{ activeFilterCount }})
          </button>
        }
      </div>

      <div class="right-section">
        <!-- Action Buttons injected from outside -->
        <ng-content select="[toolbar-actions]"></ng-content>

        <!-- Search Input -->
        <div class="inputWrapper">
          <mat-icon class="searchIcon">search</mat-icon>
          <input
            type="text"
            placeholder="Search..."
            [value]="searchText"
            (input)="onSearchInput($event)"
          />
        </div>
      </div>
    </div>
  `
})
export class TableToolbarComponent {
  @Input() tabs: TabOption[] = [];
  @Input() activeTab: string = '';
  @Input() showOnlyMeToggle: boolean = true;
  @Input() onlyMeActive: boolean = false;
  @Input() searchText: string = '';
  @Input() activeFilterCount: number = 0;

  @Output() tabChange = new EventEmitter<string>();
  @Output() onlyMeChange = new EventEmitter<boolean>();
  @Output() searchChange = new EventEmitter<string>();
  @Output() clearFilters = new EventEmitter<void>();

  onTabClick(value: string) {
    this.activeTab = value;
    this.tabChange.emit(value);
  }

  onOnlyMeChange(checked: boolean) {
    this.onlyMeActive = checked;
    this.onlyMeChange.emit(checked);
  }

  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchText = target.value;
    this.searchChange.emit(this.searchText);
  }

  onClearFilters() {
    this.clearFilters.emit();
  }

  getBadgeStyle(tab: TabOption): any {
    if (!tab.color) return {};

    // Create a style object with the custom color mixed for background
    // We use a CSS variable to make it easy to use color-mix in SCSS if needed, 
    // but here we can just pass the raw color as background and text.
    // For a modern pill style, we can use the color for text and a faded version for background.
    return {
      'color': tab.color,
      'background-color': `color-mix(in srgb, ${tab.color} 16%, transparent)`
    };
  }
}
