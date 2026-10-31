import { ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PropertyService } from '../../core/services/property.service';
import { Property } from '../../core/models/property.model';
import { PropertyCardComponent } from '../../shared/components/property-card/property-card.component';
import { FluidBackdropComponent } from '../../shared/components/fluid-backdrop/fluid-backdrop.component';
import { RevealDirective } from '../../shared/directives/reveal.directive';
import { FluidSurfaceDirective } from '../../shared/directives/fluid-surface.directive';

@Component({
  selector: 'app-home', standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, PropertyCardComponent, FluidBackdropComponent, RevealDirective, FluidSurfaceDirective],
  templateUrl: './home.component.html', styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private readonly propertyService = inject(PropertyService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  featuredProperties: Property[] = [];
  loading = true;
  error = false;
  searchType: 'ALL' | 'RESIDENTIAL' | 'COMMERCIAL' = 'ALL';
  searchKeyword = '';
  searchCategory = '';
  selectedMood = 0;
  readonly moods = [{ name: 'Warm sand', wall: '#d9c7ad', accent: '#8e6550' }, { name: 'Soft sage', wall: '#aab5a0', accent: '#576c57' }, { name: 'Terracotta', wall: '#c69078', accent: '#8f503a' }];
  ngOnInit() { this.loadProperties(); }
  loadProperties() {
    this.loading = true; this.error = false;
    this.propertyService.getProperties().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: props => { this.featuredProperties = props.slice(0, 3); this.loading = false; this.cdr.markForCheck(); },
      error: () => { this.error = true; this.loading = false; this.cdr.markForCheck(); }
    });
  }
  onSearch() {
    this.router.navigate(['/properties'], { queryParams: { type: this.searchType !== 'ALL' ? this.searchType : null, category: this.searchCategory || null, location: this.searchKeyword.trim() || null } });
  }
}
