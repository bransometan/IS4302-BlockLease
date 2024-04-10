import { ActiveSessionResource } from "@clerk/types";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function capitalizeFirstLetter(str: string) {
  return [str[0].toUpperCase(), str.slice(1)].join("");
}

export function checkUserRole(
  session: ActiveSessionResource | null | undefined
) {
  if (
    !session ||
    !session.user ||
    !session.user.organizationMemberships ||
    session.user.organizationMemberships.length === 0
  ) {
    return null; // Return null if the user is not a basic member
  }

  const organizationMemberships = session.user.organizationMemberships;

  // Loop through all organization memberships
  for (const membership of organizationMemberships) {
    if (membership.role) {
      return membership.role.toLowerCase().split(":")[1]; // Return the role in lowercase if it exists
    }
  }

  return null; // Return null if no role is found in the memberships
}
