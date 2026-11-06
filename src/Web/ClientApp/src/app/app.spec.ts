import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { App } from './app';
import { LandingComponent } from './features/landing/landing.component';
import { PropertyListComponent } from './features/properties/property-list/property-list.component';
import { PropertyService } from './core/services/property.service';
import { Property } from './core/models/property.model';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: '', component: LandingComponent },
          { path: 'properties', component: PropertyListComponent }
        ])
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});

describe('LandingComponent', () => {
  const dummyProperties: Property[] = [
    {
      id: '1',
      title: 'شقة في الشهباء',
      description: 'وصف',
      price: 250000,
      category: 'Apartment',
      purpose: 'Sale',
      city: 'حلب',
      cityArea: 'الشهباء',
      address: 'شارع النيل',
      bedrooms: 3,
      bathrooms: 2,
      areaSquareMeters: 180,
      imageUrls: ['img1.jpg'],
      status: 'Available',
      isFeatured: true,
      createdAt: new Date().toISOString()
    }
  ];

  beforeEach(async () => {
    const mockPropertyService = {
      getProperties: () => of({
        items: dummyProperties,
        totalCount: 1,
        pageNumber: 1,
        pageSize: 6,
        totalPages: 1
      })
    };

    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: '', component: LandingComponent },
          { path: 'properties', component: PropertyListComponent }
        ]),
        { provide: PropertyService, useValue: mockPropertyService }
      ]
    }).compileComponents();
  });

  it('should create the landing component and load properties', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.properties().length).toBe(1);
    expect(component.properties()[0].title).toBe('شقة في الشهباء');
  });
});
