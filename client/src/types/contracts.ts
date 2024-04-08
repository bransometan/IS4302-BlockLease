export enum PropertyType {
  HDB,
  Condo,
  Landed,
  Other,
}

export interface RentalPropertyStruct {
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
}
