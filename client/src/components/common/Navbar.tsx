"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { connectWallet } from "@/services/wallet";
import { RootState } from "@/types/state";
import { useSelector } from "react-redux";

const TENANT_TABS = [
  {
    href: "/marketplace",
    name: "Browse Properties",
  },
];

const LANDLORD_TABS = [
  {
    href: "/properties",
    name: "My Properties",
  },
];

const VALIDATOR_TABS = [
  {
    href: "/disputes",
    name: "Disputes",
  },
];

export default function Navbar() {
  const path = usePathname();
  const { wallet } = useSelector((states: RootState) => states.globalStates);

  return (
    <nav className="w-full fixed top-0 z-20 nav-blur">
      <div className="flex items-center justify-between p-3 px-10">
        <ul className="m-0 p-0 overflow-hidden">
          <Link href="/">
            <li className="float-left mr-8 text-lg font-bold">BlockLease</li>
          </Link>
          {/**TODO: Display tabs according to role */}
          {TENANT_TABS.map((tab, i) => {
            return (
              <Link href={tab.href} key={i}>
                <li
                  className={cn(
                    "float-left mr-4 text-lg px-2 rounded hover:bg-gray-200",
                    path.includes(`${tab.href}`) && "bg-gray-200 nav-active"
                  )}
                >
                  {tab.name}
                </li>
              </Link>
            );
          })}
          {LANDLORD_TABS.map((tab, i) => {
            return (
              <Link href={tab.href} key={i}>
                <li
                  className={cn(
                    "float-left mr-4 text-lg px-2 rounded hover:bg-gray-200",
                    path.includes(`${tab.href}`) && "bg-gray-200 nav-active"
                  )}
                >
                  {tab.name}
                </li>
              </Link>
            );
          })}
          {VALIDATOR_TABS.map((tab, i) => {
            return (
              <Link href={tab.href} key={i}>
                <li
                  className={cn(
                    "float-left mr-4 text-lg px-2 rounded hover:bg-gray-200",
                    path.includes(`${tab.href}`) && "bg-gray-200 nav-active"
                  )}
                >
                  {tab.name}
                </li>
              </Link>
            );
          })}
        </ul>
        {wallet ? (
          <Button disabled>{wallet}</Button>
        ) : (
          <Button onClick={connectWallet}>Connect wallet</Button>
        )}
      </div>
      <hr className="border-slate-400 opacity-25" />
    </nav>
  );
}
