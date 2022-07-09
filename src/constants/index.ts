import { ChainId, JSBI, Percent, Token, WETH } from '@pantherswap-libs/sdk'
import { BigNumber } from 'ethers'

// export const ROUTER_ADDRESS = '0x24f7C33ae5f77e2A9ECeed7EA858B4ca2fa1B7eC' // mainnet
export const ROUTER_ADDRESS = '0x8C2CaBc62Cd026f39B816C10134035D41E5878b6' // bsc testnet

export const CHAIN_LINK_PRICE_PROVIDER_ADDRESS = "0x934B5B9Aaa1D4699d9d561ac0030a7639c31ABaC" // fantom testnet

// ====================
// export const ASSET_USDT_ADDRESS = '0x384828EDcC9Dbae8450b0feF742e747E87204031' // fantom testnet
// export const ASSET_DAI_ADDRESS = '0xC594aE97Bf4B756646D20BDbafC94d96D482ABfB' // fantom testnet
// export const ASSET_USDC_ADDRESS = '0x0Ad851942D77eE54435AA4FE11c2A4577B95c198' // fantom testnet

// export const PTP_ADDRESS = '0x805C00FfEBDc7E5977CF6423d9799F41104f9bE4'        // fantom testnet
// export const VEPTP_ADDRESS = '0x53fE3EAdCc44E3D3c2545f9d131FC7054187B413'      // fantom testnet

// export const POOL_ADDRESS = '0x5a597aeb94bf7B160cfDb54dd49a3020CbD61EFe' // fantom testnet
// export const MASTER_PLATYPUS_ADDRESS = '0xa7943B2513c72034952E5b71d9b6154DE5b6ebD2'   // fantom testnet
// =====================

// Alter
export const ASSET_USDT_ADDRESS = '0xd0E8f96191D3eE2392D7780c85f7103D4E2335D6' // fantom testnet
export const ASSET_DAI_ADDRESS = '0x248e0900F1e6B0a5e364a103E24bB5C49A717577' // fantom testnet
export const ASSET_USDC_ADDRESS = '0x4daF18138E7B1620f141B6BAa76A60cDcBD02b41' // fantom testnet

export const PTP_ADDRESS = '0x7217Cf666440C46620B701DA7eCA7AfB585d0e27'        // fantom testnet
export const VEPTP_ADDRESS = '0xB6aFDae669BFB47805e260DF0503100B15375f9B'      // fantom testnet

export const POOL_ADDRESS = '0xFf617DfB2F047B822587EA5267041b1dA3f3870A' // fantom testnet
export const MASTER_PLATYPUS_ADDRESS = '0xa0e663183De2E858B6b561fB6226531e9C65B0c9'   // fantom testnet
export const AUTO_PROC_ADDRESS = '0xA38D539a98f9b007461dd34cB156984f08d54d72'

export const USDT_LP_ID = 0
export const DAI_LP_ID = 1
export const USDC_LP_ID = 2

export const T_FEE = 0.0001 // 0.01%

// a list of tokens by chain
type ChainTokenList = {
  readonly [chainId in ChainId]: Token[]
}


export const PTP = new Token(4002, PTP_ADDRESS, 18, 'MARKET', 'MARKET Token')
export const VEPTP = new Token(4002, VEPTP_ADDRESS, 18, 'veMARKET', 'veMARKET Token')


export const DAI = new Token(ChainId.MAINNET, '0x1af3f329e8be154074d8769d1ffa4ee058b1dbc3', 18, 'DAI', 'Dai Stablecoin')
export const BUSD = new Token(ChainId.MAINNET, '0xe9e7cea3dedca5984780bafc599bd69add087d56', 18, 'BUSD', 'Binance USD')
export const USDT = new Token(ChainId.MAINNET, '0x55d398326f99059ff775485246999027b3197955', 18, 'USDT', 'Tether USD')
export const UST = new Token(ChainId.MAINNET, '0x23396cf899ca06c4472205fc903bdb4de249d6fc',  18, 'UST', 'Wrapped UST Token')


const WETH_ONLY: ChainTokenList = {
  [ChainId.MAINNET]: [WETH[ChainId.MAINNET]],
  [ChainId.BSCTESTNET]: [WETH[ChainId.BSCTESTNET]],
}

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.MAINNET]: [...WETH_ONLY[ChainId.MAINNET], DAI, BUSD, USDT, UST],
}

/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 */
export const CUSTOM_BASES: { [chainId in ChainId]?: { [tokenAddress: string]: Token[] } } = {
  [ChainId.MAINNET]: {},
}

// used for display in the default list when adding liquidity
export const SUGGESTED_BASES: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.MAINNET]: [...WETH_ONLY[ChainId.MAINNET], DAI, BUSD, USDT],
}

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  ...WETH_ONLY,
  [ChainId.MAINNET]: [...WETH_ONLY[ChainId.MAINNET], DAI, BUSD, USDT],
}

export const PINNED_PAIRS: { readonly [chainId in ChainId]?: [Token, Token][] } = {
  [ChainId.MAINNET]: [
    [
      new Token(ChainId.MAINNET, '0x1f546ad641b56b86fd9dceac473d1c7a357276b7', 18, 'PANTHER', 'PantherSwap Token'),
      new Token(ChainId.MAINNET, '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c', 18, 'WBNB', 'Wrapped BNB'),
    ],
    [BUSD, USDT],
    [DAI, USDT],
  ],
}

export const NetworkContextName = 'NETWORK'

// default allowed slippage, in bips
export const INITIAL_ALLOWED_SLIPPAGE = 650
// 20 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 20

// one basis point
export const ONE_BIPS = new Percent(JSBI.BigInt(1), JSBI.BigInt(10000))
export const BIPS_BASE = JSBI.BigInt(10000)
// used for warning states
export const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(JSBI.BigInt(100), BIPS_BASE) // 1%
export const ALLOWED_PRICE_IMPACT_MEDIUM: Percent = new Percent(JSBI.BigInt(300), BIPS_BASE) // 3%
export const ALLOWED_PRICE_IMPACT_HIGH: Percent = new Percent(JSBI.BigInt(500), BIPS_BASE) // 5%
// if the price slippage exceeds this number, force the user to type 'confirm' to execute
export const PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN: Percent = new Percent(JSBI.BigInt(1000), BIPS_BASE) // 10%
// for non expert mode disable swaps above this
export const BLOCKED_PRICE_IMPACT_NON_EXPERT: Percent = new Percent(JSBI.BigInt(1500), BIPS_BASE) // 15%

// used to ensure the user doesn't send so much ETH so they end up with <.01
export const MIN_ETH: JSBI = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(16)) // .01 ETH
