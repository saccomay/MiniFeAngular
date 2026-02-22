import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { BackgroundEffectsComponent } from '../features/home/components/background-effects/background-effects';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [HeaderComponent, RouterOutlet, BackgroundEffectsComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent { }
