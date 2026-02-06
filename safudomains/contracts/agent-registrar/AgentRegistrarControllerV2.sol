// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AgentPriceOracle} from "./AgentPriceOracle.sol";

// ERC-4337 interfaces
interface IEntryPoint {
    struct UserOperation {
        address sender;
        uint256 nonce;
        bytes initCode;
        bytes callData;
        uint256 callGasLimit;
        uint256 verificationGasLimit;
        uint256 preVerificationGas;
        uint256 maxFeePerGas;
        uint256 maxPriorityFeePerGas;
        bytes paymasterAndData;
        bytes signature;
    }
}

interface IAccountFactory {
    function createAccount(address owner, uint256 salt) external returns (address);
    function getAddress(address owner, uint256 salt) external view returns (address);
}

interface INameWrapper {
    function registerAndWrapETH2LD(
        string calldata label,
        address wrappedOwner,
        uint256 duration,
        address resolver,
        uint16 ownerControlledFuses
    ) external returns (uint256 expires);
}

interface IReverseRegistrar {
    function setNameForAddr(address addr, address owner, address resolver, string memory name) external returns (bytes32);
}

interface IResolver {
    function multicallWithNodeCheck(bytes32 nodehash, bytes[] calldata data) external returns (bytes[] memory);
}

/**
 * @title AgentRegistrarControllerV2
 * @notice USDC-only, ERC-4337 compatible domain registration for AI agents
 * @dev Deployed on Base - uses Circle Paymaster for gasless transactions
 *
 * Key Features:
 * - USDC-only payments (no ETH required from users)
 * - ERC-4337 Account Abstraction compatible
 * - Optional AA wallet deployment with domain mint
 * - Works with Circle Paymaster for gas sponsorship
 * - x402 and ERC-8004 resolver records
 */
contract AgentRegistrarControllerV2 is Ownable, IERC165, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ============ Errors ============
    error NameNotAvailable(string name);
    error InsufficientUSDC();
    error InvalidName();
    error CommitmentTooNew(bytes32 commitment);
    error CommitmentTooOld(bytes32 commitment);
    error UnexpiredCommitmentExists(bytes32 commitment);
    error ResolverRequiredWhenDataSupplied();
    error TransferFailed();
    error BatchOnlyForAgentNames(string name);
    error OnlyEntryPoint();
    error InvalidPermitSignature();

    // ============ Constants ============
    uint256 private constant LIFETIME_DURATION = 31536000000; // ~1000 years
    bytes32 private constant SAFU_NODE =
        0xf92e9539a836c60f519caef3f817b823139813f56a7a19c9621f7b47f35b340d;

    uint256 public constant MIN_COMMITMENT_AGE = 60;
    uint256 public constant MAX_COMMITMENT_AGE = 1 days;

    // Base Mainnet addresses
    address public constant USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    address public constant ENTRY_POINT = 0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789;

    // ============ Immutables ============
    INameWrapper public immutable nameWrapper;
    IReverseRegistrar public immutable reverseRegistrar;

    // ============ State ============
    AgentPriceOracle public priceOracle;
    address public treasury;
    IAccountFactory public accountFactory; // For deploying AA wallets

    uint256 public totalRegistrations;
    uint256 public totalAgentRegistrations;
    uint256 public totalVolumeUSDC;

    // Commit-reveal storage
    mapping(bytes32 => uint256) public commitments;

    // Agent mode (skip commit-reveal for agent names)
    bool public agentModeEnabled = true;

    // ============ Events ============
    event NameRegistered(
        string indexed name,
        bytes32 indexed labelHash,
        address indexed owner,
        uint256 priceUSDC,
        bool isAgentName,
        address agentWallet, // Address of deployed AA wallet (or zero if not deployed)
        uint256 expires
    );

    event AgentWalletDeployed(
        address indexed owner,
        address indexed wallet,
        string domainName
    );

    // ============ Structs ============
    struct RegisterRequest {
        string name;
        address owner;
        bytes32 secret;
        address resolver;
        bytes[] data;
        bool reverseRecord;
        bool deployWallet;      // Deploy AA wallet for agent
        uint256 walletSalt;     // Salt for deterministic wallet address
    }

    struct PermitData {
        uint256 deadline;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    // ============ Constructor ============
    constructor(
        address _nameWrapper,
        address _reverseRegistrar,
        address _priceOracle,
        address _treasury,
        address _accountFactory
    ) Ownable(msg.sender) {
        nameWrapper = INameWrapper(_nameWrapper);
        reverseRegistrar = IReverseRegistrar(_reverseRegistrar);
        priceOracle = AgentPriceOracle(_priceOracle);
        treasury = _treasury;
        accountFactory = IAccountFactory(_accountFactory);
    }

    // ============ View Functions ============

    /**
     * @notice Get registration price in USDC (6 decimals)
     */
    function getPrice(string calldata name) external view returns (
        uint256 priceUSDC,
        bool isAgentName
    ) {
        (, uint256 priceUsd18, bool isAgent) = priceOracle.price(name);
        // Convert from 18 decimals to 6 decimals (USDC)
        priceUSDC = priceUsd18 / 1e12;
        isAgentName = isAgent;
    }

    /**
     * @notice Get the deterministic AA wallet address for an owner
     */
    function getWalletAddress(address owner, uint256 salt) external view returns (address) {
        return accountFactory.getAddress(owner, salt);
    }

    /**
     * @notice Check if a name is available
     */
    function available(string calldata name) public view returns (bool) {
        bytes32 labelHash = keccak256(bytes(name));
        return _valid(name) && _isAvailable(uint256(labelHash));
    }

    function _valid(string calldata name) internal pure returns (bool) {
        return bytes(name).length >= 1;
    }

    function _isAvailable(uint256 labelHash) internal view returns (bool) {
        // Check base registrar availability
        // This would call baseRegistrar.available(labelHash)
        return true; // Placeholder - integrate with BaseRegistrar on deployment
    }

    // ============ Registration with USDC ============

    /**
     * @notice Register with USDC using EIP-2612 permit (gasless approval)
     * @dev Best for AA wallets - single transaction approval + mint
     */
    function registerWithPermit(
        RegisterRequest calldata req,
        PermitData calldata permit
    ) external nonReentrant {
        // Get price in USDC
        (, uint256 priceUsd18, bool isAgentName) = priceOracle.price(req.name);
        uint256 priceUSDC = priceUsd18 / 1e12;

        // Validate
        if (!available(req.name)) revert NameNotAvailable(req.name);

        // Verify commitment if needed
        if (!agentModeEnabled || !isAgentName) {
            _consumeCommitment(req);
        }

        // Execute permit (gasless USDC approval)
        try IERC20Permit(USDC).permit(
            msg.sender,
            address(this),
            priceUSDC,
            permit.deadline,
            permit.v,
            permit.r,
            permit.s
        ) {} catch {
            // Permit might already be used or pre-approved
        }

        // Transfer USDC
        IERC20(USDC).safeTransferFrom(msg.sender, treasury, priceUSDC);

        // Deploy AA wallet if requested
        address agentWallet = address(0);
        if (req.deployWallet) {
            agentWallet = _deployAgentWallet(req.owner, req.walletSalt, req.name);
        }

        // Execute registration
        uint256 expires = _executeRegistration(req, agentWallet);

        // Update stats
        _updateStats(priceUSDC, isAgentName);

        emit NameRegistered(
            req.name,
            keccak256(bytes(req.name)),
            req.owner,
            priceUSDC,
            isAgentName,
            agentWallet,
            expires
        );
    }

    /**
     * @notice Register with pre-approved USDC
     * @dev For wallets that already approved USDC spending
     */
    function register(RegisterRequest calldata req) external nonReentrant {
        // Get price in USDC
        (, uint256 priceUsd18, bool isAgentName) = priceOracle.price(req.name);
        uint256 priceUSDC = priceUsd18 / 1e12;

        // Validate
        if (!available(req.name)) revert NameNotAvailable(req.name);

        // Verify commitment if needed
        if (!agentModeEnabled || !isAgentName) {
            _consumeCommitment(req);
        }

        // Transfer USDC
        IERC20(USDC).safeTransferFrom(msg.sender, treasury, priceUSDC);

        // Deploy AA wallet if requested
        address agentWallet = address(0);
        if (req.deployWallet) {
            agentWallet = _deployAgentWallet(req.owner, req.walletSalt, req.name);
        }

        // Execute registration
        uint256 expires = _executeRegistration(req, agentWallet);

        // Update stats
        _updateStats(priceUSDC, isAgentName);

        emit NameRegistered(
            req.name,
            keccak256(bytes(req.name)),
            req.owner,
            priceUSDC,
            isAgentName,
            agentWallet,
            expires
        );
    }

    /**
     * @notice Batch register for agents (USDC, agent names only)
     */
    function batchRegister(RegisterRequest[] calldata requests) external nonReentrant {
        uint256 totalCost = 0;

        // Calculate total and validate
        for (uint256 i = 0; i < requests.length; i++) {
            if (!available(requests[i].name)) revert NameNotAvailable(requests[i].name);

            (, uint256 priceUsd18, bool isAgentName) = priceOracle.price(requests[i].name);
            if (!isAgentName) revert BatchOnlyForAgentNames(requests[i].name);

            totalCost += priceUsd18 / 1e12;
        }

        // Transfer total USDC upfront
        IERC20(USDC).safeTransferFrom(msg.sender, treasury, totalCost);

        // Execute registrations
        for (uint256 i = 0; i < requests.length; i++) {
            (, uint256 priceUsd18, bool isAgentName) = priceOracle.price(requests[i].name);
            uint256 priceUSDC = priceUsd18 / 1e12;

            address agentWallet = address(0);
            if (requests[i].deployWallet) {
                agentWallet = _deployAgentWallet(
                    requests[i].owner,
                    requests[i].walletSalt,
                    requests[i].name
                );
            }

            uint256 expires = _executeRegistration(requests[i], agentWallet);
            _updateStats(priceUSDC, isAgentName);

            emit NameRegistered(
                requests[i].name,
                keccak256(bytes(requests[i].name)),
                requests[i].owner,
                priceUSDC,
                isAgentName,
                agentWallet,
                expires
            );
        }
    }

    // ============ Commit-Reveal ============

    function makeCommitment(RegisterRequest calldata req) public pure returns (bytes32) {
        if (req.data.length > 0 && req.resolver == address(0)) {
            revert ResolverRequiredWhenDataSupplied();
        }
        return keccak256(
            abi.encode(
                keccak256(bytes(req.name)),
                req.owner,
                req.secret,
                req.resolver,
                req.data,
                req.reverseRecord
            )
        );
    }

    function commit(bytes32 commitment) external {
        if (commitments[commitment] + MAX_COMMITMENT_AGE >= block.timestamp) {
            revert UnexpiredCommitmentExists(commitment);
        }
        commitments[commitment] = block.timestamp;
    }

    // ============ Internal Functions ============

    function _deployAgentWallet(
        address owner,
        uint256 salt,
        string calldata domainName
    ) internal returns (address wallet) {
        wallet = accountFactory.createAccount(owner, salt);
        emit AgentWalletDeployed(owner, wallet, domainName);
    }

    function _executeRegistration(
        RegisterRequest calldata req,
        address agentWallet
    ) internal returns (uint256 expires) {
        bytes32 labelHash = keccak256(bytes(req.name));

        // If agent wallet deployed, register to that address
        address registrationOwner = agentWallet != address(0) ? agentWallet : req.owner;

        // Register through NameWrapper
        expires = nameWrapper.registerAndWrapETH2LD(
            req.name,
            registrationOwner,
            LIFETIME_DURATION,
            req.resolver,
            0
        );

        // Set resolver records if provided
        if (req.data.length > 0 && req.resolver != address(0)) {
            bytes32 nodehash = keccak256(abi.encodePacked(SAFU_NODE, labelHash));
            IResolver(req.resolver).multicallWithNodeCheck(nodehash, req.data);
        }

        // Set reverse record
        if (req.reverseRecord) {
            reverseRegistrar.setNameForAddr(
                registrationOwner,
                registrationOwner,
                req.resolver,
                string.concat(req.name, ".safu")
            );
        }

        totalRegistrations++;
    }

    function _consumeCommitment(RegisterRequest calldata req) internal {
        bytes32 commitment = makeCommitment(req);

        if (commitments[commitment] + MIN_COMMITMENT_AGE > block.timestamp) {
            revert CommitmentTooNew(commitment);
        }
        if (commitments[commitment] + MAX_COMMITMENT_AGE <= block.timestamp) {
            revert CommitmentTooOld(commitment);
        }

        delete commitments[commitment];
    }

    function _updateStats(uint256 priceUSDC, bool isAgentName) internal {
        totalVolumeUSDC += priceUSDC;
        if (isAgentName) {
            totalAgentRegistrations++;
        }
    }

    // ============ Admin ============

    function setAgentMode(bool enabled) external onlyOwner {
        agentModeEnabled = enabled;
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    function setPriceOracle(address _oracle) external onlyOwner {
        priceOracle = AgentPriceOracle(_oracle);
    }

    function setAccountFactory(address _factory) external onlyOwner {
        accountFactory = IAccountFactory(_factory);
    }

    // ============ ERC-165 ============

    function supportsInterface(bytes4 interfaceID) external pure override returns (bool) {
        return interfaceID == type(IERC165).interfaceId;
    }
}
