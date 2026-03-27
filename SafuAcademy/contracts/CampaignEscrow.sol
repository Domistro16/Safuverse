// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface IPartnerCampaigns {
    function getUserCampaignPoints(
        uint256 campaignId,
        address user
    ) external view returns (uint256);

    function getCampaignSponsor(
        uint256 campaignId
    ) external view returns (address);
}

/**
 * @title CampaignEscrow
 * @notice Escrow contract for partner campaign prize pools (USDC).
 * @dev Holds USDC deposited by partner projects. After a campaign ends, participants
 *      claim their rewards via Merkle proofs. Supports gasless claims through EIP-712
 *      signatures — a relayer submits the claim on behalf of the user.
 *
 * Flow:
 * 1. Owner creates an escrow campaign linked to a PartnerCampaigns campaign ID
 * 2. Sponsor (or anyone) funds the campaign with USDC
 * 3. Campaign runs, points accumulate in PartnerCampaigns
 * 4. After endTimestamp, owner closes the campaign
 * 5. Owner sets the claim Merkle root (computed off-chain from final leaderboard)
 * 6. Participants claim USDC by providing their Merkle proof — directly or via relayer
 * 7. Sponsor can withdraw any remaining funds after a grace period
 */
contract CampaignEscrow is Ownable, EIP712 {
    using SafeERC20 for IERC20;

    struct EscrowCampaign {
        uint256 partnerCampaignId;
        address sponsor;
        uint256 totalFunded;
        uint256 totalDistributed;
        uint256 endTimestamp;
        bool isClosed;
    }

    // EIP-712 typehash for gasless claim authorization
    bytes32 public constant CLAIM_TYPEHASH =
        keccak256("ClaimReward(uint256 escrowId,address claimer,uint256 amount,uint256 deadline)");

    IERC20 public immutable usdc;
    IPartnerCampaigns public partnerCampaigns;

    uint256 public campaignCounter;
    mapping(uint256 => EscrowCampaign) public campaigns;
    mapping(uint256 => mapping(address => bool)) public hasReceivedReward;

    // Merkle claim roots per campaign
    mapping(uint256 => bytes32) public claimRoots;

    event CampaignCreated(
        uint256 indexed escrowId,
        uint256 indexed partnerCampaignId,
        address indexed sponsor,
        uint256 endTimestamp
    );
    event CampaignFunded(
        uint256 indexed escrowId,
        address indexed funder,
        uint256 amount,
        uint256 totalFunded
    );
    event CampaignClosed(uint256 indexed escrowId, uint256 closedAt);
    event ClaimRootSet(uint256 indexed escrowId, bytes32 merkleRoot);
    event RewardClaimed(
        uint256 indexed escrowId,
        address indexed claimer,
        uint256 amount
    );
    event RewardDistributed(
        uint256 indexed escrowId,
        address indexed recipient,
        uint256 rank,
        uint256 amount
    );
    event BatchDistributed(
        uint256 indexed escrowId,
        uint256 recipientCount,
        uint256 totalAmount
    );
    event PartnerCampaignsUpdated(
        address indexed oldAddress,
        address indexed newAddress
    );
    event SponsorWithdrawal(
        uint256 indexed escrowId,
        address indexed sponsor,
        uint256 amount
    );

    error InvalidAddress();
    error InvalidTimestamp();
    error InvalidAmount();
    error CampaignNotFound();
    error CampaignAlreadyClosed();
    error CampaignStillActive();
    error NotSponsorOrOwner();
    error LengthMismatch();
    error EmptyDistribution();
    error DuplicateRecipient();
    error InsufficientEscrowBalance();
    error InvalidRankingOrder();
    error NothingToWithdraw();
    error ClaimRootNotSet();
    error InvalidMerkleProof();
    error AlreadyClaimed();
    error SignatureExpired();
    error InvalidSignature();

    modifier onlySponsorOrOwner(uint256 escrowId) {
        EscrowCampaign storage c = campaigns[escrowId];
        if (msg.sender != c.sponsor && msg.sender != owner())
            revert NotSponsorOrOwner();
        _;
    }

    constructor(
        address _owner,
        address _usdc,
        address _partnerCampaigns
    ) Ownable(_owner) EIP712("CampaignEscrow", "1") {
        if (_owner == address(0) || _usdc == address(0))
            revert InvalidAddress();
        usdc = IERC20(_usdc);
        if (_partnerCampaigns != address(0)) {
            partnerCampaigns = IPartnerCampaigns(_partnerCampaigns);
        }
    }

    // ============ OWNER-ONLY ADMIN FUNCTIONS ============

    function setPartnerCampaigns(
        address _partnerCampaigns
    ) external onlyOwner {
        address old = address(partnerCampaigns);
        partnerCampaigns = IPartnerCampaigns(_partnerCampaigns);
        emit PartnerCampaignsUpdated(old, _partnerCampaigns);
    }

    function createCampaign(
        uint256 _partnerCampaignId,
        address _sponsor,
        uint256 _endTimestamp
    ) external onlyOwner returns (uint256) {
        if (_sponsor == address(0)) revert InvalidAddress();
        if (_endTimestamp <= block.timestamp) revert InvalidTimestamp();

        uint256 id = campaignCounter++;

        campaigns[id] = EscrowCampaign({
            partnerCampaignId: _partnerCampaignId,
            sponsor: _sponsor,
            totalFunded: 0,
            totalDistributed: 0,
            endTimestamp: _endTimestamp,
            isClosed: false
        });

        emit CampaignCreated(id, _partnerCampaignId, _sponsor, _endTimestamp);
        return id;
    }

    function closeCampaign(uint256 escrowId) external onlyOwner {
        EscrowCampaign storage c = campaigns[escrowId];
        if (c.sponsor == address(0)) revert CampaignNotFound();
        if (c.isClosed) revert CampaignAlreadyClosed();
        if (block.timestamp < c.endTimestamp) revert CampaignStillActive();

        c.isClosed = true;
        emit CampaignClosed(escrowId, block.timestamp);
    }

    /// @notice Set the Merkle root for reward claims (computed off-chain from final leaderboard)
    /// @param escrowId Escrow campaign identifier
    /// @param _merkleRoot Root of the Merkle tree of (claimer, amount) leaves
    function setClaimRoot(
        uint256 escrowId,
        bytes32 _merkleRoot
    ) external onlyOwner {
        EscrowCampaign storage c = campaigns[escrowId];
        if (c.sponsor == address(0)) revert CampaignNotFound();
        if (!c.isClosed) revert CampaignStillActive();

        claimRoots[escrowId] = _merkleRoot;
        emit ClaimRootSet(escrowId, _merkleRoot);
    }

    // ============ FUNDING ============

    /// @notice Fund a campaign's prize pool with USDC
    /// @dev Caller must have approved this contract to spend USDC
    function fundCampaign(uint256 escrowId, uint256 amount) external {
        if (amount == 0) revert InvalidAmount();

        EscrowCampaign storage c = campaigns[escrowId];
        if (c.sponsor == address(0)) revert CampaignNotFound();
        if (c.isClosed) revert CampaignAlreadyClosed();

        usdc.safeTransferFrom(msg.sender, address(this), amount);
        c.totalFunded += amount;

        emit CampaignFunded(escrowId, msg.sender, amount, c.totalFunded);
    }

    // ============ USER CLAIMS (Merkle-based) ============

    /**
     * @notice Claim USDC reward directly (user pays gas).
     * @param escrowId Escrow campaign identifier.
     * @param amount USDC reward amount for the caller.
     * @param merkleProof Merkle proof that (msg.sender, amount) is in the claim tree.
     */
    function claimReward(
        uint256 escrowId,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external {
        _executeClaim(escrowId, msg.sender, amount, merkleProof);
    }

    /**
     * @notice Gasless claim — relayer submits on behalf of the user using an EIP-712 signature.
     * @param escrowId Escrow campaign identifier.
     * @param claimer Address of the user claiming the reward (USDC recipient).
     * @param amount USDC reward amount.
     * @param merkleProof Merkle proof that (claimer, amount) is in the claim tree.
     * @param deadline Timestamp after which the signature is no longer valid.
     * @param v ECDSA recovery byte.
     * @param r ECDSA signature component.
     * @param s ECDSA signature component.
     */
    function claimRewardFor(
        uint256 escrowId,
        address claimer,
        uint256 amount,
        bytes32[] calldata merkleProof,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        if (block.timestamp > deadline) revert SignatureExpired();

        bytes32 structHash = keccak256(
            abi.encode(CLAIM_TYPEHASH, escrowId, claimer, amount, deadline)
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = ECDSA.recover(digest, v, r, s);

        if (signer != claimer) revert InvalidSignature();

        _executeClaim(escrowId, claimer, amount, merkleProof);
    }

    /**
     * @dev Internal claim execution — verifies Merkle proof and transfers USDC.
     */
    function _executeClaim(
        uint256 escrowId,
        address claimer,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) internal {
        if (claimer == address(0)) revert InvalidAddress();
        if (amount == 0) revert InvalidAmount();

        EscrowCampaign storage c = campaigns[escrowId];
        if (c.sponsor == address(0)) revert CampaignNotFound();
        if (!c.isClosed) revert CampaignStillActive();

        bytes32 root = claimRoots[escrowId];
        if (root == bytes32(0)) revert ClaimRootNotSet();

        if (hasReceivedReward[escrowId][claimer]) revert AlreadyClaimed();

        // Verify Merkle proof — leaf is hash(claimer, amount)
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(claimer, amount))));
        if (!MerkleProof.verify(merkleProof, root, leaf)) revert InvalidMerkleProof();

        uint256 remaining = c.totalFunded - c.totalDistributed;
        if (amount > remaining) revert InsufficientEscrowBalance();

        hasReceivedReward[escrowId][claimer] = true;
        c.totalDistributed += amount;
        usdc.safeTransfer(claimer, amount);

        emit RewardClaimed(escrowId, claimer, amount);
    }

    // ============ LEGACY DISTRIBUTION (owner/sponsor push) ============

    /**
     * @notice Distribute USDC rewards based on leaderboard ranking (legacy push model).
     * @dev Kept for admin/emergency use. For normal flow, use Merkle claims instead.
     */
    function distribute(
        uint256 escrowId,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external onlySponsorOrOwner(escrowId) {
        if (recipients.length == 0) revert EmptyDistribution();
        if (recipients.length != amounts.length) revert LengthMismatch();

        EscrowCampaign storage c = campaigns[escrowId];
        if (c.sponsor == address(0)) revert CampaignNotFound();
        if (!c.isClosed) revert CampaignStillActive();

        // Verify ranking order against on-chain leaderboard
        if (address(partnerCampaigns) != address(0)) {
            uint256 prevPoints = type(uint256).max;
            for (uint256 i = 0; i < recipients.length; i++) {
                uint256 pts = partnerCampaigns.getUserCampaignPoints(
                    c.partnerCampaignId,
                    recipients[i]
                );
                if (pts > prevPoints) revert InvalidRankingOrder();
                prevPoints = pts;
            }
        }

        // Validate amounts and check for duplicates
        uint256 totalAmount;
        for (uint256 i = 0; i < recipients.length; i++) {
            if (recipients[i] == address(0)) revert InvalidAddress();
            if (amounts[i] == 0) revert InvalidAmount();
            if (hasReceivedReward[escrowId][recipients[i]])
                revert DuplicateRecipient();
            totalAmount += amounts[i];
        }

        uint256 remaining = c.totalFunded - c.totalDistributed;
        if (totalAmount > remaining) revert InsufficientEscrowBalance();

        // Transfer USDC rewards
        for (uint256 i = 0; i < recipients.length; i++) {
            hasReceivedReward[escrowId][recipients[i]] = true;
            usdc.safeTransfer(recipients[i], amounts[i]);

            emit RewardDistributed(
                escrowId,
                recipients[i],
                i + 1,
                amounts[i]
            );
        }

        c.totalDistributed += totalAmount;
        emit BatchDistributed(escrowId, recipients.length, totalAmount);
    }

    /// @notice Withdraw remaining undistributed funds back to sponsor
    function withdrawRemaining(
        uint256 escrowId
    ) external onlySponsorOrOwner(escrowId) {
        EscrowCampaign storage c = campaigns[escrowId];
        if (c.sponsor == address(0)) revert CampaignNotFound();
        if (!c.isClosed) revert CampaignStillActive();

        uint256 remaining = c.totalFunded - c.totalDistributed;
        if (remaining == 0) revert NothingToWithdraw();

        c.totalDistributed = c.totalFunded;
        usdc.safeTransfer(c.sponsor, remaining);

        emit SponsorWithdrawal(escrowId, c.sponsor, remaining);
    }

    // ============ VIEW FUNCTIONS ============

    function remainingBalance(
        uint256 escrowId
    ) external view returns (uint256) {
        EscrowCampaign storage c = campaigns[escrowId];
        if (c.sponsor == address(0)) revert CampaignNotFound();
        return c.totalFunded - c.totalDistributed;
    }

    function getCampaign(
        uint256 escrowId
    ) external view returns (EscrowCampaign memory) {
        if (campaigns[escrowId].sponsor == address(0))
            revert CampaignNotFound();
        return campaigns[escrowId];
    }

    function numCampaigns() external view returns (uint256) {
        return campaignCounter;
    }

    /// @notice Check if a user has already claimed for a campaign
    function hasClaimed(
        uint256 escrowId,
        address user
    ) external view returns (bool) {
        return hasReceivedReward[escrowId][user];
    }

    /// @notice Get the EIP-712 domain separator (useful for frontend signature construction)
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
