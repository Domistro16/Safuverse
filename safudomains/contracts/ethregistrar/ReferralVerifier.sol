// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ReferralVerifier is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    using SafeERC20 for IERC20;

    // ============ Constants ============
    uint256 public constant BASE_PCT = 25;
    uint256 public constant BONUS_PCT = 30;
    uint256 public constant BONUS_THRESHOLD = 5;

    // ============ State ============
    address public signer;
    mapping(bytes32 => bool) public usedNonces;
    mapping(address => uint256) public referralCount;

    // Earnings tracking (in USD with 18 decimals for precision)
    mapping(address => uint256) public totalEarningsUsd;

    // Fiat tracking
    uint256 public untrackedFiatEarnings;
    mapping(address => uint256) public pendingFiatEarnings;

    // ============ Events ============
    event ReferralPaid(
        address indexed referrer,
        address indexed registrant,
        bytes32 indexed nameHash,
        uint256 amount,
        uint256 amountUsd,
        address token,
        bool isFiat
    );
    event SignerUpdated(address oldSigner, address newSigner);
    event ExcessRefunded(address indexed to, uint256 amount);

    // ============ Errors ============
    error InvalidSignature();
    error ExpiredSignature();
    error NonceAlreadyUsed();
    error SelfReferral();
    error InvalidAddress();
    error TransferFailed();

    // ============ Structs ============
    struct ReferralData {
        address referrer;
        address registrant;
        bytes32 nameHash;
        uint256 deadline;
        bytes32 nonce;
    }

    constructor(address _signer) {
        if (_signer == address(0)) revert InvalidAddress();
        signer = _signer;
    }

    // ============ Admin ============
    
    function setSigner(address _signer) external onlyOwner {
        if (_signer == address(0)) revert InvalidAddress();
        emit SignerUpdated(signer, _signer);
        signer = _signer;
    }

    // ============ Core Functions ============

    function processReferral(
        ReferralData calldata data,
        bytes calldata signature,
        uint256 totalPrice,
        uint256 totalPriceUsd,
        address token,
        bool isFiat
    ) external payable returns (uint256 paidAmount) {
        // Skip if no referrer
        if (data.referrer == address(0)) {
            // Refund any ETH sent
            if (msg.value > 0) {
                (bool refunded, ) = payable(msg.sender).call{value: msg.value}("");
                require(refunded, "Refund failed");
            }
            return 0;
        }
        
        // Validations
        if (data.referrer == data.registrant) revert SelfReferral();
        if (block.timestamp > data.deadline) revert ExpiredSignature();
        if (usedNonces[data.nonce]) revert NonceAlreadyUsed();

        // Verify signature
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                data.referrer,
                data.registrant,
                data.nameHash,
                data.deadline,
                data.nonce,
                block.chainid,
                address(this)
            )
        );
        
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = ethSignedHash.recover(signature);
        
        if (recoveredSigner != signer) revert InvalidSignature();

        // Mark nonce as used
        usedNonces[data.nonce] = true;

        // Calculate payout based on referrer's tier
        uint256 pct = referralCount[data.referrer] >= BONUS_THRESHOLD ? BONUS_PCT : BASE_PCT;
        paidAmount = (totalPrice * pct) / 100;
        uint256 paidAmountUsd = (totalPriceUsd * pct) / 100;

        // Increment referral count and track USD earnings
        referralCount[data.referrer]++;
        totalEarningsUsd[data.referrer] += paidAmountUsd;

        // Process payment based on type
        if (isFiat) {
            // Fiat payment - just track, pay later in batch
            pendingFiatEarnings[data.referrer] += paidAmount;
            untrackedFiatEarnings += paidAmount;
        } else if (token == address(0)) {
            // Native ETH payment
            require(msg.value >= paidAmount, "Insufficient ETH for referral");
            
            // Pay referrer
            (bool success, ) = payable(data.referrer).call{value: paidAmount}("");
            if (!success) revert TransferFailed();
            
            // Refund excess to caller (the registrar controller)
            uint256 excess = msg.value - paidAmount;
            if (excess > 0) {
                (bool refunded, ) = payable(msg.sender).call{value: excess}("");
                require(refunded, "Excess refund failed");
                emit ExcessRefunded(msg.sender, excess);
            }
        } else {
            // ERC20 payment - tokens should already be in this contract
            uint256 balance = IERC20(token).balanceOf(address(this));
            require(balance >= paidAmount, "Insufficient tokens for referral");
            
            IERC20(token).safeTransfer(data.referrer, paidAmount);
            
            // Return excess tokens to caller
            uint256 excessTokens = balance - paidAmount;
            if (excessTokens > 0) {
                IERC20(token).safeTransfer(msg.sender, excessTokens);
            }
        }

        emit ReferralPaid(
            data.referrer,
            data.registrant,
            data.nameHash,
            paidAmount,
            paidAmountUsd,
            token,
            isFiat
        );

        return paidAmount;
    }

    /// @notice Batch distribute fiat earnings
    function distributeFiatEarnings(
        address[] calldata referrers,
        uint256[] calldata amounts
    ) external payable onlyOwner {
        require(referrers.length == amounts.length, "Length mismatch");
        
        uint256 totalDistributed = 0;
        
        for (uint256 i = 0; i < referrers.length; i++) {
            address referrer = referrers[i];
            uint256 amount = amounts[i];
            
            // Cap at pending amount
            if (amount > pendingFiatEarnings[referrer]) {
                amount = pendingFiatEarnings[referrer];
            }
            
            if (amount > 0) {
                pendingFiatEarnings[referrer] -= amount;
                totalDistributed += amount;
                
                (bool success, ) = payable(referrer).call{value: amount}("");
                require(success, "Transfer failed");
            }
        }
        
        untrackedFiatEarnings -= totalDistributed;
    }

    // ============ View Functions ============

    function getReferralPct(address referrer) external view returns (uint256) {
        return referralCount[referrer] >= BONUS_THRESHOLD ? BONUS_PCT : BASE_PCT;
    }

    function verifySignature(
        ReferralData calldata data,
        bytes calldata signature
    ) external view returns (bool) {
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                data.referrer,
                data.registrant,
                data.nameHash,
                data.deadline,
                data.nonce,
                block.chainid,
                address(this)
            )
        );
        
        bytes32 ethSignedHash = messageHash.toEthSignedMessageHash();
        return ethSignedHash.recover(signature) == signer;
    }

    // ============ Emergency ============
    
    function withdrawStuckETH() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    function withdrawStuckTokens(address token) external onlyOwner {
        IERC20(token).safeTransfer(owner(), IERC20(token).balanceOf(address(this)));
    }

    receive() external payable {}
}