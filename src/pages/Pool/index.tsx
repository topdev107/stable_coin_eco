import { Token } from '@pantherswap-libs/sdk'
import { Button, LogoIcon, Text } from '@pantherswap-libs/uikit'
import { LightCard } from 'components/Card'
import CardNav from 'components/CardNav'
import PoolItem from 'components/PoolItem'
import { useActiveWeb3React } from 'hooks'
import React, { useCallback, useEffect, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import styled from 'styled-components'
import { getAssetContract, getERC20Contract, getPoolContract, getPriceProviderContract, PoolItemBaseData } from 'utils'
import { useTnxHandler } from 'state/tnxs/hooks'
import { useSelector } from 'react-redux'
import { AppState } from 'state'
import DepositModal from '../../components/DepositConfirmModal'
import TransactionConfirmationModal, { TransactionErrorContent } from '../../components/TransactionConfirmationModal'
import { ASSET_BUSD_ADDRESS, ASSET_DAI_ADDRESS, ASSET_USDC_ADDRESS, ASSET_USDT_ADDRESS, DEFAULT_DEADLINE_FROM_NOW, POOL_ADDRESS } from '../../constants'
import { useAllTokens } from '../../hooks/Tokens'
import { useUserSlippageTolerance } from '../../state/user/hooks'


export default function Pool() {
  const allTokens = useAllTokens()

  const { account, chainId, library } = useActiveWeb3React()

  const [baseData, setBaseData] = useState<PoolItemBaseData[]>([])
  const [selectedToken, setSelectedToken] = useState<Token | undefined>();
  const [selectedData, setSelectedData] = useState<PoolItemBaseData | undefined>()
  const [isDepositModalOpen, setIsDepositModalOpen] = useState<boolean>(false);

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm
  const [errMessage, setErrMessage] = useState<string>('')

  // txn values
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users
  const [txHash, setTxHash] = useState<string>('')

  const { saveTnx } = useTnxHandler()

  const openDepositModal = (token: Token) => () => {
    setIsDepositModalOpen(true)
    setSelectedToken(token)
    const oneData = baseData.find((d) => d.address.toLowerCase() === token.address.toLowerCase())
    setSelectedData(oneData)
  }

  const closeDepositModal = useCallback(() => setIsDepositModalOpen(false), [setIsDepositModalOpen]);

  const volume24_url = 'http://localhost:5000/api/v1/tnxs/'

  const handleDeposit = useCallback(
    async (amount: string, tkn: Token | undefined) => {
      if (!chainId || !library || !account || !tkn) return
      setShowConfirm(true)
      setIsDepositModalOpen(false)
      setAttemptingTxn(true)
      const poolContract = getPoolContract(chainId, library, account)
      const deadline = Date.now() + DEFAULT_DEADLINE_FROM_NOW * 1000      

      await poolContract.deposit(tkn.address, amount, account, deadline)
        .then((response) => {
          setAttemptingTxn(false)
          console.log(response)
          setTxHash(response.hash)
          saveTnx(tkn.address, (+amount / (10 ** tkn.decimals)).toString(), Date.now())
          console.log('saveTnx: ', tkn.address.concat(': ').concat(amount.toString()))
          
          const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token_address: tkn.address, amount: (+amount / (10 ** tkn.decimals)).toString(), timestamp: Date.now()})
          };      
          fetch(volume24_url.concat('add_tnx/'), requestOptions)
            .then(res => res.json())
            .then(data => {
              fetch(volume24_url.concat('get_tnx_amount_24h/').concat(tkn.address))
                .then(res1 => res1.json())
                .then(data1 => {
                  const idx = baseData.findIndex((d) => d.address.toLowerCase() === tkn.address.toLowerCase())
                  const volume24h = baseData[idx].volume24
                  baseData[idx].volume24 = data1.status === 'success' ? data1.volume24 : volume24h
                })
            })
            .catch(e => {
              console.log(e)
            })
        })
        .catch((e) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx          
          if (e?.code !== 4001) {
            console.error(e)
            setErrMessage(e.message)
          } else {
            setShowConfirm(false)
          }
        })
    }, [account, chainId, library, baseData, saveTnx]
  )

  const handleApprove = useCallback(
    async (amount: string, tkn: Token | undefined) => {
      if (!chainId || !library || !account || !tkn) return
      setShowConfirm(true)
      setAttemptingTxn(true)
      const erc20Contract = getERC20Contract(chainId, tkn.address, library, account)
      await erc20Contract.approve(POOL_ADDRESS, amount)
        .then((response) => {
          setAttemptingTxn(false)
          console.log(response)
          setTxHash(response.hash)
        })
        .catch((e) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx          
          if (e?.code !== 4001) {
            console.error(e)
            setErrMessage(e.message)
          } else {
            setShowConfirm(false)
          }
        })
    }, [account, chainId, library]
  )

  useEffect(() => {

    if (!chainId || !library || !account) return
    const getBaseData = async () => {
      const baseDatas = await Promise.all(Object.values(allTokens).map(async (token) => {
        const tokenAddress =
          token.symbol === 'DAI' ? ASSET_DAI_ADDRESS :
            token.symbol === 'USDC' ? ASSET_USDC_ADDRESS :
              token.symbol === 'USDT' ? ASSET_USDT_ADDRESS :
                token.symbol === 'BUSD' ? ASSET_BUSD_ADDRESS : '0x'

        const assetContract = getAssetContract(chainId, tokenAddress, library, account)
        const priceProviderContract = getPriceProviderContract(chainId, library, account)
        const getVolume24h = async () => {
          const res = await fetch(volume24_url.concat('get_tnx_amount_24h/').concat(token.address))          
          return res.json()
        }

        return Promise.all([
          assetContract.totalSupply(),
          assetContract.balanceOf(account),
          assetContract.cash(),
          assetContract.liability(),
          priceProviderContract.getAssetPrice(token.address),
          getVolume24h()
        ])
          .then(response => {
            console.log('response: ', response)
            const totalSupply = parseInt(response[0]._hex, 16) / (10 ** 18)
            const balanceOf = parseInt(response[1]._hex, 16) / (10 ** 18)
            const poolShare = totalSupply === 0 ? 0 : balanceOf * 100 / totalSupply
            const cash = parseInt(response[2]._hex, 16) / (10 ** 18)
            const liability = parseInt(response[3]._hex, 16) / (10 ** 18)
            const price = parseInt(response[4]._hex, 16) / (10 ** 8)
            const volume24h = response[5].status === 'success' ? response[5].volume24 : 0
            const bData: PoolItemBaseData = {
              'symbol': token.symbol,
              'address': token.address,
              'totalSupply': totalSupply,
              'balanceOf': balanceOf,
              'cash': cash,
              'liability': liability,
              'poolShare': poolShare,
              'price': price,
              'volume24': volume24h
            }
            return bData
          })
          .catch((e) => {
            console.error(e)
            const bData: PoolItemBaseData = {
              'symbol': token.symbol,
              'address': token.address,
              'totalSupply': 0,
              'balanceOf': 0,
              'cash': 0,
              'liability': 0,
              'poolShare': 0,
              'price': 0,
              'volume24': 0
            }
            return bData
          })
      }))
        .then(response => {
          return response
        })
        .catch((e) => {
          console.log(e)
          return []
        })

      setBaseData(baseDatas)
      console.log('baseData: ', baseDatas)
    }

    getBaseData()
  }, [account, chainId, library, allTokens])

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setTxHash('')
  }, [])

  const pendingText = 'Waiting For Confirmation.'

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
        isOpen={isDepositModalOpen}
        token={selectedToken}
        baseData={selectedData}
        onDismiss={closeDepositModal}
        onApprove={handleApprove}
        onDeposit={handleDeposit}
      />

      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        content={() => (
          <TransactionErrorContent
            message={errMessage}
            onDismiss={handleDismissConfirmation}
          />
        )}
        pendingText={pendingText}
      />

      <CardNav activeIndex={1} />
      <MaxWidthDiv>
        <Button variant='secondary' style={borderRadius7} endIcon={<LogoIcon />} className="ml-1">
          Withdraw MIM
        </Button>
        <LightCard className="mt-2 ml-1">
          <Row style={verticalCenterContainerStyle}>
            <Col md={9}>
              <Text>Pools Earning: <LogoIcon /> 0.0PTP</Text>
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
                baseData={baseData.find((d) => d.address.toLowerCase() === onetoken.address.toLowerCase())}
                openDepositModal={openDepositModal(onetoken)}
              />
            )
          })
        }
      </MaxWidthDiv>
    </>
  )
}
