import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { HeaderComponent } from './core/components/header/header.component';
import { SidebarComponent } from './core/components/sidebar/sidebar.component';
import { PropertyComparisonComponent } from './features/properties/property-comparison/property-comparison.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, SidebarComponent, PropertyComparisonComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Aleppo Real Estate');

  /** The landing page renders full-bleed (no content padding). */
  protected readonly isLanding = signal<boolean>(false);

  private readonly router = inject(Router);

  constructor() {
    this.updateLandingState(this.router.url);
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event) => this.updateLandingState(event.urlAfterRedirects));
  }

  private updateLandingState(url: string): void {
    this.isLanding.set(url.split('?')[0] === '/');
  }
}
