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
import PTPABI from '../constants/abis/PTP.json'
import VePTPABI from '../constants/abis/VePTP.json'
import MasterPlatypusABI from '../constants/abis/MasterPlatypus.json'
import AutoProcABI from '../constants/abis/AutoProc.json'
import {
  ROUTER_ADDRESS,
  POOL_ADDRESS,
  CHAIN_LINK_PRICE_PROVIDER_ADDRESS,
  PTP_ADDRESS,
  VEPTP_ADDRESS,
  MASTER_PLATYPUS_ADDRESS,
  AUTO_PROC_ADDRESS,
} from '../constants'
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
  // const prefix = `https://${BSCSCAN_PREFIXES[chainId] || BSCSCAN_PREFIXES[ChainId.MAINNET]}bscscan.com`
  const prefix = 'https://testnet.ftmscan.com'

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

export function getPTPContract(_: number, library: Web3Provider, account?: string): Contract {
  return getContract(PTP_ADDRESS, PTPABI, library, account)
}

export function getVePTPContract(_: number, library: Web3Provider, account?: string): Contract {
  return getContract(VEPTP_ADDRESS, VePTPABI, library, account)
}

export function getMasterPlatypusContract(_: number, library: Web3Provider, account?: string): Contract {
  return getContract(MASTER_PLATYPUS_ADDRESS, MasterPlatypusABI, library, account)
}

export function getAutoProcContract(_: number, library: Web3Provider, account?: string): Contract {
  return getContract(AUTO_PROC_ADDRESS, AutoProcABI, library, account)
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
  if (decStr === '') return 0;
  let i = 0
  while (decStr.charAt(i) === '0') {
    i++
  }
  return i + 1
}

export function nDecimals(n, num, thr = 0.000001) {
  const log10 = num ? Math.floor(Math.log10(num)) : 0
  const div = log10 < 0 ? 10 ** (1 - log10) : 10 ** n

  const ndes = Math.round(num * div) / div
  return ndes > thr ? ndes : 0
}

export function formatCurrency(amount, n = 2) {
  if (amount/10**9 >= 1) 
    return nDecimals(n, amount/10**9).toString().concat("G")
  if (amount/10**6 >= 1) 
    return nDecimals(n, amount/10**6).toString().concat("M")
  if (amount/10**3 >= 1) 
    return nDecimals(n, amount/10**3).toString().concat("K")  
  return nDecimals(n, amount).toString() 
  
}

export function float2int (value) {
  return value || 0;
}

export interface PoolItemBaseData {
  symbol: string | undefined
  address: string
  totalSupply: BigNumber
  balanceOf: BigNumber
  cash: BigNumber
  liability: BigNumber
  poolShare: number
  price: BigNumber // decimals = 8
  allowance: BigNumber
  allowance_lp_pool: BigNumber
  allowance_lp_master: BigNumber
  volume24: number
  stakedLPAmount: BigNumber
  autoBalancePeriod: BigNumber
  rewardablePTPAmount: BigNumber
  multiRewardablePTPAmount: BigNumber
  rewardFactorVePTP: BigNumber
  vePTPBalance: BigNumber
  stakedPTPAmount: BigNumber
  baseAPR: BigNumber
  boostAPR: BigNumber
  medianBoostedAPR: BigNumber
  coverageRatio: BigNumber
  allowance_ptp_master: BigNumber
  isAutoBalanced: boolean
  isAutoCompound: boolean
  autoCompoundPeriod: BigNumber
}

export interface PTPStakedInfo {
  ptpStakedAmount: BigNumber
  totalPtpStakedAmount: BigNumber
  vePTPrewardableAmount: BigNumber
  vePTPBalanceOf: BigNumber
  veTotalSupply: BigNumber
  calcVePTPAmount: BigNumber
  allowancePTP: BigNumber
  ptpBalanceOf: BigNumber
}

export function calcFee(val: number, t_fee: number, usefulCountFee: number): string {
  // if (val === 0) return "0"
  // const valDecimalStr = getDecimalPartStr(val)
  // const valDecimalLen = valDecimalStr.length
  // const fe = val * t_fee
  // const intStr = getIntStr(fe)
  // const decStr = getDecimalPartStr(fe)
  // const usefulCount = usefulCountFee + valDecimalLen // val=12.131, t_fee=0.0001 -> 7 (3+4) 

  // let feeDecimalPartStr = ''
  // for (let i = 0; i < usefulCount; i++) {
  //   feeDecimalPartStr += decStr.charAt(i)
  // }
  // const feeStr = intStr.concat('.').concat(feeDecimalPartStr)
  // return feeStr
  const fe = val * t_fee
  return fe.toString()
}

export function norValue(bnum: BigNumber | undefined, decimals = 18): number {      
    return bnum === undefined ? 0 : parseInt(bnum.toHexString(), 16) / (10 ** decimals)
}
