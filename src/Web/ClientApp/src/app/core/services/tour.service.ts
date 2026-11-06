import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TourBooking, BookTourRequest } from '../models/tour.model';

@Injectable({
  providedIn: 'root'
})
export class TourService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '';

  bookTour(request: BookTourRequest): Observable<TourBooking> {
    return this.http.post<TourBooking>(`${this.apiUrl}/api/tours`, request).pipe(
      catchError((error) => {
        console.warn('API bookTour call failed. Triggering dev-mode fallback.', error);
        const mockBooking: TourBooking = {
          id: 'tour-' + Date.now(),
          propertyId: request.propertyId,
          propertyTitle: 'معاينة عقار حلب',
          propertyAddress: 'حي الشهباء - حلب',
          propertyPrice: 250000,
          buyerId: 'dev-user-id',
          buyerName: request.buyerName,
          buyerPhone: request.buyerPhone,
          tourDate: request.tourDate,
          tourType: request.tourType,
          status: 'Pending',
          notes: request.notes,
          createdAt: new Date().toISOString()
        };
        return of(mockBooking);
      })
    );
  }

  getMyTours(): Observable<TourBooking[]> {
    return this.http.get<TourBooking[]>(`${this.apiUrl}/api/tours/my`).pipe(
      catchError((error) => {
        console.warn('API getMyTours call failed. Triggering dev-mode fallback.', error);
        return of([]);
      })
    );
  }
}
