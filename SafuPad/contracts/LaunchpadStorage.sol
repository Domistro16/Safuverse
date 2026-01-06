// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ILaunchpadStorage.sol";

/**
 * @title LaunchpadStorage
 * @notice Centralized storage for all launchpad data
 * @dev Only authorized modules can write to storage
 */
contract LaunchpadStorage is ILaunchpadStorage, AccessControl {
    bytes32 public constant MODULE_ROLE = keccak256("MODULE_ROLE");

    // ============ Constants ============

    uint256 public constant override MIN_RAISE_BNB = 100 ether;
    uint256 public constant override MAX_RAISE_BNB = 500 ether;
    uint256 public constant override MAX_CONTRIBUTION_PER_WALLET = 50000 ether;
    uint256 public constant override RAISE_DURATION = 72 hours;
    uint256 public constant override FOUNDER_ALLOCATION = 60;
    uint256 public constant override CONTRIBUTOR_ALLOCATION = 20;
    uint256 public constant override PANCAKESWAP_ALLOCATION = 10;
    uint256 public constant override VESTED_ALLOCATION = 10;
    uint256 public constant override LIQUIDITY_TOKEN_PERCENT = 10;
    uint256 public constant override LIQUIDITY_BNB_PERCENT = 20;
    uint256 public constant override VESTING_RELEASE_INTERVAL = 30 days;

    // ============ Storage ============

    mapping(address => LaunchBasics) private _launchBasics;
    mapping(address => LaunchVesting) private _launchVesting;
    mapping(address => LaunchLiquidity) private _launchLiquidity;
    mapping(address => LaunchStatus) private _launchStatus;
    mapping(address => mapping(address => Contribution)) private _contributions;
    mapping(address => LaunchTeamInfo) private _launchTeamInfo;
    address[] private _allLaunches;

    // ============ Events ============

    event StorageUpdated(address indexed token, string updateType);

    constructor(address admin) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ============ Modifiers ============

    modifier onlyModule() {
        require(hasRole(MODULE_ROLE, msg.sender), "Not authorized module");
        _;
    }

    // ============ Admin Functions ============

    function grantModuleRole(
        address module
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(MODULE_ROLE, module);
    }

    function revokeModuleRole(
        address module
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(MODULE_ROLE, module);
    }

    // ============ Getters ============

    function getLaunchBasics(
        address token
    ) external view override returns (LaunchBasics memory) {
        return _launchBasics[token];
    }

    function getLaunchVesting(
        address token
    ) external view override returns (LaunchVesting memory) {
        return _launchVesting[token];
    }

    function getLaunchLiquidity(
        address token
    ) external view override returns (LaunchLiquidity memory) {
        return _launchLiquidity[token];
    }

    function getLaunchStatus(
        address token
    ) external view override returns (LaunchStatus memory) {
        return _launchStatus[token];
    }

    function getContribution(
        address token,
        address contributor
    ) external view override returns (Contribution memory) {
        return _contributions[token][contributor];
    }

    function getLaunchTeamInfo(
        address token
    ) external view override returns (LaunchTeamInfo memory) {
        return _launchTeamInfo[token];
    }

    function getAllLaunches()
        external
        view
        override
        returns (address[] memory)
    {
        return _allLaunches;
    }

    // ============ Setters ============

    function setLaunchBasics(
        address token,
        LaunchBasics memory basics
    ) external override onlyModule {
        _launchBasics[token] = basics;
        emit StorageUpdated(token, "LaunchBasics");
    }

    function setLaunchVesting(
        address token,
        LaunchVesting memory vesting
    ) external override onlyModule {
        _launchVesting[token] = vesting;
        emit StorageUpdated(token, "LaunchVesting");
    }

    function setLaunchLiquidity(
        address token,
        LaunchLiquidity memory liquidity
    ) external override onlyModule {
        _launchLiquidity[token] = liquidity;
        emit StorageUpdated(token, "LaunchLiquidity");
    }

    function setLaunchStatus(
        address token,
        LaunchStatus memory status
    ) external override onlyModule {
        _launchStatus[token] = status;
        emit StorageUpdated(token, "LaunchStatus");
    }

    function setContribution(
        address token,
        address contributor,
        Contribution memory contribution
    ) external override onlyModule {
        _contributions[token][contributor] = contribution;
        emit StorageUpdated(token, "Contribution");
    }

    function setLaunchTeamInfo(
        address token,
        LaunchTeamInfo memory teamInfo
    ) external override onlyModule {
        _launchTeamInfo[token] = teamInfo;
        emit StorageUpdated(token, "TeamInfo");
    }

    function addLaunch(address token) external override onlyModule {
        _allLaunches.push(token);
    }

    // ============ Partial Updates (Gas Optimization) ============

    function updateTotalRaised(
        address token,
        uint256 amount
    ) external override onlyModule {
        _launchBasics[token].totalRaised = amount;
    }

    function updateRaiseCompleted(
        address token,
        bool completed
    ) external override onlyModule {
        _launchStatus[token].raiseCompleted = completed;
    }

    function updateLiquidityAdded(
        address token,
        bool added
    ) external override onlyModule {
        _launchStatus[token].liquidityAdded = added;
    }

    function updateGraduated(
        address token,
        bool graduated
    ) external override onlyModule {
        _launchStatus[token].graduatedToPancakeSwap = graduated;
    }

    function updateVestingClaimed(
        address token,
        uint256 founderClaimed,
        uint256 vestedClaimed
    ) external override onlyModule {
        _launchVesting[token].founderTokensClaimed = founderClaimed;
        _launchVesting[token].vestedTokensClaimed = vestedClaimed;
    }

    function updateRaisedFundsClaimed(
        address token,
        uint256 claimed
    ) external override onlyModule {
        _launchLiquidity[token].raisedFundsClaimed = claimed;
    }

    function updateCommunityControl(
        address token,
        bool triggered,
        uint256 consecutiveMonths
    ) external override onlyModule {
        _launchVesting[token].communityControlTriggered = triggered;
        _launchVesting[token].consecutiveMonthsBelowStart = consecutiveMonths;
    }

    function pushMonthlyMarketCap(
        address token,
        uint256 marketCap
    ) external override onlyModule {
        _launchVesting[token].monthlyMarketCaps.push(marketCap);
    }

    // ============ Direct Access for Complex Updates ============

    function incrementContribution(
        address token,
        address contributor,
        uint256 amount
    ) external onlyModule {
        _contributions[token][contributor].amount += amount;
    }

    function markContributionClaimed(
        address token,
        address contributor
    ) external onlyModule {
        _contributions[token][contributor].claimed = true;
    }

    function incrementTotalRaised(
        address token,
        uint256 amount
    ) external onlyModule {
        _launchBasics[token].totalRaised += amount;
    }

    function setVestingStartTime(
        address token,
        uint256 startTime
    ) external onlyModule {
        _launchVesting[token].vestingStartTime = startTime;
    }

    function setStartMarketCap(
        address token,
        uint256 marketCap
    ) external onlyModule {
        _launchVesting[token].startMarketCap = marketCap;
    }

    function setLiquidityBNB(
        address token,
        uint256 amount
    ) external onlyModule {
        _launchLiquidity[token].liquidityBNB = amount;
    }

    function setRaisedFundsVesting(
        address token,
        uint256 amount
    ) external onlyModule {
        _launchLiquidity[token].raisedFundsVesting = amount;
    }

    // ============ Batch Read (Gas Optimization for Frontend) ============

    function getFullLaunchData(
        address token
    )
        external
        view
        returns (
            LaunchBasics memory basics,
            LaunchVesting memory vesting,
            LaunchLiquidity memory liquidity,
            LaunchStatus memory status,
            LaunchTeamInfo memory teamInfo
        )
    {
        return (
            _launchBasics[token],
            _launchVesting[token],
            _launchLiquidity[token],
            _launchStatus[token],
            _launchTeamInfo[token]
        );
    }
}
