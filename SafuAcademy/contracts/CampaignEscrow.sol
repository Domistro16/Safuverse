// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title CampaignEscrow
 * @notice Escrow contract for campaign prize pools and leaderboard reward distribution.
 * @dev Owner controls campaign lifecycle and can distribute rewards after campaign close.
 */
contract CampaignEscrow is Ownable {
    using SafeERC20 for IERC20;

    struct Campaign {
        address sponsor;
        address rewardToken;
        uint256 endTimestamp;
        uint256 totalFunded;
        uint256 totalDistributed;
        bool isClosed;
    }

    uint256 public campaignCounter;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => bool)) public hasReceivedReward;

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed sponsor,
        address indexed rewardToken,
        uint256 endTimestamp
    );
    event CampaignFunded(uint256 indexed campaignId, uint256 amount, uint256 totalFunded);
    event CampaignClosed(uint256 indexed campaignId, uint256 closedAt);
    event RewardDistributed(
        uint256 indexed campaignId,
        address indexed recipient,
        uint256 rank,
        uint256 amount
    );
    event BatchDistributed(
        uint256 indexed campaignId,
        uint256 recipientCount,
        uint256 totalAmount
    );

    error InvalidAddress();
    error InvalidTimestamp();
    error CampaignNotFound();
    error CampaignAlreadyClosed();
    error CampaignStillActive();
    error LengthMismatch();
    error EmptyDistribution();
    error DuplicateRecipient();
    error InvalidAmount();
    error InsufficientEscrowBalance();

    constructor(address owner_) Ownable(owner_) {
        if (owner_ == address(0)) revert InvalidAddress();
    }

    function createCampaign(
        address sponsor,
        address rewardToken,
        uint256 endTimestamp
    ) external onlyOwner returns (uint256) {
        if (sponsor == address(0) || rewardToken == address(0)) revert InvalidAddress();
        if (endTimestamp <= block.timestamp) revert InvalidTimestamp();

        uint256 campaignId = campaignCounter;
        campaignCounter += 1;

        campaigns[campaignId] = Campaign({
            sponsor: sponsor,
            rewardToken: rewardToken,
            endTimestamp: endTimestamp,
            totalFunded: 0,
            totalDistributed: 0,
            isClosed: false
        });

        emit CampaignCreated(campaignId, sponsor, rewardToken, endTimestamp);
        return campaignId;
    }

    function fundCampaign(uint256 campaignId, uint256 amount) external onlyOwner {
        if (amount == 0) revert InvalidAmount();

        Campaign storage campaign = campaigns[campaignId];
        if (campaign.rewardToken == address(0)) revert CampaignNotFound();
        if (campaign.isClosed) revert CampaignAlreadyClosed();

        IERC20(campaign.rewardToken).safeTransferFrom(msg.sender, address(this), amount);
        campaign.totalFunded += amount;

        emit CampaignFunded(campaignId, amount, campaign.totalFunded);
    }

    function closeCampaign(uint256 campaignId) external onlyOwner {
        Campaign storage campaign = campaigns[campaignId];
        if (campaign.rewardToken == address(0)) revert CampaignNotFound();
        if (campaign.isClosed) revert CampaignAlreadyClosed();
        if (block.timestamp < campaign.endTimestamp) revert CampaignStillActive();

        campaign.isClosed = true;
        emit CampaignClosed(campaignId, block.timestamp);
    }

    /**
     * @notice Distribute rewards by leaderboard rank after campaign closes.
     * @param campaignId Campaign identifier.
     * @param recipients Recipient wallet addresses in leaderboard order.
     * @param ranks Rank values corresponding to each recipient.
     * @param amounts Reward amounts corresponding to each recipient.
     */
    function distribute(
        uint256 campaignId,
        address[] calldata recipients,
        uint256[] calldata ranks,
        uint256[] calldata amounts
    ) external onlyOwner {
        if (recipients.length == 0) revert EmptyDistribution();
        if (recipients.length != ranks.length || recipients.length != amounts.length) {
            revert LengthMismatch();
        }

        Campaign storage campaign = campaigns[campaignId];
        if (campaign.rewardToken == address(0)) revert CampaignNotFound();
        if (!campaign.isClosed) revert CampaignStillActive();

        uint256 totalAmount;
        for (uint256 i = 0; i < recipients.length; i++) {
            address recipient = recipients[i];
            uint256 amount = amounts[i];
            uint256 rank = ranks[i];

            if (recipient == address(0)) revert InvalidAddress();
            if (rank == 0 || amount == 0) revert InvalidAmount();
            if (hasReceivedReward[campaignId][recipient]) revert DuplicateRecipient();

            totalAmount += amount;
        }

        uint256 remaining = campaign.totalFunded - campaign.totalDistributed;
        if (totalAmount > remaining) revert InsufficientEscrowBalance();

        IERC20 token = IERC20(campaign.rewardToken);
        for (uint256 i = 0; i < recipients.length; i++) {
            hasReceivedReward[campaignId][recipients[i]] = true;
            token.safeTransfer(recipients[i], amounts[i]);

            emit RewardDistributed(campaignId, recipients[i], ranks[i], amounts[i]);
        }

        campaign.totalDistributed += totalAmount;
        emit BatchDistributed(campaignId, recipients.length, totalAmount);
    }

    function remainingBalance(uint256 campaignId) external view returns (uint256) {
        Campaign storage campaign = campaigns[campaignId];
        if (campaign.rewardToken == address(0)) revert CampaignNotFound();

        return campaign.totalFunded - campaign.totalDistributed;
    }
}
