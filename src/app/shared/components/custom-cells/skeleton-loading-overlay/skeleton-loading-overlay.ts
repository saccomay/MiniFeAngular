import { Component } from '@angular/core';
import { ILoadingOverlayAngularComp } from 'ag-grid-angular';
import { ILoadingOverlayParams } from 'ag-grid-community';

@Component({
  selector: 'app-skeleton-loading-overlay',
  standalone: true,
  imports: [],
  templateUrl: './skeleton-loading-overlay.html',
  styleUrl: './skeleton-loading-overlay.scss',
})
export class SkeletonLoadingOverlay implements ILoadingOverlayAngularComp {
  agInit(params: ILoadingOverlayParams): void { }
}
