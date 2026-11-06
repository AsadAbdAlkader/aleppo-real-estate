import { User } from './auth.model';

export interface DashboardStats {
  myPropertiesCount: number;
  activePropertiesCount: number;
  archivedPropertiesCount: number;
  favoritesCount: number;
  myInquiriesCount: number;
}

export interface DashboardRecentProperty {
  id: string;
  ownerId?: string;
  title: string;
  price: number;
  category: string;
  cityArea: string;
  status: string;
  createdAt: string;
  imageUrls?: string[];
}

export interface DashboardRecentFavorite {
  id: string;
  title: string;
  price: number;
  category: string;
  cityArea: string;
  status: string;
  imageUrls?: string[];
}

export interface DashboardRecentInquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  message: string;
  phoneNumber: string;
  createdAt: string;
}

export interface DashboardData {
  user: User;
  stats: DashboardStats;
  recentProperties: DashboardRecentProperty[];
  recentFavorites: DashboardRecentFavorite[];
  recentInquiries: DashboardRecentInquiry[];
}
