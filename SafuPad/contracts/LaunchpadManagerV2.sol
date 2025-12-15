// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title LaunchpadManagerV3 - BSC Migration with New Tokenomics
 * @author SafuPad Team
 * @notice Manages two types of token launches: Project Raise and Instant Launch
 *
 * VERSION: 3.0.1 (Fixed - Liquidity Cap Removed + Platform-Initiated Burns)
 */ 

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./PriceOracle.sol";
import "./mocks/MockPancakeRouter.sol";

interface ITokenFactoryV2 {
    struct TokenMetadata {
        string logoURI;
        string description;
        string website;
        string twitter;
        string telegram;
        string discord;
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

    function setLPToken(address token) external;

    function withdrawGraduatedPool(
        address token
    )
        external
        returns (
            uint256 bnbAmount,
            uint256 tokenAmount,
            uint256 remainingTokens,
            address creator
        );

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

    function getBuyQuote(
        address token,
        uint256 bnbAmount
    ) external view returns (uint256 tokensOut, uint256 pricePerToken);

    function buyTokens(address token, uint256 minTokensOut) external payable;
}

interface IPancakePair {
    function token0() external view returns (address);

    function token1() external view returns (address);

    function getReserves()
        external
        view
        returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);

    function totalSupply() external view returns (uint256);
}

interface IPancakeRouter02 {
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    )
        external
        payable
        returns (uint amountToken, uint amountETH, uint liquidity);

    function swapExactTokensForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function WETH() external pure returns (address);

    function getAmountsOut(
        uint amountIn,
        address[] calldata path
    ) external view returns (uint[] memory amounts);

    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);
}

interface ILPFeeHarvester {
    function lockLP(
        address projectToken,
        address lpToken,
        address creator,
        address projectInfoFi,
        uint256 lpAmount,
        uint256 lockDuration
    ) external;
}

interface IRaisedFundsTimelock {
    function lockFunds(address token, address beneficiary) external payable;

    function updateBeneficiary(address token, address newBeneficiary) external;

    function releaseFunds(address token) external;
}

/**
 * @title LaunchpadManagerV3
 * @dev Uses global InfoFi address and Timelock for community-controlled funds
 */
contract LaunchpadManagerV3 is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

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
        uint256 vestedTokens; // 10% vested over 6 months
        uint256 vestedTokensClaimed;
        uint256[] monthlyMarketCaps; // Track market cap each month
        uint256 consecutiveMonthsBelowStart; // Count consecutive months below starting market cap
        bool communityControlTriggered; // True if 3+ months below start market cap
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

    uint256 public constant MIN_RAISE_BNB = 100 ether; // 5M BNB
    uint256 public constant MAX_RAISE_BNB = 500 ether; // 20M BNB
    // REMOVED: MAX_LIQUIDITY_BNB - No longer capping liquidity
    uint256 public constant MAX_CONTRIBUTION_PER_WALLET = 50000 ether; // Per-wallet contribution cap
    uint256 public constant RAISE_DURATION = 72 hours;
    uint256 public constant FOUNDER_ALLOCATION = 60; // 60% to founder
    uint256 public constant CONTRIBUTOR_ALLOCATION = 20; // 20% for contributors
    uint256 public constant PANCAKESWAP_ALLOCATION = 10; // 10% for liquidity
    uint256 public constant VESTED_ALLOCATION = 10; // 10% vested over 6 months
    uint256 public constant IMMEDIATE_FOUNDER_RELEASE = 100; // 100% of founder allocation (60%) released immediately
    uint256 public constant LIQUIDITY_TOKEN_PERCENT = 10; // 10% of token supply for liquidity
    uint256 public constant LIQUIDITY_BNB_PERCENT = 20; // 20% of raised BNB for liquidity
    uint256 public constant PLATFORM_FEE_BPS = 100; // 1% platform fee (100 basis points)
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant MIN_VESTING_DURATION = 90 days;
    uint256 public constant MAX_VESTING_DURATION = 180 days;
    uint256 public constant VESTING_RELEASE_INTERVAL = 30 days;
    uint256 public constant MARKET_CAP_CHECK_BNBTHS = 3; // 3 consecutive months below starting market cap

    address public constant LP_BURN_ADDRESS =
        0x000000000000000000000000000000000000dEaD;

    ITokenFactoryV2 public tokenFactory;
    IBondingCurveDEXV3 public bondingCurveDEX;
    IPancakeRouter02 public pancakeRouter;
    PriceOracle public priceOracle;
    address public infoFiAddress; // Global InfoFi fee address
    address public platformFeeAddress; // Platform fee recipient
    ILPFeeHarvester public lpFeeHarvester;
    IRaisedFundsTimelock public raisedFundsTimelock; // Timelock for community-controlled funds
    address public pancakeFactory;
    address public wbnbAddress;

    mapping(address => LaunchBasics) public launchBasics;
    mapping(address => LaunchVesting) public launchVesting;
    mapping(address => LaunchLiquidity) public launchLiquidity;
    mapping(address => LaunchStatus) public launchStatus;
    mapping(address => mapping(address => Contribution)) public contributions;
    address[] public allLaunches;

    uint256 public fallbackBNBPrice;
    bool public useOraclePrice;

    event LaunchCreated(
        address indexed token,
        address indexed founder,
        uint256 totalSupply,
        LaunchType launchType,
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
    event RaisedFundsSentToInfoFi(address indexed token, uint256 amount);
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
    event LPTokensHandled(
        address indexed token,
        address indexed lpToken,
        uint256 amount,
        bool burned
    );
    event TransfersEnabled(address indexed token, uint256 timestamp);
    event PriceFeedUpdated(address indexed newPriceFeed);
    event FallbackPriceUpdated(uint256 newPrice);
    event OracleModeChanged(bool useOracle);
    event InfoFiAddressUpdated(address indexed newInfoFiAddress);
    event CommunityControlTriggered(
        address indexed token,
        uint256 consecutiveMonths,
        uint256 currentMarketCap,
        uint256 startMarketCap
    );

    constructor(
        address _tokenFactory,
        address _bondingCurveDEX,
        address _pancakeRouter,
        address _priceOracle,
        address _infoFiAddress,
        address _platformFeeAddress,
        address _lpFeeHarvester,
        address _raisedFundsTimelock,
        address _pancakeFactory
    ) Ownable(msg.sender) {
        require(_tokenFactory != address(0), "Invalid token factory");
        require(_bondingCurveDEX != address(0), "Invalid bonding DEX");
        require(_pancakeRouter != address(0), "Invalid pancake router");
        require(_priceOracle != address(0), "Invalid price oracle");
        require(_infoFiAddress != address(0), "Invalid InfoFi address");
        require(
            _platformFeeAddress != address(0),
            "Invalid platform fee address"
        );
        require(_lpFeeHarvester != address(0), "Invalid LP harvester");
        require(_raisedFundsTimelock != address(0), "Invalid timelock");
        pancakeFactory = _pancakeFactory;
        // BSC Wrapped Native Token address - update with actual BSC WBNB address when available
        wbnbAddress = address(0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd);

        tokenFactory = ITokenFactoryV2(_tokenFactory);
        bondingCurveDEX = IBondingCurveDEXV3(_bondingCurveDEX);
        pancakeRouter = IPancakeRouter02(_pancakeRouter);
        infoFiAddress = _infoFiAddress;
        platformFeeAddress = _platformFeeAddress;
        priceOracle = PriceOracle(_priceOracle);
        lpFeeHarvester = ILPFeeHarvester(_lpFeeHarvester);
        raisedFundsTimelock = IRaisedFundsTimelock(_raisedFundsTimelock);

        fallbackBNBPrice = 1200 * 10 ** 8;
        useOraclePrice = true;
    }

    function createLaunch(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        uint256 raiseTargetBNB,
        uint256 raiseMaxBNB,
        uint256 vestingDuration,
        ITokenFactoryV2.TokenMetadata memory metadata,
        bool burnLP
    ) external nonReentrant returns (address) {
        vestingDuration = 180 days;
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
                burnLP
            );
    }

 

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
        bool burnLP
    ) private returns (address) {
        _validateLaunchParams(raiseTargetBNB, raiseMaxBNB, vestingDuration);

        address token = _deployToken(
            name,
            symbol,
            totalSupply,
            metadata,
            useVanity,
            vanitySalt
        );

        ILaunchpadToken(token).setExemption(address(bondingCurveDEX), true);
        ILaunchpadToken(token).setExemption(address(pancakeRouter), true);
        ILaunchpadToken(token).setExemption(address(lpFeeHarvester), true);

        _initializeLaunch(
            token,
            totalSupply,
            raiseTargetBNB,
            raiseMaxBNB,
            vestingDuration,
            LaunchType.PROJECT_RAISE,
            burnLP
        );

        emit LaunchCreated(
            token,
            msg.sender,
            totalSupply * 10 ** 18,
            LaunchType.PROJECT_RAISE,
            raiseTargetBNB,
            raiseMaxBNB,
            block.timestamp + RAISE_DURATION,
            useVanity,
            burnLP
        );

        return token;
    }

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
        require(msg.value >= initialBuyBNB, "Insufficient BNB sent");

        address token = _deployToken(
            name,
            symbol,
            totalSupply,
            metadata,
            useVanity,
            vanitySalt
        );

        ILaunchpadToken(token).setExemption(address(bondingCurveDEX), true);
        ILaunchpadToken(token).setExemption(address(pancakeRouter), true);
        ILaunchpadToken(token).setExemption(address(lpFeeHarvester), true);

        uint256 totalSupplyWei = 1_000_000_000 * 10 ** 18;
        require(totalSupply == 1_000_000_000, "Total supply must be 1 billion");

        launchBasics[token] = LaunchBasics({
            token: token,
            founder: msg.sender,
            totalSupply: totalSupplyWei,
            raiseTarget: 0,
            raiseMax: 0,
            raiseDeadline: 0,
            totalRaised: 0,
            launchType: LaunchType.INSTANT_LAUNCH,
            burnLP: burnLP
        });

        launchStatus[token] = LaunchStatus({
            raiseCompleted: true,
            liquidityAdded: true,
            graduatedToPancakeSwap: false
        });

        allLaunches.push(token);

        uint256 initialLiquidityBNB = 0;
        if (msg.value > initialBuyBNB) {
            initialLiquidityBNB = msg.value - initialBuyBNB;
        }

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

    function graduateToPancakeSwap(address token) external nonReentrant {
        LaunchBasics storage basics = launchBasics[token];
        LaunchStatus storage status = launchStatus[token];

        require(
            !status.graduatedToPancakeSwap,
            "Already graduated to PancakeSwap"
        );

        uint256 bnbForLiquidity;
        uint256 tokensForLiquidity;

        if (basics.launchType == LaunchType.PROJECT_RAISE) {
            // PROJECT RAISE: Add 10% of tokens with 20% of raised BNB
            require(status.raiseCompleted, "Raise not completed");
            require(!status.liquidityAdded, "Liquidity already added");

            LaunchLiquidity storage liquidity = launchLiquidity[token];

            // 10% of total supply for PancakeSwap
            tokensForLiquidity =
                (basics.totalSupply * LIQUIDITY_TOKEN_PERCENT) /
                100;
            bnbForLiquidity = liquidity.liquidityBNB;

            IERC20(token).approve(address(this), basics.totalSupply);

            require(bnbForLiquidity > 0, "No BNB for liquidity");
            require(tokensForLiquidity > 0, "No tokens for liquidity");

            // DEDUCT 1% PLATFORM FEE from BNB
            uint256 platformFee = (bnbForLiquidity * PLATFORM_FEE_BPS) /
                BASIS_POINTS;
            bnbForLiquidity = bnbForLiquidity - platformFee;

            // Send platform fee
            payable(platformFeeAddress).transfer(platformFee);
            emit PlatformFeePaid(token, platformFee, "Project Raise Liquidity");

            status.liquidityAdded = true;
        } else {
            // INSTANT LAUNCH: Get from BondingCurveDEX
            (, , , , , , , , bool graduated) = bondingCurveDEX.getPoolInfo(
                token
            );
            require(graduated, "Not ready to graduate");

            address creator;
            uint256 remainingTokens;
            (
                bnbForLiquidity,
                tokensForLiquidity,
                remainingTokens,
                creator
            ) = bondingCurveDEX.withdrawGraduatedPool(token);

            require(creator == basics.founder, "Creator mismatch");

            // DEDUCT 1% PLATFORM FEE from BNB for Instant Launch too
            uint256 platformFee = (bnbForLiquidity * PLATFORM_FEE_BPS) /
                BASIS_POINTS;
            bnbForLiquidity = bnbForLiquidity - platformFee;

            // Send platform fee
            payable(platformFeeAddress).transfer(platformFee);
            emit PlatformFeePaid(
                token,
                platformFee,
                "Instant Launch Liquidity"
            );
        }

        // Approve and add liquidity
        IERC20(token).approve(address(pancakeRouter), tokensForLiquidity);

        (, , uint256 liquidity) = pancakeRouter.addLiquidityETH{
            value: bnbForLiquidity
        }(
            token,
            tokensForLiquidity,
            0, // TODO: Add slippage protection
            0, // TODO: Add slippage protection
            address(this),
            block.timestamp + 300
        );

        require(liquidity > 0, "No liquidity");

        // Get LP token address and handle LP tokens
        address lpToken = _getPancakePairAddressFromFactory(token, wbnbAddress);
        require(lpToken != address(0), "LP token not found");

        if (basics.launchType == LaunchType.INSTANT_LAUNCH) {
            bondingCurveDEX.setLPToken(token);
        }

        if (basics.burnLP) {
            IERC20(lpToken).safeTransfer(LP_BURN_ADDRESS, liquidity);
            emit LPBurned(token, lpToken, liquidity);
        } else {
            IERC20(lpToken).approve(address(lpFeeHarvester), liquidity);

            lpFeeHarvester.lockLP(
                token,
                lpToken,
                basics.founder,
                infoFiAddress,
                liquidity,
                0
            );

            emit LPLocked(token, lpToken, liquidity);
        }

        // Enable transfers
        ILaunchpadToken(token).enableTransfers();

        status.graduatedToPancakeSwap = true;

        emit GraduatedToPancakeSwap(token, bnbForLiquidity, tokensForLiquidity);
        emit TransfersEnabled(token, block.timestamp);
    }

    function _getPancakePairAddressFromFactory(
        address tokenA,
        address tokenB
    ) private view returns (address) {
        (bool success, bytes memory data) = pancakeFactory.staticcall(
            abi.encodeWithSignature("getPair(address,address)", tokenA, tokenB)
        );

        if (success && data.length >= 32) {
            address pair = abi.decode(data, (address));
            if (pair != address(0)) {
                return pair;
            }
        }

        (success, data) = pancakeFactory.staticcall(
            abi.encodeWithSignature("getPair(address,address)", tokenB, tokenA)
        );

        if (success && data.length >= 32) {
            return abi.decode(data, (address));
        }

        return address(0);
    }

    function _getPancakePairAddress(
        address token
    ) private view returns (address) {
        return _getPancakePairAddressFromFactory(token, wbnbAddress);
    }

    function _validateLaunchParams(
        uint256 raiseTargetBNB,
        uint256 raiseMaxBNB,
        uint256 vestingDuration
    ) private pure {
        require(
            raiseTargetBNB >= MIN_RAISE_BNB && raiseTargetBNB <= MAX_RAISE_BNB,
            "Invalid raise target"
        );
        require(
            raiseMaxBNB >= raiseTargetBNB && raiseMaxBNB <= MAX_RAISE_BNB,
            "Invalid raise max"
        );
        require(
            vestingDuration >= MIN_VESTING_DURATION &&
                vestingDuration <= MAX_VESTING_DURATION,
            "Invalid vesting duration"
        );
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

    function _initializeLaunch(
        address token,
        uint256 totalSupply,
        uint256 raiseTarget,
        uint256 raiseMax,
        uint256 vestingDuration,
        LaunchType launchType,
        bool burnLP
    ) private {
        uint256 totalSupplyWei = totalSupply * 10 ** 18;
        uint256 founderTokens = (totalSupplyWei * FOUNDER_ALLOCATION) / 100; // 60%
        uint256 vestedTokens = (totalSupplyWei * VESTED_ALLOCATION) / 100; // 10%

        launchBasics[token] = LaunchBasics({
            token: token,
            founder: msg.sender,
            totalSupply: totalSupplyWei,
            raiseTarget: raiseTarget,
            raiseMax: raiseMax,
            raiseDeadline: block.timestamp + RAISE_DURATION,
            totalRaised: 0,
            launchType: launchType,
            burnLP: burnLP
        });

        uint256[] memory emptyMarketCaps = new uint256[](0);
        launchVesting[token] = LaunchVesting({
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
        });

        launchLiquidity[token] = LaunchLiquidity({
            liquidityBNB: 0,
            liquidityTokens: 0,
            raisedFundsVesting: 0,
            raisedFundsClaimed: 0
        });

        launchStatus[token] = LaunchStatus({
            raiseCompleted: false,
            liquidityAdded: false,
            graduatedToPancakeSwap: false
        });

        allLaunches.push(token);
    }

    function contribute(address token) external payable nonReentrant {
        LaunchBasics storage basics = launchBasics[token];
        LaunchStatus storage status = launchStatus[token];

        require(
            basics.launchType == LaunchType.PROJECT_RAISE,
            "Not a project raise"
        );
        require(basics.token != address(0), "Launch does not exist");
        require(block.timestamp < basics.raiseDeadline, "Raise ended");
        require(!status.raiseCompleted, "Raise already completed");
        require(msg.value > 0, "Must contribute BNB");

        // Per-wallet contribution cap
        require(
            contributions[token][msg.sender].amount + msg.value <=
                MAX_CONTRIBUTION_PER_WALLET,
            "Exceeds per-wallet contribution limit (50K BNB)"
        );

        require(
            basics.totalRaised + msg.value <= basics.raiseMax,
            "Exceeds max raise"
        );
        contributions[token][msg.sender].amount += msg.value;
        basics.totalRaised += msg.value;

        emit ContributionMade(msg.sender, token, msg.value);

        if (basics.totalRaised >= basics.raiseTarget) {
            _completeRaise(token);
        }
    }

    /**
     * @notice Complete the raise when target is met
     * @dev FIXED: Removed liquidity cap - now true 20% of raised BNB
     */
    function _completeRaise(address token) private {
        LaunchStatus storage status = launchStatus[token];
        require(!status.raiseCompleted, "Already completed");

        LaunchBasics storage basics = launchBasics[token];
        LaunchVesting storage vesting = launchVesting[token];
        LaunchLiquidity storage liquidity = launchLiquidity[token];

        status.raiseCompleted = true;
        vesting.vestingStartTime = block.timestamp;

        // FIXED: Calculate liquidity BNB (20% of raised) - NO CAP
        uint256 liquidityBNB = (basics.totalRaised * LIQUIDITY_BNB_PERCENT) /
            100;

        liquidity.liquidityBNB = liquidityBNB;
        liquidity.raisedFundsVesting = basics.totalRaised - liquidityBNB;

        // Token distribution:
        // - 60% to founder (released immediately)
        // - 20% for contributors (claimed via claimContributorTokens)
        // - 10% for PancakeSwap liquidity (added in graduateToPancakeSwap)
        // - 10% vested over 6 months (conditional on market cap)

        // Calculate starting market cap based on liquidity
        // Market cap = (liquidityBNB * totalSupply) / liquidityTokens
        uint256 liquidityTokens = (basics.totalSupply *
            LIQUIDITY_TOKEN_PERCENT) / 100;
        vesting.startMarketCap =
            (liquidityBNB * basics.totalSupply) /
            liquidityTokens;

        // Give founder immediate 100% of their 60% allocation
        uint256 immediateRelease = (vesting.founderTokens *
            IMMEDIATE_FOUNDER_RELEASE) / 100;
        IERC20(token).safeTransfer(basics.founder, immediateRelease);
        vesting.founderTokensClaimed = immediateRelease;

        // Tokens remain in LaunchpadManager for distribution:
        // - 20% for contributors to claim
        // - 10% for liquidity
        // - 10% vested (released monthly if market cap maintained)

        status.liquidityAdded = false; // Will be set true when graduated to PancakeSwap
        emit RaiseCompleted(token, basics.totalRaised);
    }

    /**
     * @notice Contributors claim their tokens after successful raise
     * @dev Tokens are distributed proportionally based on contribution amount
     */
    function claimContributorTokens(address token) external nonReentrant {
        LaunchBasics storage basics = launchBasics[token];
        LaunchStatus storage status = launchStatus[token];

        require(
            basics.launchType == LaunchType.PROJECT_RAISE,
            "Not a project raise"
        );
        require(status.raiseCompleted, "Raise not completed");
        require(basics.totalRaised >= basics.raiseTarget, "Raise failed");

        Contribution storage contrib = contributions[token][msg.sender];
        require(contrib.amount > 0, "No contribution");
        require(!contrib.claimed, "Already claimed");

        // Calculate proportional share from 20% contributor allocation
        uint256 contributorPool = (basics.totalSupply *
            CONTRIBUTOR_ALLOCATION) / 100;
        uint256 tokensOwed = (contrib.amount * contributorPool) /
            basics.totalRaised;

        contrib.claimed = true;
        IERC20(token).safeTransfer(msg.sender, tokensOwed);

        emit ContributorTokensClaimed(msg.sender, token, tokensOwed);
    }

    /**
     * @notice Contributors claim refund if raise fails
     * @dev Refund available if raise doesn't meet target after deadline
     */
    function claimRefund(address token) external nonReentrant {
        LaunchBasics storage basics = launchBasics[token];
        LaunchStatus storage status = launchStatus[token];

        require(
            basics.launchType == LaunchType.PROJECT_RAISE,
            "Not a project raise"
        );
        require(block.timestamp > basics.raiseDeadline, "Raise still active");
        require(
            basics.totalRaised < basics.raiseTarget,
            "Raise was successful"
        );
        require(!status.raiseCompleted, "Raise completed");

        Contribution storage contrib = contributions[token][msg.sender];
        require(contrib.amount > 0, "No contribution");
        require(!contrib.claimed, "Already claimed");

        uint256 refundAmount = contrib.amount;
        contrib.claimed = true;

        payable(msg.sender).transfer(refundAmount);

        emit RefundClaimed(msg.sender, token, refundAmount);
    }

    /**
     * @notice Burn tokens for failed raise (callable by anyone after deadline)
     * @dev Burns all tokens if raise target not met
     */
    function burnFailedRaiseTokens(address token) external nonReentrant {
        LaunchBasics storage basics = launchBasics[token];
        LaunchStatus storage status = launchStatus[token];

        require(
            basics.launchType == LaunchType.PROJECT_RAISE,
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
            IERC20(token).safeTransfer(address(0xdead), balance);
            emit TokensBurned(token, balance);
            emit RaiseFailed(token, basics.totalRaised);
        }
    }

    function claimFounderTokens(address token) external nonReentrant {
        LaunchBasics storage basics = launchBasics[token];
        require(
            basics.launchType == LaunchType.PROJECT_RAISE,
            "Not a project raise"
        );
        require(msg.sender == basics.founder, "Not founder");
        require(launchStatus[token].raiseCompleted, "Raise not completed");

        uint256 claimable = _calculateClaimableFounderTokens(token);
        require(claimable > 0, "No tokens to claim");

        bool shouldBurn = _shouldBurnTokens(token);

        if (shouldBurn) {
            IERC20(token).safeTransfer(address(0xdead), claimable);
            emit TokensBurned(token, claimable);
        } else {
            IERC20(token).safeTransfer(basics.founder, claimable);
            emit FounderTokensClaimed(basics.founder, token, claimable);
        }

        launchVesting[token].founderTokensClaimed += claimable;
    }

    function claimRaisedFunds(address token) external nonReentrant {
        LaunchBasics storage basics = launchBasics[token];
        LaunchVesting storage vesting = launchVesting[token];
        require(
            basics.launchType == LaunchType.PROJECT_RAISE,
            "Not a project raise"
        );
        require(msg.sender == basics.founder, "Not founder");
        require(launchStatus[token].raiseCompleted, "Raise not completed");

        // CRITICAL: Block raised funds if community control is triggered
        require(
            !vesting.communityControlTriggered,
            "Community control active - raised funds frozen"
        );

        uint256 claimable = _calculateClaimableRaisedFunds(token);
        require(claimable > 0, "No funds to claim");

        payable(basics.founder).transfer(claimable);
        emit RaisedFundsClaimed(basics.founder, token, claimable);

        launchLiquidity[token].raisedFundsClaimed += claimable;
    }

    /**
     * @notice Claim vested tokens (10% allocation vested over 6 months)
     * @dev Vesting is conditional on token maintaining starting market cap
     * @dev Tokens ONLY release if current market cap is above starting market cap
     * @dev FIXED: If community control triggered, just revert - platform handles burn
     */
    function claimVestedTokens(address token) external nonReentrant {
        LaunchBasics storage basics = launchBasics[token];
        LaunchVesting storage vesting = launchVesting[token];
        LaunchStatus storage status = launchStatus[token];

        require(
            basics.launchType == LaunchType.PROJECT_RAISE,
            "Not a project raise"
        );
        require(msg.sender == basics.founder, "Not founder");
        require(status.raiseCompleted, "Raise not completed");
        require(status.graduatedToPancakeSwap, "Not graduated yet");

        // FIXED: If community control triggered, block claims (platform will handle burn)
        require(
            !vesting.communityControlTriggered,
            "Community control active - vesting frozen"
        );

        // CRITICAL: Check current market cap is above starting market cap
        uint256 currentMarketCap = _getCurrentMarketCap(token);
        require(
            currentMarketCap >= vesting.startMarketCap,
            "Token below starting market cap - vesting paused"
        );

        uint256 claimable = _calculateClaimableVestedTokens(token);
        require(claimable > 0, "No vested tokens to claim");

        vesting.vestedTokensClaimed += claimable;
        IERC20(token).safeTransfer(basics.founder, claimable);

        emit FounderTokensClaimed(basics.founder, token, claimable);
    }

    /**
     * @notice Update market cap tracking (called monthly)
     * @dev Tracks consecutive months below starting market cap
     */
    function updateMarketCap(address token) external {
        LaunchBasics storage basics = launchBasics[token];
        LaunchVesting storage vesting = launchVesting[token];
        LaunchStatus storage status = launchStatus[token];

        require(
            basics.launchType == LaunchType.PROJECT_RAISE,
            "Not a project raise"
        );
        require(status.raiseCompleted, "Raise not completed");
        require(status.graduatedToPancakeSwap, "Not graduated yet");

        // Check if at least 1 month has passed since last update
        uint256 monthsPassed = (block.timestamp - vesting.vestingStartTime) /
            30 days;
        require(
            monthsPassed > vesting.monthlyMarketCaps.length,
            "Too early to update"
        );

        // Get current market cap from PancakeSwap LP
        uint256 currentMarketCap = _getCurrentMarketCap(token);
        vesting.monthlyMarketCaps.push(currentMarketCap);

        // Check if below starting market cap
        if (currentMarketCap < vesting.startMarketCap) {
            vesting.consecutiveMonthsBelowStart++;

            // Trigger community control after 3 consecutive months
            if (
                vesting.consecutiveMonthsBelowStart >= MARKET_CAP_CHECK_BNBTHS
            ) {
                vesting.communityControlTriggered = true;
                emit CommunityControlTriggered(
                    token,
                    vesting.consecutiveMonthsBelowStart,
                    currentMarketCap,
                    vesting.startMarketCap
                );
            }
        } else {
            // Reset counter if above starting market cap
            vesting.consecutiveMonthsBelowStart = 0;
        }
    }

    /**
     * @notice Transfer raised funds to timelock when community control is triggered
     * @dev Only callable when 3 consecutive months below starting market cap
     * @dev Funds locked for 48 hours for platform team to review community input
     */
    function transferFundsToTimelock(address token) external nonReentrant onlyOwner{
        LaunchBasics storage basics = launchBasics[token];
        LaunchVesting storage vesting = launchVesting[token];
        LaunchLiquidity storage liquidity = launchLiquidity[token];

        require(
            basics.launchType == LaunchType.PROJECT_RAISE,
            "Not a project raise"
        );
        require(
            vesting.communityControlTriggered,
            "Community control not active"
        );

        uint256 remainingFunds = liquidity.raisedFundsVesting -
            liquidity.raisedFundsClaimed;
        require(remainingFunds > 0, "No funds to transfer");

        liquidity.raisedFundsClaimed = liquidity.raisedFundsVesting;

        // Transfer to timelock with platform address as default beneficiary
        raisedFundsTimelock.lockFunds{value: remainingFunds}(
            token,
            platformFeeAddress
        );
    }

    /**
     * @notice Burn remaining vested tokens when community control is triggered
     * @dev Only owner (platform) can call - per governance model
     * @dev Called after community consultation and decision
     */
    function burnVestedTokensOnCommunityControl(
        address token
    ) external onlyOwner nonReentrant {
        LaunchBasics storage basics = launchBasics[token];
        LaunchVesting storage vesting = launchVesting[token];

        require(
            basics.launchType == LaunchType.PROJECT_RAISE,
            "Not a project raise"
        );
        require(
            vesting.communityControlTriggered,
            "Community control not active"
        );

        uint256 remainingVestedTokens = vesting.vestedTokens -
            vesting.vestedTokensClaimed;
        require(remainingVestedTokens > 0, "No vested tokens to burn");

        // Mark all vested tokens as claimed (burned)
        vesting.vestedTokensClaimed = vesting.vestedTokens;

        // Burn the tokens
        IERC20(token).safeTransfer(address(0xdead), remainingVestedTokens);

        emit VestedTokensBurnedByCommunityControl(token, remainingVestedTokens);
        emit TokensBurned(token, remainingVestedTokens);
    }

    /**
     * @notice Update timelock beneficiary based on community decision
     * @dev Only owner can call (platform team)
     * @param token Token address
     * @param newBeneficiary New beneficiary address based on community input
     */
    function updateTimelockBeneficiary(
        address token,
        address newBeneficiary
    ) external onlyOwner {
        raisedFundsTimelock.updateBeneficiary(token, newBeneficiary);
    }

    /**
     * @notice Get information about community control status
     * @dev Useful for frontend to display community governance state
     */
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
        LaunchBasics storage basics = launchBasics[token];
        LaunchVesting storage vesting = launchVesting[token];
        LaunchLiquidity storage liquidity = launchLiquidity[token];
        LaunchStatus storage status = launchStatus[token];

        uint256 currentMCap = 0;
        if (status.graduatedToPancakeSwap) {
            currentMCap = _getCurrentMarketCap(token);
        }

        return (
            vesting.communityControlTriggered,
            vesting.consecutiveMonthsBelowStart,
            currentMCap,
            vesting.startMarketCap,
            liquidity.raisedFundsVesting - liquidity.raisedFundsClaimed,
            vesting.vestedTokens - vesting.vestedTokensClaimed
        );
    }

    /**
     * @notice Handle selling tokens after graduation via PancakeSwap
     * @dev Routes trade through PancakeSwap router (no platform fee)
     */
    function handlePostGraduationSell(
        address token,
        uint256 tokenAmount,
        uint256 minBNBOut
    ) external nonReentrant {
        LaunchBasics storage launch = launchBasics[token];
        LaunchStatus storage status = launchStatus[token];

        require(status.graduatedToPancakeSwap, "Not graduated");
        require(
            launch.launchType == LaunchType.PROJECT_RAISE,
            "Not a project raise"
        );

        // Transfer tokens from seller
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);

        // ROUTE THROUGH PANCAKESWAP ROUTER
        IERC20(token).approve(address(pancakeRouter), tokenAmount);

        address[] memory path = new address[](2);
        path[0] = token;
        path[1] = wbnbAddress;

        uint256[] memory amounts = pancakeRouter.swapExactTokensForETH(
            tokenAmount,
            minBNBOut,
            path,
            msg.sender, // Send BNB directly to seller
            block.timestamp + 300
        );

        uint256 bnbReceived = amounts[amounts.length - 1];
        require(bnbReceived >= minBNBOut, "Slippage too high");

        emit PostGraduationSell(
            msg.sender,
            token,
            tokenAmount,
            bnbReceived,
            0,
            0
        );
    }

    /**
     * @notice Handle buying tokens after graduation via PancakeSwap
     * @dev Routes trade through PancakeSwap router (no platform fee)
     */
    function handlePostGraduationBuy(
        address token,
        uint256 minTokensOut
    ) external payable nonReentrant {
        LaunchBasics storage launch = launchBasics[token];
        LaunchStatus storage status = launchStatus[token];

        require(status.graduatedToPancakeSwap, "Not graduated");
        require(
            launch.launchType == LaunchType.PROJECT_RAISE,
            "Not a project raise"
        );
        require(msg.value > 0, "Must send BNB");

        // ROUTE THROUGH PANCAKESWAP ROUTER
        address[] memory path = new address[](2);
        path[0] = wbnbAddress;
        path[1] = token;

        uint256[] memory amounts = pancakeRouter.swapExactETHForTokens{
            value: msg.value
        }(
            minTokensOut,
            path,
            msg.sender, // Send tokens directly to buyer
            block.timestamp + 300
        );

        uint256 tokensReceived = amounts[amounts.length - 1];
        require(tokensReceived >= minTokensOut, "Slippage too high");

        emit PostGraduationBuy(msg.sender, token, msg.value, tokensReceived, 0);
    }

    function _shouldBurnTokens(address token) private view returns (bool) {
        LaunchBasics storage basics = launchBasics[token];
        LaunchStatus storage status = launchStatus[token];

        if (basics.launchType == LaunchType.PROJECT_RAISE) {
            // Only burn if raise failed
            return
                (block.timestamp >= basics.raiseDeadline) &&
                !status.raiseCompleted;
        } else {
            // INSTANT_LAUNCH: Check bonding curve price
            (, , , , , uint256 currentPrice, , , ) = bondingCurveDEX
                .getPoolInfo(token);
            LaunchVesting storage vesting = launchVesting[token];
            uint256 startPrice = (vesting.startMarketCap * 10 ** 18) /
                basics.totalSupply;
            return currentPrice < startPrice;
        }
    }

    function _calculateClaimableFounderTokens(
        address token
    ) private view returns (uint256) {
        LaunchVesting storage vesting = launchVesting[token];

        if (!launchStatus[token].raiseCompleted) return 0;

        uint256 immediateRelease = (vesting.founderTokens *
            IMMEDIATE_FOUNDER_RELEASE) / 100;
        uint256 vestedTokens = vesting.founderTokens - immediateRelease;

        uint256 timePassed = block.timestamp - vesting.vestingStartTime;

        if (timePassed >= vesting.vestingDuration) {
            return vesting.founderTokens - vesting.founderTokensClaimed;
        }

        uint256 monthsPassed = timePassed / VESTING_RELEASE_INTERVAL;
        uint256 totalMonths = vesting.vestingDuration /
            VESTING_RELEASE_INTERVAL;

        uint256 totalVested = immediateRelease +
            ((vestedTokens * monthsPassed) / totalMonths);

        if (totalVested <= vesting.founderTokensClaimed) {
            return 0;
        }
        return totalVested - vesting.founderTokensClaimed;
    }

    function _calculateClaimableRaisedFunds(
        address token
    ) private view returns (uint256) {
        LaunchVesting storage vesting = launchVesting[token];
        LaunchLiquidity storage liquidity = launchLiquidity[token];

        if (!launchStatus[token].raiseCompleted) return 0;

        uint256 timePassed = block.timestamp - vesting.vestingStartTime;

        if (timePassed >= vesting.vestingDuration) {
            return liquidity.raisedFundsVesting - liquidity.raisedFundsClaimed;
        }

        // BNBTHLY VESTING (same as founder tokens)
        uint256 monthsPassed = timePassed / VESTING_RELEASE_INTERVAL;
        uint256 totalMonths = vesting.vestingDuration /
            VESTING_RELEASE_INTERVAL;

        uint256 totalVested = (liquidity.raisedFundsVesting * monthsPassed) /
            totalMonths;

        if (totalVested <= liquidity.raisedFundsClaimed) {
            return 0;
        }
        return totalVested - liquidity.raisedFundsClaimed;
    }

    /**
     * @notice Calculate claimable vested tokens (10% allocation)
     * @dev Vesting only releases if token maintains starting market cap
     */
    function _calculateClaimableVestedTokens(
        address token
    ) private view returns (uint256) {
        LaunchVesting storage vesting = launchVesting[token];

        if (!launchStatus[token].raiseCompleted) return 0;
        if (vesting.communityControlTriggered) return 0;

        uint256 timePassed = block.timestamp - vesting.vestingStartTime;

        if (timePassed >= vesting.vestingDuration) {
            return vesting.vestedTokens - vesting.vestedTokensClaimed;
        }

        // BNBTHLY VESTING over 6 months
        uint256 monthsPassed = timePassed / VESTING_RELEASE_INTERVAL;
        uint256 totalMonths = vesting.vestingDuration /
            VESTING_RELEASE_INTERVAL;

        uint256 totalVested = (vesting.vestedTokens * monthsPassed) /
            totalMonths;

        if (totalVested <= vesting.vestedTokensClaimed) {
            return 0;
        }
        return totalVested - vesting.vestedTokensClaimed;
    }

    /**
     * @notice Get current market cap from PancakeSwap LP
     * @dev Market cap = (total supply * token price in BNB)
     */
    function _getCurrentMarketCap(
        address token
    ) private view returns (uint256) {
        address lpToken = _getPancakePairAddress(token);
        require(lpToken != address(0), "LP token not found");

        IPancakePair pair = IPancakePair(lpToken);
        (uint112 reserve0, uint112 reserve1, ) = pair.getReserves();

        address token0 = pair.token0();

        uint256 tokenReserve;
        uint256 bnbReserve;

        if (token0 == token) {
            tokenReserve = uint256(reserve0);
            bnbReserve = uint256(reserve1);
        } else {
            tokenReserve = uint256(reserve1);
            bnbReserve = uint256(reserve0);
        }

        require(tokenReserve > 0, "No token reserve");

        // Market cap = total supply * price per token
        // Price per token = bnbReserve / tokenReserve
        LaunchBasics storage basics = launchBasics[token];
        uint256 marketCap = (basics.totalSupply * bnbReserve) / tokenReserve;

        return marketCap;
    }

    function updateLPFeeHarvester(address _lpFeeHarvester) external onlyOwner {
        require(_lpFeeHarvester != address(0), "Invalid address");
        lpFeeHarvester = ILPFeeHarvester(_lpFeeHarvester);
    }

    function updateInfoFiAddress(address _infoFiAddress) external onlyOwner {
        require(_infoFiAddress != address(0), "Invalid address");
        infoFiAddress = _infoFiAddress;
        emit InfoFiAddressUpdated(_infoFiAddress);
    }

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
            LaunchType launchType,
            bool burnLP
        )
    {
        LaunchBasics storage basics = launchBasics[token];
        LaunchStatus storage status = launchStatus[token];
        LaunchLiquidity storage liquidity = launchLiquidity[token];

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
            LaunchType launchType,
            bool burnLP
        )
    {
        LaunchBasics storage basics = launchBasics[token];
        LaunchStatus storage status = launchStatus[token];

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
        LaunchBasics storage basics = launchBasics[token];

        if (basics.launchType == LaunchType.PROJECT_RAISE) {
            return (
                _calculateClaimableFounderTokens(token),
                _calculateClaimableRaisedFunds(token)
            );
        } else {
            return (0, 0);
        }
    }

    /**
     * @notice Get claimable vested tokens amount
     * @dev Returns 0 if community control is active
     */
    function getClaimableVestedTokens(
        address token
    ) external view returns (uint256) {
        return _calculateClaimableVestedTokens(token);
    }

    function getContribution(
        address token,
        address contributor
    ) external view returns (uint256 amount, bool claimed) {
        Contribution storage contrib = contributions[token][contributor];
        return (contrib.amount, contrib.claimed);
    }

    function getAllLaunches() external view returns (address[] memory) {
        return allLaunches;
    }

    /**
     * @notice Get monthly market cap history
     * @dev Useful for frontend to display market cap trends
     */
    function getMarketCapHistory(
        address token
    ) external view returns (uint256[] memory) {
        return launchVesting[token].monthlyMarketCaps;
    }

    function emergencyWithdraw(address token) external onlyOwner {
        LaunchBasics storage basics = launchBasics[token];
        LaunchStatus storage status = launchStatus[token];

        require(
            basics.launchType == LaunchType.PROJECT_RAISE,
            "Not a project raise"
        );
        require(!status.raiseCompleted, "Raise completed");
        require(block.timestamp > basics.raiseDeadline, "Raise still active");
        require(basics.totalRaised < basics.raiseTarget, "Raise target met");

        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(owner(), balance);
    }

    receive() external payable {}
}
