export enum PropertyType {
  HDB = "HDB",
  Condo = "Condo",
  Landed = "Landed",
  Other = "Other",
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
