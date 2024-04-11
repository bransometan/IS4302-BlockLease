"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { convertLeaseTokenToETH, getLeaseToken } from "@/services/leaseToken";
import { RootState } from "@/types/state";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { useSelector } from "react-redux";
import { z } from "zod";

const leaseTokenFormSchema = z.object({
  valueInEth: z.coerce.number().positive("Eth must be > 0"),
});

const SwapLeaseTokensForm = () => {
  const { wallet } = useSelector((states: RootState) => states.globalStates);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof leaseTokenFormSchema>>({
    resolver: zodResolver(leaseTokenFormSchema),
    defaultValues: {
      valueInEth: 1,
    },
  });

  async function onSubmit(values: z.infer<typeof leaseTokenFormSchema>) {
    if (!wallet) {
      toast({
        description: "Please connect to your wallet!",
      });
      return;
    }
    try {
      await getLeaseToken(values.valueInEth);
      toast({
        title: "Success!",
        description: `Swapped ${values.valueInEth} ETH for ${
          values.valueInEth * 100
        } Lease Token`,
      });
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
    <Card>
      <CardHeader>
        <CardTitle>Swap Lease Token</CardTitle>
        <CardDescription>
          Get Lease Token eligible (1e16 wei = 1 LeaseToken OR 0.01 ETH = 1
          LeaseToken)
        </CardDescription>
        <CardDescription>
          LeaseTokens are required to perform actions on our site.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="px-2 space-y-4"
          >
            <FormField
              control={form.control}
              name="valueInEth"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-4 mx-10">
                    <FormLabel className="font-bold">ETH</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter ETH" {...field} />
                    </FormControl>
                    <FormLabel className="font-bold">Lease Token</FormLabel>
                    <Input
                      placeholder="Enter Lease Token"
                      value={form.getValues().valueInEth * 100}
                      onChange={(e) =>
                        form.setValue(
                          "valueInEth",
                          parseInt(
                            e.currentTarget.value ? e.currentTarget.value : "0"
                          ) / 100
                        )
                      }
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Swap</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

const ethFormSchema = z.object({
  valueInLeaseToken: z.coerce.number().positive("Lease token must be > 0"),
});

const SwapEthForm = () => {
  const { wallet } = useSelector((states: RootState) => states.globalStates);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof ethFormSchema>>({
    resolver: zodResolver(ethFormSchema),
    defaultValues: {
      valueInLeaseToken: 1,
    },
  });

  async function onSubmit(values: z.infer<typeof ethFormSchema>) {
    if (!wallet) {
      toast({
        description: "Please connect to your wallet!",
      });
      return;
    }
    try {
      await convertLeaseTokenToETH(values.valueInLeaseToken);
      toast({
        title: "Success!",
        description: `Swapped ${values.valueInLeaseToken} Lease Token for ${
          values.valueInLeaseToken / 100
        } ETH`,
      });
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
    <Card>
      <CardHeader>
        <CardTitle>Swap ETH</CardTitle>
        <CardDescription>
          Get ETH eligible (1 LeaseToken = 0.01 ETH)
        </CardDescription>
        <CardDescription>Swap back ETH from your lease tokens</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="px-2 space-y-4"
          >
            <FormField
              control={form.control}
              name="valueInLeaseToken"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center gap-4 mx-10">
                    <FormLabel className="font-bold">Lease Token</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter lease token" {...field} />
                    </FormControl>
                    <FormLabel className="font-bold">ETH</FormLabel>
                    <Input
                      placeholder="Enter ETH"
                      value={form.getValues().valueInLeaseToken / 100}
                      onChange={(e) =>
                        form.setValue(
                          "valueInLeaseToken",
                          parseInt(
                            e.currentTarget.value ? e.currentTarget.value : "0"
                          ) * 100
                        )
                      }
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Swap</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default function Home() {
  const router = useRouter();
  return (
    <main className="flex flex-col items-center justify-between">
      <div className="space-y-10 text-center">
        <section className="space-y-4">
          <h1 className="text-4xl">BlockLease</h1>
          <h2 className="text-lg">
            Unlocking Property Rental Freedom: Empowering Decentralized Rentals
            with Blockchain
          </h2>
          <SignedOut>
            <div className="space-x-4">
              <SignInButton>
                <Button>Log In</Button>
              </SignInButton>
              <Button onClick={() => router.push("/invite")}>Sign Up</Button>
            </div>
          </SignedOut>
        </section>
        <SignedIn>
          <section className="space-y-4">
            <SwapLeaseTokensForm />
            <SwapEthForm />
          </section>
        </SignedIn>
      </div>
    </main>
  );
}
