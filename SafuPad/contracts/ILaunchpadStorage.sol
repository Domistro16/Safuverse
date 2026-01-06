// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ILaunchpadStorage
 * @notice Shared data structures and storage interface for modular launchpad
 * @dev All modules read/write through this interface
 */
interface ILaunchpadStorage {
    enum LaunchType {
        PROJECT_RAISE,
        INSTANT_LAUNCH
    }

    struct LaunchBasics {
        address token;
        address founder;
        uint256 totalSupply;
        uint256 raiseTarget;
        uint256 raiseMax;
        uint256 raiseDeadline;
        uint256 totalRaised;
        LaunchType launchType;
        bool burnLP;
    }

    struct LaunchVesting {
        uint256 startMarketCap;
        uint256 vestingDuration;
        uint256 vestingStartTime;
        uint256 founderTokens;
        uint256 founderTokensClaimed;
        uint256 vestedTokens;
        uint256 vestedTokensClaimed;
        uint256[] monthlyMarketCaps;
        uint256 consecutiveMonthsBelowStart;
        bool communityControlTriggered;
    }

    struct LaunchLiquidity {
        uint256 liquidityBNB;
        uint256 liquidityTokens;
        uint256 raisedFundsVesting;
        uint256 raisedFundsClaimed;
    }

    struct LaunchStatus {
        bool raiseCompleted;
        bool liquidityAdded;
        bool graduatedToPancakeSwap;
    }

    struct Contribution {
        uint256 amount;
        bool claimed;
    }

    struct FounderInfo {
        string name;
        address walletAddress;
        string bio;
    }

    struct TeamMember {
        string name;
        string role;
        string twitter;
        string linkedin;
    }

    struct LaunchTeamInfo {
        FounderInfo founder;
        TeamMember teamMember1;
        TeamMember teamMember2;
        uint8 teamMemberCount;
    }

    // ============ Getters ============

    function getLaunchBasics(
        address token
    ) external view returns (LaunchBasics memory);
    function getLaunchVesting(
        address token
    ) external view returns (LaunchVesting memory);
    function getLaunchLiquidity(
        address token
    ) external view returns (LaunchLiquidity memory);
    function getLaunchStatus(
        address token
    ) external view returns (LaunchStatus memory);
    function getContribution(
        address token,
        address contributor
    ) external view returns (Contribution memory);
    function getLaunchTeamInfo(
        address token
    ) external view returns (LaunchTeamInfo memory);
    function getAllLaunches() external view returns (address[] memory);

    // ============ Setters ============

    function setLaunchBasics(
        address token,
        LaunchBasics memory basics
    ) external;
    function setLaunchVesting(
        address token,
        LaunchVesting memory vesting
    ) external;
    function setLaunchLiquidity(
        address token,
        LaunchLiquidity memory liquidity
    ) external;
    function setLaunchStatus(
        address token,
        LaunchStatus memory status
    ) external;
    function setContribution(
        address token,
        address contributor,
        Contribution memory contribution
    ) external;
    function setLaunchTeamInfo(
        address token,
        LaunchTeamInfo memory teamInfo
    ) external;
    function addLaunch(address token) external;

    // ============ Partial Updates ============

    function updateTotalRaised(address token, uint256 amount) external;
    function updateRaiseCompleted(address token, bool completed) external;
    function updateLiquidityAdded(address token, bool added) external;
    function updateGraduated(address token, bool graduated) external;
    function updateVestingClaimed(
        address token,
        uint256 founderClaimed,
        uint256 vestedClaimed
    ) external;
    function updateRaisedFundsClaimed(address token, uint256 claimed) external;
    function updateCommunityControl(
        address token,
        bool triggered,
        uint256 consecutiveMonths
    ) external;
    function pushMonthlyMarketCap(address token, uint256 marketCap) external;
    function markContributionClaimed(
        address token,
        address contributor
    ) external;

    // ============ Constants ============

    function MIN_RAISE_BNB() external view returns (uint256);
    function MAX_RAISE_BNB() external view returns (uint256);
    function MAX_CONTRIBUTION_PER_WALLET() external view returns (uint256);
    function RAISE_DURATION() external view returns (uint256);
    function FOUNDER_ALLOCATION() external view returns (uint256);
    function CONTRIBUTOR_ALLOCATION() external view returns (uint256);
    function PANCAKESWAP_ALLOCATION() external view returns (uint256);
    function VESTED_ALLOCATION() external view returns (uint256);
    function LIQUIDITY_TOKEN_PERCENT() external view returns (uint256);
    function LIQUIDITY_BNB_PERCENT() external view returns (uint256);
    function VESTING_RELEASE_INTERVAL() external view returns (uint256);
}
