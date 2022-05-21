import { Token } from '@pantherswap-libs/sdk'
import { Button, Checkbox, CloseIcon, ChevronDownIcon, Input, Text } from '@pantherswap-libs/uikit'
import { DarkblueOutlineRCard, GreyCard, GreyOutlineRCard, GreyRCard, LightRCard, OutlineRCard, PinkRCard } from 'components/Card'
import PercentInputPanel from 'components/PercentInputPanel'
import { BigNumber, ethers } from 'ethers'
import { useAllTokens } from 'hooks/Tokens'
import React, { useCallback, useState, useEffect, useMemo } from 'react'
import { Col, Row } from 'react-bootstrap'
import { Flex } from 'rebass'
import styled from 'styled-components'
import { darken } from 'polished'
import { formatCurrency, getERC20Contract, nDecimals, norValue, PoolItemBaseData, getPoolContract, getAssetContract, getPTPContract } from 'utils'
import AutoDepositModal from 'components/AutoDepositConfirmModal'
import { useActiveWeb3React } from 'hooks'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { useCurrencyBalances } from 'state/wallet/hooks'
import CurrencyLogo from '../CurrencyLogo'
import Modal from '../Modal'
import Question, { QuestionColorHelper } from '../QuestionHelper'
import { RowBetween } from '../Row'
import WideModal from '../WideModal'
import AutoPeriodSelectModal from '../AutoPeriodSelectModal'
import { ASSET_DAI_ADDRESS, ASSET_USDC_ADDRESS, ASSET_USDT_ADDRESS, MASTER_PLATYPUS_ADDRESS, POOL_ADDRESS, PTP } from '../../constants'
import RightAmountInputPanel from '../RightAmountInputPanel'

const Option = styled.div`
  padding: 0 4px;
`

const PeriodSelect = styled.div<{ selected: boolean }>`
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
  width: 30%;

  :focus,
  :hover {    
    background-color: ${({ theme }) => darken(0.05, theme.colors.input)};
  }
`

interface AutoProModalProps {
  isOpen: boolean
  baseData: PoolItemBaseData[]
  onDismiss: () => void
}

export default function AutoProModal({
  isOpen,
  baseData,
  onDismiss
}: AutoProModalProps) {

  const allTokens = useAllTokens()
  const { account, chainId, library } = useActiveWeb3React()
  const selectedCurrencyBalances = useCurrencyBalances(account ?? undefined, Object.values(allTokens) ?? undefined)

  const MIN = 1
  const MAX = 50

  const compoundPeriodTxts = useMemo(() => {
    return ['1 week', '2 weeks', '3 weeks', '4 weeks']
  }, [])

  const balancePeriodTxts = useMemo(() => {
    return ['1 week', '2 weeks', '3 weeks', '4 weeks']
  }, [])

  const lockPeriodTxts = useMemo(() => {
    return ['1 week', '2 weeks', '3 weeks', '4 weeks',
      '5 weeks', '6 weeks', '7 weeks', '8 weeks',
      '9 weeks', '10 weeks', '11 weeks', '12 weeks',
      '13 weeks', '14 weeks', '15 weeks', '16 weeks']
  }, [])

  const handleClose = useCallback(
    () => {
      setSelectedPoolId(undefined)
      setInputedValue1('')
      setInputedValue2('')
      setInputedValue3('')
      setIsCheckAutoAllocation(true)
      setIsCheckInvest(true)
      setIsCheckAutoBalance(false)
      setIsCheckAutoCompound(false)
      setIsCheckLock(false)
      onDismiss()
    }, [onDismiss]
  )

  const handleConfirm = useCallback(
    () => {
      onDismiss()
    }, [onDismiss]
  )

  const [investPercent, setInvestPercent] = useState<string>('10')
  const [error, setError] = useState<string | null>(null)

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm
  const [errMessage, setErrMessage] = useState<string>('')
  const [txHash, setTxHash] = useState<string>('')

  const [isDepositModalOpen, setIsDepositModalOpen] = useState<boolean>(false);
  const closeDepositModal = useCallback(() => setIsDepositModalOpen(false), [setIsDepositModalOpen]);
  const openDepositModal = useCallback((token: Token) => {
    setIsDepositModalOpen(true)
    setSelectedToken(token)
  }, [setIsDepositModalOpen])

  const [totalDepositAmount, setTotalDepositAmount] = useState<number>(0);

  const [selectedToken, setSelectedToken] = useState<Token | undefined>();
  const [selectedBaseData, setSelectedBaseData] = useState<PoolItemBaseData | undefined>()

  const [selectedPoolId, setSelectedPoolId] = useState<number | undefined>(0)

  const [inputedValue1, setInputedValue1] = useState('')
  const [inputedValue2, setInputedValue2] = useState('')
  const [inputedValue3, setInputedValue3] = useState('')
  const inputedValues = useMemo(() => {
    return [inputedValue1, inputedValue2, inputedValue3]
  }, [inputedValue1, inputedValue2, inputedValue3])

  const percents = useMemo(() => {
    const pers: number[] = []
    for (let i = 0; i < Object.values(allTokens).length; i++) {
      pers.push(nDecimals(1, norValue(baseData[i]?.balanceOf.add(baseData[i]?.stakedLPAmount), Object.values(allTokens)[i].decimals) / (totalDepositAmount) * 100))
    }
    return pers
  }, [allTokens, baseData, totalDepositAmount])

  const usddeposits = useMemo(() => {
    const usddps: string[] = []
    for (let i = 0; i < Object.values(allTokens).length; i++) {
      usddps.push(formatCurrency(nDecimals(6, norValue(baseData[i]?.balanceOf.add(baseData[i]?.stakedLPAmount), Object.values(allTokens)[i].decimals)) * norValue(baseData[i]?.price, 8), 2))
    }
    return usddps
  }, [allTokens, baseData])

  const coindeposits = useMemo(() => {
    const coindps: string[] = []
    for (let i = 0; i < Object.values(allTokens).length; i++) {
      coindps.push(formatCurrency(nDecimals(6, norValue((baseData[i]?.balanceOf.add(baseData[i]?.stakedLPAmount)), Object.values(allTokens)[i].decimals)), 2))
    }
    return coindps;
  }, [allTokens, baseData])

  const isInputOvers = useMemo(() => {
    const iio: boolean[] = []
    for (let i = 0; i < Object.values(allTokens).length; i++) {
      const wallAmount = (selectedCurrencyBalances !== undefined && selectedCurrencyBalances[i] !== undefined) ? selectedCurrencyBalances[i]?.toExact() : "0"
      const maxAmount = wallAmount !== undefined ? parseFloat(wallAmount) : 0
      const inAmount = inputedValues[i] !== undefined && inputedValues[i] !== '' ? parseFloat(inputedValues[i]) : 0
      iio.push(maxAmount < inAmount)
    }

    return iio
  }, [allTokens, selectedCurrencyBalances, inputedValues])

  const isInputOver = useMemo(() => {
    let isOver = false;
    for (let i = 0; i < isInputOvers.length; i++) {
      if (isInputOvers[i]) isOver = true
    }
    return isOver
  }, [isInputOvers])

  const isNeedApprove = useMemo(() => {

    const ENOUGH = BigNumber.from(Number.MAX_SAFE_INTEGER.toString())

    if (baseData !== undefined && baseData[0] !== undefined && baseData[1] !== undefined && baseData[2] !== undefined) {
      const allowance_master = baseData[0].allowance_lp_master.lt(ENOUGH) || baseData[1].allowance_lp_master.lt(ENOUGH) || baseData[2].allowance_lp_master.lt(ENOUGH) || baseData[0].allowance_ptp_master.lt(ENOUGH)
      if (+inputedValue1 > 0 && +inputedValue2 === 0 && +inputedValue3 === 0) {
        const inAmount = ethers.utils.parseUnits(inputedValue1, Object.values(allTokens)[0].decimals)
        return inAmount.gt(baseData[0].allowance) || allowance_master
      }
      if (+inputedValue1 === 0 && +inputedValue2 > 0 && +inputedValue3 === 0) {
        const inAmount = ethers.utils.parseUnits(inputedValue2, Object.values(allTokens)[1].decimals)
        return inAmount.gt(baseData[1].allowance) || allowance_master
      }
      if (+inputedValue1 === 0 && +inputedValue2 === 0 && +inputedValue3 > 0) {
        const inAmount = ethers.utils.parseUnits(inputedValue3, Object.values(allTokens)[2].decimals)
        return inAmount.gt(baseData[2].allowance) || allowance_master
      }
      if (+inputedValue1 > 0 && +inputedValue2 > 0 && +inputedValue3 === 0) {
        const inAmount1 = ethers.utils.parseUnits(inputedValue1, Object.values(allTokens)[0].decimals)
        const inAmount2 = ethers.utils.parseUnits(inputedValue2, Object.values(allTokens)[1].decimals)
        return (inAmount1.gt(baseData[0].allowance) || inAmount2.gt(baseData[1].allowance)) || allowance_master
      }
      if (+inputedValue1 > 0 && +inputedValue2 === 0 && +inputedValue3 > 0) {
        const inAmount1 = ethers.utils.parseUnits(inputedValue1, Object.values(allTokens)[0].decimals)
        const inAmount3 = ethers.utils.parseUnits(inputedValue3, Object.values(allTokens)[2].decimals)
        return (inAmount1.gt(baseData[0].allowance) || inAmount3.gt(baseData[2].allowance)) || allowance_master
      }
      if (+inputedValue1 === 0 && +inputedValue2 > 0 && +inputedValue3 > 0) {
        const inAmount2 = ethers.utils.parseUnits(inputedValue2, Object.values(allTokens)[1].decimals)
        const inAmount3 = ethers.utils.parseUnits(inputedValue3, Object.values(allTokens)[2].decimals)
        return (inAmount2.gt(baseData[1].allowance) || inAmount3.gt(baseData[2].allowance)) || allowance_master
      }
      if (+inputedValue1 > 0 && +inputedValue2 > 0 && +inputedValue3 > 0) {
        const inAmount1 = ethers.utils.parseUnits(inputedValue1, Object.values(allTokens)[0].decimals)
        const inAmount2 = ethers.utils.parseUnits(inputedValue2, Object.values(allTokens)[1].decimals)
        const inAmount3 = ethers.utils.parseUnits(inputedValue3, Object.values(allTokens)[2].decimals)
        return (inAmount1.gt(baseData[0].allowance) || inAmount2.gt(baseData[1].allowance) || inAmount3.gt(baseData[2].allowance)) || allowance_master
      }


      return undefined
    }

    return undefined
  }, [allTokens, baseData, inputedValue1, inputedValue2, inputedValue3])

  const [isApproving, setIsApproving] = useState(false)

  const [isCheckAutoAllocation, setIsCheckAutoAllocation] = useState<boolean>(true)
  const [isCheckInvest, setIsCheckInvest] = useState<boolean>(true)
  const [isCheckAutoBalance, setIsCheckAutoBalance] = useState<boolean>(false)
  const [isCheckAutoCompound, setIsCheckAutoCompound] = useState<boolean>(false)
  const [isCheckLock, setIsCheckLock] = useState<boolean>(false)

  const handleChangeAutoAllocation = useCallback(
    (event) => {
      setIsCheckAutoAllocation(event.target.checked)
    }, []
  )

  const handleChangeInvest = useCallback(
    (event) => {
      setIsCheckInvest(event.target.checked)
    }, []
  )

  const handleChangeAutoBalance = useCallback(
    (event) => {
      setIsCheckAutoBalance(event.target.checked)
    }, []
  )

  const handleChangeAutoCompound = useCallback(
    (event) => {
      setIsCheckAutoCompound(event.target.checked)
    }, []
  )

  const handleChangeLock = useCallback(
    (event) => {
      setIsCheckLock(event.target.checked)
    }, []
  )

  const handleTypeInput1 = useCallback(
    (val: string) => {
      setInputedValue1(val)
    },
    [setInputedValue1]
  )

  const handleTypeInput2 = useCallback(
    (val: string) => {
      setInputedValue2(val)
    },
    [setInputedValue2]
  )

  const handleTypeInput3 = useCallback(
    (val: string) => {
      setInputedValue3(val)
    },
    [setInputedValue3]
  )

  const handleTypeInputs = [handleTypeInput1, handleTypeInput2, handleTypeInput3]

  const handleMax1 = useCallback(
    () => {
      if (selectedCurrencyBalances !== undefined && selectedCurrencyBalances[0] !== undefined) {

        // setInputedValue1(selectedCurrencyBalances[0]?.toExact())
        console.log('toExact: ', selectedCurrencyBalances[0]?.toExact())
        console.log('toFixed: ', selectedCurrencyBalances[0]?.toFixed(0))
        const maxableAmount = BigNumber.from(selectedCurrencyBalances[0]?.toFixed(0)).mul(BigNumber.from(990)).div(BigNumber.from(1000))
        setInputedValue1(maxableAmount.toString())
        console.log('maxable: ', maxableAmount.toString())
      }
    },
    [selectedCurrencyBalances]
  )

  const handleMax2 = useCallback(
    () => {
      if (selectedCurrencyBalances !== undefined && selectedCurrencyBalances[1] !== undefined) {
        // setInputedValue2(selectedCurrencyBalances[1]?.toExact())
        const maxableAmount = BigNumber.from(selectedCurrencyBalances[1]?.toFixed(0)).mul(BigNumber.from(990)).div(BigNumber.from(1000))
        setInputedValue2(maxableAmount.toString())
      }
    },
    [selectedCurrencyBalances]
  )

  const handleMax3 = useCallback(
    () => {
      if (selectedCurrencyBalances !== undefined && selectedCurrencyBalances[2] !== undefined) {
        // setInputedValue3(selectedCurrencyBalances[2]?.toExact())
        const maxableAmount = BigNumber.from(selectedCurrencyBalances[2]?.toFixed(0)).mul(BigNumber.from(990)).div(BigNumber.from(1000))
        setInputedValue3(maxableAmount.toString())
      }
    },
    [selectedCurrencyBalances]
  )

  const handleMax = [handleMax1, handleMax2, handleMax3]

  const isInputedValue = useMemo(() => {
    return +inputedValue1 > 0 || +inputedValue2 > 0 || +inputedValue3 > 0
  }, [inputedValue1, inputedValue2, inputedValue3])

  const [compoundPeriodId, setCompoundPeriodId] = useState<number>(0)
  const [isCompoundPeriodModalOpen, setIsCompoundPeriodModalOpen] = useState(false)
  const compoundPeriodTxt = useMemo(() => {
    return compoundPeriodTxts[compoundPeriodId]
  }, [compoundPeriodTxts, compoundPeriodId])

  const [balancePeriodId, setBalancePeriodId] = useState<number>(0)
  const [isBalancePeriodModalOpen, setIsBalancePeriodModalOpen] = useState(false)
  const balancePeriodTxt = useMemo(() => {
    return balancePeriodTxts[balancePeriodId]
  }, [balancePeriodTxts, balancePeriodId])

  const [lockPeriodId, setLockPeriodId] = useState<number>(0)
  const [isLockPeriodModalOpen, setIsLockPeriodModalOpen] = useState(false)
  const lockPeriodTxt = useMemo(() => {
    return lockPeriodTxts[lockPeriodId]
  }, [lockPeriodTxts, lockPeriodId])

  const handleCompoundPeriodSelect = useCallback(
    (selectedId) => {
      setCompoundPeriodId(selectedId)
    }, [setCompoundPeriodId]
  )

  const handleCompoundPeriodDismiss = useCallback(() => {
    setIsCompoundPeriodModalOpen(false)
  }, [setIsCompoundPeriodModalOpen])

  const handleBalancePeriodSelect = useCallback(
    (selectedId) => {
      setBalancePeriodId(selectedId)
    }, [setBalancePeriodId]
  )

  const handleBalancePeriodDismiss = useCallback(() => {
    setIsBalancePeriodModalOpen(false)
  }, [setIsBalancePeriodModalOpen])

  const handleLockPeriodSelect = useCallback(
    (selectedId) => {
      setLockPeriodId(selectedId)
    }, [setLockPeriodId]
  )

  const handleLockPeriodDismiss = useCallback(() => {
    setIsLockPeriodModalOpen(false)
  }, [setIsLockPeriodModalOpen])

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const { value: inputValue } = evt.target
    setInvestPercent(inputValue)
  }

  useEffect(() => {
    try {

      const rawValue = +investPercent
      if (!Number.isNaN(rawValue) && rawValue >= MIN && rawValue <= MAX) {
        setError(null)
      } else {
        setError('Enter a valid percentage')
      }
    } catch {
      setError('Enter a valid percentage')
    }

    let sum = 0
    for (let i = 0; i < Object.values(allTokens).length; i++) {
      sum += norValue((baseData[i]?.balanceOf.add(baseData[i]?.stakedLPAmount)), Object.values(allTokens)[i]?.decimals)
    }

    setTotalDepositAmount(sum)

    if (isApproving && isNeedApprove === false) {
      setShowConfirm(false)
      setIsApproving(false)
    }

  }, [investPercent, setError, allTokens, baseData, isApproving, isNeedApprove])

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setTxHash('')
    setIsApproving(false)
  }, [])

  const pendingText = 'Waiting For Confirmation.'

  const handleApprove = useCallback(
    async () => {
      if (!chainId || !library || !account) return
      setShowConfirm(true)
      setAttemptingTxn(true)
      setIsApproving(true)
      const erc20Contract1 = getERC20Contract(chainId, Object.values(allTokens)[0].address, library, account)
      const erc20Contract2 = getERC20Contract(chainId, Object.values(allTokens)[1].address, library, account)
      const erc20Contract3 = getERC20Contract(chainId, Object.values(allTokens)[2].address, library, account)
      const assetContract1 = getAssetContract(chainId, ASSET_USDT_ADDRESS, library, account)
      const assetContract2 = getAssetContract(chainId, ASSET_DAI_ADDRESS, library, account)
      const assetContract3 = getAssetContract(chainId, ASSET_USDC_ADDRESS, library, account)
      const ptpContract = getPTPContract(chainId, library, account)

      // const tnx_hashes: string[] = []
      const promises: any[] = []
      promises.push(erc20Contract1.approve(POOL_ADDRESS, ethers.utils.parseUnits(Number.MAX_SAFE_INTEGER.toString(), Object.values(allTokens)[0].decimals)))
      promises.push(erc20Contract2.approve(POOL_ADDRESS, ethers.utils.parseUnits(Number.MAX_SAFE_INTEGER.toString(), Object.values(allTokens)[1].decimals)))
      promises.push(erc20Contract3.approve(POOL_ADDRESS, ethers.utils.parseUnits(Number.MAX_SAFE_INTEGER.toString(), Object.values(allTokens)[2].decimals)))
      promises.push(assetContract1.approve(MASTER_PLATYPUS_ADDRESS, ethers.utils.parseUnits(Number.MAX_SAFE_INTEGER.toString(), Object.values(allTokens)[0].decimals)))
      promises.push(assetContract2.approve(MASTER_PLATYPUS_ADDRESS, ethers.utils.parseUnits(Number.MAX_SAFE_INTEGER.toString(), Object.values(allTokens)[1].decimals)))
      promises.push(assetContract3.approve(MASTER_PLATYPUS_ADDRESS, ethers.utils.parseUnits(Number.MAX_SAFE_INTEGER.toString(), Object.values(allTokens)[2].decimals)))
      promises.push(ptpContract.approve(MASTER_PLATYPUS_ADDRESS, ethers.utils.parseUnits(Number.MAX_SAFE_INTEGER.toString(), PTP.decimals)))

      await Promise.all(promises)
        .then((response) => {
          console.log('multi_approve: ', response)
          // response.forEach(hash => {
          //   tnx_hashes.push(hash.hash)
          // })
          // console.log('tnx_hashes:', tnx_hashes)
        })
        .catch((e) => {
          console.log(e)
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx          
          if (e?.code !== 4001) {
            console.error(e)
            setErrMessage(e.data.message)
          } else {
            setShowConfirm(false)
            setIsApproving(false)
          }
        })

    }, [account, chainId, library, allTokens]
  )

  const handleDeposit = useCallback(
    async () => {
      if (!chainId || !library || !account) return
      setShowConfirm(true)
      setAttemptingTxn(true)

      const poolContract = getPoolContract(chainId, library, account)

      const token1 = Object.values(allTokens)[0];
      const token2 = Object.values(allTokens)[1];
      const token3 = Object.values(allTokens)[2];
      let amount1 = BigNumber.from(0)
      let amount2 = BigNumber.from(0)
      let amount3 = BigNumber.from(0)

      if (+inputedValue1 > 0)
        amount1 = ethers.utils.parseUnits(inputedValue1, Object.values(allTokens)[0].decimals)
      if (+inputedValue2 > 0)
        amount2 = ethers.utils.parseUnits(inputedValue2, Object.values(allTokens)[1].decimals)
      if (+inputedValue3 > 0)
        amount3 = ethers.utils.parseUnits(inputedValue3, Object.values(allTokens)[2].decimals)

      const volume24_url = 'https://stable-coin-eco-api.vercel.app/api/v1/tnxs/'

      let tnx_hash = ''
      await poolContract.depositAuto(
        token1.address,
        token2.address,
        token3.address,
        amount1,
        amount2,
        amount3,
        account,
        isCheckAutoAllocation,
        isCheckInvest ? +investPercent * 100 : 0
      )
        .then((response) => {
          setAttemptingTxn(false)
          console.log('deposit: ', response)
          setTxHash(response.hash)
          tnx_hash = response.hash

          if (+inputedValue1 > 0) {
            const requestOptions1 = {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token_address: token1.address, amount: inputedValue1, timestamp: Date.now() })
            };
            fetch(volume24_url.concat('add_tnx/'), requestOptions1)
          }

          if (+inputedValue2 > 0) {
            const requestOptions2 = {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token_address: token2.address, amount: inputedValue2, timestamp: Date.now() })
            };
            fetch(volume24_url.concat('add_tnx/'), requestOptions2)
          }

          if (+inputedValue3 > 0) {
            const requestOptions3 = {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token_address: token3.address, amount: inputedValue3, timestamp: Date.now() })
            };
            fetch(volume24_url.concat('add_tnx/'), requestOptions3)
          }

          setInputedValue1('')
          setInputedValue2('')
          setInputedValue3('')
          setIsCheckAutoAllocation(true)
          setIsCheckInvest(true)
          setIsCheckAutoBalance(false)
          setIsCheckAutoCompound(false)
          setIsCheckLock(false)
        })
        .catch((e) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx          
          if (e?.code !== 4001) {
            console.error(e)
            setErrMessage(e.data.message)
          } else {
            setShowConfirm(false)
          }
        })

    }, [account, chainId, library, allTokens, inputedValue1, inputedValue2, inputedValue3, investPercent, isCheckAutoAllocation, isCheckInvest]
  )

  return (
    <>
      {/* <AutoDepositModal
        isOpen={isDepositModalOpen}
        token={selectedToken}
        baseData={selectedBaseData}
        onDismiss={closeDepositModal}
        onApprove={handleApprove}
        onDeposit={handleDeposit}
      /> */}

      <AutoPeriodSelectModal
        isOpen={isBalancePeriodModalOpen}
        title='Auto Balance Period Select'
        items={balancePeriodTxts}
        onDismiss={handleBalancePeriodDismiss}
        onSelected={handleBalancePeriodSelect}
      />

      <AutoPeriodSelectModal
        isOpen={isCompoundPeriodModalOpen}
        title='Auto Compound Period Select'
        items={compoundPeriodTxts}
        onDismiss={handleCompoundPeriodDismiss}
        onSelected={handleCompoundPeriodSelect}
      />

      <AutoPeriodSelectModal
        isOpen={isLockPeriodModalOpen}
        title='Lock Period Select'
        items={lockPeriodTxts}
        onDismiss={handleLockPeriodDismiss}
        onSelected={handleLockPeriodSelect}
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

      <WideModal isOpen={isOpen} onDismiss={onDismiss} minHeight={30} maxHeight={120}>
        <div style={{ width: '100%', padding: '30px 30px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Text className="mr-3" fontSize='20px'>Get Started Investing In MARKET</Text>
            </div>
            <div style={{ marginTop: '-30px', display: 'flex', justifyContent: 'end' }}>
              <CloseIcon onClick={handleClose} />
            </div>
          </div>

          <div className='mt-5'>
            <RowBetween>
              <Text fontSize='13px'>Pools</Text>
              <Text fontSize='13px'>My Desposits</Text>
            </RowBetween>
            {
              Object.values(allTokens).map((onetoken, index) => {
                return (
                  <div className='mt-2'>
                    <GreyRCard>
                      <RowBetween>
                        <div style={{ display: 'flex', alignItems: 'center', borderRadius: '7px', backgroundColor: '#555', padding: '5px 12px' }}>
                          <CurrencyLogo currency={onetoken} size="20px" />
                          <Text className='ml-2'>{onetoken.symbol}</Text>
                          {
                            totalDepositAmount === 0 ?
                              <Text style={{ marginLeft: '10px', fontSize: '12px', color: '#aaa' }}>0%</Text> :
                              <Text style={{ marginLeft: '10px', fontSize: '12px', color: '#aaa' }}>{percents[index]}%</Text>
                          }
                          <QuestionColorHelper
                            text={`The portion of ${onetoken.symbol} pool is ${percents[index]}% of my total deposits`}
                            color='#fff'
                          />
                        </div>
                        <div style={{ flexGrow: '1', marginLeft: '10px' }}>
                          <RightAmountInputPanel
                            value={inputedValues[index]}
                            showMaxButton={false}
                            currency={Object.values(allTokens)[0]}
                            onUserInput={handleTypeInputs[index]}
                            onMax={undefined}
                          />
                        </div>
                      </RowBetween>
                      <RowBetween className='mt-2'>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Text style={{ fontSize: '12px', color: '#aaa' }}>Balance:</Text>
                          <Text style={{ marginLeft: '10px', fontSize: '12px', color: '#aaa' }}>{formatCurrency(selectedCurrencyBalances[index]?.toExact(), 2)}</Text>
                          <Text style={{ marginLeft: '10px', color: '#ff720d', cursor: 'pointer' }} onClick={handleMax[index]}>MAX</Text>
                        </div>
                        <Text style={{ marginLeft: '10px', fontSize: '12px', color: '#aaa' }}>{`$${usddeposits[index]} (${coindeposits[index]} ${onetoken.symbol})`}</Text>
                      </RowBetween>
                      {
                        isInputOvers[index] ? (
                          <RowBetween>
                            <Text style={{ color: 'red', fontSize: '12px' }}>Exceeds wallet balance</Text>
                          </RowBetween>
                        ) : (
                          <></>
                        )
                      }
                    </GreyRCard>
                  </div>
                )
              })
            }
          </div>

          <div className='mt-4'>
            <Flex alignItems="center">
              <Checkbox
                scale='sm'
                checked={isCheckAutoAllocation}
                onChange={handleChangeAutoAllocation}
              />
              <Text style={{ marginLeft: '10px' }}>Auto Allocation</Text>
            </Flex>
            <Flex alignItems="center" className='mt-2'>
              <Checkbox
                scale='sm'
                checked={isCheckInvest}
                onChange={handleChangeInvest}
              />
              <Text style={{ marginLeft: '10px', marginRight: '10px' }}>Invest to MARKET</Text>
              <Flex alignItems="center">
                <Option>
                  <Input
                    type="number"
                    scale="sm"
                    step={1}
                    min={MIN}
                    max={MAX}
                    placeholder="10%"
                    value={investPercent}
                    onChange={handleChange}
                    isWarning={error !== null}
                    style={{ width: '90px' }}
                  />
                </Option>
                <Option>
                  {
                    error === null ?
                      <Text >{`(${MIN}% - ${MAX}%)`}</Text> :
                      <Text color='#f00'>{`(${MIN}% - ${MAX}%)`}</Text>
                  }
                </Option>
              </Flex>
            </Flex>
            {/* <div className='mt-4'>
              {
                isInputedValue === false ?
                  <Button fullWidth disabled style={{ borderRadius: '5px' }}>Please input amounts</Button> :
                  isInputOver ?
                    <Button fullWidth disabled style={{ borderRadius: '5px' }}>Please input correct amount</Button> :
                    <Button fullWidth style={{ borderRadius: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Text className='ml-2'>Deposit</Text>
                      </div>
                    </Button>
              }
            </div> */}
            {/* <div className="mt-3" >
              <div style={{ width: '100%', height: '1px', backgroundColor: '#ff720d', position: 'relative', top: '13px' }} />
              <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', backgroundColor: '#121827', paddingLeft: '10px', paddingRight: '10px' }}>
                  <Text className='ml-1'>Settings</Text>
                </div>
              </div>
            </div> */}

            {/* <Flex alignItems="center" className='mt-3'>
              <Checkbox 
                scale='sm' 
                checked={isCheckAutoBalance}
                onChange={handleChangeAutoBalance}
              />
              <Text style={{ marginLeft: '10px', marginRight: '10px' }}>Auto Balance Per</Text>
              <PeriodSelect
                selected={!!balancePeriodId}
                className="open-currency-select-button"
                onClick={() => {
                  setIsBalancePeriodModalOpen(true)
                }}
              >
                <div style={{ marginTop: '4px' }}>
                  <Flex alignItems="center">
                    <Text>{balancePeriodTxt}</Text>
                  </Flex>
                  <Flex justifyContent="end" style={{ marginTop: '-22px' }}>
                    <ChevronDownIcon />
                  </Flex>
                </div>
              </PeriodSelect>
            </Flex>
            <Flex alignItems="center" className='mt-2'>
              <Checkbox 
                scale='sm'
                checked={isCheckAutoCompound}
                onChange={handleChangeAutoCompound}
              />
              <Text style={{ marginLeft: '10px', marginRight: '10px' }}>Auto Compound Per</Text>
              <PeriodSelect
                selected={!!compoundPeriodId}
                className="open-currency-select-button"
                onClick={() => {
                  setIsCompoundPeriodModalOpen(true)
                }}
              >
                <div style={{ marginTop: '4px' }}>
                  <Flex alignItems="center">
                    <Text>{compoundPeriodTxt}</Text>
                  </Flex>
                  <Flex justifyContent="end" style={{ marginTop: '-22px' }}>
                    <ChevronDownIcon />
                  </Flex>
                </div>
              </PeriodSelect>
            </Flex>
            <Flex alignItems="center" className='mt-2'>
              <Checkbox 
                scale='sm' 
                checked={isCheckLock}
                onChange={handleChangeLock}
              />
              <Text style={{ marginLeft: '10px', marginRight: '10px' }}>Lock Staking</Text>
              <PeriodSelect
                selected={!!lockPeriodId}
                className="open-currency-select-button"
                onClick={() => {
                  setIsLockPeriodModalOpen(true)
                }}
              >
                <div style={{ marginTop: '4px' }}>
                  <Flex alignItems="center">
                    <Text>{lockPeriodTxt}</Text>
                  </Flex>
                  <Flex justifyContent="end" style={{ marginTop: '-22px' }}>
                    <ChevronDownIcon />
                  </Flex>
                </div>
              </PeriodSelect>
            </Flex> */}
            {/* <div className='mt-4'>
              <Button fullWidth style={{ borderRadius: '5px' }} onClick={handleConfirm}>Confirm</Button>
            </div> */}
            <div className='mt-4'>
              {
                isInputedValue === false ?
                  <Button fullWidth disabled style={{ borderRadius: '5px' }}>Please input amounts</Button> :
                  isInputOver ?
                    <Button fullWidth disabled style={{ borderRadius: '5px' }}>Please input correct amount</Button> :
                    isNeedApprove === undefined ? (
                      <Button fullWidth style={{ borderRadius: '5px' }} disabled>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <Text className='ml-2'>Approve</Text>
                        </div>
                      </Button>
                    ) : (
                      isNeedApprove ? (
                        <Button fullWidth style={{ borderRadius: '5px' }} onClick={handleApprove}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Text className='ml-2'>Approve</Text>
                          </div>
                        </Button>
                      ) : (
                        <Button fullWidth style={{ borderRadius: '5px' }} onClick={handleDeposit}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <Text className='ml-2'>Deposit</Text>
                          </div>
                        </Button>
                      )
                    )
              }
            </div>
          </div>
        </div>
      </WideModal >
    </>
  )
}
