// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./ILaunchpadStorage.sol";

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

    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);

    function WETH() external pure returns (address);
}

interface IPancakeFactory {
    function getPair(
        address tokenA,
        address tokenB
    ) external view returns (address);
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

interface ILaunchpadToken {
    function enableTransfers() external;
}

interface IBondingCurveDEX {
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

    function setLPToken(address token) external;
}

/**
 * @title GraduationManager
 * @notice Handles graduation to PancakeSwap and post-graduation trading
 * @dev Called by LaunchpadManager - handles actual LP creation
 */
contract GraduationManager is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    ILaunchpadStorage public immutable storage_;
    IPancakeRouter02 public immutable pancakeRouter;
    IPancakeFactory public immutable pancakeFactory;
    IBondingCurveDEX public bondingCurveDEX;
    ILPFeeHarvester public lpFeeHarvester;

    address public launchpadManager;
    address public wbnbAddress;
    address public infoFiAddress;
    address public platformFeeAddress;

    // Constants
    uint256 public constant PLATFORM_FEE_BPS = 100; // 1%
    uint256 public constant BASIS_POINTS = 10000;
    address public constant LP_BURN_ADDRESS =
        0x000000000000000000000000000000000000dEaD;

    // ============ Events ============

    event GraduatedToPancakeSwap(
        address indexed token,
        uint256 bnbForLiquidity,
        uint256 tokensForLiquidity,
        address lpToken,
        uint256 lpAmount
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
    event PlatformFeePaid(
        address indexed token,
        uint256 amount,
        string feeType
    );
    event TransfersEnabled(address indexed token, uint256 timestamp);
    event PostGraduationSell(
        address indexed seller,
        address indexed token,
        uint256 tokensIn,
        uint256 bnbOut
    );
    event PostGraduationBuy(
        address indexed buyer,
        address indexed token,
        uint256 bnbIn,
        uint256 tokensOut
    );

    // ============ Errors ============

    error AlreadyGraduated();
    error RaiseNotCompleted();
    error LiquidityAlreadyAdded();
    error NotReadyToGraduate();
    error CreatorMismatch();
    error NoLiquidity();
    error LPTokenNotFound();
    error NotGraduated();
    error NotProjectRaise();
    error MustSendBNB();
    error SlippageTooHigh();
    error OnlyLaunchpadManager();

    // ============ Modifiers ============

    modifier onlyLaunchpadManager() {
        if (msg.sender != launchpadManager) revert OnlyLaunchpadManager();
        _;
    }

    constructor(
        address _storage,
        address _pancakeRouter,
        address _pancakeFactory,
        address _bondingCurveDEX,
        address _lpFeeHarvester,
        address _infoFiAddress,
        address _platformFeeAddress
    ) Ownable(msg.sender) {
        storage_ = ILaunchpadStorage(_storage);
        pancakeRouter = IPancakeRouter02(_pancakeRouter);
        pancakeFactory = IPancakeFactory(_pancakeFactory);
        bondingCurveDEX = IBondingCurveDEX(_bondingCurveDEX);
        lpFeeHarvester = ILPFeeHarvester(_lpFeeHarvester);
        infoFiAddress = _infoFiAddress;
        platformFeeAddress = _platformFeeAddress;
        wbnbAddress = pancakeRouter.WETH();
    }

    function setLaunchpadManager(address _launchpadManager) external onlyOwner {
        require(_launchpadManager != address(0), "Invalid address");
        launchpadManager = _launchpadManager;
    }

    // ============================================================
    // GRADUATION (Called by LaunchpadManager)
    // ============================================================

    /**
     * @notice Graduate a PROJECT_RAISE token to PancakeSwap
     * @dev Receives BNB and tokens from LaunchpadManager
     */
    function graduateProjectRaise(
        address token,
        uint256 tokensForLiquidity
    )
        external
        payable
        onlyLaunchpadManager
        nonReentrant
        returns (address lpToken, uint256 lpAmount)
    {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );

        if (status.graduatedToPancakeSwap) revert AlreadyGraduated();
        if (!status.raiseCompleted) revert RaiseNotCompleted();
        if (status.liquidityAdded) revert LiquidityAlreadyAdded();

        uint256 bnbForLiquidity = msg.value;
        require(bnbForLiquidity > 0, "No BNB for liquidity");
        require(tokensForLiquidity > 0, "No tokens for liquidity");

        // Receive tokens from LaunchpadManager
        IERC20(token).safeTransferFrom(
            launchpadManager,
            address(this),
            tokensForLiquidity
        );

        // Deduct platform fee (split between platform and founder)
        uint256 platformFee = (bnbForLiquidity * PLATFORM_FEE_BPS) /
            BASIS_POINTS;
        bnbForLiquidity = bnbForLiquidity - platformFee;

        // Send platform fees
        payable(platformFeeAddress).transfer(platformFee / 2);
        payable(basics.founder).transfer(platformFee / 2);
        emit PlatformFeePaid(token, platformFee, "Project Raise Liquidity");

        // Add liquidity to PancakeSwap
        (lpToken, lpAmount) = _addLiquidityToPancakeSwap(
            token,
            tokensForLiquidity,
            bnbForLiquidity
        );

        // Handle LP tokens (burn or lock)
        _handleLPTokens(token, lpToken, lpAmount, basics);

        // Enable transfers
        // Enable transfers - MOVED TO LAUNCHPAD MANAGER (Owner)
        // ILaunchpadToken(token).enableTransfers();

        // Update storage
        storage_.updateLiquidityAdded(token, true);
        storage_.updateGraduated(token, true);

        emit GraduatedToPancakeSwap(
            token,
            bnbForLiquidity,
            tokensForLiquidity,
            lpToken,
            lpAmount
        );
        emit TransfersEnabled(token, block.timestamp);

        return (lpToken, lpAmount);
    }

    /**
     * @notice Graduate an INSTANT_LAUNCH token from bonding curve to PancakeSwap
     */
    function graduateInstantLaunch(
        address token
    )
        external
        onlyLaunchpadManager
        nonReentrant
        returns (address lpToken, uint256 lpAmount)
    {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );

        if (status.graduatedToPancakeSwap) revert AlreadyGraduated();

        // Check if bonding curve graduated
        (, , , , , , , , bool graduated) = bondingCurveDEX.getPoolInfo(token);
        if (!graduated) revert NotReadyToGraduate();

        // Withdraw from bonding curve
        (
            uint256 bnbForLiquidity,
            uint256 tokensForLiquidity,
            ,
            address creator
        ) = bondingCurveDEX.withdrawGraduatedPool(token);

        if (creator != basics.founder) revert CreatorMismatch();

        // Deduct platform fee
        uint256 platformFee = (bnbForLiquidity * PLATFORM_FEE_BPS) /
            BASIS_POINTS;
        bnbForLiquidity = bnbForLiquidity - platformFee;

        payable(platformFeeAddress).transfer(platformFee);
        emit PlatformFeePaid(token, platformFee, "Instant Launch Liquidity");

        // Add liquidity to PancakeSwap
        (lpToken, lpAmount) = _addLiquidityToPancakeSwap(
            token,
            tokensForLiquidity,
            bnbForLiquidity
        );

        // Set LP token on bonding curve
        bondingCurveDEX.setLPToken(token);

        // Handle LP tokens
        _handleLPTokens(token, lpToken, lpAmount, basics);

        // Enable transfers
        // Enable transfers - MOVED TO LAUNCHPAD MANAGER (Owner)
        // ILaunchpadToken(token).enableTransfers();

        // Update storage
        storage_.updateGraduated(token, true);

        emit GraduatedToPancakeSwap(
            token,
            bnbForLiquidity,
            tokensForLiquidity,
            lpToken,
            lpAmount
        );
        emit TransfersEnabled(token, block.timestamp);

        return (lpToken, lpAmount);
    }

    // ============================================================
    // POST-GRADUATION TRADING
    // ============================================================

    /**
     * @notice Sell tokens after graduation via PancakeSwap
     * @dev Receives tokens from LaunchpadManager, sends BNB to seller
     */
    function handlePostGraduationSell(
        address token,
        uint256 tokenAmount,
        uint256 minBNBOut,
        address seller
    ) external onlyLaunchpadManager nonReentrant {
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );
        if (!status.graduatedToPancakeSwap) revert NotGraduated();

        // Receive tokens from LaunchpadManager
        IERC20(token).safeTransferFrom(
            launchpadManager,
            address(this),
            tokenAmount
        );

        // Approve and swap
        IERC20(token).approve(address(pancakeRouter), tokenAmount);

        address[] memory path = new address[](2);
        path[0] = token;
        path[1] = wbnbAddress;

        uint256[] memory amounts = pancakeRouter.swapExactTokensForETH(
            tokenAmount,
            minBNBOut,
            path,
            seller, // Send BNB directly to seller
            block.timestamp + 300
        );

        uint256 bnbReceived = amounts[amounts.length - 1];
        if (bnbReceived < minBNBOut) revert SlippageTooHigh();

        emit PostGraduationSell(seller, token, tokenAmount, bnbReceived);
    }

    /**
     * @notice Buy tokens after graduation via PancakeSwap
     * @dev Receives BNB from LaunchpadManager, sends tokens to buyer
     */
    function handlePostGraduationBuy(
        address token,
        uint256 minTokensOut,
        address buyer
    ) external payable onlyLaunchpadManager nonReentrant {
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );
        if (!status.graduatedToPancakeSwap) revert NotGraduated();
        if (msg.value == 0) revert MustSendBNB();

        address[] memory path = new address[](2);
        path[0] = wbnbAddress;
        path[1] = token;

        uint256[] memory amounts = pancakeRouter.swapExactETHForTokens{
            value: msg.value
        }(
            minTokensOut,
            path,
            buyer, // Send tokens directly to buyer
            block.timestamp + 300
        );

        uint256 tokensReceived = amounts[amounts.length - 1];
        if (tokensReceived < minTokensOut) revert SlippageTooHigh();

        emit PostGraduationBuy(buyer, token, msg.value, tokensReceived);
    }

    // ============================================================
    // INTERNAL FUNCTIONS
    // ============================================================

    function _addLiquidityToPancakeSwap(
        address token,
        uint256 tokenAmount,
        uint256 bnbAmount
    ) private returns (address lpToken, uint256 liquidity) {
        // Approve router
        IERC20(token).approve(address(pancakeRouter), tokenAmount);

        // Add liquidity
        (, , liquidity) = pancakeRouter.addLiquidityETH{value: bnbAmount}(
            token,
            tokenAmount,
            0, // TODO: Add slippage protection
            0, // TODO: Add slippage protection
            address(this),
            block.timestamp + 300
        );

        if (liquidity == 0) revert NoLiquidity();

        // Get LP token address
        lpToken = pancakeFactory.getPair(token, wbnbAddress);
        if (lpToken == address(0)) revert LPTokenNotFound();

        return (lpToken, liquidity);
    }

    function _handleLPTokens(
        address token,
        address lpToken,
        uint256 liquidity,
        ILaunchpadStorage.LaunchBasics memory basics
    ) private {
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
    }

    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================

    /**
     * @notice Check if a token can graduate
     */
    function canGraduate(
        address token
    ) external view returns (bool canGrad, string memory reason) {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );

        if (status.graduatedToPancakeSwap) {
            return (false, "Already graduated");
        }

        if (basics.launchType == ILaunchpadStorage.LaunchType.PROJECT_RAISE) {
            if (!status.raiseCompleted) {
                return (false, "Raise not completed");
            }
            if (status.liquidityAdded) {
                return (false, "Liquidity already added");
            }
            return (true, "Ready to graduate");
        } else {
            // INSTANT_LAUNCH - check bonding curve
            (, , , , , , , , bool graduated) = bondingCurveDEX.getPoolInfo(
                token
            );
            if (!graduated) {
                return (false, "Bonding curve not graduated");
            }
            return (true, "Ready to graduate");
        }
    }

    /**
     * @notice Get graduation info
     */
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

        graduated = status.graduatedToPancakeSwap;
        lpToken = pancakeFactory.getPair(token, wbnbAddress);
        lpBurned = basics.burnLP;
        liquidityBNB = liquidity.liquidityBNB;
        liquidityTokens =
            (basics.totalSupply * storage_.LIQUIDITY_TOKEN_PERCENT()) /
            100;
    }

    // ============================================================
    // ADMIN FUNCTIONS
    // ============================================================

    function updateBondingCurveDEX(
        address _bondingCurveDEX
    ) external onlyOwner {
        require(_bondingCurveDEX != address(0), "Invalid address");
        bondingCurveDEX = IBondingCurveDEX(_bondingCurveDEX);
    }

    function updateLPFeeHarvester(address _lpFeeHarvester) external onlyOwner {
        require(_lpFeeHarvester != address(0), "Invalid address");
        lpFeeHarvester = ILPFeeHarvester(_lpFeeHarvester);
    }

    function updateInfoFiAddress(address _infoFiAddress) external onlyOwner {
        require(_infoFiAddress != address(0), "Invalid address");
        infoFiAddress = _infoFiAddress;
    }

    function updatePlatformFeeAddress(
        address _platformFeeAddress
    ) external onlyOwner {
        require(_platformFeeAddress != address(0), "Invalid address");
        platformFeeAddress = _platformFeeAddress;
    }

    // Receive BNB
    receive() external payable {}
}
