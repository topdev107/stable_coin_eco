import { Pair, Token } from '@pantherswap-libs/sdk'
import { Button, LogoIcon, Text } from '@pantherswap-libs/uikit'
import { LightCard } from 'components/Card'
import CardNav from 'components/CardNav'
import PoolItem from 'components/PoolItem'
import { TYPE } from 'components/Shared'
import { usePairs } from 'data/Reserves'
import { useActiveWeb3React } from 'hooks'

import React, { useContext, useMemo, useCallback, useState, useEffect } from 'react'
import { Col, Row } from 'react-bootstrap'
import { toV2LiquidityToken, useTrackedTokenPairs } from 'state/user/hooks'
import { useTokenBalancesWithLoadingIndicator } from 'state/wallet/hooks'
import styled, { ThemeContext } from 'styled-components'

import { useDispatch } from 'react-redux'
import { getPoolContract } from 'utils'
import { DEFAULT_DEADLINE_FROM_NOW } from '../../constants'
import { useAllTokens } from '../../hooks/Tokens'
import DepositModal from '../../components/DepositConfirmModal'

import { AppDispatch } from '../../state/index'
import { addOrUpdatePoolItem } from '../../state/pool/reducer'
import { setTokenAddress } from '../../state/pool/reducer1'


const { body: Body } = TYPE


export default function Pool() {
  const allTokens = useAllTokens()
  const theme = useContext(ThemeContext)
  
  const { account, chainId, library } = useActiveWeb3React()  

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

  const [selectedToken, setSelectedToken] = useState<Token | undefined>();
  const [depositModal, setDepositModal] = useState<boolean>(false);
  const [withdrawModal, setWithdrawModal] = useState<boolean>(false);

  const openDepositModal = token => () => {      
    setDepositModal(true)
    setSelectedToken(token)
  }

  // const openDepositModal = useCallback (() => setDepositModal(true), [setDepositModal]);
  const closeDepositModal = useCallback (() => setDepositModal(false), [setDepositModal]);
  const openWithdrawModal = useCallback (() => setWithdrawModal(true), [setWithdrawModal]);
  const closeWithdrawModal = useCallback (() => setWithdrawModal(false), [setWithdrawModal]);

  const handleDeposit = useCallback (    
    async (amount: string, tkn: Token | undefined) => {
      if (!chainId || !library || !account || !tkn) return
      const poolContract = getPoolContract(chainId, library, account)
      const deadline = (Date.now() + DEFAULT_DEADLINE_FROM_NOW) * 1000
      await poolContract.deposit(tkn.address, amount, account, deadline).then((response) => {
        console.log(response)
        console.log('deposit completed')
      })
    }, [account, chainId, library]    
  ) 

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
      <DepositModal
        isOpen={depositModal}     
        token={selectedToken}
        onDismiss={closeDepositModal}
        onDeposit={handleDeposit}     
      />

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
          Object.values(allTokens).map((onetoken, index) => {
            return (
              <PoolItem 
                token={onetoken}
                openDepositModal={openDepositModal(onetoken)}
                />   
            )
          })          
        }     
      </MaxWidthDiv> 
    </>
  )
}
