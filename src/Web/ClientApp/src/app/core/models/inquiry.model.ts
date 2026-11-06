export type InquiryStatus = 'New' | 'Contacted' | 'Closed';

export interface CreateInquiryRequest {
  propertyId: string;
  message: string;
  phoneNumber: string;
}

export interface Inquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  userId: string;
  userName?: string;
  message: string;
  phoneNumber: string;
  status: InquiryStatus;
  createdAt: string;
  updatedAt?: string;
}

export type InquiryDto = Inquiry;

export interface ReceivedInquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  userId: string;
  buyerName: string;
  phoneNumber: string;
  message: string;
  status: InquiryStatus;
  agentNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UpdateInquiryStatusDto {
  status: InquiryStatus;
  agentNotes?: string;
}
