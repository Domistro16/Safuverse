import { useState, useCallback } from "react";
import {
  useAccount,
  useReadContract,
  useSignTypedData,
  useWaitForTransactionReceipt,
} from "wagmi";
import type { Abi } from "abitype";
import { encodeFunctionData } from "viem";
import { ERC2771Forwarder } from "../constants";

type ForwardRequest = {
  from: `0x${string}`;
  to: `0x${string}`;
  value: bigint;
  gas: bigint;
  nonce: bigint;
  data: `0x${string}`;
};

// Hook arguments
interface writeContractArgs {
  targetABI: Abi;
  /** Address of target contract (inherits ERC2771Context) */
  targetAddress: `0x${string}`;
  /** The name of the function you want to call on target (e.g. "setValue") */
  functionName: string;
  /** Arguments for that function (e.g. [42]) */
  functionArgs: readonly unknown[];
  /** (Optional) Gas limit to send in the ForwardRequest. Defaults to 100k */
  gasLimit?: number;
}

const abi = [
  {
    inputs: [],
    name: "eip712Domain",
    outputs: [
      {
        internalType: "bytes1",
        name: "fields",
        type: "bytes1",
      },
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "version",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "chainId",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "verifyingContract",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "salt",
        type: "bytes32",
      },
      {
        internalType: "uint256[]",
        name: "extensions",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "gas",
            type: "uint256",
          },
          {
            internalType: "uint48",
            name: "deadline",
            type: "uint48",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes",
          },
        ],
        internalType: "struct ERC2771Forwarder.ForwardRequestData",
        name: "request",
        type: "tuple",
      },
    ],
    name: "execute",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "gas",
            type: "uint256",
          },
          {
            internalType: "uint48",
            name: "deadline",
            type: "uint48",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes",
          },
        ],
        internalType: "struct ERC2771Forwarder.ForwardRequestData[]",
        name: "requests",
        type: "tuple[]",
      },
      {
        internalType: "address payable",
        name: "refundReceiver",
        type: "address",
      },
    ],
    name: "executeBatch",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
    ],
    name: "nonces",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "address",
            name: "from",
            type: "address",
          },
          {
            internalType: "address",
            name: "to",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "gas",
            type: "uint256",
          },
          {
            internalType: "uint48",
            name: "deadline",
            type: "uint48",
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes",
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes",
          },
        ],
        internalType: "struct ERC2771Forwarder.ForwardRequestData",
        name: "request",
        type: "tuple",
      },
    ],
    name: "verify",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const ForwardRequest = [
  { name: "from", type: "address" },
  { name: "to", type: "address" },
  { name: "value", type: "uint256" },
  { name: "gas", type: "uint256" },
  { name: "nonce", type: "uint256" },
  { name: "deadline", type: "uint48" },
  { name: "data", type: "bytes" },
];

/**
 * useGaslessContractWrite
 *
 * A custom hook that wraps:
 * 1. useContractRead to get forwarder.getNonce(userAddress)
 * 2. useSignTypedData to sign an EIP-712 ForwardRequest
 * 3. POST to your relayer endpoint (`relayerUrl`) with { request, signature }
 * 4. useWaitForTransaction to watch the relayed txHash
 *
 * Returns:
 *  - write(): triggers the entire flow (nonce → sign → send)
 *  - isLoading: true while signing or sending
 *  - isError: true if any step fails
 *  - error: the thrown error (signature/releray failure)
 *  - status: human-readable status ("Signing...", "Sending to relayer...", etc.)
 *  - txHash: the relayed transaction hash (if returned by your relayer)
 *  - isSuccess: true when tx is confirmed on-chain
 */
export function useGaslessContractWrite() {
  const { address: userAddress } = useAccount();
  const relayerUrl = import.meta.env.VITE_RELAYER_URL;

  // 1. Fetch forwarder nonce for this user
  const {
    data: nonceData,
    isLoading: nonceLoading,
    isError: nonceError,
  } = useReadContract({
    address: ERC2771Forwarder,
    abi: abi,
    functionName: "nonces",
    args: [
      userAddress ??
        ("0x0000000000000000000000000000000000000000" as `0x${string}`),
    ],
  });

  // Convert returned nonce to bigint (viem returns bigint)
  const nonce: number = (nonceData as unknown as number) ?? 0;

  // Local state for status, error, txHash
  const [data, setTxHash] = useState<`0x${string}` | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [hookError, setHookError] = useState<Error | null>(null);

  // 2. Set up typed data signer
  const { signTypedDataAsync, isPending: isSigning } = useSignTypedData();

  // 3. When the relayed transaction hash is known, use useWaitForTransaction
  const { isSuccess: isTxSuccess } = useWaitForTransactionReceipt({
    hash: data ?? undefined,
  });

  // 4. The main “write” function that orchestrates everything
  const writeContract = useCallback(
    async ({
      targetABI,
      targetAddress,
      functionName,
      functionArgs,
      gasLimit = 100000,
    }: writeContractArgs) => {
      if (!userAddress) {
        setHookError(new Error("Wallet not connected"));
        return;
      }
      if (nonceError) {
        setHookError(new Error("Failed to fetch nonce"));
        return;
      }
      if (nonceLoading) {
        return;
      }

      try {
        // Encode target contract’s function call
        const targetCalldata = encodeFunctionData({
          abi: targetABI,
          functionName: functionName as any,
          args: functionArgs as readonly any[],
        }) as `0x${string}`;

        // Build the ForwardRequest struct

        const deadline = Math.floor(Date.now() / 1000) + 60 * 5; // 5 mins in the future
        const request = {
          from: userAddress as `0x${string}`,
          to: targetAddress,
          value: 0,
          gas: gasLimit,
          nonce: nonce,
          deadline,
          data: targetCalldata,
        };

        const domain = {
          name: "ERC2771Forwarder",
          version: "1",
          chainId: 97,
          verifyingContract: ERC2771Forwarder as `0x${string}`,
        };
        // Prompt user to sign EIP-712 typed ForwardRequest
        const types = {
          ForwardRequest,
        };
        const signature = await signTypedDataAsync({
          domain,
          types,
          primaryType: "ForwardRequest",
          message: request,
        });

        setIsSending(true);

        const finalRequest = {
          from: request.from,
          to: request.to,
          value: request.value.toString(),
          gas: request.gas.toString(),
          deadline: request.deadline.toString(),
          data: request.data,
          signature,
        };
        // 4. Send to relayer endpoint
        const response = await fetch(relayerUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ request: finalRequest, signature }),
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `Relayer error: ${response.status} ${response.statusText} – ${text}`
          );
        }
        const { txHash } = await response.json();
        setTxHash(txHash);
      } catch (err: any) {
        console.error(err);
        setIsSending(false);
        setHookError(err);
      }
    },
    [
      userAddress,
      nonce,
      nonceLoading,
      nonceError,
      signTypedDataAsync,
      relayerUrl,
      ForwardRequest,
      abi,
    ]
  );
  return {
    writeContract, // Call this to start the gasless flow
    isLoading: nonceLoading || isSigning || isSending,
    isError: Boolean(hookError),
    error: hookError,
    data,
    isSuccess: Boolean(isTxSuccess),
  };
}
