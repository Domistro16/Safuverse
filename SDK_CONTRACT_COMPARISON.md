# SafuPad SDK vs Contract Comprehensive Comparison

**Date:** December 3, 2025
**Purpose:** Verify SDK functions and constants match actual contracts

---

## 🚨 CRITICAL ISSUES FOUND

### **Issue 1: WRONG CURRENCY THROUGHOUT SDK** 🔴

**SDK Uses:** "BNB" everywhere
**Contract Uses:** "MON" (Monad native token)

**Impact:**
- All comments mentioning "BNB" are WRONG
- Variable names use "BNB" but should use "MON"
- Examples:
  - `raiseTargetBNB` should be `raiseTargetMON`
  - `raiseMaxBNB` should be `raiseMaxMON`
  - Comments say "Users contribute BNB" but it's actually MON

---

### **Issue 2: WRONG RAISE DURATION** 🔴

**SDK Says:** "24-hour raise period"
**Contract Says:** `RAISE_DURATION = 72 hours`

**Locations:**
- Line 33: "24-hour raise period" ❌
- Line 61: "24-hour contribution period" ❌
- constants/index.ts line 94: `RAISE_DURATION: 24 * 60 * 60` ❌

**Correct:** 72 hours (3 days)

---

### **Issue 3: WRONG CONSTANTS** 🔴

| Constant | SDK Value | Contract Value | Status |
|----------|-----------|----------------|--------|
| MIN_RAISE | '50000' USD | 5,000,000 MON | ❌ WRONG |
| MAX_RAISE | '500000' USD | 20,000,000 MON | ❌ WRONG |
| MAX_LIQUIDITY | '100000' USD | REMOVED (no cap) | ❌ WRONG |
| RAISE_DURATION | 24 hours | 72 hours | ❌ WRONG |
| FOUNDER_ALLOCATION | 20% | 60% | ❌ WRONG |
| IMMEDIATE_FOUNDER_RELEASE | 50% | 100% | ❌ WRONG |
| LIQUIDITY_PERCENT | 10% | 10% | ✅ CORRECT |
| LIQUIDITY_BNB_PERCENT | 50% | 20% | ❌ WRONG |
| PLATFORM_FEE_BPS | 1000 (10%) | 100 (1%) | ❌ WRONG |
| CONTRIBUTOR_ALLOCATION | N/A | 20% | ❌ MISSING |
| PANCAKESWAP_ALLOCATION | N/A | 10% | ❌ MISSING |
| VESTED_ALLOCATION | N/A | 10% | ❌ MISSING |

---

### **Issue 4: WRONG ALLOCATION COMMENTS** 🔴

**SDK Comments Say:**
- Founder gets 20% (with 50% immediate, 50% vested)
- Liquidity gets 10%

**Contract Reality:**
- Founder gets 60% (with 100% released immediately - NO vesting on founder tokens!)
- Contributors get 20%
- PancakeSwap liquidity gets 10% (tokens)
- Conditional vesting gets 10% (separate allocation)
- 20% of raised MON goes to liquidity (not 50%)

---

## 📊 Function Comparison

### ✅ CONTRACT FUNCTIONS (28 total)

1. ✅ `createLaunch()` - SDK has it
2. ❌ `createLaunchWithVanity()` - Contract doesn't have this as separate function
3. ✅ `createInstantLaunch()` - SDK has it
4. ❌ `createInstantLaunchWithVanity()` - Contract doesn't have this as separate function
5. ✅ `contribute()` - SDK has it
6. ✅ `claimContributorTokens()` - SDK has it
7. ✅ `claimRefund()` - SDK has it
8. ✅ `burnFailedRaiseTokens()` - SDK has it
9. ✅ `claimFounderTokens()` - SDK has it
10. ✅ `claimRaisedFunds()` - SDK has it
11. ✅ `claimVestedTokens()` - SDK has it (NEW)
12. ✅ `updateMarketCap()` - SDK has it (NEW)
13. ✅ `transferFundsToTimelock()` - SDK has it (NEW)
14. ✅ `burnVestedTokensOnCommunityControl()` - SDK has it (NEW)
15. ✅ `updateTimelockBeneficiary()` - SDK has it (NEW)
16. ✅ `getCommunityControlInfo()` - SDK has it (NEW)
17. ✅ `graduateToPancakeSwap()` - SDK has it
18. ✅ `handlePostGraduationSell()` - SDK has it
19. ✅ `handlePostGraduationBuy()` - SDK has it
20. ✅ `updateLPFeeHarvester()` - SDK has it
21. ✅ `updateInfoFiAddress()` - SDK has it (NEW)
22. ✅ `getLaunchInfo()` - SDK has it
23. ✅ `getLaunchInfoWithUSD()` - SDK has it
24. ✅ `getClaimableAmounts()` - SDK has it
25. ✅ `getClaimableVestedTokens()` - SDK has it (NEW)
26. ✅ `getContribution()` - SDK has it
27. ✅ `getAllLaunches()` - SDK has it
28. ✅ `getMarketCapHistory()` - SDK has it (NEW)
29. ✅ `emergencyWithdraw()` - SDK has it

### ❌ SDK EXTRA FUNCTIONS (Not in contract)

These are SDK helper functions (OK):
- `getLaunchVesting()` - Helper (OK)
- `getVestingProgress()` - Helper (OK)
- `getTimeBasedVestingProgress()` - Helper (OK)
- `getRemainingVestingTime()` - Helper (OK)
- `isValidLaunch()` - Helper (OK)
- `getLaunchProgress()` - Helper (OK)
- `hasLaunchDeadlinePassed()` - Helper (OK)
- `getTimeUntilDeadline()` - Helper (OK)
- `canClaimContributorTokens()` - Helper (OK)
- `canClaimRefund()` - Helper (OK)
- `getContributorTokenAllocation()` - Helper (OK)
- `updateFallbackPrice()` - Contract doesn't have this? Need to verify

---

## 🔧 FIXES REQUIRED

### **Priority 1: Fix Constants** 🔴

Update `safupadsdk/src/constants/index.ts`:

```typescript
export const CONSTANTS = {
  // Launch parameters - MON NOT USD!
  MIN_RAISE_MON: '5000000', // 5M MON
  MAX_RAISE_MON: '20000000', // 20M MON
  MAX_CONTRIBUTION_PER_WALLET: '50000', // 50K MON per wallet
  RAISE_DURATION: 72 * 60 * 60, // 72 hours (3 days) NOT 24!

  // Token allocation percentages
  FOUNDER_ALLOCATION: 60, // 60% to founder (NOT 20%!)
  CONTRIBUTOR_ALLOCATION: 20, // 20% for contributors
  PANCAKESWAP_ALLOCATION: 10, // 10% for liquidity
  VESTED_ALLOCATION: 10, // 10% vested (conditional)

  IMMEDIATE_FOUNDER_RELEASE: 100, // 100% of founder tokens released immediately (NOT 50%!)

  // Liquidity percentages
  LIQUIDITY_TOKEN_PERCENT: 10, // 10% of token supply
  LIQUIDITY_MON_PERCENT: 20, // 20% of raised MON (NOT 50%!)

  // Vesting
  MIN_VESTING_DURATION: 90 * 24 * 60 * 60, // 90 days (correct)
  MAX_VESTING_DURATION: 180 * 24 * 60 * 60, // 180 days (correct)
  VESTING_RELEASE_INTERVAL: 30 * 24 * 60 * 60, // 30 days (correct)
  MARKET_CAP_CHECK_MONTHS: 3, // 3 consecutive months

  // Fees
  PLATFORM_FEE_BPS: 100, // 1% platform fee (NOT 10%!)
  BASIS_POINTS: 10000,

  // Remove these - they're from old version:
  // - INITIAL_FEE_BPS
  // - OPTION1_FINAL_FEE_BPS
  // - OPTION2_FINAL_FEE_BPS
  // - POST_GRADUATION_FEE_BPS
  // - FEE_DECAY_BLOCK_*
  // - FEE_TIER_*
};
```

---

### **Priority 2: Fix All Comments** 🔴

Replace ALL occurrences of:
- "BNB" → "MON" (except in network configs where BNB is actually correct)
- "24-hour" → "72-hour"
- "24 hours" → "3 days (72 hours)"

Update allocation comments:
- "Founder gets 20%" → "Founder gets 60%"
- "50% immediate, 50% vested" → "100% released immediately to founder"
- "50% of raised funds" → "20% of raised MON"

---

### **Priority 3: Fix Variable Names** ⚠️

**Consider renaming** (but be careful with breaking changes):
- `raiseTargetBNB` → `raiseTargetMON`
- `raiseMaxBNB` → `raiseMaxMON`
- All parameter names with "BNB" → "MON"

**OR at minimum:**
- Update comments to clarify these are MON values despite the "BNB" name

---

### **Priority 4: Verify Missing Functions** ⚠️

Check if these exist in contract:
- `updateFallbackPrice()` - SDK has it, need to verify in contract
- `createLaunchWithVanity()` - SDK calls it, but is it separate or part of createLaunch?

---

## 📝 Verification Checklist

- [ ] All constants match contract
- [ ] All comments say "MON" not "BNB"
- [ ] All comments say "72 hours" not "24 hours"
- [ ] All allocation percentages correct
- [ ] All function signatures match
- [ ] All parameter types match
- [ ] All return types match
- [ ] No references to removed features (MAX_LIQUIDITY_USD)

---

## 🎯 Summary

**Critical Issues:** 4
**Affected Files:**
- `safupadsdk/src/constants/index.ts`
- `safupadsdk/src/contracts/LaunchpadManager.ts`
- `safupadsdk/src/types/index.ts` (parameter names)

**Estimated Fix Time:** 30-60 minutes
**Severity:** HIGH - SDK provides incorrect information to developers

---

**Next Action:** Fix constants and comments systematically
