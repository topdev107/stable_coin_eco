import { Token } from '@pantherswap-libs/sdk'
import { ButtonMenu, ButtonMenuItem, ChevronDownIcon, CloseIcon, Text } from '@pantherswap-libs/uikit'
import AmountRefreshableInputPanel from 'components/AmountRefreshableInputPanel'
import { GreyCard, YellowCard } from 'components/Card'
import PeriodSelectModal from 'components/PeriodSelectModal'
import { QuestionColorHelper } from 'components/QuestionHelper'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { BigNumber, ethers } from 'ethers'
import { useActiveWeb3React } from 'hooks'
import { useAllTokens } from 'hooks/Tokens'
import { darken } from 'polished'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import styled from 'styled-components'
import { getAssetContract, getMasterPlatypusContract, getPTPContract, nDecimals, norValue } from 'utils'
import lock_icon from '../../assets/lock.png'
import PTP_logo from '../../assets/PTP_logo.png'
import timer_icon from '../../assets/timer.png'
import vePTP_logo from '../../assets/vePTP_logo.png'
import { ASSET_DAI_ADDRESS, ASSET_USDC_ADDRESS, ASSET_USDT_ADDRESS, DAI_LP_ID, USDC_LP_ID, USDT_LP_ID, VEPTP, PTP } from '../../constants'
import CurrencyLogo from '../CurrencyLogo'
import { RowBetween } from '../Row'
import WideModal from '../WideModal'

interface CalcModalProps {
  isOpen: boolean,
  vePTPBalanceOf: BigNumber,
  vePTPTotalSupply: BigNumber,
  ptpStakedAmount: BigNumber,
  onDismiss: () => void
}

interface CalcData {
  poolLiquidity: BigNumber
  lpBalanceOf: BigNumber
  stakedLPAmount: BigNumber
  cash: BigNumber
  liability: BigNumber
  rewardFactorVePTP: BigNumber
  baseAPR: BigNumber
  boostedAPR: BigNumber
  estimatedBoostedAPRFromVePTP: BigNumber
  estimatedBoostedAPRFromPTP: BigNumber
}

interface VePTPData {
  calculatedVePTP: BigNumber
  claimableVePTP: BigNumber
}

export default function CalcModal({
  isOpen,
  vePTPBalanceOf,
  vePTPTotalSupply,
  ptpStakedAmount,
  onDismiss
}: CalcModalProps) {

  const CurrencySelect = styled.div<{ selected: boolean }>`
  align-items: center;
  height: 34px;
  font-size: 16px;
  font-weight: 500;
  background-color: transparent;
  color: ${({ selected, theme }) => (selected ? theme.colors.text : '#FFFFFF')};
  border-radius: 7px;
  outline: none;
  cursor: pointer;
  user-select: none;
  border: 1px solid white;
  padding: 0 0.5rem;
  width: 100%;

  :focus,
  :hover {    
    background-color: ${({ theme }) => darken(0.05, theme.colors.input)};
  }
` 

  const [baseData, setBaseData] = useState<CalcData | undefined>()
  const [vePTPData, setVePTPData] = useState<VePTPData | undefined>()
  
  const [isNeedRefresh, setIsNeedRefresh] = useState<boolean>(true)
  const [isFirst, setIsFirst] = useState<boolean>(true)

  const { account, library, chainId } = useActiveWeb3React()
  const allTokens = useAllTokens()

  const [inputedTokenValue, setInputedTokenValue] = useState('')
  const [inputedPoolValue, setInputedPoolValue] = useState('')
  const [inputedVePTPValue, setInputedVePTPValue] = useState('')
  const [inputedPTPValue, setInputedPTPValue] = useState('')
  const [inputedVePTPTotalSupply, setInputedVePTPTotalSupply] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState<Token | undefined>()

  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false)
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | undefined>()

  const selectedPeriodTxt = useMemo(() => {
    switch (selectedPeriodId) {
      case 0:
        return "2 months"
      case 1:
        return "5 months"
      case 2:
        return "8 months"
      case 3:
        return "10 months (max vePTP cap reached)"
      default:
        return "Select a staking period"
    }
  }, [selectedPeriodId])

  const [tabIdx, setTabIdx] = useState(0)

  const poolShare = useMemo(() => {
    if (inputedTokenValue !== '' && inputedPoolValue !== '') {
      return parseFloat(inputedTokenValue) * 100 / parseFloat(inputedPoolValue)
    }
    return 0
  }, [inputedTokenValue, inputedPoolValue])


  const vePTPShare = useMemo(() => {
    if (inputedVePTPValue !== '' && inputedVePTPTotalSupply !== '') {
      return parseFloat(inputedVePTPValue) * 100 / parseFloat(inputedVePTPTotalSupply)
    }
    return 0
  }, [inputedVePTPValue, inputedVePTPTotalSupply])

  const vePTPShareFromPTP = useMemo(() => {
    if (vePTPData !== undefined && !vePTPTotalSupply.sub(vePTPBalanceOf).add(vePTPData?.calculatedVePTP).eq(BigNumber.from(0))) {
      return vePTPData?.calculatedVePTP.mul(BigNumber.from(100)).div(vePTPTotalSupply.sub(vePTPBalanceOf).add(vePTPData?.calculatedVePTP))
    }
    return 0
  }, [vePTPData, vePTPTotalSupply, vePTPBalanceOf])

  const handleTypeInputToken = useCallback(
    (val: string) => {
      setInputedTokenValue(val)
    },
    [setInputedTokenValue]
  )

  const handleTypeInputVePTP = useCallback(
    (val: string) => {
      setInputedVePTPValue(val)
    },
    [setInputedVePTPValue]
  )

  const handleTypeInputPTP = useCallback(
    (val: string) => {
      setInputedPTPValue(val)
    },
    [setInputedPTPValue]
  )

  const handleTypeInputVePTPTotal = useCallback(
    (val: string) => {
      setInputedVePTPTotalSupply(val)
    },
    [setInputedVePTPTotalSupply]
  )

  const handleTypeInputPool = useCallback(
    (val: string) => {
      setInputedPoolValue(val)
    },
    [setInputedPoolValue]
  )

  const handleRefreshInputToken = useCallback(
    () => {
      if (baseData !== undefined)
        setInputedTokenValue(norValue(baseData?.lpBalanceOf.add(baseData?.stakedLPAmount)).toString())
    },
    [setInputedTokenValue, baseData]
  )

  const handleRefreshInputPool = useCallback(
    () => {
      setInputedPoolValue(norValue(baseData?.poolLiquidity).toString())
    },
    [setInputedPoolValue, baseData?.poolLiquidity]
  )

  const handleRefreshInputVePTP = useCallback(
    () => {
      setInputedVePTPValue(norValue(vePTPBalanceOf).toString())
    },
    [setInputedVePTPValue, vePTPBalanceOf]
  )

  const handleRefreshInputPTP = useCallback(
    () => {
      setInputedPTPValue(norValue(ptpStakedAmount).toString())
    },
    [setInputedPTPValue, ptpStakedAmount]
  )

  const handleRefreshInputVePTPTotal = useCallback(
    () => {
      setInputedVePTPTotalSupply(norValue(vePTPTotalSupply).toString())
    },
    [setInputedVePTPTotalSupply, vePTPTotalSupply]
  )

  const handleClose = useCallback(
    () => {
      setInputedTokenValue('')
      setInputedPoolValue('')
      setInputedVePTPValue('')
      setInputedVePTPTotalSupply('')
      setInputedPTPValue('')
      setBaseData(undefined)
      setSelectedToken(undefined)
      setSelectedPeriodId(undefined)
      setTabIdx(0)
      onDismiss()
      setIsFirst(true)
    }, [setInputedTokenValue, setInputedPTPValue, setInputedPoolValue, setInputedVePTPValue, setInputedVePTPTotalSupply, setBaseData, setSelectedToken, onDismiss]
  )

  const onCurrencySelect = useCallback(
    (inputCurrency) => {
      const oneToken = Object.values(allTokens).find((d) => d.address.toLowerCase() === inputCurrency.address.toLowerCase())
      setSelectedToken(oneToken)
      setBaseData(undefined)
      setIsFirst(true)
    }, [allTokens]
  )

  const handlePeriodSelect = useCallback(
    (selectedId) => {
      setSelectedPeriodId(selectedId)
    }, [setSelectedPeriodId]
  )

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  const handleDismissPeriod = useCallback(() => {
    setIsPeriodModalOpen(false)
  }, [setIsPeriodModalOpen])

  const handleTabClick = (tIdx: number) => {
    setTabIdx(tIdx)
  }

  useEffect(() => {
    if (!isFirst) return 
    setInputedTokenValue(norValue(baseData?.lpBalanceOf.add(baseData?.stakedLPAmount)).toString())
    setInputedPoolValue(norValue(baseData?.poolLiquidity).toString())
    setInputedVePTPValue(norValue(vePTPBalanceOf).toString())
    setInputedVePTPTotalSupply(norValue(vePTPTotalSupply).toString())
    setInputedPTPValue(norValue(ptpStakedAmount).toString())
    if (baseData !== undefined) setIsFirst(false)
  }, [isFirst, baseData, baseData?.lpBalanceOf, baseData?.stakedLPAmount, baseData?.poolLiquidity, vePTPBalanceOf, vePTPTotalSupply, ptpStakedAmount])

  useEffect(() => {
    const getVePTPData = async () => {
      if (!chainId || !library || !account) return
      const masterPlatypusContract = getMasterPlatypusContract(chainId, library, account)

      const stakingTimeSecond =
        selectedPeriodId === 0 ? 2 * 30 * 24 * 3600 :
          selectedPeriodId === 1 ? 5 * 30 * 24 * 3600 :
            selectedPeriodId === 2 ? 8 * 30 * 24 * 3600 :
              selectedPeriodId === 3 ? 10 * 30 * 24 * 3600 : 0

      const inPTPValue = inputedPTPValue === '' ? '0' : inputedPTPValue
      const calcedVePTP = await Promise.all([
        masterPlatypusContract.calcVePTPReward(account, ethers.utils.parseUnits(inPTPValue, PTP.decimals), stakingTimeSecond),
        masterPlatypusContract.ptpStakedInfo(account)
      ]).then(response => {
        const calculatedVePTP = BigNumber.from(response[0]._hex)
        const claimableVePTP = BigNumber.from(response[1].rewardAmount._hex)
        const vePTPDatas: VePTPData = {
          'calculatedVePTP': calculatedVePTP,
          'claimableVePTP': claimableVePTP
        }
        return vePTPDatas
      }).catch((e) => {
        console.error(e)
        const vePTPDatas: VePTPData = {
          'calculatedVePTP': BigNumber.from(0),
          'claimableVePTP': BigNumber.from(0)
        }
        return vePTPDatas
      })

      if (!(vePTPData?.calculatedVePTP.eq(calcedVePTP.calculatedVePTP)) ||
        !(vePTPData?.claimableVePTP.eq(calcedVePTP.claimableVePTP))
      ) {
        setVePTPData(calcedVePTP)
      }
    }

    console.log('vePTPData: ', vePTPData)

    getVePTPData()

    const interval = setInterval(() => {
      getVePTPData()
    }, 20000);

    return () => window.clearInterval(interval);
  }, [account, chainId, library, inputedPTPValue, selectedPeriodId, vePTPData, vePTPData?.calculatedVePTP, vePTPData?.claimableVePTP])

  useEffect(() => {
    const getBaseData = async () => {
      if (!chainId || !library || !account || !selectedToken) return

      const tokenAddress =
        selectedToken.symbol === 'DAI' ? ASSET_DAI_ADDRESS :
          selectedToken.symbol === 'USDC' ? ASSET_USDC_ADDRESS :
            selectedToken.symbol === 'fUSDT' ? ASSET_USDT_ADDRESS : '0x'

      const lpID =
        selectedToken.symbol === 'DAI' ? DAI_LP_ID :
          selectedToken.symbol === 'USDC' ? USDC_LP_ID :
            selectedToken.symbol === 'fUSDT' ? USDT_LP_ID : '0'

      const stakingTimeSecond =
        selectedPeriodId === 0 ? 2 * 30 * 24 * 3600 :
          selectedPeriodId === 1 ? 5 * 30 * 24 * 3600 :
            selectedPeriodId === 2 ? 8 * 30 * 24 * 3600 :
              selectedPeriodId === 3 ? 10 * 30 * 24 * 3600 : 0

      const assetContract = getAssetContract(chainId, tokenAddress, library, account)
      const masterPlatypusContract = getMasterPlatypusContract(chainId, library, account)

      const inTokenValue = inputedTokenValue === '' ? '0' : inputedTokenValue
      const inPTPValue = inputedPTPValue === '' ? '0' : inputedPTPValue
      const inVePTPValue = inputedVePTPValue === '' ? '0' : inputedVePTPValue

      const baseDatas = await Promise.all([
        assetContract.totalSupply(),
        assetContract.balanceOf(account),
        masterPlatypusContract.lpStakedInfo(lpID, account),
        assetContract.cash(),
        assetContract.liability(),
        masterPlatypusContract.rewardFactorVePTP(),
        masterPlatypusContract.baseAPR(lpID),
        masterPlatypusContract.boostedAPR(lpID, account),
        masterPlatypusContract.estimatedBoostedAPRFromVePTP(lpID, account, ethers.utils.parseUnits(inTokenValue, selectedToken.decimals), ethers.utils.parseUnits(inVePTPValue, VEPTP.decimals)),
        masterPlatypusContract.estimatedBoostedAPRFromPTP(lpID, account, ethers.utils.parseUnits(inTokenValue, selectedToken.decimals), ethers.utils.parseUnits(inPTPValue, PTP.decimals), stakingTimeSecond)
      ]).then(response => {
        const poolLiquidity = BigNumber.from(response[0]._hex)
        const lpBalanceOf = BigNumber.from(response[1]._hex)
        const stakedLPAmount = BigNumber.from(response[2].lpAmount._hex)
        const cash = BigNumber.from(response[3]._hex)
        const liability = BigNumber.from(response[4]._hex)
        const rewardFactorVePTP = BigNumber.from(response[5]._hex)
        const baseAPR = BigNumber.from(response[6]._hex)
        const boostedAPR = BigNumber.from(response[7]._hex)
        const estimatedBoostedAPRFromVePTP = BigNumber.from(response[8]._hex)        
        const estimatedBoostedAPRFromPTP = BigNumber.from(response[9]._hex)

        const bData: CalcData = {
          'poolLiquidity': poolLiquidity,
          'lpBalanceOf': lpBalanceOf,
          'stakedLPAmount': stakedLPAmount,
          'cash': cash,
          'liability': liability,
          'rewardFactorVePTP': rewardFactorVePTP,
          'baseAPR': baseAPR,
          'boostedAPR': boostedAPR,
          'estimatedBoostedAPRFromVePTP': estimatedBoostedAPRFromVePTP,
          'estimatedBoostedAPRFromPTP': estimatedBoostedAPRFromPTP
        }
        return bData
      }).catch((e) => {
        console.error(e)
        const bData: CalcData = {
          'poolLiquidity': BigNumber.from(0),
          'lpBalanceOf': BigNumber.from(0),
          'stakedLPAmount': BigNumber.from(0),
          'cash': BigNumber.from(0),
          'liability': BigNumber.from(0),
          'rewardFactorVePTP': BigNumber.from(0),
          'baseAPR': BigNumber.from(0),
          'boostedAPR': BigNumber.from(0),
          'estimatedBoostedAPRFromVePTP': BigNumber.from(0),
          'estimatedBoostedAPRFromPTP': BigNumber.from(0)
        }
        return bData
      })

      if (!(baseData?.poolLiquidity.eq(baseDatas.poolLiquidity)) ||
        !(baseData?.lpBalanceOf.eq(baseDatas.lpBalanceOf)) ||
        !(baseData?.stakedLPAmount.eq(baseDatas.stakedLPAmount)) ||
        !(baseData?.cash.eq(baseDatas.cash)) ||
        !(baseData?.liability.eq(baseDatas.liability)) ||
        !(baseData?.rewardFactorVePTP.eq(baseDatas.rewardFactorVePTP)) ||
        !(baseData?.baseAPR.eq(baseDatas.baseAPR)) ||
        !(baseData?.boostedAPR.eq(baseDatas.boostedAPR)) ||
        !(baseData?.estimatedBoostedAPRFromVePTP.eq(baseDatas.estimatedBoostedAPRFromVePTP)) ||
        !(baseData?.estimatedBoostedAPRFromPTP.eq(baseDatas.estimatedBoostedAPRFromPTP))
      ) {
        setBaseData(baseDatas)
      }

      setIsNeedRefresh(false)
      console.log('baseData: ', baseData)
    }

    getBaseData()

    const interval = setInterval(() => {
      getBaseData()
    }, 20000);

    return () => window.clearInterval(interval);
  }, [account, chainId, library, baseData, selectedToken, inputedPTPValue, selectedPeriodId, inputedTokenValue, inputedVePTPValue])

  const disableCurrencySelect = false

  return (
    <>
      {!disableCurrencySelect && onCurrencySelect && (
        <CurrencySearchModal
          isOpen={modalOpen}
          onDismiss={handleDismissSearch}
          onCurrencySelect={onCurrencySelect}
          selectedCurrency={selectedToken}
          otherSelectedCurrency={selectedToken}
          showCommonBases
        />
      )}
      <PeriodSelectModal
        isOpen={isPeriodModalOpen}
        onDismiss={handleDismissPeriod}
        onSelected={handlePeriodSelect}
      />
      <WideModal isOpen={isOpen} onDismiss={handleClose} minHeight={30} maxHeight={120}>
        <div style={{ width: '100%', padding: '30px 30px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Text className="mr-3" fontSize='20px'>Booster Calculator</Text>
            </div>
            <div style={{ marginTop: '-30px', display: 'flex', justifyContent: 'end' }}>
              <CloseIcon onClick={handleClose} />
            </div>
          </div>
          <div className='mt-3'>
            <div style={{ width: '100%', height: '1px', backgroundColor: '#ff720d', position: 'relative', top: '12px' }} />
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#121827', paddingLeft: '15px', paddingRight: '0px' }}>
                <img src={PTP_logo} alt='logo' style={{ width: '23px', height: '23px', marginRight: '3px' }} />
                <Text className="mr-3">My Staked Deposit</Text>
              </div>
            </div>
          </div>
          <div className='mt-3'>
            <GreyCard>
              <CurrencySelect
                selected={!!selectedToken}
                className="open-currency-select-button"
                onClick={() => {
                  if (!disableCurrencySelect) {
                    setModalOpen(true)
                  }
                }}
              >
                <div style={{ marginTop: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <CurrencyLogo currency={selectedToken} size="24px" style={{ marginRight: '8px' }} />
                    <Text>
                      {(selectedToken && selectedToken.symbol && selectedToken.symbol.length > 20
                        ? `${selectedToken.symbol.slice(0, 4)
                        }...${selectedToken.symbol.slice(selectedToken.symbol.length - 5, selectedToken.symbol.length)}`
                        : selectedToken?.symbol) || <Text>Select a Token</Text>}
                    </Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'end', marginTop: '-22px' }}>
                    <ChevronDownIcon />
                  </div>
                </div>
              </CurrencySelect>

              <Row className='mt-1'>
                <Col>
                  <AmountRefreshableInputPanel
                    value={inputedTokenValue}
                    showMaxButton
                    currency={selectedToken}
                    onUserInput={handleTypeInputToken}
                    onRefresh={handleRefreshInputToken}
                  />
                </Col>
              </Row>
            </GreyCard>
          </div>
          <div className='mt-2'>
            <YellowCard>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <CurrencyLogo currency={selectedToken} size="24px" style={{ marginRight: '8px' }} />
                <Text>Pool Liquidity</Text>
              </div>
              <Row className='mt-1'>
                <Col>
                  <AmountRefreshableInputPanel
                    value={inputedPoolValue}
                    showMaxButton
                    currency={selectedToken}
                    onUserInput={handleTypeInputPool}
                    onRefresh={handleRefreshInputPool}
                  />
                </Col>
              </Row>
            </YellowCard>
          </div>
          <div className='mt-2'>
            <RowBetween>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                <Text>Pool Share</Text>
                <QuestionColorHelper
                  text='The percentage share of the pool you would own'
                  color='white'
                />
              </div>
              {
                poolShare === 0 ?
                  <Text>0.0%</Text> :
                  poolShare < 0.01 ?
                    <Text>{`< 0.01%`}</Text> :
                    <Text>{`${nDecimals(2, poolShare)}%`}</Text>
              }
            </RowBetween>
          </div>

          <div className='mt-4' style={{ display: 'flex', justifyContent: 'center' }}>
            <ButtonMenu activeIndex={tabIdx} size="sm" onClick={handleTabClick}>
              <ButtonMenuItem>veMARKET</ButtonMenuItem>
              <ButtonMenuItem>MARKET</ButtonMenuItem>
            </ButtonMenu>
          </div>

          {
            tabIdx === 0 ? (
              <>
                <div className='mt-3'>
                  <div style={{ width: '100%', height: '1px', backgroundColor: '#ff720d', position: 'relative', top: '12px' }} />
                  <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#121827', paddingLeft: '15px', paddingRight: '0px' }}>
                      <img src={vePTP_logo} alt='logo' style={{ width: '23px', height: '23px', marginRight: '3px' }} />
                      <Text className="mr-3">My veMARKET</Text>
                    </div>
                  </div>
                </div>

                <div>
                  <Row className='mt-1'>
                    <Col>
                      <AmountRefreshableInputPanel
                        value={inputedVePTPValue}
                        showMaxButton
                        currency={VEPTP}
                        onUserInput={handleTypeInputVePTP}
                        onRefresh={handleRefreshInputVePTP}
                      />
                    </Col>
                  </Row>
                </div>

                <div className='mt-2'>
                  <GreyCard>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      {/* <CurrencyLogo currency={VEPTP} size="24px" style={{ marginRight: '8px' }} /> */}
                      <img src={vePTP_logo} alt='logo' style={{ width: '23px', height: '23px', marginRight: '3px' }} />
                      <Text>Total veMARKET Supply</Text>
                    </div>
                    <Row className='mt-1'>
                      <Col>
                        <AmountRefreshableInputPanel
                          value={inputedVePTPTotalSupply}
                          showMaxButton
                          currency={VEPTP}
                          onUserInput={handleTypeInputVePTPTotal}
                          onRefresh={handleRefreshInputVePTPTotal}
                        />
                      </Col>
                    </Row>
                  </GreyCard>
                </div>

                <div className='mt-2'>
                  <RowBetween>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <Text>veMARKET Share</Text>
                      <QuestionColorHelper
                        text='The percentage of veMARKET you would own.'
                        color='white'
                      />
                    </div>
                    {
                      vePTPShare === 0 ?
                        <Text>0.0%</Text> :
                        vePTPShare < 0.01 ?
                          <Text>{`< 0.01%`}</Text> :
                          <Text>{`${nDecimals(2, vePTPShare)}%`}</Text>
                    }
                  </RowBetween>
                </div>

                <div className='mt-0'>
                  <RowBetween>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <Text>Base APR</Text>
                      <QuestionColorHelper
                        text='The base APR is independent of your veMARKET balance.'
                        color='white'
                      />
                    </div>
                    {
                      selectedToken === undefined || baseData === undefined ? (
                        <Text>0.0%</Text>
                      ) : (
                        <Text>{`${nDecimals(2, parseInt(baseData.baseAPR.toHexString(), 16) / (10 ** 18))}%`}</Text>
                      )
                    }
                  </RowBetween>
                </div>
                <div className='mt-0'>
                  <RowBetween>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <Text>Current Boosted APR</Text>
                      <QuestionColorHelper
                        text='The current boosted APR of MARKET emission you are earning at.'
                        color='white'
                      />
                    </div>
                    {
                      selectedToken === undefined || baseData === undefined ? (
                        <Text>0.0%</Text>
                      ) : (
                        <Text>{`${nDecimals(2, parseInt(baseData.boostedAPR.toHexString(), 16) / (10 ** 18))}%`}</Text>
                      )
                    }
                  </RowBetween>
                </div>
                <div className='mt-0'>
                  <RowBetween>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <Text>Estimated Boosted APR</Text>
                      <QuestionColorHelper
                        text='An estimate of the Boosted APR based on the veMARKET balance you would have. The actual value is also affected by the distribution of veMARKET.'
                        color='white'
                      />
                    </div>
                    {
                      selectedToken === undefined || baseData === undefined ? 
                        <Text>0.0%</Text> :                        
                        <Text>{`${nDecimals(2, parseInt(baseData.estimatedBoostedAPRFromVePTP.toHexString(), 16) / (10**18))}%`}</Text>
                    }
                  </RowBetween>
                </div>
              </>
            ) : (
              <>
                <div className='mt-3'>
                  <div style={{ width: '100%', height: '1px', backgroundColor: '#ff720d', position: 'relative', top: '12px' }} />
                  <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#121827', paddingLeft: '15px', paddingRight: '0px' }}>
                      <img src={PTP_logo} alt='logo' style={{ width: '23px', height: '23px', marginRight: '3px' }} />
                      <Text className="mr-3">My Staked MARKET</Text>
                    </div>
                  </div>
                </div>

                <div className='mt-3'>
                  <GreyCard>
                    <Row>
                      <Col>
                        <AmountRefreshableInputPanel
                          value={inputedPTPValue}
                          showMaxButton
                          currency={PTP}
                          onUserInput={handleTypeInputPTP}
                          onRefresh={handleRefreshInputPTP}
                        />
                      </Col>
                    </Row>
                    <div className='mt-1'>
                      <CurrencySelect
                        selected={!!selectedPeriodId}
                        className="open-currency-select-button"
                        onClick={() => {
                          setIsPeriodModalOpen(true)
                        }}
                      >
                        <div style={{ marginTop: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {
                              selectedPeriodId !== undefined ? (
                                <>
                                  <img src={lock_icon} alt='logo' style={{ width: '20px', height: '20px', marginRight: '5px' }} />
                                  <Text>{selectedPeriodTxt}</Text>
                                </>
                              ) : (
                                <>
                                  <img src={timer_icon} alt='logo' style={{ width: '20px', height: '20px', marginRight: '5px' }} />
                                  <Text>Select a staking period</Text>
                                </>
                              )
                            }
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'end', marginTop: '-22px' }}>
                            <ChevronDownIcon />
                          </div>
                        </div>
                      </CurrencySelect>
                    </div>
                  </GreyCard>
                </div>
                <div className='mt-2'>
                  <RowBetween>
                    <Text>Estimated veMARKET balance</Text>
                    <Text>{nDecimals(2, norValue(vePTPData?.calculatedVePTP.add(vePTPBalanceOf)))}</Text>
                  </RowBetween>
                </div>

                <div className='mt-2'>
                  <YellowCard>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <CurrencyLogo currency={VEPTP} size="24px" style={{ marginRight: '8px' }} />
                      <Text>Total veMARKET Supply</Text>
                    </div>
                  </YellowCard>
                </div>

                <div className='mt-2'>
                  <RowBetween>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <Text>veMARKET Share</Text>
                      <QuestionColorHelper
                        text='The percentage of vePTP you would own.'
                        color='white'
                      />
                    </div>
                    {
                      vePTPShareFromPTP === undefined || vePTPShareFromPTP === 0 ?
                        <Text>0.0%</Text> :
                        (vePTPShareFromPTP.mul(BigNumber.from(100))).lt(BigNumber.from(1)) ?
                          <Text>{`< 0.01%`}</Text> :
                          <Text>{`${nDecimals(2, vePTPShareFromPTP)}%`}</Text>
                    }
                  </RowBetween>
                </div>

                <div className='mt-0'>
                  <RowBetween>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <Text>Base APR</Text>
                      <QuestionColorHelper
                        text='The base APR is independent of your veMARKET balance.'
                        color='white'
                      />
                    </div>
                    {
                      selectedToken === undefined || baseData === undefined ? (
                        <Text>0.0%</Text>
                      ) : (
                        <Text>{`${nDecimals(2, parseInt(baseData.baseAPR.toHexString(), 16) / (10 ** 5 * 10 ** 18))}%`}</Text>
                      )
                    }
                  </RowBetween>
                </div>
                <div className='mt-0'>
                  <RowBetween>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <Text>Current Boosted APR</Text>
                      <QuestionColorHelper
                        text='The current boosted APR of MARKET emission you are earning at.'
                        color='white'
                      />
                    </div>
                    {
                      selectedToken === undefined || baseData === undefined ? (
                        <Text>0.0%</Text>
                      ) : (
                        <Text>{`${nDecimals(2, parseInt(baseData.boostedAPR.toHexString(), 16) / (10 ** 18))}%`}</Text>
                      )
                    }
                  </RowBetween>
                </div>
                <div className='mt-0'>
                  <RowBetween>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <Text>Estimated Boosted APR</Text>
                      <QuestionColorHelper
                        text='An estimate of the Boosted APR based on the veMARKET balance you would have. The actual value is also affected by the distribution of veMARKET.'
                        color='white'
                      />
                    </div>
                    {
                      selectedToken === undefined || baseData === undefined ? 
                      <Text>0.0%</Text> :
                      <Text>{`${nDecimals(2, parseInt(baseData.estimatedBoostedAPRFromPTP.toHexString(), 16) / (10**18))}%`}</Text>
                    }                    
                  </RowBetween>
                </div>
              </>
            )
          }
        </div>
      </WideModal >
    </>
  )
}
