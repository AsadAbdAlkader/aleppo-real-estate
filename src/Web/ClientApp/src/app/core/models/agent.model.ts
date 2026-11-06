import { Property } from './property.model';

export interface Agent {
  id: string;
  name: string;
  agencyId?: string | null;
  agencyName?: string | null;
  bio?: string | null;
  publicPhone?: string | null;
  address?: string | null;
  cityArea?: string | null;
  logoUrl?: string | null;
  licenseNumber?: string | null;
  activePropertiesCount: number;
  createdAt?: string;
}

export interface AgentDetails {
  id: string;
  name: string;
  agencyId?: string | null;
  agencyName?: string | null;
  agencyDescription?: string | null;
  bio?: string | null;
  publicPhone?: string | null;
  agencyPhone?: string | null;
  address?: string | null;
  cityArea?: string | null;
  logoUrl?: string | null;
  licenseNumber?: string | null;
  activePropertiesCount: number;
  createdAt?: string;
}

export interface Agency {
  id: string;
  name: string;
  description?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  cityArea?: string | null;
  logoUrl?: string | null;
  licenseNumber?: string | null;
  agentsCount: number;
  activePropertiesCount: number;
  createdAt?: string;
}

export interface AgencyDetails extends Agency {
  agents?: Agent[];
}

export interface AgentFilterParams {
  searchTerm?: string;
  cityArea?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface UpdateAgentProfileDto {
  bio?: string;
  publicPhone?: string;
  agencyId?: string | null;
}

export interface CreateAgencyDto {
  name: string;
  description?: string;
  phoneNumber?: string;
  address?: string;
  cityArea?: string;
  logoUrl?: string;
  licenseNumber?: string;
}

export interface UpdateAgencyDto {
  name?: string;
  description?: string;
  phoneNumber?: string;
  address?: string;
  cityArea?: string;
  logoUrl?: string;
  licenseNumber?: string;
}
