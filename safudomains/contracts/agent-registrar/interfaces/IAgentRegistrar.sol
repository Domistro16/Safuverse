// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {ReferralVerifier} from "../../ethregistrar/ReferralVerifier.sol";

/**
 * @title IAgentRegistrar
 * @notice Interface for the agent registrar controller
 */
interface IAgentRegistrar {
    /**
     * @notice Registration request structure
     */
    struct RegisterRequest {
        string name; // Name to register (without .safu suffix)
        address owner; // Owner of the registered name
        bytes32 secret; // Secret for commit-reveal (can be zero for agent names in agent mode)
        address resolver; // Resolver address to set
        bytes[] data; // Resolver data to set during registration
        bool reverseRecord; // Whether to set reverse record
        uint16 ownerControlledFuses; // Fuses to set on the wrapped name
    }

    /**
     * @notice Emitted when a name is registered
     */
    event NameRegistered(
        string name,
        bytes32 indexed label,
        address indexed owner,
        uint256 cost,
        uint256 expires
    );

    /**
     * @notice Emitted when a batch registration completes
     */
    event BatchRegistered(
        uint256 count,
        address indexed owner,
        uint256 totalCost
    );

    /**
     * @notice Register a name with ETH payment
     * @param req The registration request
     * @param referralData The referral data
     * @param referralSignature The referral signature
     */
    function register(
        RegisterRequest calldata req,
        ReferralVerifier.ReferralData calldata referralData,
        bytes calldata referralSignature
    ) external payable;

    /**
     * @notice Register a name with USDC payment
     * @param req The registration request
     */
    function registerWithUSDC(RegisterRequest calldata req) external;

    /**
     * @notice Register multiple names in a single transaction
     * @param requests Array of registration requests
     */
    function batchRegister(
        RegisterRequest[] calldata requests
    ) external payable;

    /**
     * @notice Commit to a name registration (for commit-reveal)
     * @param commitment The commitment hash
     */
    function commit(bytes32 commitment) external;

    /**
     * @notice Make a commitment hash from registration parameters
     * @param req The registration request
     * @return The commitment hash
     */
    function makeCommitment(
        RegisterRequest calldata req
    ) external pure returns (bytes32);

    /**
     * @notice Check if a name is available for registration
     * @param name The name to check
     * @return True if the name is available
     */
    function available(string calldata name) external view returns (bool);

    /**
     * @notice Check if a name is valid (meets minimum requirements)
     * @param name The name to check
     * @return True if the name is valid
     */
    function valid(string calldata name) external pure returns (bool);
}
