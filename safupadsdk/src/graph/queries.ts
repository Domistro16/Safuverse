// src/graph/queries.ts

/**
 * GraphQL queries for SafuPad subgraph
 */

/**
 * Get token by address with all related data
 */
export const GET_TOKEN = `
  query GetToken($id: ID!) {
    token(id: $id) {
      id
      name
      symbol
      decimals
      totalSupply
      creator
      createdAt
      createdAtBlock
      logoURI
      description
      website
      twitter
      telegram
      discord
      totalVolume
      totalTrades
      launch {
        id
        founder
        launchType
        totalSupply
        raiseTarget
        raiseMax
        raiseDeadline
        totalRaised
        raiseCompleted
        liquidityAdded
        graduatedToPancakeSwap
        burnLP
        vestingDuration
        vestingStartTime
        founderTokens
        founderTokensClaimed
        vestedTokens
        vestedTokensClaimed
        startMarketCap
        monthlyMarketCaps
        consecutiveMonthsBelowStart
        communityControlTriggered
        liquidityBNB
        liquidityTokens
        raisedFundsVesting
        raisedFundsClaimed
        createdAt
        createdAtBlock
      }
      pool {
        id
        creator
        bnbReserve
        tokenReserve
        reservedTokens
        virtualBnbReserve
        marketCap
        graduationMarketCap
        currentPrice
        active
        graduated
        burnLP
        lpToken
        bnbForPancakeSwap
        launchBlock
        graduationBnbThreshold
        totalVolume
        totalBuys
        totalSells
        createdAt
        graduatedAt
      }
    }
  }
`;

/**
 * Get all launches with optional filters
 */
export const GET_LAUNCHES = `
  query GetLaunches(
    $first: Int = 100
    $skip: Int = 0
    $orderBy: String = "createdAt"
    $orderDirection: String = "desc"
    $where: Launch_filter
  ) {
    launches(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      id
      founder
      launchType
      totalSupply
      raiseTarget
      raiseMax
      raiseDeadline
      totalRaised
      raiseCompleted
      liquidityAdded
      graduatedToPancakeSwap
      burnLP
      createdAt
      createdAtBlock
      token {
        id
        name
        symbol
        logoURI
        totalVolume
        totalTrades
      }
    }
  }
`;

/**
 * Get launch by token address
 */
export const GET_LAUNCH = `
  query GetLaunch($id: ID!) {
    launch(id: $id) {
      id
      founder
      launchType
      totalSupply
      raiseTarget
      raiseMax
      raiseDeadline
      totalRaised
      raiseCompleted
      liquidityAdded
      graduatedToPancakeSwap
      burnLP
      vestingDuration
      vestingStartTime
      founderTokens
      founderTokensClaimed
      vestedTokens
      vestedTokensClaimed
      startMarketCap
      monthlyMarketCaps
      consecutiveMonthsBelowStart
      communityControlTriggered
      liquidityBNB
      liquidityTokens
      raisedFundsVesting
      raisedFundsClaimed
      createdAt
      createdAtBlock
      token {
        id
        name
        symbol
        decimals
        totalSupply
        logoURI
        description
        website
        twitter
        telegram
        discord
      }
      contributions {
        id
        contributor
        amount
        claimed
        timestamp
        transactionHash
      }
    }
  }
`;

/**
 * Get pool by token address
 */
export const GET_POOL = `
  query GetPool($id: ID!) {
    pool(id: $id) {
      id
      creator
      bnbReserve
      tokenReserve
      reservedTokens
      virtualBnbReserve
      marketCap
      graduationMarketCap
      currentPrice
      active
      graduated
      burnLP
      lpToken
      bnbForPancakeSwap
      launchBlock
      graduationBnbThreshold
      totalVolume
      totalBuys
      totalSells
      createdAt
      graduatedAt
      token {
        id
        name
        symbol
        decimals
        logoURI
      }
    }
  }
`;

/**
 * Get pools with filters
 */
export const GET_POOLS = `
  query GetPools(
    $first: Int = 100
    $skip: Int = 0
    $orderBy: String = "createdAt"
    $orderDirection: String = "desc"
    $where: Pool_filter
  ) {
    pools(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      id
      creator
      bnbReserve
      tokenReserve
      currentPrice
      marketCap
      graduated
      active
      totalVolume
      totalBuys
      totalSells
      createdAt
      token {
        id
        name
        symbol
        logoURI
      }
    }
  }
`;

/**
 * Get trades for a token
 */
export const GET_TRADES = `
  query GetTrades(
    $first: Int = 100
    $skip: Int = 0
    $orderBy: String = "timestamp"
    $orderDirection: String = "desc"
    $where: Trade_filter
  ) {
    trades(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      id
      trader
      isBuy
      bnbAmount
      tokenAmount
      price
      feeRate
      totalFee
      timestamp
      blockNumber
      transactionHash
      token {
        id
        name
        symbol
      }
    }
  }
`;

/**
 * Get contributions for a launch
 */
export const GET_CONTRIBUTIONS = `
  query GetContributions($launchId: ID!, $first: Int = 100, $skip: Int = 0) {
    contributions(
      first: $first
      skip: $skip
      orderBy: "timestamp"
      orderDirection: "desc"
      where: { launch: $launchId }
    ) {
      id
      contributor
      amount
      claimed
      timestamp
      transactionHash
    }
  }
`;

/**
 * Get contribution for specific contributor
 */
export const GET_CONTRIBUTION = `
  query GetContribution($launchId: ID!, $contributor: Bytes!) {
    contributions(
      where: { launch: $launchId, contributor: $contributor }
    ) {
      id
      contributor
      amount
      claimed
      timestamp
      transactionHash
    }
  }
`;

/**
 * Get token holders
 */
export const GET_TOKEN_HOLDERS = `
  query GetTokenHolders(
    $tokenId: ID!
    $first: Int = 100
    $skip: Int = 0
    $orderBy: String = "balance"
    $orderDirection: String = "desc"
  ) {
    tokenHolders(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: { token: $tokenId }
    ) {
      id
      holder
      balance
      totalBought
      totalSold
      firstBuyTimestamp
      lastActivityTimestamp
    }
  }
`;

/**
 * Get creator fees
 */
export const GET_CREATOR_FEES = `
  query GetCreatorFees($tokenId: ID!, $creator: Bytes!) {
    creatorFees(where: { token: $tokenId, creator: $creator }) {
      id
      accumulatedFees
      totalClaimed
      lastClaimTime
      claimCount
    }
  }
`;

/**
 * Get platform statistics
 */
export const GET_PLATFORM_STATS = `
  query GetPlatformStats {
    platformStats(id: "platform") {
      id
      totalLaunches
      totalProjectRaises
      totalInstantLaunches
      totalGraduated
      totalVolume
      totalFees
      totalRaised
      lastUpdated
    }
  }
`;

/**
 * Get daily statistics
 */
export const GET_DAILY_STATS = `
  query GetDailyStats(
    $first: Int = 30
    $orderBy: String = "date"
    $orderDirection: String = "desc"
  ) {
    dailyStats(
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      date
      launches
      volume
      fees
      trades
      uniqueTraders
    }
  }
`;

/**
 * Search tokens by name or symbol
 */
export const SEARCH_TOKENS = `
  query SearchTokens($searchText: String!, $first: Int = 10) {
    tokens(
      first: $first
      where: {
        or: [
          { name_contains_nocase: $searchText }
          { symbol_contains_nocase: $searchText }
        ]
      }
      orderBy: "totalVolume"
      orderDirection: "desc"
    ) {
      id
      name
      symbol
      decimals
      logoURI
      totalVolume
      totalTrades
      createdAt
      launch {
        launchType
        graduatedToPancakeSwap
      }
      pool {
        currentPrice
        marketCap
        graduated
      }
    }
  }
`;

/**
 * Get user's trading history
 */
export const GET_USER_TRADES = `
  query GetUserTrades(
    $trader: Bytes!
    $first: Int = 100
    $skip: Int = 0
  ) {
    trades(
      first: $first
      skip: $skip
      orderBy: "timestamp"
      orderDirection: "desc"
      where: { trader: $trader }
    ) {
      id
      isBuy
      bnbAmount
      tokenAmount
      price
      timestamp
      transactionHash
      token {
        id
        name
        symbol
        logoURI
      }
    }
  }
`;

/**
 * Get user's contributions
 */
export const GET_USER_CONTRIBUTIONS = `
  query GetUserContributions(
    $contributor: Bytes!
    $first: Int = 100
    $skip: Int = 0
  ) {
    contributions(
      first: $first
      skip: $skip
      orderBy: "timestamp"
      orderDirection: "desc"
      where: { contributor: $contributor }
    ) {
      id
      amount
      claimed
      timestamp
      transactionHash
      launch {
        id
        launchType
        raiseCompleted
        token {
          id
          name
          symbol
          logoURI
        }
      }
    }
  }
`;

/**
 * Get trending tokens (by volume in last 24h)
 */
export const GET_TRENDING_TOKENS = `
  query GetTrendingTokens($first: Int = 10) {
    tokens(
      first: $first
      orderBy: "totalVolume"
      orderDirection: "desc"
    ) {
      id
      name
      symbol
      logoURI
      totalVolume
      totalTrades
      pool {
        currentPrice
        marketCap
        graduated
        totalBuys
        totalSells
      }
    }
  }
`;
