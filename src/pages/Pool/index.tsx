import React, { useContext, useMemo, useCallback } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Pair } from '@pantherswap-libs/sdk'
import { Button, CardBody, LogoIcon, Text } from '@pantherswap-libs/uikit'
import { Link } from 'react-router-dom'
import CardNav from 'components/CardNav'
import Question from 'components/QuestionHelper'
import FullPositionCard from 'components/PositionCard'
import { useTokenBalancesWithLoadingIndicator } from 'state/wallet/hooks'
import { StyledInternalLink, TYPE } from 'components/Shared'
import { LightCard, DarkblueOutlineCard } from 'components/Card'
import { RowBetween } from 'components/Row'
import { AutoColumn } from 'components/Column'
import { Row, Col } from 'react-bootstrap'

import { useActiveWeb3React } from 'hooks'
import { usePairs } from 'data/Reserves'
import { toV2LiquidityToken, useTrackedTokenPairs } from 'state/user/hooks'
import { Dots } from 'components/swap/styleds'
import TranslatedText from 'components/TranslatedText'
import { TranslateString } from 'utils/translateTextHelpers'
import PageHeader from 'components/PageHeader'
import PoolItem from 'components/PoolItem'
import { right } from '@popperjs/core'
import AppBody from '../AppBody'
import { useAllTokens } from '../../hooks/Tokens'


const { body: Body } = TYPE


export default function Pool() {
  const allTokens = useAllTokens()
  const theme = useContext(ThemeContext)
  const { account } = useActiveWeb3React()

  // fetch the user's balances of all tracked V2 LP tokens
  const trackedTokenPairs = useTrackedTokenPairs()
  const tokenPairsWithLiquidityTokens = useMemo(
    () => trackedTokenPairs.map((tokens) => ({ liquidityToken: toV2LiquidityToken(tokens), tokens })),
    [trackedTokenPairs]
  )
  const liquidityTokens = useMemo(() => tokenPairsWithLiquidityTokens.map((tpwlt) => tpwlt.liquidityToken), [
    tokenPairsWithLiquidityTokens,
  ])
  const [v2PairsBalances, fetchingV2PairBalances] = useTokenBalancesWithLoadingIndicator(
    account ?? undefined,
    liquidityTokens
  )

  // fetch the reserves for all V2 pools in which the user has a balance
  const liquidityTokensWithBalances = useMemo(
    () =>
      tokenPairsWithLiquidityTokens.filter(({ liquidityToken }) =>
        v2PairsBalances[liquidityToken.address]?.greaterThan('0')
      ),
    [tokenPairsWithLiquidityTokens, v2PairsBalances]
  )

  const v2Pairs = usePairs(liquidityTokensWithBalances.map(({ tokens }) => tokens))
  const v2IsLoading =
    fetchingV2PairBalances || v2Pairs?.length < liquidityTokensWithBalances.length || v2Pairs?.some((V2Pair) => !V2Pair)

  const allV2PairsWithLiquidity = v2Pairs.map(([, pair]) => pair).filter((v2Pair): v2Pair is Pair => Boolean(v2Pair))

  const MaxWidthDiv = styled.div`
    width: 100%;
    max-width: 900px;
  `
  const borderRadius7 = {
    borderRadius: '5px',
    border: '1px solid #ff720d'
  }

  const verticalCenterContainerStyle = {
    height: '100%',
    display: 'flex',
    alignItems: 'center'
  }

  return (
    <>
      <CardNav activeIndex={1} />
      <MaxWidthDiv>
        <Button variant='secondary' style={borderRadius7} endIcon={<LogoIcon/>} className="ml-1">
          Withdraw MIM
        </Button>
        <LightCard className="mt-2 ml-1">
          <Row style={verticalCenterContainerStyle}>
            <Col md={9}>
              <Text>Pools Earning: <LogoIcon/> 0.0PTP</Text> 
            </Col>
            <Col md={3}>
              <Button variant='secondary' size='sm' style={borderRadius7} >Claim PTP</Button>   
            </Col>
          </Row>                      
        </LightCard>
        {
          Object.values(allTokens).map((onetoken) => {
            return (
              <PoolItem token={onetoken}/>       
            )
          })
        }     
      </MaxWidthDiv> 
    </>
  )
}
