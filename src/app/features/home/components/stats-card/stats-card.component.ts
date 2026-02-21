import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-stats-card',
    standalone: true,
    imports: [CommonModule, MatCardModule, MatIconModule],
    templateUrl: './stats-card.component.html',
    styleUrl: './stats-card.component.scss'
})
export class StatsCardComponent {
    @Input() title: string = '';
    @Input() count: string | number = 0;
    @Input() icon: string = '';
    @Input() set color(value: string) {
        this._color = value;
        this.rgbColor = this.hexToRgb(value);
    }

    _color: string = '#000000';
    rgbColor: string = '0, 0, 0';

    private hexToRgb(hex: string): string {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ?
            `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
            '0, 0, 0';
    }
}
