import { Contract } from '@ethersproject/contracts'
import { getAddress } from '@ethersproject/address'
import { AddressZero } from '@ethersproject/constants'
import { JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { BigNumber } from '@ethersproject/bignumber'
import { abi as IUniswapV2Router02ABI } from '@uniswap/v2-periphery/build/IUniswapV2Router02.json'
import { ChainId, JSBI, Percent, Token, CurrencyAmount, Currency, ETHER } from '@pantherswap-libs/sdk'
import PoolABI from '../constants/abis/Pool.json'
import AssetABI from '../constants/abis/Asset.json'
import ERC20ABI from '../constants/abis/erc20.json'
import PriceProviderABI from '../constants/abis/ChainlinkProxyPriceProvider.json'
import { ROUTER_ADDRESS, POOL_ADDRESS, CHAIN_LINK_PRICE_PROVIDER_ADDRESS } from '../constants'
import { TokenAddressMap } from '../state/lists/hooks'

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: any): string | false {
  try {
    return getAddress(value)
  } catch {
    return false
  }
}

const BSCSCAN_PREFIXES: { [chainId in ChainId]: string } = {
  56: '',
  97: 'testnet.',
}

export function getBscScanLink(chainId: ChainId, data: string, type: 'transaction' | 'token' | 'address'): string {
  const prefix = `https://${BSCSCAN_PREFIXES[chainId] || BSCSCAN_PREFIXES[ChainId.MAINNET]}bscscan.com`

  switch (type) {
    case 'transaction': {
      return `${prefix}/tx/${data}`
    }
    case 'token': {
      return `${prefix}/token/${data}`
    }
    case 'address':
    default: {
      return `${prefix}/address/${data}`
    }
  }
}

// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
export function shortenAddress(address: string, chars = 4): string {
  const parsed = isAddress(address)
  if (!parsed) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }
  return `${parsed.substring(0, chars + 2)}...${parsed.substring(42 - chars)}`
}

// add 10%
export function calculateGasMargin(value: BigNumber): BigNumber {
  return value.mul(BigNumber.from(10000).add(BigNumber.from(1000))).div(BigNumber.from(10000))
}

// converts a basis points value to a sdk percent
export function basisPointsToPercent(num: number): Percent {
  return new Percent(JSBI.BigInt(Math.floor(num)), JSBI.BigInt(10000))
}

export function calculateSlippageAmount(value: CurrencyAmount, slippage: number): [JSBI, JSBI] {
  if (slippage < 0 || slippage > 10000) {
    throw Error(`Unexpected slippage value: ${slippage}`)
  }
  return [
    JSBI.divide(JSBI.multiply(value.raw, JSBI.BigInt(10000 - slippage)), JSBI.BigInt(10000)),
    JSBI.divide(JSBI.multiply(value.raw, JSBI.BigInt(10000 + slippage)), JSBI.BigInt(10000)),
  ]
}

// account is not optional
export function getSigner(library: Web3Provider, account: string): JsonRpcSigner {
  return library.getSigner(account).connectUnchecked()
}

// account is optional
export function getProviderOrSigner(library: Web3Provider, account?: string): Web3Provider | JsonRpcSigner {
  return account ? getSigner(library, account) : library
}

// account is optional
export function getContract(address: string, ABI: any, library: Web3Provider, account?: string): Contract {
  if (!isAddress(address) || address === AddressZero) {
    throw Error(`Invalid 'address' parameter '${address}'.`)
  }

  return new Contract(address, ABI, getProviderOrSigner(library, account) as any)
}

// account is optional
// _: number: chainId (testnet: 97)
export function getPoolContract(_: number, library: Web3Provider, account?: string): Contract {
  return getContract(POOL_ADDRESS, PoolABI, library, account)
}

export function getERC20Contract(_: number, address: string, library: Web3Provider, account?: string): Contract {
  return getContract(address, ERC20ABI, library, account)
}

export function getPriceProviderContract(_: number, library: Web3Provider, account?: string): Contract {
  return getContract(CHAIN_LINK_PRICE_PROVIDER_ADDRESS, PriceProviderABI, library, account)
}

export function getAssetContract(_: number, address: string, library: Web3Provider, account?: string): Contract {
  return getContract(address, AssetABI, library, account)
}

// account is optional
export function getRouterContract(_: number, library: Web3Provider, account?: string): Contract {
  return getContract(ROUTER_ADDRESS, IUniswapV2Router02ABI, library, account)
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // $& means the whole matched string
}

export function isTokenOnList(defaultTokens: TokenAddressMap, currency?: Currency): boolean {
  if (currency === ETHER) return true
  return Boolean(currency instanceof Token && defaultTokens[currency.chainId]?.[currency.address])
}

//
export function getUnitedValue(value: string, decimals: number): number {
  return +value * 10 ** decimals
}

export function getDecimalPartStr(num: number): string {
  if (Number.isInteger(num)) {
    return ''
  }

  const decimalStr = num.toString().split('.')[1]
  return decimalStr
}

export function getIntStr(num: number): string {
  if (Number.isInteger(num)) {
    return num.toString()
  }

  const intStr = num.toString().split('.')[0]
  return intStr
}

// number should be less than 1: should be decimal
// this function is for fee
// ex: num = 0.0001 -> return 4
export function getUsefulCount(num: number): number {
  const decStr = getDecimalPartStr(num) // 0.0001 -> '0001', 0.00015 -> '00015'
  let i = 0
  while (decStr.charAt(i) === '0') {
    i++
  }
  return i + 1
}

export function nDecimals(n, num) {
  const log10 = num ? Math.floor(Math.log10(num)) : 0
  const div = log10 < 0 ? 10**(1 - log10) : 10**n

  return Math.round(num * div) / div
}

export interface PoolItemBaseData {
  symbol: string | undefined
  address: string
  totalSupply: number
  balanceOf: number
  cash: number
  liability: number
  poolShare: number
  price: number
  volume24: number
}
