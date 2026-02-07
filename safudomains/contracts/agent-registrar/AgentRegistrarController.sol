// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {IAgentRegistrar} from "./interfaces/IAgentRegistrar.sol";
import {IAgentPriceOracle} from "./interfaces/IAgentPriceOracle.sol";
import {
    BaseRegistrarImplementation
} from "../ethregistrar/BaseRegistrarImplementation.sol";
import {StringUtils} from "../utils/StringUtils.sol";
import {Resolver} from "../resolvers/Resolver.sol";
import {ReverseRegistrar} from "../reverseRegistrar/ReverseRegistrar.sol";
import {INameWrapper} from "../wrapper/INameWrapper.sol";
import {ReverseClaimer} from "../reverseRegistrar/ReverseClaimer.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {IERC165} from "@openzeppelin/contracts/utils/introspection/IERC165.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    IERC20Permit
} from "@openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {
    ReentrancyGuard
} from "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import {ReferralVerifier} from "../ethregistrar/ReferralVerifier.sol";

// ERC-4337 Account Factory interface
interface IAccountFactory {
    function createAccount(
        address owner,
        uint256 salt
    ) external returns (address);
    function getAddress(
        address owner,
        uint256 salt
    ) external view returns (address);
}

// Custom errors
error CommitmentTooNew(bytes32 commitment);
error CommitmentTooOld(bytes32 commitment);
error NameNotAvailable(string name);
error ResolverRequiredWhenDataSupplied();
error UnexpiredCommitmentExists(bytes32 commitment);
error InsufficientValue();
error InsufficientUSDC();
error InvalidName(string name);
error BatchTooLarge(uint256 count);
error BatchOnlyForAgentNames(string name);

/**
 * @title AgentRegistrarController
 * @notice Agent-first domain registration controller with lifetime-only pricing
 * @dev Supports USDC-only payments, ERC-4337 Account Abstraction,
 *      Circle Paymaster for gasless transactions, and optional AA wallet deployment.
 *      No renewal functions - all registrations are lifetime (100 years).
 *
 * Key Features:
 * - ETH and USDC payments
 * - EIP-2612 permit for gasless USDC approval
 * - ERC-4337 Account Abstraction compatible
 * - Optional AA wallet deployment with domain mint
 * - Works with Circle Paymaster for gas sponsorship
 */
contract AgentRegistrarController is
    IAgentRegistrar,
    Ownable,
    IERC165,
    ReverseClaimer,
    ReentrancyGuard
{
    using StringUtils for *;
    using Address for address;
    using SafeERC20 for IERC20;

    // ============ Constants ============

    /// @notice Lifetime duration: 100 years in seconds
    uint256 public constant LIFETIME_DURATION = 100 * 365 days;

    /// @notice Maximum names in a single batch registration
    uint256 public constant MAX_BATCH_SIZE = 50;

    /// @notice Minimum commitment age (10 minutes)
    uint256 public constant MIN_COMMITMENT_AGE = 10 minutes;

    /// @notice Maximum commitment age (24 hours)
    uint256 public constant MAX_COMMITMENT_AGE = 24 hours;

    // ============ State Variables ============

    BaseRegistrarImplementation public immutable base;
    IAgentPriceOracle public immutable prices;
    ReverseRegistrar public immutable reverseRegistrar;
    INameWrapper public immutable nameWrapper;

    /// @notice USDC token address on Base
    IERC20 public immutable usdc;

    /// @notice ReferralVerifier for referral rewards
    ReferralVerifier public referralVerifier;

    /// @notice Max referral percentage (30%)
    uint256 public constant MAX_REFERRAL_PCT = 30;

    /// @notice Mapping of commitments to timestamps
    mapping(bytes32 => uint256) public commitments;

    /// @notice Whether to skip commit-reveal for agent names
    bool public agentModeEnabled;

    /// @notice Total number of names minted
    uint256 public totalMints;

    /// @notice Account factory for deploying AA wallets
    IAccountFactory public accountFactory;

    /// @notice Treasury address for USDC payments
    address public treasury;

    /// @notice Total USDC volume processed (6 decimals)
    uint256 public totalVolumeUSDC;

    /// @notice Total agent-specific registrations
    uint256 public totalAgentRegistrations;

    // ============ Events ============

    event CommitmentMade(bytes32 indexed commitment, address indexed sender);
    event AgentModeToggled(bool enabled);
    event FundsWithdrawn(address indexed to, uint256 amount);
    event USDCWithdrawn(address indexed to, uint256 amount);

    // ============ Constructor ============

    constructor(
        BaseRegistrarImplementation _base,
        IAgentPriceOracle _prices,
        ReverseRegistrar _reverseRegistrar,
        INameWrapper _nameWrapper,
        IERC20 _usdc,
        ReferralVerifier _referralVerifier
    ) ReverseClaimer(_base.ens(), msg.sender) {
        base = _base;
        prices = _prices;
        reverseRegistrar = _reverseRegistrar;
        nameWrapper = _nameWrapper;
        usdc = _usdc;
        referralVerifier = _referralVerifier;
        agentModeEnabled = true; // Enable agent mode by default
        treasury = msg.sender; // Default treasury to deployer
    }

    // ============ Admin Functions ============

    /**
     * @notice Toggle agent mode (skip commit-reveal for agent names)
     */
    function setAgentMode(bool enabled) external onlyOwner {
        agentModeEnabled = enabled;
        emit AgentModeToggled(enabled);
    }

    /**
     * @notice Withdraw ETH from the contract
     */
    function withdraw(address payable to) external onlyOwner {
        uint256 balance = address(this).balance;
        to.transfer(balance);
        emit FundsWithdrawn(to, balance);
    }

    /**
     * @notice Withdraw USDC from the contract
     */
    function withdrawUSDC(address to) external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        usdc.safeTransfer(to, balance);
        emit USDCWithdrawn(to, balance);
    }

    /**
     * @notice Set the referral verifier contract
     */
    function setReferralVerifier(address _verifier) external onlyOwner {
        referralVerifier = ReferralVerifier(payable(_verifier));
    }

    /**
     * @notice Set the account factory for AA wallet deployment
     */
    function setAccountFactory(address _factory) external onlyOwner {
        accountFactory = IAccountFactory(_factory);
    }

    /**
     * @notice Set the treasury address for USDC payments
     */
    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    // ============ External View Functions ============

    /**
     * @inheritdoc IAgentRegistrar
     */
    function available(
        string calldata name
    ) external view override returns (bool) {
        bytes32 label = keccak256(bytes(name));
        return valid(name) && base.available(uint256(label));
    }

    /**
     * @inheritdoc IAgentRegistrar
     */
    function valid(string calldata name) public pure override returns (bool) {
        return name.strlen() >= 1;
    }

    /**
     * @notice Get the rent price for a name (ETH + USD)
     */
    function rentPrice(
        string calldata name
    )
        external
        view
        returns (uint256 priceWei, uint256 priceUsd, bool isAgentName)
    {
        IAgentPriceOracle.AgentPrice memory price = prices.getPrice(name);
        return (price.priceWei, price.priceUsd, price.isAgentName);
    }

    /**
     * @inheritdoc IAgentRegistrar
     */
    function getPrice(
        string calldata name
    ) external view override returns (uint256 priceUSDC, bool isAgentName) {
        IAgentPriceOracle.AgentPrice memory price = prices.getPrice(name);
        // Convert from 18 decimals to 6 decimals (USDC)
        priceUSDC = price.priceUsd / 1e12;
        isAgentName = price.isAgentName;
    }

    /**
     * @inheritdoc IAgentRegistrar
     */
    function getWalletAddress(
        address owner,
        uint256 salt
    ) external view override returns (address) {
        require(address(accountFactory) != address(0), "No account factory");
        return accountFactory.getAddress(owner, salt);
    }

    /**
     * @inheritdoc IAgentRegistrar
     */
    function makeCommitment(
        RegisterRequest calldata req
    ) public pure override returns (bytes32) {
        if (req.data.length > 0 && req.resolver == address(0)) {
            revert ResolverRequiredWhenDataSupplied();
        }
        return
            keccak256(
                abi.encode(
                    req.name,
                    req.owner,
                    req.secret,
                    req.resolver,
                    req.data,
                    req.reverseRecord,
                    req.ownerControlledFuses
                )
            );
    }

    // ============ External Functions ============

    /**
     * @inheritdoc IAgentRegistrar
     */
    function commit(bytes32 commitment) external override {
        if (commitments[commitment] + MAX_COMMITMENT_AGE >= block.timestamp) {
            revert UnexpiredCommitmentExists(commitment);
        }
        commitments[commitment] = block.timestamp;
        emit CommitmentMade(commitment, msg.sender);
    }

    /**
     * @inheritdoc IAgentRegistrar
     */
    function register(
        RegisterRequest calldata req,
        ReferralVerifier.ReferralData calldata referralData,
        bytes calldata referralSignature
    ) external payable override {
        uint256 cost = _executeRegistration(req);

        if (msg.value < cost) {
            revert InsufficientValue();
        }

        // Handle referral reward
        _handleReferral(referralData, referralSignature, cost);

        // Refund excess
        if (msg.value > cost) {
            payable(msg.sender).transfer(msg.value - cost);
        }

        totalMints++;
    }

    /**
     * @inheritdoc IAgentRegistrar
     */
    function registerWithUSDC(
        RegisterRequest calldata req
    ) external override nonReentrant {
        IAgentPriceOracle.AgentPrice memory price = prices.getPrice(req.name);

        // USDC has 6 decimals, priceUsd has 18 decimals
        uint256 usdcAmount = price.priceUsd / 1e12;

        // Transfer USDC to treasury (or contract if no treasury set)
        address recipient = treasury != address(0) ? treasury : address(this);
        usdc.safeTransferFrom(msg.sender, recipient, usdcAmount);

        _executeRegistrationInternal(req, price.isAgentName);

        // Deploy AA wallet if requested
        if (req.deployWallet && address(accountFactory) != address(0)) {
            _deployAgentWallet(req.owner, req.walletSalt, req.name);
        }

        // Update USDC stats
        totalVolumeUSDC += usdcAmount;
        if (price.isAgentName) {
            totalAgentRegistrations++;
        }

        totalMints++;
    }

    /**
     * @inheritdoc IAgentRegistrar
     */
    function registerWithPermit(
        RegisterRequest calldata req,
        PermitData calldata permit
    ) external override nonReentrant {
        IAgentPriceOracle.AgentPrice memory price = prices.getPrice(req.name);
        uint256 usdcAmount = price.priceUsd / 1e12;

        // Execute permit (gasless USDC approval)
        try
            IERC20Permit(address(usdc)).permit(
                msg.sender,
                address(this),
                usdcAmount,
                permit.deadline,
                permit.v,
                permit.r,
                permit.s
            )
        {} catch {
            // Permit might already be used or pre-approved
        }
        // Transfer USDC to treasury (or contract if no treasury set)
        address recipient = treasury != address(0) ? treasury : address(this);
        usdc.safeTransferFrom(msg.sender, recipient, usdcAmount);

        _executeRegistrationInternal(req, price.isAgentName);

        // Deploy AA wallet if requested
        if (req.deployWallet && address(accountFactory) != address(0)) {
            _deployAgentWallet(req.owner, req.walletSalt, req.name);
        }

        // Update USDC stats
        totalVolumeUSDC += usdcAmount;
        if (price.isAgentName) {
            totalAgentRegistrations++;
        }

        totalMints++;
    }

    /**
     * @inheritdoc IAgentRegistrar
     */
    function batchRegisterWithUSDC(
        RegisterRequest[] calldata requests
    ) external override nonReentrant {
        if (requests.length > MAX_BATCH_SIZE) {
            revert BatchTooLarge(requests.length);
        }

        uint256 totalCost = 0;

        // Calculate total and validate all are agent names
        for (uint256 i = 0; i < requests.length; i++) {
            IAgentPriceOracle.AgentPrice memory price = prices.getPrice(
                requests[i].name
            );
            if (!price.isAgentName) {
                revert BatchOnlyForAgentNames(requests[i].name);
            }
            totalCost += price.priceUsd / 1e12;
        }

        // Transfer total USDC upfront
        address recipient = treasury != address(0) ? treasury : address(this);
        usdc.safeTransferFrom(msg.sender, recipient, totalCost);

        // Execute registrations
        for (uint256 i = 0; i < requests.length; i++) {
            IAgentPriceOracle.AgentPrice memory price = prices.getPrice(
                requests[i].name
            );

            _executeRegistrationInternal(requests[i], price.isAgentName);

            // Deploy AA wallet if requested
            if (
                requests[i].deployWallet &&
                address(accountFactory) != address(0)
            ) {
                _deployAgentWallet(
                    requests[i].owner,
                    requests[i].walletSalt,
                    requests[i].name
                );
            }

            totalAgentRegistrations++;
        }

        totalVolumeUSDC += totalCost;
        totalMints += requests.length;

        emit BatchRegistered(requests.length, msg.sender, totalCost);
    }

    /**
     * @inheritdoc IAgentRegistrar
     */
    function batchRegister(
        RegisterRequest[] calldata requests
    ) external payable override {
        if (requests.length > MAX_BATCH_SIZE) {
            revert BatchTooLarge(requests.length);
        }

        uint256 totalCost = 0;

        for (uint256 i = 0; i < requests.length; i++) {
            totalCost += _executeRegistration(requests[i]);
        }

        if (msg.value < totalCost) {
            revert InsufficientValue();
        }

        // Refund excess
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }

        totalMints += requests.length;

        emit BatchRegistered(requests.length, msg.sender, totalCost);
    }

    // ============ IERC165 ============

    function supportsInterface(
        bytes4 interfaceID
    ) public pure override returns (bool) {
        return
            interfaceID == type(IERC165).interfaceId ||
            interfaceID == type(IAgentRegistrar).interfaceId;
    }

    // ============ Internal Functions ============

    /**
     * @notice Deploy an AA wallet for an agent via the account factory
     */
    function _deployAgentWallet(
        address owner,
        uint256 salt,
        string calldata domainName
    ) internal returns (address wallet) {
        wallet = accountFactory.createAccount(owner, salt);
        emit AgentWalletDeployed(owner, wallet, domainName);
    }

    /**
     * @notice Execute a single registration with ETH payment
     */
    function _executeRegistration(
        RegisterRequest calldata req
    ) internal returns (uint256 cost) {
        IAgentPriceOracle.AgentPrice memory price = prices.getPrice(req.name);
        cost = price.priceWei;

        _executeRegistrationInternal(req, price.isAgentName);

        // Deploy AA wallet if requested
        if (req.deployWallet && address(accountFactory) != address(0)) {
            _deployAgentWallet(req.owner, req.walletSalt, req.name);
        }

        return cost;
    }

    /**
     * @notice Internal registration logic
     */
    function _executeRegistrationInternal(
        RegisterRequest calldata req,
        bool isAgentName
    ) internal {
        // Validate name
        if (!valid(req.name)) {
            revert InvalidName(req.name);
        }

        bytes32 label = keccak256(bytes(req.name));

        // Check availability
        if (!base.available(uint256(label))) {
            revert NameNotAvailable(req.name);
        }

        // Check commitment (skip for agent names if agent mode is enabled)
        if (!(agentModeEnabled && isAgentName)) {
            bytes32 commitment = makeCommitment(req);
            _validateCommitment(commitment);
            delete commitments[commitment];
        }

        // Register through name wrapper (lifetime = 100 years)
        uint256 expires = nameWrapper.registerAndWrapETH2LD(
            req.name,
            req.owner,
            LIFETIME_DURATION,
            req.resolver,
            req.ownerControlledFuses
        );

        // Set resolver records if provided
        if (req.data.length > 0) {
            _setRecords(req.resolver, label, req.data);
        }

        // Set reverse record if requested
        if (req.reverseRecord) {
            _setReverseRecord(req.name, req.resolver, msg.sender);
        }

        emit NameRegistered(
            req.name,
            label,
            req.owner,
            expires,
            0 // No premium
        );
    }

    /**
     * @notice Validate a commitment
     */
    function _validateCommitment(bytes32 commitment) internal view {
        uint256 commitmentTime = commitments[commitment];

        if (commitmentTime + MIN_COMMITMENT_AGE > block.timestamp) {
            revert CommitmentTooNew(commitment);
        }

        if (commitmentTime + MAX_COMMITMENT_AGE <= block.timestamp) {
            revert CommitmentTooOld(commitment);
        }
    }

    /**
     * @notice Set resolver records
     */
    function _setRecords(
        address resolver,
        bytes32 label,
        bytes[] calldata data
    ) internal {
        bytes32 nodehash = keccak256(abi.encodePacked(base.baseNode(), label));
        for (uint256 i = 0; i < data.length; i++) {
            // Resolver must be the new name's resolver
            resolver.functionCall(data[i]);
        }
    }

    /**
     * @notice Set reverse record
     */
    function _setReverseRecord(
        string calldata name,
        address resolver,
        address owner
    ) internal {
        reverseRegistrar.setNameForAddr(
            owner,
            owner,
            resolver,
            string.concat(name, ".safu")
        );
    }

    /**
     * @notice Handle referral reward for registration
     */
    function _handleReferral(
        ReferralVerifier.ReferralData calldata referralData,
        bytes calldata referralSignature,
        uint256 totalPrice
    ) internal {
        if (
            address(referralVerifier) == address(0) ||
            referralData.referrer == address(0) ||
            referralSignature.length == 0
        ) return;

        uint256 amount = (totalPrice * MAX_REFERRAL_PCT) / 100;

        referralVerifier.processReferral{value: amount}(
            referralData,
            referralSignature,
            totalPrice,
            address(0), // ETH payment
            false // not fiat
        );
    }

    // ============ Receive ============

    receive() external payable {}
}
