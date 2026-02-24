"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { useLoginWithSiwe } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";

type Step = 1 | 2 | 3 | 4 | 5;

export default function AcademyGatewayPage() {
  const router = useRouter();
  const { generateSiweMessage, loginWithSiwe } = useLoginWithSiwe();
  const [step, setStep] = useState<Step>(1);
  const [providerName, setProviderName] = useState("MetaMask");
  const [address, setAddress] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const [networkStatus, setNetworkStatus] = useState<"disconnected" | "syncing" | "connected">("disconnected");
  const [redirectCount, setRedirectCount] = useState(3);
  const [error, setError] = useState("");

  const orbClass = useMemo(() => {
    if (networkStatus === "syncing") return "orb-gold";
    if (networkStatus === "connected") return "orb-green";
    return "orb-blue";
  }, [networkStatus]);

  const addLog = (line: string) => {
    setLogs((prev) => [...prev, line]);
  };

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const connectWithProvider = async (provider: "MetaMask" | "WalletConnect" | "Phantom") => {
    setProviderName(provider);
    setError("");
    setLogs([]);
    setStep(2);
    setNetworkStatus("syncing");

    try {
      const ethereum = (window as {
        ethereum?: {
          request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
        };
      }).ethereum;

      if (!ethereum) {
        throw new Error("No injected wallet detected in this browser.");
      }

      addLog(`[AUTH] Initializing ${provider} provider...`);
      await sleep(300);

      const accounts = (await ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];
      const connectedAddress = accounts?.[0];
      if (!connectedAddress) {
        throw new Error("Wallet connection was not approved.");
      }
      setAddress(connectedAddress);
      addLog(`[WALLET] Connected ${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}.`);
      await sleep(250);

      const chainHex = (await ethereum.request({
        method: "eth_chainId",
      })) as string;
      const chainId = Number.parseInt(chainHex, 16);
      addLog(`[RPC] Network chainId ${chainId}.`);
      await sleep(250);

      const message = await generateSiweMessage({
        address: connectedAddress,
        chainId: `eip155:${chainId}`,
      });
      addLog("[NEXID] SIWE message generated.");
      await sleep(250);

      const signature = (await ethereum.request({
        method: "personal_sign",
        params: [message, connectedAddress],
      })) as string;
      addLog("[WALLET] Signature received.");
      await sleep(250);

      await loginWithSiwe({
        signature,
        message,
        walletClientType:
          provider === "MetaMask"
            ? "metamask"
            : provider === "WalletConnect"
              ? "wallet_connect_v2"
              : "phantom",
        connectorType: "injected",
      });

      addLog("[SUCCESS] Identity resolved.");
      setNetworkStatus("connected");
      await sleep(400);
      setStep(3);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to connect wallet.";
      setError(message);
      setStep(1);
      setNetworkStatus("disconnected");
    }
  };

  const executeSignature = async () => {
    setStep(5);
    setRedirectCount(3);
    localStorage.setItem("nexid_gateway_connected", "true");
    if (address) localStorage.setItem("nexid_gateway_address", address);
  };

  useEffect(() => {
    if (step !== 5) return;

    const interval = setInterval(() => {
      setRedirectCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push("/academy");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [router, step]);

  return (
    <div className="nexid-gateway relative flex h-screen items-center justify-center overflow-hidden">
      <div className="bg-grid" />
      <div className={`hero-orb ${orbClass}`} />

      <div className="gateway-panel">
        <div className="logo-mark font-display text-lg font-black tracking-tighter text-white">
          N<span className="text-nexid-gold">.</span>
        </div>

        <div className="absolute right-6 top-6 z-20 flex items-center gap-2 font-mono text-[9px] uppercase tracking-widest">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              networkStatus === "connected"
                ? "bg-green-500"
                : networkStatus === "syncing"
                  ? "bg-nexid-gold animate-pulse"
                  : "bg-[#444]"
            }`}
          />
          <span className={networkStatus === "connected" ? "text-green-400" : networkStatus === "syncing" ? "text-nexid-gold" : "text-nexid-muted"}>
            {networkStatus === "connected" ? "Connected" : networkStatus === "syncing" ? "Syncing RPC..." : "Disconnected"}
          </span>
        </div>

        <StepWrap active={step === 1}>
          <div className="mt-4 text-center">
            <h2 className="font-display mb-2 text-2xl font-bold text-white">
              Initialize Session
            </h2>
            <p className="text-sm text-nexid-muted">
              Connect your provider to access the Sovereign Knowledge Layer.
            </p>
          </div>
          <div className="mt-8 space-y-3">
            {(["MetaMask", "WalletConnect", "Phantom"] as const).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => connectWithProvider(name)}
                className="wallet-btn w-full rounded-xl border border-[#222] bg-[#0a0a0a] p-4 text-left text-white"
              >
                {name}
              </button>
            ))}
          </div>
          {error ? (
            <p className="mt-4 text-xs text-red-400">{error}</p>
          ) : null}
        </StepWrap>

        <StepWrap active={step === 2}>
          <div className="flex flex-1 items-center justify-center">
            <div className="relative h-24 w-24">
              <div className="absolute inset-0 animate-[spin_10s_linear_infinite] rounded-full border-2 border-dashed border-nexid-gold/30" />
              <div className="absolute inset-2 animate-[spin_4s_linear_infinite_reverse] rounded-full border-2 border-nexid-gold/50" />
            </div>
          </div>
          <div className="relative h-36 w-full overflow-hidden rounded-lg border border-[#222] bg-[#050505] p-3">
            <div className="custom-scroll h-full overflow-y-auto">
              {logs.map((line, idx) => (
                <div key={`${line}-${idx}`} className="log-line">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </StepWrap>

        <StepWrap active={step === 3}>
          <div className="mt-4 text-center">
            <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full border border-green-500/30 bg-green-500/10 text-green-400">
              ✓
            </div>
            <h2 className="font-display text-2xl font-bold text-white">
              Identity Resolved
            </h2>
          </div>
          <div className="relative mt-8 rounded-xl border border-nexid-gold/40 bg-[#050505] p-5">
            <div className="mb-3 font-mono text-[9px] uppercase tracking-widest text-nexid-gold">
              Primary Namespace
            </div>
            <div className="font-display text-xl font-bold text-white">
              nadya<span className="text-nexid-gold">.id</span>
            </div>
            <div className="font-mono text-[10px] text-nexid-muted">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ""}
            </div>
          </div>
          <div className="mb-8 mt-6">
            <label className="mb-2 block px-1 font-mono text-[10px] uppercase tracking-widest text-nexid-muted">
              Academy Display Alias (Optional)
            </label>
            <input
              type="text"
              placeholder="Defaults to nadya.id"
              className="gateway-input"
            />
          </div>
          <button
            type="button"
            onClick={() => setStep(4)}
            className="w-full rounded-xl bg-white py-4 text-sm font-bold text-black"
          >
            Confirm Identity
          </button>
        </StepWrap>

        <StepWrap active={step === 4}>
          <div className="text-center">
            <h2 className="font-display mb-3 text-2xl font-bold text-white">
              Sign Session Key
            </h2>
            <p className="mx-auto mb-8 max-w-xs text-sm leading-relaxed text-nexid-muted">
              Approve a gasless session key to interact with Academy contracts.
            </p>
          </div>
          <div className="mb-8 rounded-lg border border-[#222] bg-[#050505] p-4 text-left">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] text-nexid-muted">Permission</span>
              <span className="font-mono text-[10px] text-green-400">Granted</span>
            </div>
            <div className="break-all font-mono text-xs text-white/80">
              SignMessage: "Authenticate session for nadya.id. Valid for 24h."
            </div>
          </div>
          <button
            id="sign-btn"
            type="button"
            onClick={executeSignature}
            className="w-full rounded-xl bg-nexid-gold py-4 text-sm font-bold text-black"
          >
            Sign & Enter Protocol
          </button>
        </StepWrap>

        <StepWrap active={step === 5}>
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-2 border-green-500/20">
              <span className="text-3xl text-green-500">✓</span>
            </div>
            <h2 className="font-display mb-2 text-2xl font-bold text-white">
              Authentication Successful
            </h2>
            <p className="font-mono text-sm text-nexid-muted">
              Routing to Sovereign Dashboard in {redirectCount}...
            </p>
          </div>
        </StepWrap>
      </div>
    </div>
  );
}

function StepWrap({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`step-container flex flex-col ${active ? "active" : ""}`}>
      {children}
    </div>
  );
}
