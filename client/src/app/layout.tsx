import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/common/Navbar";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BlockLease",
  description: "Rent properties",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {" "}
        <main className="flex flex-col min-h-[100vh]">
          <Navbar />
          <div className="mt-20 mx-8">
            {children}
            <Toaster />
          </div>
        </main>
      </body>
    </html>
  );
}
