export interface TourBooking {
  id: string;
  propertyId: string;
  propertyTitle: string;
  propertyAddress: string;
  propertyPrice: number;
  propertyImageUrl?: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  tourDate: string;
  tourType: 'InPerson' | 'VideoCall' | string;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | string;
  notes?: string;
  createdAt: string;
}

export interface BookTourRequest {
  propertyId: string;
  buyerName: string;
  buyerPhone: string;
  tourDate: string;
  tourType: 'InPerson' | 'VideoCall';
  notes?: string;
}
