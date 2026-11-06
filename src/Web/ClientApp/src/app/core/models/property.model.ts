export type PropertyCategory = 'Apartment' | 'Villa' | 'Commercial' | 'Land';

export type PropertyPurpose = 'Sale' | 'Rent';

export type PropertyStatus = 'Available' | 'Sold' | 'Rented';

export interface Property {
  id: string;
  ownerId?: string;
  ownerName?: string;
  title: string;
  description: string;
  price: number;
  category: PropertyCategory | string;
  purpose?: PropertyPurpose | string;
  city?: string;
  cityArea: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  areaSquareMeters: number;
  imageUrls: string[];
  status: PropertyStatus | string;
  isFeatured: boolean;
  createdAt: string;
}

export interface PropertyFilterParams {
  searchTerm?: string;
  purpose?: string;
  city?: string;
  cityArea?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  bedrooms?: number;
  bathrooms?: number;
  status?: string;
  sortBy?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface CreatePropertyRequest {
  title: string;
  description: string;
  price: number;
  category: string;
  cityArea: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  areaSquareMeters: number;
  imageUrls: string[];
}

export interface UpdatePropertyRequest {
  title: string;
  description: string;
  price: number;
  category: string;
  cityArea: string;
  address: string;
  bedrooms: number;
  bathrooms: number;
  areaSquareMeters: number;
  imageUrls: string[];
  status?: string;
}

