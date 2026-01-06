// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ILaunchpadStorage.sol";

interface IPancakePair {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function getReserves()
        external
        view
        returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
}

interface IPancakeFactory {
    function getPair(
        address tokenA,
        address tokenB
    ) external view returns (address);
}

/**
 * @title VestingManager
 * @notice Handles vesting state management for PROJECT_RAISE launches
 * @dev Called by LaunchpadManager - returns amounts but doesn't transfer tokens/BNB
 */
contract VestingManager is ReentrancyGuard, Ownable {
    ILaunchpadStorage public immutable storage_;
    IPancakeFactory public immutable pancakeFactory;
    address public launchpadManager;
    address public wbnbAddress;

    // Constants
    uint256 public constant MARKET_CAP_CHECK_MONTHS = 3;

    // ============ Events ============

    event FounderTokensClaimed(
        address indexed founder,
        address indexed token,
        uint256 amount
    );
    event VestedTokensClaimed(
        address indexed founder,
        address indexed token,
        uint256 amount
    );
    event RaisedFundsClaimed(
        address indexed founder,
        address indexed token,
        uint256 amount
    );
    event MarketCapUpdated(
        address indexed token,
        uint256 monthIndex,
        uint256 marketCap,
        uint256 consecutiveMonthsBelow
    );
    event CommunityControlTriggered(
        address indexed token,
        uint256 consecutiveMonths,
        uint256 currentMarketCap,
        uint256 startMarketCap
    );

    // ============ Errors ============

    error NotProjectRaise();
    error NotFounder();
    error RaiseNotCompleted();
    error NotGraduated();
    error CommunityControlActive();
    error BelowStartingMarketCap();
    error NoTokensToClaim();
    error NoFundsToClaim();
    error TooEarlyToUpdate();
    error CommunityControlNotActive();
    error OnlyLaunchpadManager();

    // ============ Modifiers ============

    modifier onlyLaunchpadManager() {
        if (msg.sender != launchpadManager) revert OnlyLaunchpadManager();
        _;
    }

    constructor(
        address _storage,
        address _pancakeFactory,
        address _wbnbAddress
    ) Ownable(msg.sender) {
        storage_ = ILaunchpadStorage(_storage);
        pancakeFactory = IPancakeFactory(_pancakeFactory);
        wbnbAddress = _wbnbAddress;
    }

    function setLaunchpadManager(address _launchpadManager) external onlyOwner {
        require(_launchpadManager != address(0), "Invalid address");
        launchpadManager = _launchpadManager;
    }

    // ============================================================
    // CLAIM FUNCTIONS (Called by LaunchpadManager)
    // ============================================================

    /**
     * @notice Process founder token claim (state only)
     * @return claimable Amount of tokens claimable
     */
    function claimFounderTokens(
        address token,
        address founder
    ) external onlyLaunchpadManager returns (uint256 claimable) {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );
        ILaunchpadStorage.LaunchVesting memory vesting = storage_
            .getLaunchVesting(token);

        if (basics.launchType != ILaunchpadStorage.LaunchType.PROJECT_RAISE)
            revert NotProjectRaise();
        if (founder != basics.founder) revert NotFounder();
        if (!status.raiseCompleted) revert RaiseNotCompleted();

        claimable = _calculateClaimableFounderTokens(token);
        if (claimable == 0) revert NoTokensToClaim();

        // Update claimed amount
        storage_.updateVestingClaimed(
            token,
            vesting.founderTokensClaimed + claimable,
            vesting.vestedTokensClaimed
        );

        emit FounderTokensClaimed(founder, token, claimable);
        return claimable;
    }

    /**
     * @notice Process vested token claim (state only)
     * @return claimable Amount of vested tokens claimable
     */
    function claimVestedTokens(
        address token,
        address founder
    ) external onlyLaunchpadManager returns (uint256 claimable) {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );
        ILaunchpadStorage.LaunchVesting memory vesting = storage_
            .getLaunchVesting(token);

        if (basics.launchType != ILaunchpadStorage.LaunchType.PROJECT_RAISE)
            revert NotProjectRaise();
        if (founder != basics.founder) revert NotFounder();
        if (!status.raiseCompleted) revert RaiseNotCompleted();
        if (!status.graduatedToPancakeSwap) revert NotGraduated();
        if (vesting.communityControlTriggered) revert CommunityControlActive();

        // Check current market cap is above starting market cap
        uint256 currentMarketCap = _getCurrentMarketCap(
            token,
            basics.totalSupply
        );
        if (currentMarketCap < vesting.startMarketCap)
            revert BelowStartingMarketCap();

        claimable = _calculateClaimableVestedTokens(token);
        if (claimable == 0) revert NoTokensToClaim();

        // Update claimed amount
        storage_.updateVestingClaimed(
            token,
            vesting.founderTokensClaimed,
            vesting.vestedTokensClaimed + claimable
        );

        emit VestedTokensClaimed(founder, token, claimable);
        return claimable;
    }

    /**
     * @notice Process raised funds claim (state only)
     * @return claimable Amount of BNB claimable
     */
    function claimRaisedFunds(
        address token,
        address founder
    ) external onlyLaunchpadManager returns (uint256 claimable) {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );
        ILaunchpadStorage.LaunchVesting memory vesting = storage_
            .getLaunchVesting(token);
        ILaunchpadStorage.LaunchLiquidity memory liquidity = storage_
            .getLaunchLiquidity(token);

        if (basics.launchType != ILaunchpadStorage.LaunchType.PROJECT_RAISE)
            revert NotProjectRaise();
        if (founder != basics.founder) revert NotFounder();
        if (!status.raiseCompleted) revert RaiseNotCompleted();
        if (vesting.communityControlTriggered) revert CommunityControlActive();

        claimable = _calculateClaimableRaisedFunds(token);
        if (claimable == 0) revert NoFundsToClaim();

        // Update claimed amount
        storage_.updateRaisedFundsClaimed(
            token,
            liquidity.raisedFundsClaimed + claimable
        );

        emit RaisedFundsClaimed(founder, token, claimable);
        return claimable;
    }

    // ============================================================
    // MARKET CAP TRACKING & COMMUNITY CONTROL
    // ============================================================

    /**
     * @notice Update market cap tracking (monthly)
     */
    function updateMarketCap(address token) external {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );
        ILaunchpadStorage.LaunchVesting memory vesting = storage_
            .getLaunchVesting(token);

        if (basics.launchType != ILaunchpadStorage.LaunchType.PROJECT_RAISE)
            revert NotProjectRaise();
        if (!status.raiseCompleted) revert RaiseNotCompleted();
        if (!status.graduatedToPancakeSwap) revert NotGraduated();

        // Check if at least 1 month has passed since last update
        uint256 monthsPassed = (block.timestamp - vesting.vestingStartTime) /
            30 days;
        if (monthsPassed <= vesting.monthlyMarketCaps.length)
            revert TooEarlyToUpdate();

        // Get current market cap from PancakeSwap LP
        uint256 currentMarketCap = _getCurrentMarketCap(
            token,
            basics.totalSupply
        );
        storage_.pushMonthlyMarketCap(token, currentMarketCap);

        uint256 newConsecutiveMonths = vesting.consecutiveMonthsBelowStart;

        // Check if below starting market cap
        if (currentMarketCap < vesting.startMarketCap) {
            newConsecutiveMonths++;

            // Trigger community control after 3 consecutive months
            if (
                newConsecutiveMonths >= MARKET_CAP_CHECK_MONTHS &&
                !vesting.communityControlTriggered
            ) {
                storage_.updateCommunityControl(
                    token,
                    true,
                    newConsecutiveMonths
                );

                emit CommunityControlTriggered(
                    token,
                    newConsecutiveMonths,
                    currentMarketCap,
                    vesting.startMarketCap
                );
            } else {
                storage_.updateCommunityControl(
                    token,
                    vesting.communityControlTriggered,
                    newConsecutiveMonths
                );
            }
        } else {
            // Reset counter if above starting market cap
            storage_.updateCommunityControl(
                token,
                vesting.communityControlTriggered,
                0
            );
            newConsecutiveMonths = 0;
        }

        emit MarketCapUpdated(
            token,
            vesting.monthlyMarketCaps.length,
            currentMarketCap,
            newConsecutiveMonths
        );
    }

    /**
     * @notice Mark vested tokens as burned for community control
     * @return remainingVestedTokens Amount of tokens that were burned
     */
    function burnVestedTokensOnCommunityControl(
        address token
    ) external onlyLaunchpadManager returns (uint256 remainingVestedTokens) {
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchVesting memory vesting = storage_
            .getLaunchVesting(token);

        if (basics.launchType != ILaunchpadStorage.LaunchType.PROJECT_RAISE)
            revert NotProjectRaise();
        if (!vesting.communityControlTriggered)
            revert CommunityControlNotActive();

        remainingVestedTokens =
            vesting.vestedTokens -
            vesting.vestedTokensClaimed;
        require(remainingVestedTokens > 0, "No vested tokens to burn");

        // Mark all vested tokens as claimed (burned)
        storage_.updateVestingClaimed(
            token,
            vesting.founderTokensClaimed,
            vesting.vestedTokens
        );

        return remainingVestedTokens;
    }

    /**
     * @notice Get remaining raised funds for timelock transfer
     * @return remainingFunds Amount of remaining raised funds
     */
    function getRemainingFundsForTimelock(
        address token
    ) external view returns (uint256 remainingFunds) {
        ILaunchpadStorage.LaunchVesting memory vesting = storage_
            .getLaunchVesting(token);
        ILaunchpadStorage.LaunchLiquidity memory liquidity = storage_
            .getLaunchLiquidity(token);

        if (!vesting.communityControlTriggered) return 0;

        return liquidity.raisedFundsVesting - liquidity.raisedFundsClaimed;
    }

    /**
     * @notice Mark raised funds as transferred to timelock
     */
    function markFundsTransferredToTimelock(
        address token
    ) external onlyLaunchpadManager {
        ILaunchpadStorage.LaunchLiquidity memory liquidity = storage_
            .getLaunchLiquidity(token);
        storage_.updateRaisedFundsClaimed(token, liquidity.raisedFundsVesting);
    }

    // ============================================================
    // INTERNAL CALCULATION FUNCTIONS
    // ============================================================

    function _calculateClaimableFounderTokens(
        address token
    ) internal view returns (uint256) {
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );
        ILaunchpadStorage.LaunchVesting memory vesting = storage_
            .getLaunchVesting(token);

        if (!status.raiseCompleted) return 0;

        // 100% of founder tokens released immediately at raise completion
        // This was already done in _completeRaise, so nothing more to claim
        // Unless there's additional vesting (which there isn't per current design)

        return vesting.founderTokens - vesting.founderTokensClaimed;
    }

    function _calculateClaimableVestedTokens(
        address token
    ) internal view returns (uint256) {
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );
        ILaunchpadStorage.LaunchVesting memory vesting = storage_
            .getLaunchVesting(token);

        if (!status.raiseCompleted) return 0;
        if (vesting.communityControlTriggered) return 0;

        uint256 timePassed = block.timestamp - vesting.vestingStartTime;

        if (timePassed >= vesting.vestingDuration) {
            return vesting.vestedTokens - vesting.vestedTokensClaimed;
        }

        // Monthly vesting over 6 months
        uint256 monthsPassed = timePassed / storage_.VESTING_RELEASE_INTERVAL();
        uint256 totalMonths = vesting.vestingDuration /
            storage_.VESTING_RELEASE_INTERVAL();

        uint256 totalVested = (vesting.vestedTokens * monthsPassed) /
            totalMonths;

        if (totalVested <= vesting.vestedTokensClaimed) {
            return 0;
        }
        return totalVested - vesting.vestedTokensClaimed;
    }

    function _calculateClaimableRaisedFunds(
        address token
    ) internal view returns (uint256) {
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );
        ILaunchpadStorage.LaunchVesting memory vesting = storage_
            .getLaunchVesting(token);
        ILaunchpadStorage.LaunchLiquidity memory liquidity = storage_
            .getLaunchLiquidity(token);

        if (!status.raiseCompleted) return 0;

        uint256 timePassed = block.timestamp - vesting.vestingStartTime;

        if (timePassed >= vesting.vestingDuration) {
            return liquidity.raisedFundsVesting - liquidity.raisedFundsClaimed;
        }

        // Monthly vesting
        uint256 monthsPassed = timePassed / storage_.VESTING_RELEASE_INTERVAL();
        uint256 totalMonths = vesting.vestingDuration /
            storage_.VESTING_RELEASE_INTERVAL();

        uint256 totalVested = (liquidity.raisedFundsVesting * monthsPassed) /
            totalMonths;

        if (totalVested <= liquidity.raisedFundsClaimed) {
            return 0;
        }
        return totalVested - liquidity.raisedFundsClaimed;
    }

    function _getCurrentMarketCap(
        address token,
        uint256 totalSupply
    ) internal view returns (uint256) {
        address lpToken = pancakeFactory.getPair(token, wbnbAddress);
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
        return (totalSupply * bnbReserve) / tokenReserve;
    }

    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================

    function getClaimableAmounts(
        address token
    )
        external
        view
        returns (
            uint256 claimableFounderTokens,
            uint256 claimableVestedTokens,
            uint256 claimableRaisedFunds
        )
    {
        return (
            _calculateClaimableFounderTokens(token),
            _calculateClaimableVestedTokens(token),
            _calculateClaimableRaisedFunds(token)
        );
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
        ILaunchpadStorage.LaunchBasics memory basics = storage_.getLaunchBasics(
            token
        );
        ILaunchpadStorage.LaunchVesting memory vesting = storage_
            .getLaunchVesting(token);
        ILaunchpadStorage.LaunchLiquidity memory liquidity = storage_
            .getLaunchLiquidity(token);
        ILaunchpadStorage.LaunchStatus memory status = storage_.getLaunchStatus(
            token
        );

        uint256 currentMCap = 0;
        if (status.graduatedToPancakeSwap) {
            try
                this.getCurrentMarketCapExternal(token, basics.totalSupply)
            returns (uint256 mcap) {
                currentMCap = mcap;
            } catch {
                currentMCap = 0;
            }
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

    // External wrapper for try/catch
    function getCurrentMarketCapExternal(
        address token,
        uint256 totalSupply
    ) external view returns (uint256) {
        return _getCurrentMarketCap(token, totalSupply);
    }

    function getMarketCapHistory(
        address token
    ) external view returns (uint256[] memory) {
        return storage_.getLaunchVesting(token).monthlyMarketCaps;
    }
}
