
import { Currency, ETHER, Token } from '@pantherswap-libs/sdk'
import React, { useMemo } from 'react'
import styled from 'styled-components'
import useHttpLocations from '../../hooks/useHttpLocations'
import { WrappedTokenInfo } from '../../state/lists/hooks'
import Logo from '../Logo'
import CoinLogo from '../pancake/CoinLogo'

const BASE_URL = process.env.REACT_APP_BASE_URL

const getTokenLogoURL = (address: string) =>
  `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/smartchain/assets/${address}/logo.png`

const StyledBnbLogo = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  border-radius: 24px;
`

const StyledLogo = styled(Logo) <{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
`

export default function CurrencyLogo({
  currency,
  size = '24px',
  style,
}: {
  currency?: Currency
  size?: string
  style?: React.CSSProperties
}) {

  

  const uriLocations = useHttpLocations(currency instanceof WrappedTokenInfo ? currency.logoURI : undefined)

  const srcs: string[] = useMemo(() => {
    if (currency === ETHER) return []

    if (currency instanceof Token) {
      if (currency instanceof WrappedTokenInfo) {
        return [...uriLocations, `${BASE_URL}/images/coins/${currency?.symbol ?? 'token'}.png`, getTokenLogoURL(currency.address)]
      }

      return [`${BASE_URL}/images/coins/${currency?.symbol ?? 'token'}.png`, getTokenLogoURL(currency.address)]
    }
    return []
  }, [currency, uriLocations])

  if (currency === ETHER) {
    return <StyledBnbLogo src={`${BASE_URL}/images/coins/bnb.png`} size={size} style={style} />
  }

  return (currency as any)?.symbol ? (
    <CoinLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} />
  ) : (
    <StyledLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} />
  )

  // const uriLocations = useHttpLocations(currency instanceof WrappedTokenInfo ? currency.logoURI : undefined)

  // const baseurl = 'http://localhost:3000'
  // const srcs: string[] = useMemo(() => {
  //   if (currency === ETHER) return []

  //   if (currency instanceof Token) {
  //     if (currency instanceof WrappedTokenInfo) {
  //       return [...uriLocations, `/images/coins/${currency?.symbol ?? 'token'}.png`, getTokenLogoURL(currency.address)]
  //     }

  //     return [`/images/coins/${currency?.symbol ?? 'token'}.png`, getTokenLogoURL(currency.address)]
  //   }
  //   return []
  // }, [currency, uriLocations])

  // if (currency === ETHER) {
  //   return <StyledBnbLogo src="/images/coins/bnb.png" size={size} style={style} />
  // }


  // return (currency as any)?.symbol ? (
  //   <CoinLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} />
  // ) : (
  //   <StyledLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} />
  // )

  // return <CoinLogo size={size} srcs={require('../../assets/images/coins/PTP.png')} alt={`${currency?.symbol ?? 'token'} logo`} style={style} />
}
