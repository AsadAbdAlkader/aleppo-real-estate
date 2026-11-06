import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { PropertyTourModalComponent } from './tour-modal.component';
import { TourService } from '../../../core/services/tour.service';
import { AuthService } from '../../../core/services/auth.service';

describe('PropertyTourModalComponent', () => {
  let component: PropertyTourModalComponent;
  let fixture: ComponentFixture<PropertyTourModalComponent>;
  let tourService: TourService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyTourModalComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        TourService,
        AuthService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PropertyTourModalComponent);
    component = fixture.componentInstance;
    tourService = TestBed.inject(TourService);
    component.propertyId = 'prop-123';
    component.propertyTitle = 'فيلا الفرقان';
    component.isOpen = true;
    fixture.detectChanges();
  });

  it('should initialize with default tomorrow date and InPerson tour', () => {
    expect(component).toBeTruthy();
    expect(component.tourType).toBe('InPerson');
    expect(component.tourDate).toBeTruthy();
    expect(component.selectedTimeSlot).toBe('05:00 PM');
  });

  it('should switch tour type to VideoCall', () => {
    component.tourType = 'VideoCall';
    expect(component.tourType).toBe('VideoCall');
  });

  it('should call TourService and show success state upon submit', () => {
    const spy = vi.spyOn(tourService, 'bookTour').mockReturnValue(of({
      id: 'tour-1',
      propertyId: 'prop-123',
      propertyTitle: 'فيلا الفرقان',
      propertyAddress: 'الفرقان',
      propertyPrice: 500000,
      buyerId: 'user-1',
      buyerName: 'سعيد',
      buyerPhone: '0944111222',
      tourDate: '2026-11-09T17:00:00Z',
      tourType: 'InPerson',
      status: 'Pending',
      createdAt: new Date().toISOString()
    }));

    component.buyerName = 'سعيد';
    component.buyerPhone = '0944111222';
    component.tourDate = '2026-11-09';

    component.onSubmit();

    expect(spy).toHaveBeenCalled();
    expect(component.isSuccess()).toBe(true);
  });
});
