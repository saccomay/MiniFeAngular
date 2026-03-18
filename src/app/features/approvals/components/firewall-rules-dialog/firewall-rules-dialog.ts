import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-firewall-rules-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule, MatButtonToggleModule, MatInputModule, FormsModule],
  templateUrl: './firewall-rules-dialog.html',
  styleUrl: './firewall-rules-dialog.scss'
})
export class FirewallRulesDialogComponent {
  directionFilter: 'All' | 'In' | 'Out' = 'All';
  searchText: string = '';

  constructor(
    public dialogRef: MatDialogRef<FirewallRulesDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { rules: any[] }
  ) {}

  get filteredRules() {
    return this.data.rules.filter(rule => {
      const matchDirection = this.directionFilter === 'All' || rule.direction === this.directionFilter;
      const matchSearch = !this.searchText || 
                          rule.peer.toLowerCase().includes(this.searchText.toLowerCase()) || 
                          rule.port.toLowerCase().includes(this.searchText.toLowerCase()) ||
                          rule.protocol.toLowerCase().includes(this.searchText.toLowerCase());
      return matchDirection && matchSearch;
    });
  }
}
