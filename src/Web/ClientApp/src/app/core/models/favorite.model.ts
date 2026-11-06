import { Property } from './property.model';

export interface FavoriteResponse {
  propertyId: string;
  isFavorite: boolean;
}

export interface FavoriteItem {
  propertyId: string;
  property?: Property;
  addedAt?: string;
}
