// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ILaunchpadStorage.sol";

/**
 * @title ContributionManager
 * @notice Handles contribution state management for PROJECT_RAISE launches
 * @dev Called by LaunchpadManager - does NOT handle token/BNB transfers directly
 */
contract ContributionManager is ReentrancyGuard, Ownable {
    ILaunchpadStorage public immutable storage_;
    address public launchpadManager;

    // ============ Events ============

    event ContributionRecorded(
        address indexed contributor,
        address indexed token,
        uint256 amount
    );
    event ContributorTokensClaimed(
        address indexed contributor,
        address indexed token,
        uint256 amount
    );
    event RefundClaimed(
        address indexed contributor,
        address indexed token,
        uint256 amount
    );

    // ============ Errors ============

    error NotProjectRaise();
    error LaunchDoesNotExist();
    error RaiseEnded();
    error RaiseAlreadyCompleted();
    error MustContributeBNB();
    error ExceedsWalletLimit();
    error ExceedsMaxRaise();
    error RaiseNotCompleted();
    error RaiseFailed();
    error NoContribution();
    error AlreadyClaimed();
    error RaiseStillActive();
    error RaiseWasSuccessful();
    error OnlyLaunchpadManager();

    // ============ Modifiers ============

    modifier onlyLaunchpadManager() {
        if (msg.sender != launchpadManager) revert OnlyLaunchpadManager();
        _;
    }

    constructor(address _storage) Ownable(msg.sender) {
        storage_ = ILaunchpadStorage(_storage);
    }

    function setLaunchpadManager(address _launchpadManager) external onlyOwner {
        require(_launchpadManager != address(0), "Invalid address");
        launchpadManager = _launchpadManager;
    }

    // ============================================================
    // CORE FUNCTIONS (Called by LaunchpadManager)
    // ============================================================

    /**
     * @notice Record a contribution (state only - LaunchpadManager handles BNB)
     * @param token The token address
     * @param contributor The contributor address
     * @param amount The BNB amount contributed
     * @return reachedTarget True if raise target was reached
     */
    function contribute(
        address token,
        address contributor,
        uint256 amount
    ) external onlyLaunchpadManager returns (bool reachedTarget) {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );

        // Validations
        if (basics.launchType != ILaunchpadStorage.LaunchType.PROJECT_RAISE)
            revert NotProjectRaise();
        if (basics.token == address(0)) revert LaunchDoesNotExist();
        if (block.timestamp >= basics.raiseDeadline) revert RaiseEnded();
        if (status.raiseCompleted) revert RaiseAlreadyCompleted();
        if (amount == 0) revert MustContributeBNB();

        // Check per-wallet contribution limit
        ILaunchpadStorage.Contribution memory contrib = storage_
            .getContribution(token, contributor);
        if (contrib.amount + amount > storage_.MAX_CONTRIBUTION_PER_WALLET()) {
            revert ExceedsWalletLimit();
        }

        // Check max raise limit
        if (basics.totalRaised + amount > basics.raiseMax) {
            revert ExceedsMaxRaise();
        }

        // Update contribution in storage
        ILaunchpadStorage.Contribution memory newContrib = ILaunchpadStorage
            .Contribution({amount: contrib.amount + amount, claimed: false});
        storage_.setContribution(token, contributor, newContrib);

        // Update total raised
        uint256 newTotalRaised = basics.totalRaised + amount;
        storage_.updateTotalRaised(token, newTotalRaised);

        emit ContributionRecorded(contributor, token, amount);

        // Return whether target reached
        return newTotalRaised >= basics.raiseTarget;
    }

    /**
     * @notice Mark contributor tokens as claimed (state only)
     * @param token The token address
     * @param contributor The contributor address
     * @return tokensOwed Amount of tokens owed to contributor
     */
    function claimContributorTokens(
        address token,
        address contributor
    ) external onlyLaunchpadManager returns (uint256 tokensOwed) {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );

        // Validations
        if (basics.launchType != ILaunchpadStorage.LaunchType.PROJECT_RAISE)
            revert NotProjectRaise();
        if (!status.raiseCompleted) revert RaiseNotCompleted();
        if (basics.totalRaised < basics.raiseTarget) revert RaiseFailed();

        ILaunchpadStorage.Contribution memory contrib = storage_
            .getContribution(token, contributor);
        if (contrib.amount == 0) revert NoContribution();
        if (contrib.claimed) revert AlreadyClaimed();

        // Calculate proportional share from 20% contributor allocation
        uint256 contributorPool = (basics.totalSupply *
            storage_.CONTRIBUTOR_ALLOCATION()) / 100;
        tokensOwed = (contrib.amount * contributorPool) / basics.totalRaised;

        // Mark as claimed
        storage_.markContributionClaimed(token, contributor);

        emit ContributorTokensClaimed(contributor, token, tokensOwed);

        return tokensOwed;
    }

    /**
     * @notice Mark refund as claimed (state only)
     * @param token The token address
     * @param contributor The contributor address
     * @return refundAmount Amount of BNB to refund
     */
    function claimRefund(
        address token,
        address contributor
    ) external onlyLaunchpadManager returns (uint256 refundAmount) {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );

        // Validations
        if (basics.launchType != ILaunchpadStorage.LaunchType.PROJECT_RAISE)
            revert NotProjectRaise();
        if (block.timestamp <= basics.raiseDeadline) revert RaiseStillActive();
        if (basics.totalRaised >= basics.raiseTarget)
            revert RaiseWasSuccessful();
        if (status.raiseCompleted) revert RaiseAlreadyCompleted();

        ILaunchpadStorage.Contribution memory contrib = storage_
            .getContribution(token, contributor);
        if (contrib.amount == 0) revert NoContribution();
        if (contrib.claimed) revert AlreadyClaimed();

        refundAmount = contrib.amount;

        // Mark as claimed
        storage_.markContributionClaimed(token, contributor);

        emit RefundClaimed(contributor, token, refundAmount);

        return refundAmount;
    }

    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================

    /**
     * @notice Get contribution details
     */
    function getContribution(
        address token,
        address contributor
    ) external view returns (uint256 amount, bool claimed) {
        ILaunchpadStorage.Contribution memory contrib = storage_
            .getContribution(token, contributor);
        return (contrib.amount, contrib.claimed);
    }

    /**
     * @notice Calculate tokens owed to contributor
     */
    function calculateTokensOwed(
        address token,
        address contributor
    ) external view returns (uint256) {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.Contribution memory contrib = storage_
            .getContribution(token, contributor);

        if (contrib.amount == 0 || basics.totalRaised == 0) return 0;

        uint256 contributorPool = (basics.totalSupply *
            storage_.CONTRIBUTOR_ALLOCATION()) / 100;
        return (contrib.amount * contributorPool) / basics.totalRaised;
    }

    /**
     * @notice Check if contributor can claim tokens
     */
    function canClaimTokens(
        address token,
        address contributor
    ) external view returns (bool canClaim, string memory reason) {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );
        ILaunchpadStorage.Contribution memory contrib = storage_
            .getContribution(token, contributor);

        if (basics.launchType != ILaunchpadStorage.LaunchType.PROJECT_RAISE) {
            return (false, "Not a project raise");
        }
        if (!status.raiseCompleted) {
            return (false, "Raise not completed");
        }
        if (basics.totalRaised < basics.raiseTarget) {
            return (false, "Raise failed");
        }
        if (contrib.amount == 0) {
            return (false, "No contribution");
        }
        if (contrib.claimed) {
            return (false, "Already claimed");
        }

        return (true, "Can claim");
    }

    /**
     * @notice Check if contributor can claim refund
     */
    function canClaimRefund(
        address token,
        address contributor
    ) external view returns (bool canClaim, string memory reason) {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );
        ILaunchpadStorage.Contribution memory contrib = storage_
            .getContribution(token, contributor);

        if (basics.launchType != ILaunchpadStorage.LaunchType.PROJECT_RAISE) {
            return (false, "Not a project raise");
        }
        if (block.timestamp <= basics.raiseDeadline) {
            return (false, "Raise still active");
        }
        if (basics.totalRaised >= basics.raiseTarget) {
            return (false, "Raise was successful");
        }
        if (status.raiseCompleted) {
            return (false, "Raise completed");
        }
        if (contrib.amount == 0) {
            return (false, "No contribution");
        }
        if (contrib.claimed) {
            return (false, "Already claimed");
        }

        return (true, "Can claim refund");
    }

    /**
     * @notice Get raise progress information
     */
    function getRaiseProgress(
        address token
    )
        external
        view
        returns (
            uint256 totalRaised,
            uint256 raiseTarget,
            uint256 raiseMax,
            uint256 percentageComplete,
            uint256 timeRemaining,
            bool isActive
        )
    {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );

        totalRaised = basics.totalRaised;
        raiseTarget = basics.raiseTarget;
        raiseMax = basics.raiseMax;

        percentageComplete = basics.raiseTarget > 0
            ? (basics.totalRaised * 100) / basics.raiseTarget
            : 0;

        timeRemaining = block.timestamp < basics.raiseDeadline
            ? basics.raiseDeadline - block.timestamp
            : 0;

        isActive =
            !status.raiseCompleted &&
            block.timestamp < basics.raiseDeadline;
    }
}
