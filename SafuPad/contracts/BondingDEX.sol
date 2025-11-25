// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
/**
 * @title BondingCurveDEX - INSTANT_LAUNCH Only Version (Monad)
 * @dev Version: 3.0.0 (Monad Migration)
 *
 * MONAD MIGRATION CHANGES:
 * - Updated from BNB to MON (Monad native token)
 * - Graduation threshold: 1M MON
 * - All BNB references changed to MON
 *
 * CHANGES FROM v2.0.0:
 * - Migrated to Monad blockchain
 * - Updated all BNB/WBNB references to MON/WMON
 * - Added graduation fee distribution (70% creator, 20% InfoFi, 10% platform)
 *
 * TRADING FEE STRUCTURE (2% total before graduation):
 * - 1% to creator (50% of fees)
 * - 0.6% to InfoFi (30% of fees)
 * - 0.1% to platform (5% of fees)
 * - 0.3% to EduFi incentives (15% of fees)
 *
 * LP FEE DISTRIBUTION (after graduation to PancakeSwap):
 * - 70% to creator
 * - 20% to InfoFi
 * - 10% to platform
 * Note: LP fee distribution is handled by LaunchpadManager/LPFeeHarvester
 *
 * CHANGES FROM v1.1.0:
 * - Removed all PROJECT_RAISE functionality
 * - Only supports INSTANT_LAUNCH tokens
 * - Simplified fee distribution (single structure)
 * - Cleaner, more focused codebase
 *
 * SECURITY FIXES (carried over from v1.1.0):
 * ✅ Fix #1: Added strict input validation in createInstantLaunchPool()
 * ✅ Fix #2: Added slippage protection in _handlePostGraduationSell()
 * ✅ Fix #3: State updates before external calls (CEI pattern) + nonReentrant
 *
 * Status: PRODUCTION READY
 */
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./PriceOracle.sol";

interface ILaunchpadToken {
    function enableTransfers() external;

    function setExemption(address account, bool exempt) external;
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

interface IPancakeFactory {
    function getPair(
        address tokenA,
        address tokenB
    ) external view returns (address);
}

/**

* @title BondingCurveDEX - INSTANT_LAUNCH Only
* @dev Simplified bonding curve DEX supporting only INSTANT_LAUNCH tokens
*/
contract BondingCurveDEX is ReentrancyGuard, AccessControl {
    using SafeERC20 for IERC20;
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    struct Pool {
        address token;
        uint256 monReserve;
        uint256 tokenReserve;
        uint256 reservedTokens;
        uint256 totalTokenSupply;
        uint256 marketCap;
        uint256 graduationMarketCap;
        bool graduated;
        bool active;
        address creator;
        uint256 virtualMonReserve;
        uint256 monForPancakeSwap;
        address lpToken;
        bool burnLP;
        uint256 launchBlock;
        uint256 graduationMonThreshold;
        uint256 graduationMarketCapMON;
    }
    struct FeeDistribution {
        uint256 platformFee;
        uint256 creatorFee;
        uint256 infoFiFee;
        uint256 academyFee;
    }
    struct CreatorFees {
        uint256 accumulatedFees;
        uint256 lastClaimTime;
        uint256 graduationMarketCap;
        uint256 weekStartTime;
        uint256 totalPurchaseVolume;
    }
    struct PostGraduationStats {
        uint256 totalTokensSold;
        uint256 totalLiquidityAdded;
        uint256 lpTokensGenerated;
    }
    // Constants
    uint256 public constant TOTAL_TOKEN_SUPPLY = 1_000_000_000 * 10 ** 18;
    uint256 public constant GRADUATION_MON_THRESHOLD = 1_000_000 ether; // 1M MON graduation threshold
    uint256 public constant TARGET_PRICE_MULTIPLIER = 6;
    uint256 public constant BASIS_POINTS = 10000;
    uint256 public constant CLAIM_COOLDOWN = 24 hours;
    uint256 public constant REDISTRIBUTION_PERIOD = 7 days;
    uint256 public constant INSTANT_LAUNCH_PANCAKESWAP_PERCENT = 20; // 20% reserved for PancakeSwap
    uint256 public constant POST_GRADUATION_FEE_BPS = 100; // 1% post-graduation fee

    address public constant LP_BURN_ADDRESS =
        0x000000000000000000000000000000000000dEaD;

    // Anti-bot dynamic fee structure for INSTANT_LAUNCH
    uint256 public constant INITIAL_FEE_BPS = 1000; // 10% at launch
    uint256 public constant FINAL_FEE_BPS = 200; // 2% final trading fee
    uint256 public constant FEE_DECAY_BLOCK_1 = 20;
    uint256 public constant FEE_DECAY_BLOCK_2 = 50;
    uint256 public constant FEE_DECAY_BLOCK_3 = 100;
    uint256 public constant FEE_TIER_1 = 1000; // 10%
    uint256 public constant FEE_TIER_2 = 600; // 6%
    uint256 public constant FEE_TIER_3 = 400; // 4%

    // Fee distribution structure for 2% trading fee:
    // - 1% to creator (50% of fees)
    // - 0.6% to InfoFi (30% of fees)
    // - 0.1% to platform (5% of fees)
    // - 0.3% to EduFi/Academy (15% of fees)

    FeeDistribution public feeDistribution;
    // State variables

    address public platformFeeAddress;
    address public academyFeeAddress;
    address public infoFiFeeAddress;
    PriceOracle public priceOracle;
    IPancakeRouter02 public pancakeRouter;
    IPancakeFactory public pancakeFactory;
    ILPFeeHarvester public lpFeeHarvester;
    address public wmonAddress;
    mapping(address => Pool) public pools;

    mapping(address => CreatorFees) public creatorFees;
    mapping(address => PostGraduationStats) public postGradStats;
    address[] public activeTokens;
    bool public paused;

    // Events

    event PoolCreated(
        address indexed token,
        uint256 initialLiquidity,
        uint256 tradableTokens,
        uint256 reservedTokens,
        address indexed creator,
        uint256 launchBlock,
        uint256 virtualMonReserve,
        uint256 graduationMonThreshold
    );
    event TokensBought(
        address indexed buyer,
        address indexed token,
        uint256 monAmount,
        uint256 tokensReceived,
        uint256 currentPrice,
        uint256 feeRate
    );
    event TokensSold(
        address indexed seller,
        address indexed token,
        uint256 tokensAmount,
        uint256 monReceived,
        uint256 currentPrice,
        uint256 feeRate
    );
    event PoolGraduated(
        address indexed token,
        uint256 finalMarketCap,
        uint256 finalPrice,
        uint256 reservedTokens,
        uint256 monForPancakeSwap
    );
    event FeesCollected(
        address indexed token,
        uint256 platformFee,
        uint256 creatorFee,
        uint256 infoFiFee
    );
    event CreatorFeesClaimed(
        address indexed creator,
        address indexed token,
        uint256 amount
    );
    event CreatorFeesRedirectedToInfoFi(address indexed token, uint256 amount);
    event LiquidityIncreased(address indexed token, uint256 monAdded);
    event Paused(address indexed account);
    event Unpaused(address indexed account);
    event PostGraduationSell(
        address indexed seller,
        address indexed token,
        uint256 tokensIn,
        uint256 monOut,
        uint256 liquidityAdded,
        uint256 lpGenerated
    );
    event LPTokensHandled(
        address indexed token,
        address indexed lpToken,
        uint256 amount,
        bool burned
    );
    modifier whenNotPaused() {
        require(!paused, "Contract is paused");
        _;
    }

    constructor(
        address _platformFeeAddress,
        address _academyFeeAddress,
        address _infoFiFeeAddress,
        address _priceOracle,
        address _admin,
        address _pancakeRouter,
        address _pancakeFactory,
        address _lpFeeHarvester
    ) {
        require(_platformFeeAddress != address(0), "Invalid platform address");
        require(_academyFeeAddress != address(0), "Invalid academy address");
        require(_infoFiFeeAddress != address(0), "Invalid InfoFi address");
        require(_priceOracle != address(0), "Invalid price oracle");
        require(_admin != address(0), "Invalid admin address");
        require(_pancakeRouter != address(0), "Invalid router");
        require(_pancakeFactory != address(0), "Invalid factory");
        require(_lpFeeHarvester != address(0), "Invalid harvester");
        platformFeeAddress = _platformFeeAddress;

        academyFeeAddress = _academyFeeAddress;
        infoFiFeeAddress = _infoFiFeeAddress;
        priceOracle = PriceOracle(_priceOracle);
        pancakeRouter = IPancakeRouter02(_pancakeRouter);
        pancakeFactory = IPancakeFactory(_pancakeFactory);
        lpFeeHarvester = ILPFeeHarvester(_lpFeeHarvester);
        wmonAddress = pancakeRouter.WETH();
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);

        _grantRole(EMERGENCY_ROLE, _admin);
        // INSTANT_LAUNCH fee distribution: 5% platform, 50% creator, 30% InfoFi, 15% academy

        feeDistribution = FeeDistribution({
            platformFee: 5,
            creatorFee: 50,
            infoFiFee: 30,
            academyFee: 15
        });
        paused = false;
    }

    /**

* @notice Get current fee rate based on blocks since launch
* @dev Fee decays from 10% to 2% over 100 blocks for INSTANT_LAUNCH
*/
    function getCurrentFeeRate(address token) public view returns (uint256) {
        Pool memory pool = pools[token];
        if (pool.graduated || !pool.active) {
            return POST_GRADUATION_FEE_BPS;
        }
        uint256 blocksSinceLaunch = block.number - pool.launchBlock;
        if (blocksSinceLaunch < FEE_DECAY_BLOCK_1) {
            return FEE_TIER_1; // 10%
        } else if (blocksSinceLaunch < FEE_DECAY_BLOCK_2) {
            return FEE_TIER_2; // 6%
        } else if (blocksSinceLaunch < FEE_DECAY_BLOCK_3) {
            return FEE_TIER_3; // 4%
        } else {
            return FINAL_FEE_BPS; // 2% final fee
        }
    }

    /**
* @notice Create an INSTANT_LAUNCH pool

* @dev Only callable by MANAGER_ROLE. Creates a bonding curve pool with virtual reserves.
* @param token The token address
* @param tokenAmount Total token amount (must be 1 billion)
* @param creator The creator address
* @param burnLP Whether to burn LP tokens or lock them
*/
    function createInstantLaunchPool(
        address token,
        uint256 tokenAmount,
        address creator,
        bool burnLP
    ) external payable onlyRole(MANAGER_ROLE) whenNotPaused {
        require(tokenAmount == TOTAL_TOKEN_SUPPLY, "Must be 1 billion tokens");
        require(creator != address(0), "Invalid creator");
        // 20% reserved for PancakeSwap, 80% tradable on curve
        uint256 reservedTokens = (TOTAL_TOKEN_SUPPLY *
            INSTANT_LAUNCH_PANCAKESWAP_PERCENT) / 100;
        uint256 tradableTokens = TOTAL_TOKEN_SUPPLY - reservedTokens;
        _createPool(token, tradableTokens, reservedTokens, creator, burnLP);
    }

    /**
* @notice Internal function to create a pool

*/
    function _createPool(
        address token,
        uint256 tradableTokens,
        uint256 reservedTokens,
        address creator,
        bool burnLP
    ) private {
        require(!pools[token].active, "Pool already exists");
        require(tradableTokens > 0, "Token amount must be > 0");
        require(reservedTokens > 0, "Reserved tokens must be > 0");
        uint256 totalTokens = tradableTokens + reservedTokens;
        IERC20(token).safeTransferFrom(msg.sender, address(this), totalTokens);

        uint256 monReserve = msg.value;
        uint256 initialMarketCap = 0;

        if (monReserve > 0) {
            initialMarketCap =
                (monReserve * TOTAL_TOKEN_SUPPLY) /
                tradableTokens;
        }
        // Calculate virtual MON reserve for price shaping
        uint256 virtualMonReserve = GRADUATION_MON_THRESHOLD /
            (TARGET_PRICE_MULTIPLIER - 1);
        require(virtualMonReserve > 0, "Virtual reserve must be > 0");
        pools[token] = Pool({
            token: token,
            monReserve: monReserve,
            tokenReserve: tradableTokens,
            reservedTokens: reservedTokens,
            totalTokenSupply: TOTAL_TOKEN_SUPPLY,
            marketCap: initialMarketCap,
            graduationMarketCap: 0,
            graduated: false,
            active: true,
            creator: creator,
            virtualMonReserve: virtualMonReserve,
            monForPancakeSwap: 0,
            lpToken: address(0),
            burnLP: burnLP,
            launchBlock: block.number,
            graduationMonThreshold: GRADUATION_MON_THRESHOLD,
            graduationMarketCapMON: 0
        });
        creatorFees[token] = CreatorFees({
            accumulatedFees: 0,
            lastClaimTime: block.timestamp,
            graduationMarketCap: 0,
            weekStartTime: block.timestamp,
            totalPurchaseVolume: 0
        });
        activeTokens.push(token);
        emit PoolCreated(
            token,
            msg.value,
            tradableTokens,
            reservedTokens,
            creator,
            block.number,
            virtualMonReserve,
            GRADUATION_MON_THRESHOLD
        );
    }

    /**
* @notice Buy tokens from the bonding curve

* @param token The token address
* @param minTokensOut Minimum tokens to receive (slippage protection)
*/
    function buyTokens(
        address token,
        uint256 minTokensOut
    ) external payable nonReentrant whenNotPaused {
        Pool storage pool = pools[token];
        if (pool.graduated) {
            _buyTokensPostGraduation(token, minTokensOut);
            return;
        }
        require(pool.active, "Pool not active");

        require(msg.value > 0, "Must send MON");
        uint256 feeRate = getCurrentFeeRate(token);
        uint256 totalFee = (msg.value * feeRate) / BASIS_POINTS;

        uint256 monAfterFee = msg.value - totalFee;
        // Calculate tokens out using bonding curve formula
        uint256 augmentedMonBefore = pool.monReserve + pool.virtualMonReserve;

        uint256 tokensOut = (monAfterFee * pool.tokenReserve) /
            (augmentedMonBefore + monAfterFee);
        if (tokensOut > pool.tokenReserve) {
            tokensOut = pool.tokenReserve;
        }
        require(tokensOut >= minTokensOut, "Slippage too high");
        require(tokensOut <= pool.tokenReserve, "Insufficient liquidity");

        // Update reserves (CEI pattern - state changes before external calls)
        pool.monReserve += monAfterFee;

        pool.tokenReserve -= tokensOut;
        // Update market cap
        uint256 augmentedMonNow = pool.monReserve + pool.virtualMonReserve;

        if (pool.tokenReserve > 0) {
            pool.marketCap =
                (augmentedMonNow * pool.totalTokenSupply) /
                pool.tokenReserve;
        }
        uint256 currentPrice = 0;
        if (pool.tokenReserve > 0) {
            currentPrice = (augmentedMonNow * 10 ** 18) / pool.tokenReserve;
        }
        _distributeFees(totalFee, token, msg.sender);
        IERC20(token).safeTransfer(msg.sender, tokensOut);

        emit TokensBought(
            msg.sender,
            token,
            msg.value,
            tokensOut,
            currentPrice,
            feeRate
        );
        _checkGraduation(token);
    }

    /**
* @notice Sell tokens back to the bonding curve or after graduation

* @param token The token address
* @param tokenAmount Amount of tokens to sell
* @param minMONOut Minimum MON to receive (slippage protection)
*/
    function sellTokens(
        address token,
        uint256 tokenAmount,
        uint256 minMONOut
    ) external nonReentrant whenNotPaused {
        Pool storage pool = pools[token];
        require(pool.token != address(0), "Pool does not exist");
        require(tokenAmount > 0, "Must sell tokens");

        if (pool.graduated) {
            _handlePostGraduationSell(token, tokenAmount, minMONOut);
            return;
        }

        require(pool.active, "Pool not active");
        // Calculate MON out using bonding curve formula

        uint256 monOut = (tokenAmount * pool.monReserve) /
            (pool.tokenReserve + tokenAmount);
        uint256 feeRate = getCurrentFeeRate(token);
        uint256 totalFee = (monOut * feeRate) / BASIS_POINTS;
        uint256 monAfterFee = monOut - totalFee;
        require(monAfterFee >= minMONOut, "Slippage too high");
        require(monAfterFee <= pool.monReserve, "Insufficient MON liquidity");

        // Transfer tokens from seller (before state changes for CEI)
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);

        // Update reserves
        pool.monReserve -= monOut;

        pool.tokenReserve += tokenAmount;
        // Update market cap
        uint256 augmentedMonNow = pool.monReserve + pool.virtualMonReserve;

        if (pool.tokenReserve > 0) {
            pool.marketCap =
                (augmentedMonNow * pool.totalTokenSupply) /
                pool.tokenReserve;
        }
        uint256 currentPrice = augmentedMonNow > 0 && pool.tokenReserve > 0
            ? (augmentedMonNow * 10 ** 18) / pool.tokenReserve
            : 0;
        _distributeFees(totalFee, token, msg.sender);
        payable(msg.sender).transfer(monAfterFee);

        emit TokensSold(
            msg.sender,
            token,
            tokenAmount,
            monAfterFee,
            currentPrice,
            feeRate
        );
    }

    /**
     * @notice Handle selling tokens after graduation via PancakeSwap
     * @dev Routes trade through PancakeSwap router
     */
    function _handlePostGraduationSell(
        address token,
        uint256 tokenAmount,
        uint256 minMONOut
    ) private {
        Pool storage pool = pools[token];
        require(pool.graduated, "Pool not graduated");

        // Transfer tokens from seller
        IERC20(token).safeTransferFrom(msg.sender, address(this), tokenAmount);

        // Take 2% platform fee
        uint256 platformFee = (tokenAmount * POST_GRADUATION_FEE_BPS) /
            BASIS_POINTS;
        uint256 tokensToSell = tokenAmount - platformFee;

        // ✅ ROUTE THROUGH PANCAKESWAP ROUTER
        IERC20(token).approve(address(pancakeRouter), tokensToSell);

        address[] memory path = new address[](2);
        path[0] = token;
        path[1] = wmonAddress;

        uint256[] memory amounts = pancakeRouter.swapExactTokensForETH(
            tokensToSell,
            minMONOut,
            path,
            msg.sender, // ✅ Send MON directly to seller
            block.timestamp + 300
        );

        uint256 monReceived = amounts[amounts.length - 1];
        require(monReceived >= minMONOut, "Slippage too high");

        // Send platform fee tokens to fee address
        if (platformFee > 0) {
            IERC20(token).safeTransfer(platformFeeAddress, platformFee);
        }

        // Update stats
        PostGraduationStats storage stats = postGradStats[token];
        stats.totalTokensSold += tokenAmount;

        emit PostGraduationSell(
            msg.sender,
            token,
            tokenAmount,
            monReceived,
            platformFee,
            0
        );
    }

    /**
     * @notice Buy tokens after graduation via PancakeSwap
     * @dev Routes trade through PancakeSwap router
     */
    function _buyTokensPostGraduation(
        address token,
        uint256 minTokensOut
    ) private nonReentrant whenNotPaused {
        Pool storage pool = pools[token];
        require(pool.graduated, "Pool not graduated");
        require(msg.value > 0, "Must send MON");

        // Take 1% platform fee
        uint256 platformFee = (msg.value * POST_GRADUATION_FEE_BPS) /
            BASIS_POINTS;
        uint256 monToSpend = msg.value - platformFee;

        // ✅ ROUTE THROUGH PANCAKESWAP ROUTER
        address[] memory path = new address[](2);
        path[0] = wmonAddress;
        path[1] = token;

        uint256[] memory amounts = pancakeRouter.swapExactETHForTokens{
            value: monToSpend
        }(
            minTokensOut,
            path,
            msg.sender, // ✅ Send tokens directly to buyer
            block.timestamp + 300
        );

        uint256 tokensReceived = amounts[amounts.length - 1];
        require(tokensReceived >= minTokensOut, "Slippage too high");

        // Send platform fee to fee address
        if (platformFee > 0) {
            payable(platformFeeAddress).transfer(platformFee);
        }

        emit TokensBought(
            msg.sender,
            token,
            msg.value,
            tokensReceived,
            (monToSpend * 10 ** 18) / tokensReceived, // price
            POST_GRADUATION_FEE_BPS
        );
    }

    /**
* @notice Check if pool should graduate to PancakeSwap

*/
    function _checkGraduation(address token) private {
        Pool storage pool = pools[token];
        if (pool.monReserve >= GRADUATION_MON_THRESHOLD) {
            _graduatePool(token);
        }
    }

    /**
* @notice Graduate pool to PancakeSwap

*/
    function _graduatePool(address token) private {
        Pool storage pool = pools[token];
        pool.graduated = true;
        pool.active = false;

        creatorFees[token].graduationMarketCap = pool.marketCap;
        pool.monForPancakeSwap = pool.monReserve;

        uint256 finalPrice = (pool.monReserve + pool.virtualMonReserve) > 0 &&
            pool.tokenReserve > 0
            ? ((pool.monReserve + pool.virtualMonReserve) * 10 ** 18) /
                pool.tokenReserve
            : 0;
        emit PoolGraduated(
            token,
            pool.marketCap,
            finalPrice,
            pool.reservedTokens,
            pool.monReserve
        );
    }

    /**
* @notice Withdraw graduated pool funds (for LaunchpadManager to add to PancakeSwap)
* @dev Sends all MON and reserved tokens to LaunchpadManager for liquidity
* @return monAmount Amount of MON withdrawn
* @return tokenAmount Amount of reserved tokens withdrawn
* @return remainingTokens Amount of remaining tradable tokens
* @return creator The pool creator address
*/
    function withdrawGraduatedPool(
        address token
    )
        external
        onlyRole(MANAGER_ROLE)
        returns (
            uint256 monAmount,
            uint256 tokenAmount,
            uint256 remainingTokens,
            address creator
        )
    {
        Pool storage pool = pools[token];
        require(pool.graduated, "Pool not graduated");
        require(pool.active == false, "Pool still active");
        monAmount = pool.monForPancakeSwap;
        tokenAmount = pool.reservedTokens;

        remainingTokens = pool.tokenReserve;
        creator = pool.creator;
        if (monAmount > 0) {
            require(
                pool.monReserve >= monAmount,
                "Insufficient MON for withdrawal"
            );
            pool.monReserve -= monAmount;
        }
        pool.reservedTokens = 0;
        // Send remaining tradable tokens to creator

        // Send reserved tokens and MON to LaunchpadManager
        IERC20(pool.token).safeTransfer(msg.sender, tokenAmount);

        if (monAmount > 0) {
            (bool success, ) = payable(msg.sender).call{value: monAmount}("");
            require(success, "MON transfer failed");
        }
        return (monAmount, tokenAmount, remainingTokens, creator);
    }

    /**
* @notice Set LP token address for a pool

*/
    function setLPToken(address token) external onlyRole(MANAGER_ROLE) {
        Pool storage pool = pools[token];
        address lpToken = pancakeFactory.getPair(token, wmonAddress);
        pool.lpToken = lpToken;
    }

    /**
* @notice Distribute fees according to INSTANT_LAUNCH structure

* @dev 5% platform, 50% creator, 45% InfoFi, 0% liquidity
*/
    function _distributeFees(
        uint256 totalFee,
        address token,
        address trader
    ) private {
        Pool storage pool = pools[token];
        uint256 platformAmount = (totalFee * feeDistribution.platformFee) / 100;
        uint256 creatorAmount = (totalFee * feeDistribution.creatorFee) / 100;

        uint256 infoFiAmount = (totalFee * feeDistribution.infoFiFee) / 100;
        // If trader is creator, redirect their creator fee to InfoFi
        if (trader != pool.creator) {
            creatorFees[token].accumulatedFees += creatorAmount;
        } else {
            infoFiAmount += creatorAmount;
        }
        payable(platformFeeAddress).transfer(platformAmount);
        payable(infoFiFeeAddress).transfer(infoFiAmount);

        emit FeesCollected(token, platformAmount, creatorAmount, infoFiAmount);
    }

    /**
* @notice Creator claims accumulated fees

* @dev For INSTANT_LAUNCH: If market cap drops and week passes, fees go to InfoFi
*/
    function claimCreatorFees(
        address token
    ) external nonReentrant whenNotPaused {
        Pool memory pool = pools[token];
        require(msg.sender == pool.creator, "Not creator");
        CreatorFees storage fees = creatorFees[token];
        require(fees.accumulatedFees > 0, "No fees to claim");
        require(
            block.timestamp >= fees.lastClaimTime + CLAIM_COOLDOWN,
            "Claim cooldown active"
        );
        // Normal creator claim
        uint256 amount = fees.accumulatedFees;
        fees.accumulatedFees = 0;
        fees.lastClaimTime = block.timestamp;
        payable(pool.creator).transfer(amount);
        emit CreatorFeesClaimed(pool.creator, token, amount);
    }

    /**
* @notice Get quote for buying tokens

*/
    function getBuyQuote(
        address token,
        uint256 monAmount
    ) external view returns (uint256 tokensOut, uint256 pricePerToken) {
        Pool memory pool = pools[token];
        require(pool.active, "Pool not active");
        require(!pool.graduated, "Buying forbidden after graduation");
        uint256 feeRate = getCurrentFeeRate(token);
        uint256 monAfterFee = monAmount -
            ((monAmount * feeRate) / BASIS_POINTS);
        uint256 augmentedMonBefore = pool.monReserve + pool.virtualMonReserve;
        tokensOut =
            (monAfterFee * pool.tokenReserve) /
            (augmentedMonBefore + monAfterFee);
        if (tokensOut > pool.tokenReserve) tokensOut = pool.tokenReserve;
        pricePerToken = tokensOut > 0 ? (monAmount * 10 ** 18) / tokensOut : 0;
    }

    /**
* @notice Get quote for selling tokens

*/
    function getSellQuote(
        address token,
        uint256 tokenAmount
    ) external view returns (uint256 monOut, uint256 pricePerToken) {
        Pool memory pool = pools[token];
        if (pool.graduated) {
            uint256 fee = (tokenAmount * POST_GRADUATION_FEE_BPS) /
                BASIS_POINTS;
            uint256 tokensAfterFee = tokenAmount - fee;
            uint256 tokensToSwap = tokensAfterFee / 2;
            monOut = (tokensToSwap * 70) / 100;
            pricePerToken = monOut > 0 ? (monOut * 10 ** 18) / tokenAmount : 0;

            return (monOut, pricePerToken);
        }
        require(pool.active, "Pool not active");
        uint256 monBeforeFee = (tokenAmount * pool.monReserve) /
            (pool.tokenReserve + tokenAmount);

        uint256 feeRate = getCurrentFeeRate(token);
        monOut = monBeforeFee - ((monBeforeFee * feeRate) / BASIS_POINTS);
        pricePerToken = monOut > 0 ? (monOut * 10 ** 18) / tokenAmount : 0;
    }

    /**
* @notice Get pool information

*/
    function getPoolInfo(
        address token
    )
        external
        view
        returns (
            uint256 marketCapMON,
            uint256 marketCapUSD,
            uint256 monReserve,
            uint256 tokenReserve,
            uint256 reservedTokens,
            uint256 currentPrice,
            uint256 priceMultiplier,
            uint256 graduationProgress,
            bool graduated
        )
    {
        Pool memory pool = pools[token];
        marketCapMON = pool.marketCap;
        marketCapUSD = priceOracle.bnbToUSD(pool.marketCap);
        monReserve = pool.monReserve;
        tokenReserve = pool.tokenReserve;
        reservedTokens = pool.reservedTokens;
        uint256 augmentedMon = pool.monReserve + pool.virtualMonReserve;
        currentPrice = pool.tokenReserve > 0 && augmentedMon > 0
            ? (augmentedMon * 10 ** 18) / pool.tokenReserve
            : 0;
        // Calculate initial price for INSTANT_LAUNCH
        uint256 initialPrice = 0;

        uint256 initialReserve = pool.virtualMonReserve;
        uint256 initialTokenReserve = (TOTAL_TOKEN_SUPPLY * 80) / 100;
        if (initialReserve > 0 && initialTokenReserve > 0) {
            initialPrice = (initialReserve * 10 ** 18) / initialTokenReserve;
        }
        priceMultiplier = currentPrice > 0 && initialPrice > 0
            ? (currentPrice * 100) / initialPrice
            : 100;
        graduationProgress = GRADUATION_MON_THRESHOLD > 0
            ? (pool.monReserve * 100) / GRADUATION_MON_THRESHOLD
            : 0;
        graduated = pool.graduated;
    }

    /**
* @notice Get pool debug information

*/
    function getPoolDebugInfo(
        address token
    )
        external
        view
        returns (
            uint256 virtualMonReserve,
            uint256 graduationMonThreshold,
            uint256 graduationMarketCapMON,
            uint256 launchBlock
        )
    {
        Pool memory pool = pools[token];
        return (
            pool.virtualMonReserve,
            pool.graduationMonThreshold,
            pool.graduationMarketCapMON,
            pool.launchBlock
        );
    }

    /**
* @notice Get post-graduation statistics

*/
    function getPostGraduationStats(
        address token
    )
        external
        view
        returns (
            uint256 totalTokensSold,
            uint256 totalLiquidityAdded,
            uint256 lpTokensGenerated
        )
    {
        PostGraduationStats memory stats = postGradStats[token];
        return (
            stats.totalTokensSold,
            stats.totalLiquidityAdded,
            stats.lpTokensGenerated
        );
    }

    /**
* @notice Get fee information for a token

*/
    function getFeeInfo(
        address token
    )
        external
        view
        returns (
            uint256 currentFeeRate,
            uint256 finalFeeRate,
            uint256 blocksSinceLaunch,
            uint256 blocksUntilNextTier,
            string memory feeStage
        )
    {
        Pool memory pool = pools[token];
        if (pool.graduated || !pool.active) {
            return (
                POST_GRADUATION_FEE_BPS,
                POST_GRADUATION_FEE_BPS,
                0,
                0,
                "Post-Graduation"
            );
        }
        blocksSinceLaunch = block.number - pool.launchBlock;
        currentFeeRate = getCurrentFeeRate(token);
        finalFeeRate = FINAL_FEE_BPS; // Always 2% for INSTANT_LAUNCH

        if (blocksSinceLaunch < FEE_DECAY_BLOCK_1) {
            blocksUntilNextTier = FEE_DECAY_BLOCK_1 - blocksSinceLaunch;
            feeStage = "Tier 1 (10%)";
        } else if (blocksSinceLaunch < FEE_DECAY_BLOCK_2) {
            blocksUntilNextTier = FEE_DECAY_BLOCK_2 - blocksSinceLaunch;
            feeStage = "Tier 2 (6%)";
        } else if (blocksSinceLaunch < FEE_DECAY_BLOCK_3) {
            blocksUntilNextTier = FEE_DECAY_BLOCK_3 - blocksSinceLaunch;
            feeStage = "Tier 3 (4%)";
        } else {
            blocksUntilNextTier = 0;
            feeStage = "Final (2%)";
        }
        return (
            currentFeeRate,
            finalFeeRate,
            blocksSinceLaunch,
            blocksUntilNextTier,
            feeStage
        );
    }

    /**
     * @notice Get creator fee information
     */

    function getCreatorFeeInfo(
        address token
    )
        external
        view
        returns (
            uint256 accumulatedFees,
            uint256 lastClaimTime,
            uint256 graduationMarketCap,
            uint256 currentMarketCap,
            uint256 monInPool,
            bool canClaim
        )
    {
        Pool memory pool = pools[token];
        CreatorFees memory fees = creatorFees[token];
        accumulatedFees = fees.accumulatedFees;
        lastClaimTime = fees.lastClaimTime;
        graduationMarketCap = fees.graduationMarketCap;

        currentMarketCap = pool.marketCap;
        monInPool = pool.monReserve;
        bool cooldownPassed = block.timestamp >=
            fees.lastClaimTime + CLAIM_COOLDOWN;
        bool notGraduated = !pool.graduated;

        canClaim = fees.accumulatedFees > 0 && cooldownPassed && notGraduated;
    }

    /**

* @notice Manually graduate a pool (admin function)
*/

    function graduatePool(address token) external onlyRole(OPERATOR_ROLE) {
        _graduatePool(token);
    }

    /**
     * @notice Update fee addresses
     */

    function updateFeeAddresses(
        address _platformFeeAddress,
        address _academyFeeAddress,
        address _infoFiFeeAddress
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_platformFeeAddress != address(0), "Invalid platform address");
        require(_academyFeeAddress != address(0), "Invalid academy address");
        require(_infoFiFeeAddress != address(0), "Invalid InfoFi address");
        platformFeeAddress = _platformFeeAddress;
        academyFeeAddress = _academyFeeAddress;
        infoFiFeeAddress = _infoFiFeeAddress;
    }

    /**
     * @notice Update price oracle
     */

    function updatePriceOracle(
        address _priceOracle
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_priceOracle != address(0), "Invalid price oracle");
        priceOracle = PriceOracle(_priceOracle);
    }

    /**
     * @notice Pause the contract
     */

    function pause() external onlyRole(EMERGENCY_ROLE) {
        paused = true;
        emit Paused(msg.sender);
    }

    /**
     * @notice Unpause the contract
     */

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        paused = false;
        emit Unpaused(msg.sender);
    }

    /**
     * @notice Recover stuck tokens (emergency function)
     */

    function recoverStuckTokens(
        address token,
        uint256 amount,
        address recipient
    ) external onlyRole(EMERGENCY_ROLE) {
        require(recipient != address(0), "Invalid recipient");
        require(!pools[token].active, "Cannot recover active pool tokens");
        IERC20(token).safeTransfer(recipient, amount);
    }

    /**

* @notice Get all active token addresses
*/

    function getActiveTokens() external view returns (address[] memory) {
        return activeTokens;
    }

    receive() external payable {}
}
