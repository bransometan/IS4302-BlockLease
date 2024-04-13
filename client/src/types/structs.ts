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
