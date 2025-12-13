import { ConnectButton } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { useENSName } from "../hooks/getPrimaryName";
import { Avatar } from "./useAvatar";
import { WalletModal } from "./walletModal";
import { useState } from "react";
// useAccount imported via wagmi in other files

// Separate component to handle the connected state with proper hook usage
function ConnectedButton({
  account,
  chain,
  openChainModal,
}: {
  account: {
    address: string;
    displayName: string;
    displayBalance?: string;
  };
  chain: { unsupported?: boolean };
  openChainModal: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { name } = useENSName({
    owner: account.address as `0x${string}`,
  });

  if (chain.unsupported) {
    return (
      <button
        onClick={openChainModal}
        type="button"
        className="bg-neutral-950 p-4 py-[10px] rounded-full cursor-pointer flex gap-2 items-center hover:scale-105 duration-200 font-bold text-red-500"
      >
        Wrong network!
      </button>
    );
  }

  return (
    <div
      className="font-bold cursor-pointer text-white hover:scale-105 duration-200"
      style={{ display: "flex", gap: 12 }}
    >
      <button
        className="bg-neutral-950 p-3 py-[8px] rounded-full cursor-pointer flex gap-2 items-center hover:scale-105 duration-200"
        onClick={() => {
          setIsOpen(true);
        }}
        type="button"
      >
        <Avatar
          name={
            name == "" ? (account.address as string) : (name as string)
          }
          className="w-8 h-8"
        />
        {name ? (
          <div className="">{name as string}</div>
        ) : (
          <div className="">{account.displayName}</div>
        )}
      </button>

      <WalletModal
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        address={account.displayName}
        name={name as string}
        balance={account.displayBalance as string}
      />
    </div>
  );
}

export const CustomConnect = () => {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== "loading";
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === "authenticated");

        return (
          <div
            {...(!ready && {
              "aria-hidden": true,
              style: {
                opacity: 0,
                pointerEvents: "none",
                userSelect: "none",
              },
            })}
          >
            {!connected ? (
              <button
                className="px-[18px] lg:px-[22px] py-[8px] lg:py-[9px] rounded-full border border-[#111] bg-[#111] text-white font-semibold text-[13px] lg:text-[14px] cursor-pointer transition hover:bg-white hover:text-[#111] hover:scale-105"
                type="button"
                onClick={openConnectModal}
              >
                Login
              </button>
            ) : (
              <ConnectedButton
                account={account}
                chain={chain}
                openChainModal={openChainModal}
              />
            )}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

