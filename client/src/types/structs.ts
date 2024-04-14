export enum PropertyType {
  HDB = "HDB", // Housing and Development Board
  Condo = "Condo", // Condominium
  Landed = "Landed", // Landed Property
  Other = "Other", // Other types of property
}

export enum RentStatus {
  PENDING = "Pending", // This is when a tenant apply for a rental property and waiting for landlord to accept
  ONGOING = "Ongoing", // This is when a tenant sign a rental agreement and the rental is ongoing
  MADE_PAYMENT = "Made Payment", // This is when the tenant paid for a monthly rent and waiting for landlord to accept
  COMPLETED = "Completed", // This is when the rental is completed for the tenant (e.g. tenant move out and landlord return deposit if any)
  DISPUTE = "Dispute", // This is when a dispute is submitted from the tenant to the landlord when the rental is completed
}

export enum DisputeStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
  DRAW = "Draw",
}

export enum DisputeType {
  MAINTENANCE_AND_REPAIRS = "Maintenance and repairs",
  HEALTH_AND_SAFETY = "Health and safety",
  PRIVACY = "Privacy",
  DISCRIMINATION = "Discrimination",
  NOISE_COMPLAINTS = "Noise complaints",
  LEASE_TERMS = "Lease terms",
  OTHER = "Other",
}

export enum Vote {
  VOID = "Void",
  APPROVE = "Approve",
  REJECT = "Reject",
}

export interface RentalPropertyStruct {
  rentalPropertyId: number;
  location: string;
  postalCode: string;
  unitNumber: string;
  propertyType: PropertyType;
  description: string;
  numOfTenants: number;
  rentalPrice: number;
  leaseDuration: number;
  landlord: string;
  updateStatus: boolean;
  isListed: boolean;
  paymentId: number;
}

export interface RentalApplicationStruct {
  rentalPropertyId: number;
  applicationId: number;
  landlordAddress: string;
  tenantAddress: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone: string;
  description: string;
  monthsPaid: number;
  status: RentStatus;
  paymentIds: number[];
}

export interface RentDisputeStruct {
  rentDisputeId: number; // Unique identifier for the dispute
  rentalPropertyId: number; // Unique identifier for the rental property
  applicationId: number; // Unique identifier for the rental application
  tenantAddress: string; // Address of the tenant who created the dispute
  landlordAddress: string; // Address of the landlord of the rental property
  startTime: number; // Start time of the dispute
  endTime: number; // End time of the dispute
  status: DisputeStatus; // Status of the dispute (PENDING, APPROVED, REJECTED, DRAW)
  disputeType: DisputeType; // Type of the dispute
  disputeReason: string; // Reason for the dispute
}
