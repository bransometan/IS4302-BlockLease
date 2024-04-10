"use client";

import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, SignedOut } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  return (
    <main className="flex min-h-screen flex-col items-center justify-between">
      <div className="space-y-4 text-center">
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
      </div>
    </main>
  );
}
