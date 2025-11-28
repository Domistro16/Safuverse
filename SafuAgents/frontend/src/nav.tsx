import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState } from "react";
import { HiOutlineX } from "react-icons/hi";
import wide from "./assets/wide.png";
import small from "./assets/small.png";

export const Nav = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    // make this relative so the absolute dropdown positions to it
    <nav className="relative flex px-5 py-2 lg:px-5 pr-5 w-[95%] mx-auto lg:py-3 bg-black rounded-full items-center">
      <div className="flex gap-2 items-center">
        <img src={wide} className="h-10 hidden md:flex" />
        <img src={small} className="h-15 lg:hidden" />
      </div>

      <div className="flex grow" />

      {/* desktop controls */}
      <div className="hidden lg:flex items-center text-white text-lg font-semibold gap-4">
        <a href="https://names.safuverse.com">
          {" "}
          <button className="cursor-pointer "> Mint .safu </button>
        </a>
        <button className="cursor-pointer "> Manifesto </button>
        <button className="cursor-pointer "> FAQ </button>
        <div className="ml-6">
          <WalletMultiButton className="!bg-[#FFB000] !text-black !rounded-full !font-semibold !py-2 !px-8" />
        </div>
      </div>

      {/* mobile hamburger */}
      {mobileMenuOpen ? (
        <HiOutlineX
          className="text-[#FFB000] text-4xl"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : (
        <button
          onClick={() => setMobileMenuOpen((s) => !s)}
          className="rounded-full lg:hidden p-3 px-4 bg-[#FFB000] flex flex-col items-center space-y-1 justify-center"
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
        >
          <div className="h-[2px] rounded-full w-4 bg-black"></div>
          <div className="h-[2px] rounded-full w-4 bg-black"></div>
        </button>
      )}

      {/* mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute left-0 right-0 top-full mt-3 z-50 px-4">
          <div className="w-full bg-black py-4 shadow-lg rounded-lg px-4">
            <div className="flex flex-col items-center text-white space-y-4 px-10 font-semibold">
              <a href="https://names.safuverse.com">
                <button className="cursor-pointer "> Mint .safu </button>
              </a>
              <button className="cursor-pointer "> Manifesto </button>
              <button className="cursor-pointer "> FAQ </button>

              <div className="w-full px-4">
                <WalletMultiButton className="!bg-[#FFB000] !text-black !rounded-full !font-semibold !py-2 !px-8 !w-full" />
              </div>

              {/* optional: add a close button for clarity */}
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="mt-2 text-sm text-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
