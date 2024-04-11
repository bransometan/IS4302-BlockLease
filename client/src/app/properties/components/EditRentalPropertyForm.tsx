"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { updateRentalPropertyById } from "@/services/rentalProperty";
import { PropertyType, RentalPropertyStruct } from "@/types/contracts";
import { RootState } from "@/types/state";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { z } from "zod";

const formSchema = z.object({
  location: z.string().min(1, "Location must be at least 1 character"),
  postalCode: z.string().length(6, "Postal code must be 6 characters"),
  unitNumber: z.string().min(1, "Unit number must be at least 1 character"),
  propertyType: z.nativeEnum(PropertyType),
  description: z.string().min(1, "Description must be at least 1 character"),
  numOfTenants: z.coerce
    .number()
    .positive("Number of tenants must be greater than 0"),
  rentalPrice: z.coerce
    .number()
    .positive("Rental price must be greater than 0"),
  leaseDuration: z.coerce
    .number()
    .positive("Lease duration (months) must be greater than 0"),
});

export default function EditRentalPropertyForm({
  rentalProperty,
}: {
  rentalProperty: RentalPropertyStruct;
}) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const { wallet } = useSelector((states: RootState) => states.globalStates);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      location: rentalProperty.location,
      postalCode: rentalProperty.postalCode,
      unitNumber: rentalProperty.unitNumber,
      propertyType: rentalProperty.propertyType,
      description: rentalProperty.description,
      numOfTenants: rentalProperty.numOfTenants,
      rentalPrice: rentalProperty.rentalPrice,
      leaseDuration: rentalProperty.leaseDuration,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!wallet) {
      toast({
        description: "Please connect to your wallet!",
      });
      return;
    }
    try {
      await updateRentalPropertyById(rentalProperty.rentalPropertyId, values);
      toast({
        title: "Success!",
        description: "Rental property successfully edited",
      });
      setOpen(false);
      form.reset();
      window.location.reload();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Oops",
        description: "Something went wrong",
      });
      console.error(error);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <li className="hover:bg-gray-100 hover:cursor-pointer rounded px-2">
          <span>Edit</span>
        </li>
      </DialogTrigger>
      <DialogContent className="max-w-[600px] max-h-[500px] overflow-scroll">
        <DialogHeader>
          <DialogTitle>Edit Rental Property</DialogTitle>
          <DialogDescription>
            Make changes to your rental property
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="px-2 space-y-2"
          >
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="postalCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Postal Code</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter postal code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unitNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter unit number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="propertyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a property type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.values(PropertyType).map((propertyType, i) => {
                        return (
                          <SelectItem key={i} value={propertyType}>
                            {propertyType}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                    <FormMessage />
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter Description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="numOfTenants"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number of tenants</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter number of tenants"
                      {...field}
                      type="number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rentalPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Rental Price</FormLabel>
                  <FormDescription>In lease tokens</FormDescription>
                  <FormControl>
                    <Input
                      placeholder="Enter rental price"
                      {...field}
                      type="number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="leaseDuration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lease duration</FormLabel>
                  <FormDescription>In Months</FormDescription>
                  <FormControl>
                    <Input
                      placeholder="Enter lease duration"
                      {...field}
                      type="number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Confirm</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
