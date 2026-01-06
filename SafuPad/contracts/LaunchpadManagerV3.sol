// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LaunchpadManagerV3 - Modular Facade
 * @author SafuPad Team
 * @notice Main entry point for all launchpad interactions
 * @dev Maintains the same external interface but routes to specialized modules:
 *      - ContributionManager: contributions, claims, refunds
 *      - VestingManager: founder tokens, vested tokens, raised funds
 *      - GraduationManager: PancakeSwap graduation, post-grad trading
 *
 * VERSION: 3.1.0 (Modular Facade)
 */

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ILaunchpadStorage.sol";

interface ITokenFactoryV2 {
    struct TokenMetadata {
        string logoURI;
        string description;
        string website;
        string twitter;
        string telegram;
        string discord;
        string docs;
    }

    function createToken(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint8 decimals,
        address owner,
        TokenMetadata memory metadata
    ) external returns (address);

    function createTokenWithSalt(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint8 decimals,
        address owner,
        TokenMetadata memory metadata,
        bytes32 salt
    ) external returns (address);
}

interface ILaunchpadToken {
    function enableTransfers() external;
    function setExemption(address account, bool exempt) external;
}

interface IBondingCurveDEXV3 {
    function createInstantLaunchPool(
        address token,
        uint256 tokenAmount,
        address creator,
        bool burnLP
    ) external payable;

    function getBuyQuote(
        address token,
        uint256 bnbAmount
    ) external view returns (uint256 tokensOut, uint256 pricePerToken);

    function buyTokens(address token, uint256 minTokensOut) external payable;

    function getPoolInfo(
        address token
    )
        external
        view
        returns (
            uint256 marketCapBNB,
            uint256 marketCapUSD,
            uint256 bnbReserve,
            uint256 tokenReserve,
            uint256 reservedTokens,
            uint256 currentPrice,
            uint256 priceMultiplier,
            uint256 graduationProgress,
            bool graduated
        );
}

interface IContributionManager {
    function contribute(
        address token,
        address contributor,
        uint256 amount
    ) external returns (bool reachedTarget);
    function claimContributorTokens(
        address token,
        address contributor
    ) external returns (uint256 tokensOwed);
    function claimRefund(
        address token,
        address contributor
    ) external returns (uint256 refundAmount);
    function getContribution(
        address token,
        address contributor
    ) external view returns (uint256 amount, bool claimed);
    function calculateTokensOwed(
        address token,
        address contributor
    ) external view returns (uint256);
    function canClaimTokens(
        address token,
        address contributor
    ) external view returns (bool canClaim, string memory reason);
    function canClaimRefund(
        address token,
        address contributor
    ) external view returns (bool canClaim, string memory reason);
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
        );
}

interface IVestingManager {
    function claimFounderTokens(
        address token,
        address founder
    ) external returns (uint256 claimable);
    function claimVestedTokens(
        address token,
        address founder
    ) external returns (uint256 claimable);
    function claimRaisedFunds(
        address token,
        address founder
    ) external returns (uint256 claimable);
    function updateMarketCap(address token) external;
    function burnVestedTokensOnCommunityControl(
        address token
    ) external returns (uint256 remainingVestedTokens);
    function getRemainingFundsForTimelock(
        address token
    ) external view returns (uint256 remainingFunds);
    function markFundsTransferredToTimelock(address token) external;
    function getClaimableAmounts(
        address token
    )
        external
        view
        returns (
            uint256 claimableFounderTokens,
            uint256 claimableVestedTokens,
            uint256 claimableRaisedFunds
        );
    function getCommunityControlInfo(
        address token
    )
        external
        view
        returns (
            bool communityControlActive,
            uint256 consecutiveMonthsBelowStart,
            uint256 currentMarketCap,
            uint256 startMarketCap,
            uint256 remainingFunds,
            uint256 remainingVestedTokens
        );
    function getMarketCapHistory(
        address token
    ) external view returns (uint256[] memory);
}

interface IGraduationManager {
    function graduateProjectRaise(
        address token,
        uint256 tokensForLiquidity
    ) external payable returns (address lpToken, uint256 lpAmount);
    function graduateInstantLaunch(
        address token
    ) external returns (address lpToken, uint256 lpAmount);
    function handlePostGraduationSell(
        address token,
        uint256 tokenAmount,
        uint256 minBNBOut,
        address seller
    ) external;
    function handlePostGraduationBuy(
        address token,
        uint256 minTokensOut,
        address buyer
    ) external payable;
    function canGraduate(
        address token
    ) external view returns (bool canGrad, string memory reason);
    function getGraduationInfo(
        address token
    )
        external
        view
        returns (
            bool graduated,
            address lpToken,
            bool lpBurned,
            uint256 liquidityBNB,
            uint256 liquidityTokens
        );
}

interface IPriceOracle {
    function bnbToUSD(uint256 bnbAmount) external view returns (uint256);
}

/**
 * @title LaunchpadManagerV3
 * @dev Facade contract that routes to specialized modules while maintaining original interface
 */
contract LaunchpadManagerV3 is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ============ Module References ============

    ILaunchpadStorage public storage_;
    ITokenFactoryV2 public tokenFactory;
    IBondingCurveDEXV3 public bondingCurveDEX;
    IContributionManager public contributionManager;
    IVestingManager public vestingManager;
    IGraduationManager public graduationManager;
    IPriceOracle public priceOracle;

    // ============ External Dependencies ============

    address public pancakeRouter;
    address public lpFeeHarvester;
    address public infoFiAddress;
    address public platformFeeAddress;
    address public pancakeFactory;
    address public wbnbAddress;

    // ============ Constants ============

    uint256 public constant MIN_VESTING_DURATION = 365 days;
    uint256 public constant MAX_VESTING_DURATION = 365 days;
    uint256 public constant PLATFORM_FEE_BPS = 100;
    uint256 public constant BASIS_POINTS = 10000;
    address public constant LP_BURN_ADDRESS =
        0x000000000000000000000000000000000000dEaD;

    // ============ Events ============

    event LaunchCreated(
        address indexed token,
        address indexed founder,
        uint256 totalSupply,
        ILaunchpadStorage.LaunchType launchType,
        uint256 raiseTargetBNB,
        uint256 raiseMaxBNB,
        uint256 deadline,
        bool hasVanitySalt,
        bool burnLP
    );
    event InstantLaunchCreated(
        address indexed token,
        address indexed founder,
        uint256 totalSupply,
        uint256 initialBuyAmount,
        uint256 tokensReceived,
        bool burnLP
    );
    event ContributionMade(
        address indexed contributor,
        address indexed token,
        uint256 amount
    );
    event RaiseCompleted(address indexed token, uint256 totalRaised);
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
    event RaiseFailed(address indexed token, uint256 totalRaised);
    event PlatformFeePaid(
        address indexed token,
        uint256 amount,
        string feeType
    );
    event FounderTokensClaimed(
        address indexed founder,
        address indexed token,
        uint256 amount
    );
    event RaisedFundsClaimed(
        address indexed founder,
        address indexed token,
        uint256 amount
    );
    event TokensBurned(address indexed token, uint256 amount);
    event VestedTokensBurnedByCommunityControl(
        address indexed token,
        uint256 amount
    );
    event GraduatedToPancakeSwap(
        address indexed token,
        uint256 bnbForLiquidity,
        uint256 tokensForLiquidity
    );
    event LPBurned(
        address indexed token,
        address indexed lpToken,
        uint256 amount
    );
    event LPLocked(
        address indexed token,
        address indexed lpToken,
        uint256 amount
    );
    event PostGraduationSell(
        address indexed seller,
        address indexed token,
        uint256 tokensIn,
        uint256 bnbOut,
        uint256 liquidityAdded,
        uint256 lpGenerated
    );
    event PostGraduationBuy(
        address indexed buyer,
        address indexed token,
        uint256 bnbIn,
        uint256 tokensOut,
        uint256 platformFee
    );
    event TransfersEnabled(address indexed token, uint256 timestamp);
    event CommunityControlTriggered(
        address indexed token,
        uint256 consecutiveMonths,
        uint256 currentMarketCap,
        uint256 startMarketCap
    );
    event ModuleUpdated(string moduleName, address newAddress);
    event InfoFiAddressUpdated(address indexed newInfoFiAddress);

    // ============ Errors ============

    error InvalidAddress();
    error InvalidRaiseTarget();
    error InvalidRaiseMax();
    error InvalidVestingDuration();
    error InvalidTeamMemberCount();
    error InvalidFounderWallet();
    error InsufficientBNB();
    error InvalidTotalSupply();
    error OnlyModule();
    error ModulesNotSet();

    // ============ Modifiers ============

    modifier onlyModule() {
        if (
            msg.sender != address(contributionManager) &&
            msg.sender != address(vestingManager) &&
            msg.sender != address(graduationManager)
        ) revert OnlyModule();
        _;
    }

    modifier modulesRequired() {
        if (
            address(contributionManager) == address(0) ||
            address(vestingManager) == address(0) ||
            address(graduationManager) == address(0)
        ) revert ModulesNotSet();
        _;
    }

    constructor(
        address _storage,
        address _tokenFactory,
        address _bondingCurveDEX,
        address _pancakeRouter,
        address _priceOracle,
        address _infoFiAddress,
        address _platformFeeAddress,
        address _lpFeeHarvester,
        address _pancakeFactory
    ) Ownable(msg.sender) {
        if (_storage == address(0)) revert InvalidAddress();
        if (_tokenFactory == address(0)) revert InvalidAddress();
        if (_bondingCurveDEX == address(0)) revert InvalidAddress();
        if (_pancakeRouter == address(0)) revert InvalidAddress();
        if (_priceOracle == address(0)) revert InvalidAddress();
        if (_infoFiAddress == address(0)) revert InvalidAddress();
        if (_platformFeeAddress == address(0)) revert InvalidAddress();
        if (_lpFeeHarvester == address(0)) revert InvalidAddress();
        if (_pancakeFactory == address(0)) revert InvalidAddress();

        storage_ = ILaunchpadStorage(_storage);
        tokenFactory = ITokenFactoryV2(_tokenFactory);
        bondingCurveDEX = IBondingCurveDEXV3(_bondingCurveDEX);
        pancakeRouter = _pancakeRouter;
        priceOracle = IPriceOracle(_priceOracle);
        infoFiAddress = _infoFiAddress;
        platformFeeAddress = _platformFeeAddress;
        lpFeeHarvester = _lpFeeHarvester;
        pancakeFactory = _pancakeFactory;
        wbnbAddress = address(0x10ED43C718714eb63d5aA57B78B54704E256024E); // BSC Testnet WBNB
    }

    // ============ Module Setup ============

    function setModules(
        address _contributionManager,
        address _vestingManager,
        address _graduationManager
    ) external onlyOwner {
        if (_contributionManager == address(0)) revert InvalidAddress();
        if (_vestingManager == address(0)) revert InvalidAddress();
        if (_graduationManager == address(0)) revert InvalidAddress();

        contributionManager = IContributionManager(_contributionManager);
        vestingManager = IVestingManager(_vestingManager);
        graduationManager = IGraduationManager(_graduationManager);

        emit ModuleUpdated("ContributionManager", _contributionManager);
        emit ModuleUpdated("VestingManager", _vestingManager);
        emit ModuleUpdated("GraduationManager", _graduationManager);
    }

    // ============================================================
    // LAUNCH CREATION (Same interface as original)
    // ============================================================

    /**
     * @notice Create a PROJECT_RAISE launch
     */
    function createLaunch(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint256 raiseTargetBNB,
        uint256 raiseMaxBNB,
        uint256 vestingDuration,
        ITokenFactoryV2.TokenMetadata memory metadata,
        bool burnLP,
        ILaunchpadStorage.LaunchTeamInfo memory teamInfo
    ) external nonReentrant returns (address) {
        vestingDuration = 365 days; // Force 1 year vesting

        return
            _createLaunch(
                name,
                symbol,
                totalSupply,
                raiseTargetBNB,
                raiseMaxBNB,
                vestingDuration,
                metadata,
                false,
                bytes32(0),
                burnLP,
                teamInfo
            );
    }

    /**
     * @notice Create an INSTANT_LAUNCH
     */
    function createInstantLaunch(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        ITokenFactoryV2.TokenMetadata memory metadata,
        uint256 initialBuyBNB,
        bool burnLP
    ) external payable nonReentrant returns (address) {
        return
            _createInstantLaunch(
                name,
                symbol,
                totalSupply,
                metadata,
                initialBuyBNB,
                false,
                bytes32(0),
                burnLP
            );
    }

    // ============================================================
    // CONTRIBUTION FUNCTIONS (Routes to ContributionManager)
    // ============================================================

    /**
     * @notice Contribute BNB to a PROJECT_RAISE launch
     * @dev Routes to ContributionManager (BNB stays in this contract)
     */
    function contribute(
        address token
    ) external payable nonReentrant modulesRequired {
        // ContributionManager updates state, BNB stays here
        bool reachedTarget = contributionManager.contribute(
            token,
            msg.sender,
            msg.value
        );

        emit ContributionMade(msg.sender, token, msg.value);

        if (reachedTarget) {
            _completeRaise(token);
        }
    }

    /**
     * @notice Claim tokens after successful raise
     * @dev Routes to ContributionManager
     */
    function claimContributorTokens(
        address token
    ) external nonReentrant modulesRequired {
        // ContributionManager calculates and updates state, returns amount
        uint256 tokensOwed = contributionManager.claimContributorTokens(
            token,
            msg.sender
        );

        // Transfer tokens to contributor
        IERC20(token).safeTransfer(msg.sender, tokensOwed);

        emit ContributorTokensClaimed(msg.sender, token, tokensOwed);
    }

    /**
     * @notice Claim refund if raise fails
     * @dev Routes to ContributionManager
     */
    function claimRefund(address token) external nonReentrant modulesRequired {
        // ContributionManager updates state and returns refund amount
        uint256 refundAmount = contributionManager.claimRefund(
            token,
            msg.sender
        );

        // Transfer BNB refund
        payable(msg.sender).transfer(refundAmount);

        emit RefundClaimed(msg.sender, token, refundAmount);
    }

    // ============================================================
    // VESTING FUNCTIONS (Routes to VestingManager)
    // ============================================================

    /**
     * @notice Claim founder tokens (60% allocation)
     * @dev Routes to VestingManager
     */
    function claimFounderTokens(
        address token
    ) external nonReentrant modulesRequired {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        require(msg.sender == basics.founder, "Not founder");

        // VestingManager updates state and returns claimable amount
        uint256 claimable = vestingManager.claimFounderTokens(
            token,
            msg.sender
        );

        // Transfer tokens
        IERC20(token).safeTransfer(msg.sender, claimable);

        emit FounderTokensClaimed(msg.sender, token, claimable);
    }

    /**
     * @notice Claim vested tokens (10% allocation)
     * @dev Routes to VestingManager
     */
    function claimVestedTokens(
        address token
    ) external nonReentrant modulesRequired {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        require(msg.sender == basics.founder, "Not founder");

        // VestingManager updates state and returns claimable amount
        uint256 claimable = vestingManager.claimVestedTokens(token, msg.sender);

        // Transfer tokens
        IERC20(token).safeTransfer(msg.sender, claimable);

        emit FounderTokensClaimed(msg.sender, token, claimable);
    }

    /**
     * @notice Claim raised funds
     * @dev Routes to VestingManager
     */
    function claimRaisedFunds(
        address token
    ) external nonReentrant modulesRequired {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        require(msg.sender == basics.founder, "Not founder");

        // VestingManager updates state and returns claimable amount
        uint256 claimable = vestingManager.claimRaisedFunds(token, msg.sender);

        // Transfer BNB
        payable(msg.sender).transfer(claimable);

        emit RaisedFundsClaimed(msg.sender, token, claimable);
    }

    /**
     * @notice Update market cap tracking (monthly)
     * @dev Routes to VestingManager
     */
    function updateMarketCap(address token) external modulesRequired {
        vestingManager.updateMarketCap(token);
    }

    /**
     * @notice Transfer funds to timelock when community control triggered
     * @dev Routes to VestingManager, only owner
     */
    function transferFundsToTimelock(
        address token,
        address timelockAddress
    ) external onlyOwner nonReentrant modulesRequired {
        // Get remaining funds from VestingManager
        uint256 remainingFunds = vestingManager.getRemainingFundsForTimelock(
            token
        );
        require(remainingFunds > 0, "No funds to transfer");

        // Mark funds as transferred in VestingManager
        vestingManager.markFundsTransferredToTimelock(token);

        // Transfer BNB to timelock
        payable(timelockAddress).transfer(remainingFunds);
    }

    /**
     * @notice Burn vested tokens on community control
     * @dev Routes to VestingManager, only owner
     */
    function burnVestedTokensOnCommunityControl(
        address token
    ) external onlyOwner nonReentrant modulesRequired {
        // VestingManager updates state and returns amount to burn
        uint256 remainingVested = vestingManager
            .burnVestedTokensOnCommunityControl(token);

        // Burn tokens
        IERC20(token).safeTransfer(LP_BURN_ADDRESS, remainingVested);

        emit VestedTokensBurnedByCommunityControl(token, remainingVested);
        emit TokensBurned(token, remainingVested);
    }

    // ============================================================
    // GRADUATION FUNCTIONS (Routes to GraduationManager)
    // ============================================================

    /**
     * @notice Graduate token to PancakeSwap
     * @dev Routes to GraduationManager based on launch type
     */
    function graduateToPancakeSwap(
        address token
    ) external nonReentrant modulesRequired {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );

        address lpToken;
        uint256 lpAmount;

        if (basics.launchType == ILaunchpadStorage.LaunchType.PROJECT_RAISE) {
            // Calculate tokens for liquidity (10%)
            uint256 tokensForLiquidity = (basics.totalSupply *
                storage_.LIQUIDITY_TOKEN_PERCENT()) / 100;

            // Get BNB for liquidity (20% of raised)
            ILaunchpadStorage.LaunchLiquidity memory liquidity = storage_
                .getLaunchLiquidity(token);
            uint256 bnbForLiquidity = liquidity.liquidityBNB;

            // Approve tokens to GraduationManager
            IERC20(token).approve(
                address(graduationManager),
                tokensForLiquidity
            );

            // Graduate with BNB and tokens
            (lpToken, lpAmount) = graduationManager.graduateProjectRaise{
                value: bnbForLiquidity
            }(token, tokensForLiquidity);

            emit GraduatedToPancakeSwap(
                token,
                bnbForLiquidity,
                tokensForLiquidity
            );
        } else {
            // INSTANT_LAUNCH - bonding curve handles the graduation
            (lpToken, lpAmount) = graduationManager.graduateInstantLaunch(
                token
            );

            emit GraduatedToPancakeSwap(token, 0, 0);
        }

        ILaunchpadToken(token).enableTransfers();
        emit TransfersEnabled(token, block.timestamp);
    }

    /**
     * @notice Sell tokens after graduation via PancakeSwap
     * @dev Routes to GraduationManager
     */
    function handlePostGraduationSell(
        address token,
        uint256 tokenAmount,
        uint256 minBNBOut
    ) external nonReentrant modulesRequired {
        // Transfer tokens from seller to this contract first
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);

        // Approve GraduationManager
        IERC20(token).approve(address(graduationManager), tokenAmount);

        graduationManager.handlePostGraduationSell(
            token,
            tokenAmount,
            minBNBOut,
            msg.sender
        );

        emit PostGraduationSell(
            msg.sender,
            token,
            tokenAmount,
            minBNBOut,
            0,
            0
        );
    }

    /**
     * @notice Buy tokens after graduation via PancakeSwap
     * @dev Routes to GraduationManager
     */
    function handlePostGraduationBuy(
        address token,
        uint256 minTokensOut
    ) external payable nonReentrant modulesRequired {
        graduationManager.handlePostGraduationBuy{value: msg.value}(
            token,
            minTokensOut,
            msg.sender
        );

        emit PostGraduationBuy(msg.sender, token, msg.value, minTokensOut, 0);
    }

    // ============================================================
    // BURN FAILED RAISE
    // ============================================================

    /**
     * @notice Burn tokens for failed raise
     */
    function burnFailedRaiseTokens(address token) external nonReentrant {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );

        require(
            basics.launchType == ILaunchpadStorage.LaunchType.PROJECT_RAISE,
            "Not a project raise"
        );
        require(block.timestamp > basics.raiseDeadline, "Raise still active");
        require(
            basics.totalRaised < basics.raiseTarget,
            "Raise was successful"
        );
        require(!status.raiseCompleted, "Raise completed");

        uint256 balance = IERC20(token).balanceOf(address(this));
        if (balance > 0) {
            IERC20(token).safeTransfer(LP_BURN_ADDRESS, balance);
            emit TokensBurned(token, balance);
            emit RaiseFailed(token, basics.totalRaised);
        }
    }

    // ============================================================
    // VIEW FUNCTIONS (Same interface as original)
    // ============================================================

    function getLaunchInfo(
        address token
    )
        external
        view
        returns (
            address founder,
            uint256 raiseTarget,
            uint256 raiseMax,
            uint256 totalRaised,
            uint256 raiseDeadline,
            bool raiseCompleted,
            bool graduatedToPancakeSwap,
            uint256 raisedFundsVesting,
            uint256 raisedFundsClaimed,
            ILaunchpadStorage.LaunchType launchType,
            bool burnLP
        )
    {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );
        ILaunchpadStorage.LaunchLiquidity memory liquidity = storage_
            .getLaunchLiquidity(token);

        return (
            basics.founder,
            basics.raiseTarget,
            basics.raiseMax,
            basics.totalRaised,
            basics.raiseDeadline,
            status.raiseCompleted,
            status.graduatedToPancakeSwap,
            liquidity.raisedFundsVesting,
            liquidity.raisedFundsClaimed,
            basics.launchType,
            basics.burnLP
        );
    }

    function getLaunchInfoWithUSD(
        address token
    )
        external
        view
        returns (
            address founder,
            uint256 raiseTargetBNB,
            uint256 raiseTargetUSD,
            uint256 raiseMaxBNB,
            uint256 raiseMaxUSD,
            uint256 totalRaisedBNB,
            uint256 totalRaisedUSD,
            uint256 raiseDeadline,
            bool raiseCompleted,
            ILaunchpadStorage.LaunchType launchType,
            bool burnLP
        )
    {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );

        return (
            basics.founder,
            basics.raiseTarget,
            priceOracle.bnbToUSD(basics.raiseTarget),
            basics.raiseMax,
            priceOracle.bnbToUSD(basics.raiseMax),
            basics.totalRaised,
            priceOracle.bnbToUSD(basics.totalRaised),
            basics.raiseDeadline,
            status.raiseCompleted,
            basics.launchType,
            basics.burnLP
        );
    }

    function getClaimableAmounts(
        address token
    ) external view returns (uint256 claimableTokens, uint256 claimableFunds) {
        if (address(vestingManager) == address(0)) {
            return (0, 0);
        }
        (uint256 founder, , uint256 funds) = vestingManager.getClaimableAmounts(
            token
        );
        return (founder, funds);
    }

    function getClaimableVestedTokens(
        address token
    ) external view returns (uint256) {
        if (address(vestingManager) == address(0)) {
            return 0;
        }
        (, uint256 vested, ) = vestingManager.getClaimableAmounts(token);
        return vested;
    }

    function getContribution(
        address token,
        address contributor
    ) external view returns (uint256 amount, bool claimed) {
        if (address(contributionManager) == address(0)) {
            return (0, false);
        }
        return contributionManager.getContribution(token, contributor);
    }

    function getCommunityControlInfo(
        address token
    )
        external
        view
        returns (
            bool communityControlActive,
            uint256 consecutiveMonthsBelowStart,
            uint256 currentMarketCap,
            uint256 startMarketCap,
            uint256 remainingFunds,
            uint256 remainingVestedTokens
        )
    {
        if (address(vestingManager) == address(0)) {
            return (false, 0, 0, 0, 0, 0);
        }
        return vestingManager.getCommunityControlInfo(token);
    }

    function getMarketCapHistory(
        address token
    ) external view returns (uint256[] memory) {
        if (address(vestingManager) == address(0)) {
            return new uint256[](0);
        }
        return vestingManager.getMarketCapHistory(token);
    }

    function getAllLaunches() external view returns (address[] memory) {
        return storage_.getAllLaunches();
    }

    function getFounderInfo(
        address token
    )
        external
        view
        returns (string memory name, address walletAddress, string memory bio)
    {
        ILaunchpadStorage.LaunchTeamInfo memory info = storage_
            .getLaunchTeamInfo(token);
        return (
            info.founder.name,
            info.founder.walletAddress,
            info.founder.bio
        );
    }

    function getTeamMembers(
        address token
    )
        external
        view
        returns (
            ILaunchpadStorage.TeamMember memory teamMember1,
            ILaunchpadStorage.TeamMember memory teamMember2,
            uint8 teamMemberCount
        )
    {
        ILaunchpadStorage.LaunchTeamInfo memory info = storage_
            .getLaunchTeamInfo(token);
        return (info.teamMember1, info.teamMember2, info.teamMemberCount);
    }

    function getLaunchTeamInfo(
        address token
    ) external view returns (ILaunchpadStorage.LaunchTeamInfo memory) {
        return storage_.getLaunchTeamInfo(token);
    }

    // ============================================================
    // TEAM INFO UPDATE FUNCTIONS
    // ============================================================

    function updateFounderInfo(
        address token,
        string memory name,
        string memory bio
    ) external {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );

        require(msg.sender == basics.founder, "Not founder");
        require(!status.graduatedToPancakeSwap, "Already graduated");

        ILaunchpadStorage.LaunchTeamInfo memory teamInfo = storage_
            .getLaunchTeamInfo(token);
        teamInfo.founder.name = name;
        teamInfo.founder.bio = bio;
        storage_.setLaunchTeamInfo(token, teamInfo);
    }

    function updateTeamMembers(
        address token,
        ILaunchpadStorage.TeamMember memory teamMember1,
        ILaunchpadStorage.TeamMember memory teamMember2,
        uint8 teamMemberCount
    ) external {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );

        require(msg.sender == basics.founder, "Not founder");
        require(!status.graduatedToPancakeSwap, "Already graduated");
        require(teamMemberCount <= 2, "Max 2 team members");

        ILaunchpadStorage.LaunchTeamInfo memory teamInfo = storage_
            .getLaunchTeamInfo(token);
        teamInfo.teamMember1 = teamMember1;
        teamInfo.teamMember2 = teamMember2;
        teamInfo.teamMemberCount = teamMemberCount;
        storage_.setLaunchTeamInfo(token, teamInfo);
    }

    // ============================================================
    // INTERNAL FUNCTIONS
    // ============================================================

    function _createLaunch(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint256 raiseTargetBNB,
        uint256 raiseMaxBNB,
        uint256 vestingDuration,
        ITokenFactoryV2.TokenMetadata memory metadata,
        bool useVanity,
        bytes32 vanitySalt,
        bool burnLP,
        ILaunchpadStorage.LaunchTeamInfo memory teamInfo
    ) private returns (address) {
        _validateLaunchParams(raiseTargetBNB, raiseMaxBNB, vestingDuration);
        _validateTeamInfo(teamInfo);

        address token = _deployToken(
            name,
            symbol,
            totalSupply,
            metadata,
            useVanity,
            vanitySalt
        );

        // Set exemptions
        ILaunchpadToken(token).setExemption(address(bondingCurveDEX), true);
        ILaunchpadToken(token).setExemption(pancakeRouter, true);
        ILaunchpadToken(token).setExemption(lpFeeHarvester, true);
        if (address(graduationManager) != address(0)) {
            ILaunchpadToken(token).setExemption(
                address(graduationManager),
                true
            );
        }

        _initializeProjectRaise(
            token,
            totalSupply,
            raiseTargetBNB,
            raiseMaxBNB,
            vestingDuration,
            burnLP
        );
        storage_.setLaunchTeamInfo(token, teamInfo);

        emit LaunchCreated(
            token,
            msg.sender,
            totalSupply * 10 ** 18,
            ILaunchpadStorage.LaunchType.PROJECT_RAISE,
            raiseTargetBNB,
            raiseMaxBNB,
            block.timestamp + storage_.RAISE_DURATION(),
            useVanity,
            burnLP
        );

        return token;
    }

    function _createInstantLaunch(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        ITokenFactoryV2.TokenMetadata memory metadata,
        uint256 initialBuyBNB,
        bool useVanity,
        bytes32 vanitySalt,
        bool burnLP
    ) private returns (address) {
        if (msg.value < initialBuyBNB) revert InsufficientBNB();
        if (totalSupply != 1_000_000_000) revert InvalidTotalSupply();

        address token = _deployToken(
            name,
            symbol,
            totalSupply,
            metadata,
            useVanity,
            vanitySalt
        );

        // Set exemptions
        ILaunchpadToken(token).setExemption(address(bondingCurveDEX), true);
        ILaunchpadToken(token).setExemption(pancakeRouter, true);
        ILaunchpadToken(token).setExemption(lpFeeHarvester, true);
        if (address(graduationManager) != address(0)) {
            ILaunchpadToken(token).setExemption(
                address(graduationManager),
                true
            );
        }

        uint256 totalSupplyWei = 1_000_000_000 * 10 ** 18;
        _initializeInstantLaunch(token, totalSupplyWei, burnLP);

        // Create bonding curve pool
        uint256 initialLiquidityBNB = msg.value > initialBuyBNB
            ? msg.value - initialBuyBNB
            : 0;

        IERC20(token).approve(address(bondingCurveDEX), totalSupplyWei);
        bondingCurveDEX.createInstantLaunchPool{value: initialLiquidityBNB}(
            token,
            totalSupplyWei,
            msg.sender,
            burnLP
        );

        uint256 tokensReceived = 0;
        if (initialBuyBNB > 0) {
            tokensReceived = _executeInitialBuy(token, initialBuyBNB);
        }

        emit InstantLaunchCreated(
            token,
            msg.sender,
            totalSupplyWei,
            initialBuyBNB,
            tokensReceived,
            burnLP
        );

        return token;
    }

    function _completeRaise(address token) private {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );

        require(!status.raiseCompleted, "Already completed");

        // Mark as completed
        storage_.updateRaiseCompleted(token, true);

        // Update Vesting info
        ILaunchpadStorage.LaunchVesting memory vesting = storage_
            .getLaunchVesting(token);
        vesting.vestingStartTime = block.timestamp;

        // Calculate liquidity BNB (20% of raised for PancakeSwap)
        uint256 liquidityBNB = (basics.totalRaised *
            storage_.LIQUIDITY_BNB_PERCENT()) / 100;

        // Calculate founder's immediate BNB (20% of raised)
        uint256 founderImmediateBNB = (basics.totalRaised *
            storage_.FOUNDER_BNB_IMMEDIATE_PERCENT()) / 100;

        // Remaining BNB goes to vesting (60% of raised)
        uint256 vestedBNB = basics.totalRaised -
            liquidityBNB -
            founderImmediateBNB;

        // Update Liquidity info
        ILaunchpadStorage.LaunchLiquidity memory liquidity = storage_
            .getLaunchLiquidity(token);
        liquidity.liquidityBNB = liquidityBNB;
        liquidity.raisedFundsVesting = vestedBNB;
        storage_.setLaunchLiquidity(token, liquidity);

        // Calculate starting market cap
        uint256 liquidityTokens = (basics.totalSupply *
            storage_.LIQUIDITY_TOKEN_PERCENT()) / 100;
        uint256 startMarketCap = (liquidityBNB * basics.totalSupply) /
            liquidityTokens;

        vesting.startMarketCap = startMarketCap;
        storage_.setLaunchVesting(token, vesting);

        // Transfer founder's immediate 20% tokens (founderTokens is already 20% of supply)
        IERC20(token).safeTransfer(basics.founder, vesting.founderTokens);
        storage_.updateVestingClaimed(token, vesting.founderTokens, 0);

        // Transfer founder's immediate 20% BNB
        payable(basics.founder).transfer(founderImmediateBNB);

        emit RaiseCompleted(token, basics.totalRaised);
    }

    function _validateLaunchParams(
        uint256 raiseTargetBNB,
        uint256 raiseMaxBNB,
        uint256 vestingDuration
    ) private view {
        if (
            raiseTargetBNB < storage_.MIN_RAISE_BNB() ||
            raiseTargetBNB > storage_.MAX_RAISE_BNB()
        ) {
            revert InvalidRaiseTarget();
        }
        if (
            raiseMaxBNB < raiseTargetBNB ||
            raiseMaxBNB > storage_.MAX_RAISE_BNB()
        ) {
            revert InvalidRaiseMax();
        }
        if (
            vestingDuration < MIN_VESTING_DURATION ||
            vestingDuration > MAX_VESTING_DURATION
        ) {
            revert InvalidVestingDuration();
        }
    }

    function _validateTeamInfo(
        ILaunchpadStorage.LaunchTeamInfo memory teamInfo
    ) private pure {
        if (teamInfo.teamMemberCount > 2) revert InvalidTeamMemberCount();
        if (teamInfo.founder.walletAddress == address(0))
            revert InvalidFounderWallet();
    }

    function _deployToken(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        ITokenFactoryV2.TokenMetadata memory metadata,
        bool useVanity,
        bytes32 vanitySalt
    ) private returns (address) {
        if (useVanity) {
            return
                tokenFactory.createTokenWithSalt(
                    name,
                    symbol,
                    totalSupply,
                    18,
                    address(this),
                    metadata,
                    vanitySalt
                );
        } else {
            return
                tokenFactory.createToken(
                    name,
                    symbol,
                    totalSupply,
                    18,
                    address(this),
                    metadata
                );
        }
    }

    function _initializeProjectRaise(
        address token,
        uint256 totalSupply,
        uint256 raiseTarget,
        uint256 raiseMax,
        uint256 vestingDuration,
        bool burnLP
    ) private {
        uint256 totalSupplyWei = totalSupply * 10 ** 18;
        uint256 founderTokens = (totalSupplyWei *
            storage_.FOUNDER_ALLOCATION()) / 100;
        uint256 vestedTokens = (totalSupplyWei * storage_.VESTED_ALLOCATION()) /
            100;

        storage_.setLaunchBasics(
            token,
            ILaunchpadStorage.LaunchBasics({
                token: token,
                founder: msg.sender,
                totalSupply: totalSupplyWei,
                raiseTarget: raiseTarget,
                raiseMax: raiseMax,
                raiseDeadline: block.timestamp + storage_.RAISE_DURATION(),
                totalRaised: 0,
                launchType: ILaunchpadStorage.LaunchType.PROJECT_RAISE,
                burnLP: burnLP
            })
        );

        uint256[] memory emptyMarketCaps = new uint256[](0);
        storage_.setLaunchVesting(
            token,
            ILaunchpadStorage.LaunchVesting({
                startMarketCap: 0,
                vestingDuration: vestingDuration,
                vestingStartTime: 0,
                founderTokens: founderTokens,
                founderTokensClaimed: 0,
                vestedTokens: vestedTokens,
                vestedTokensClaimed: 0,
                monthlyMarketCaps: emptyMarketCaps,
                consecutiveMonthsBelowStart: 0,
                communityControlTriggered: false
            })
        );

        storage_.setLaunchLiquidity(
            token,
            ILaunchpadStorage.LaunchLiquidity({
                liquidityBNB: 0,
                liquidityTokens: 0,
                raisedFundsVesting: 0,
                raisedFundsClaimed: 0
            })
        );

        storage_.setLaunchStatus(
            token,
            ILaunchpadStorage.LaunchStatus({
                raiseCompleted: false,
                liquidityAdded: false,
                graduatedToPancakeSwap: false
            })
        );

        storage_.addLaunch(token);
    }

    function _initializeInstantLaunch(
        address token,
        uint256 totalSupplyWei,
        bool burnLP
    ) private {
        storage_.setLaunchBasics(
            token,
            ILaunchpadStorage.LaunchBasics({
                token: token,
                founder: msg.sender,
                totalSupply: totalSupplyWei,
                raiseTarget: 0,
                raiseMax: 0,
                raiseDeadline: 0,
                totalRaised: 0,
                launchType: ILaunchpadStorage.LaunchType.INSTANT_LAUNCH,
                burnLP: burnLP
            })
        );

        storage_.setLaunchStatus(
            token,
            ILaunchpadStorage.LaunchStatus({
                raiseCompleted: true,
                liquidityAdded: true,
                graduatedToPancakeSwap: false
            })
        );

        storage_.addLaunch(token);
    }

    function _executeInitialBuy(
        address token,
        uint256 buyAmount
    ) private returns (uint256) {
        (uint256 tokensOut, ) = bondingCurveDEX.getBuyQuote(token, buyAmount);
        bondingCurveDEX.buyTokens{value: buyAmount}(token, tokensOut);

        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(msg.sender, balance);

        return balance;
    }

    // ============================================================
    // ADMIN FUNCTIONS
    // ============================================================

    function updateInfoFiAddress(address _infoFiAddress) external onlyOwner {
        if (_infoFiAddress == address(0)) revert InvalidAddress();
        infoFiAddress = _infoFiAddress;
        emit InfoFiAddressUpdated(_infoFiAddress);
    }

    function updatePlatformFeeAddress(
        address _platformFeeAddress
    ) external onlyOwner {
        if (_platformFeeAddress == address(0)) revert InvalidAddress();
        platformFeeAddress = _platformFeeAddress;
    }

    function updateLPFeeHarvester(address _lpFeeHarvester) external onlyOwner {
        if (_lpFeeHarvester == address(0)) revert InvalidAddress();
        lpFeeHarvester = _lpFeeHarvester;
    }

    function emergencyWithdraw(address token) external onlyOwner {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );

        require(
            basics.launchType == ILaunchpadStorage.LaunchType.PROJECT_RAISE,
            "Not project raise"
        );
        require(!status.raiseCompleted, "Raise completed");
        require(block.timestamp > basics.raiseDeadline, "Raise still active");
        require(basics.totalRaised < basics.raiseTarget, "Raise target met");

        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(owner(), balance);
    }

    receive() external payable {}
}
