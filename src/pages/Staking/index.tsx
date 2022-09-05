import { Button, Progress, Text } from '@pantherswap-libs/uikit'
import CalcModal from 'components/CalcModal'
import { GreyCard, LightCard, YellowCard } from 'components/Card'
import CardNav from 'components/CardNav'
import MyMenu from 'components/MyMenu'
import PTPLockModal from 'components/PTPLockModal'
import PTPLockTimeIncreaseModal from 'components/PTPLockTimeIncreaseModal'
import PTPStakeModal from 'components/PTPStakeConfirmModal'
import PTPUnStakeModal from 'components/PTPUnStakeConfirmModal'
import { QuestionColorHelper } from 'components/QuestionHelper'
import { RowBetween } from 'components/Row'
import TimeDown from 'components/TimeDown'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import VePTPClaimModal from 'components/VePTPClaimConfirmModal'
import { BigNumber } from 'ethers'
import { useActiveWeb3React } from 'hooks'
import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { Col, Row } from 'react-bootstrap'
import { AlignCenter, Edit } from 'react-feather'
import { Flex } from 'rebass'
import styled from 'styled-components'
import { formatCurrency, getMasterPlatypusContract, getPTPContract, getVePTPContract, nDecimals, norValue, PTPStakedInfo, pad, calculateGasMargin } from 'utils'
import MARKET_logo from '../../assets/MARKET_logo.png'
import MARKET_logo_blank from '../../assets/MARKET_logo_blank.png'
import MARKET_logo_disabled from '../../assets/MARKET_logo_disabled.png'
import { MASTER_PLATYPUS_ADDRESS, PTP, VEPTP } from '../../constants'


export default function Staking() {

  const { account, chainId, library } = useActiveWeb3React()

  const MaxWidthDiv = styled.div`
    width: 100%;
    max-width: 600px;
    display: flex;
    justify-content: center;
  `
  const initialBaseData = {
    'ptpStakedAmount': BigNumber.from(0),
    'totalPtpStakedAmount': BigNumber.from(0),
    'vePTPrewardableAmount': BigNumber.from(0),
    'vePTPBalanceOf': BigNumber.from(0),
    'veTotalSupply': BigNumber.from(0),
    'calcVePTPAmount': BigNumber.from(0),
    'allowancePTP': BigNumber.from(0),
    'ptpBalanceOf': BigNumber.from(0),
    'lockedTimestamp': BigNumber.from(0),
    'lockedDeadline': BigNumber.from(0),
    'lockedAmount': BigNumber.from(0),
    'lockedTotalAmount': BigNumber.from(0),
    'curTimestamp': BigNumber.from(0),
    'relock': false,
    'activeLockedDeadline': BigNumber.from(0)
  }

  const [baseData, setBaseData] = useState<PTPStakedInfo>(initialBaseData)
  const [isNeedRefresh, setIsNeedRefresh] = useState<boolean>(true)
  const [isPTPStakeModalOpen, setIsPTPStakeModalOpen] = useState<boolean>(false);
  const [isPTPUnStakeModalOpen, setIsPTPUnStakeModalOpen] = useState<boolean>(false);
  const [isVePTPClaimModalOpen, setIsVePTPClaimModalOpen] = useState<boolean>(false);
  const [isCalcModalOpen, setIsCalcModalOpen] = useState<boolean>(false);
  const [isPTPLockModalOpen, setIsPTPLockModalOpen] = useState<boolean>(false);
  const [isPTPLockTimeIncreaseModalOpen, setIsPTPLockTimeIncreaseModalOpen] = useState<boolean>(false);


  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm
  const [errMessage, setErrMessage] = useState<string>('')
  const [txHash, setTxHash] = useState<string>('')

  const openPTPStakeModal = useCallback(() => setIsPTPStakeModalOpen(true), [setIsPTPStakeModalOpen]);
  const closePTPStakeModal = useCallback(() => setIsPTPStakeModalOpen(false), [setIsPTPStakeModalOpen]);

  const openPTPUnStakeModal = useCallback(() => setIsPTPUnStakeModalOpen(true), [setIsPTPUnStakeModalOpen]);
  const closePTPUnStakeModal = useCallback(() => setIsPTPUnStakeModalOpen(false), [setIsPTPUnStakeModalOpen]);

  const openVePTPClaimModal = useCallback(() => setIsVePTPClaimModalOpen(true), [setIsVePTPClaimModalOpen]);
  const closeVePTPClaimModal = useCallback(() => setIsVePTPClaimModalOpen(false), [setIsVePTPClaimModalOpen]);

  const openCalcModal = useCallback(() => setIsCalcModalOpen(true), [setIsCalcModalOpen]);
  const closeCalcModal = useCallback(() => setIsCalcModalOpen(false), [setIsCalcModalOpen]);

  const openPTPLockModal = useCallback(() => setIsPTPLockModalOpen(true), [setIsPTPLockModalOpen]);
  const closePTPLockModal = useCallback(() => setIsPTPLockModalOpen(false), [setIsPTPLockModalOpen]);

  const openPTPLockTimeIncreaseModal = useCallback(() => setIsPTPLockTimeIncreaseModalOpen(true), [setIsPTPLockTimeIncreaseModalOpen]);
  const closePTPLockTimeIncreaseModal = useCallback(() => setIsPTPLockTimeIncreaseModalOpen(false), [setIsPTPLockTimeIncreaseModalOpen]);

  const lockAmount = useMemo(() => {
    return baseData.lockedTimestamp.add(baseData.lockedDeadline).gte(baseData.curTimestamp) ? baseData.lockedAmount : BigNumber.from(0)
  }, [baseData.lockedTimestamp, baseData.lockedDeadline, baseData.curTimestamp, baseData.lockedAmount])

  const handleApprovePTPStaking = useCallback(
    async (amount: BigNumber) => {
      if (!chainId || !library || !account) return

      setShowConfirm(true)
      setAttemptingTxn(true)
      const ptpContract = getPTPContract(chainId, library, account)
      let tnx_hash = ''
      await ptpContract.approve(MASTER_PLATYPUS_ADDRESS, amount)
        .then((response) => {
          console.log('approved: ', response)
          setTxHash(response.hash)
          tnx_hash = response.hash
        })
        .catch((e) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx          
          if (e?.code !== 4001) {
            console.error(e)
            setErrMessage(e.data.message ?? e.message)
          } else {
            setShowConfirm(false)
          }
        })

      const checkTnx = async () => {
        if (tnx_hash === '') return
        ptpContract
          .once('Approval', (owner, spender, allowanceAmount) => {
            console.log('== Approval ==')
            console.log('owner: ', owner)
            console.log('spender: ', spender)
            console.log('amount: ', parseInt(allowanceAmount._hex, 16) / (10 ** 18))

            ptpContract.provider
              .getTransactionReceipt(tnx_hash)
              .then((res) => {
                console.log('getTransactionReceipt: ', res)
              })
              .catch(e => {
                console.log('tnx_receipt_exception: ', e)
              })
              .finally(() => {
                console.log('finally called')
                setIsNeedRefresh(true)
                setAttemptingTxn(false)
                setShowConfirm(false)
              })
          })
      }

      checkTnx()

    }, [account, chainId, library]
  )

  const handleLockPTP = useCallback(
    async (amount: BigNumber, deadline: number, relock: boolean) => {
      if (!chainId || !library || !account) return
      setShowConfirm(true)
      setAttemptingTxn(true)
      setIsPTPLockModalOpen(false)
      const ptpContract = getPTPContract(chainId, library, account)
      let tnx_hash = ''

      await ptpContract.setLockInfo(account, amount, deadline, relock)
        .then((response) => {
          console.log('setLockInfo: ', response)
          // setAttemptingTxn(false)          
          setTxHash(response.hash)
          tnx_hash = response.hash
        })
        .catch((e) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx          
          if (e?.code !== 4001) {
            console.error(e)
            setErrMessage(e.data.message ?? e.message)
          } else {
            setShowConfirm(false)
          }
        })

      // event UpdateLockInfo(address indexed user, uint256 addedAmount, uint256 oldDeadline, uint256 newDeadline, bool oldRelock, bool newRelock);
      const checkTnx = async () => {
        if (tnx_hash === '') return
        ptpContract
          .once('UpdateLockInfo', (owner, addedAmount, oldDeadline, newDeadline, oldRelock, newRelock) => {
            console.log('== UpdateLockInfo ==')
            console.log('owner: ', owner)
            console.log('addedAmount: ', parseInt(addedAmount._hex, 16) / (10 ** 18))
            console.log('oldDeadline: ', parseInt(oldDeadline._hex, 16))
            console.log('newDeadline: ', parseInt(newDeadline._hex, 16))
            console.log('oldRelock: ', oldRelock)
            console.log('newRelock: ', newRelock)

            ptpContract.provider
              .getTransactionReceipt(tnx_hash)
              .then((res) => {
                console.log('getTransactionReceipt: ', res)
              })
              .catch(e => {
                console.log('tnx_receipt_exception: ', e)
              })
              .finally(() => {
                console.log('finally called')
                setIsNeedRefresh(true)
                setAttemptingTxn(false)
              })
          })
      }

      checkTnx()
    }, [account, chainId, library]
  )

  const handleLockTimeIncreasePTP = useCallback(
    async (deadline: number) => {
      if (!chainId || !library || !account) return
      setShowConfirm(true)
      setAttemptingTxn(true)
      setIsPTPLockTimeIncreaseModalOpen(false)
      const ptpContract = getPTPContract(chainId, library, account)
      let tnx_hash = ''

      await ptpContract.increaseLockTime(account, deadline)
        .then((response) => {
          console.log('increaseLockTime: ', response)
          // setAttemptingTxn(false)          
          setTxHash(response.hash)
          tnx_hash = response.hash
        })
        .catch((e) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx          
          if (e?.code !== 4001) {
            console.error(e)
            setErrMessage(e.data.message ?? e.message)
          } else {
            setShowConfirm(false)
          }
        })

      const checkTnx = async () => {
        if (tnx_hash === '') return
        ptpContract
          .once('IncreasedLockTime', (owner, newdeadline) => {
            console.log('== IncreasedLockTime ==')
            console.log('owner: ', owner)
            console.log('deadline: ', parseInt(newdeadline._hex, 16))

            ptpContract.provider
              .getTransactionReceipt(tnx_hash)
              .then((res) => {
                console.log('getTransactionReceipt: ', res)
              })
              .catch(e => {
                console.log('tnx_receipt_exception: ', e)
              })
              .finally(() => {
                console.log('finally called')
                setIsNeedRefresh(true)
                setAttemptingTxn(false)
              })
          })
      }

      checkTnx()
    }, [account, chainId, library]
  )

  const handleStakePTP = useCallback(
    async (amount: BigNumber) => {
      if (!chainId || !library || !account) return
      setShowConfirm(true)
      setAttemptingTxn(true)
      setIsPTPStakeModalOpen(false)
      const masterPlatypusContract = getMasterPlatypusContract(chainId, library, account)
      let tnx_hash = ''

      const gaslimit = await masterPlatypusContract.estimateGas.stakingPTP(amount)
        .then(calculateGasMargin)
        .catch((e) => {
          console.error(`estimateGas failed`, e)
          return undefined
        })
      console.log('Gas Limits: ', gaslimit)

      await masterPlatypusContract.stakingPTP(amount)
        .then((response) => {
          console.log('stakingLP: ', response)
          // setAttemptingTxn(false)          
          setTxHash(response.hash)
          tnx_hash = response.hash
        })
        .catch((e) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx          
          if (e?.code !== 4001) {
            console.error(e)
            setErrMessage(e.data.message ?? e.message)
          } else {
            setShowConfirm(false)
          }
        })

      const checkTnx = async () => {
        if (tnx_hash === '') return
        masterPlatypusContract
          .once('PTPStaked', (owner, tokenAddr, amt) => {
            console.log('== PTPStaked ==')
            console.log('owner: ', owner)
            console.log('tokenAddr: ', tokenAddr)
            console.log('amount: ', parseInt(amt._hex, 16) / (10 ** 18))

            masterPlatypusContract.provider
              .getTransactionReceipt(tnx_hash)
              .then((res) => {
                console.log('getTransactionReceipt: ', res)
              })
              .catch(e => {
                console.log('tnx_receipt_exception: ', e)
              })
              .finally(() => {
                console.log('finally called')
                setIsNeedRefresh(true)
                setAttemptingTxn(false)
              })
          })
      }

      checkTnx()
    }, [account, chainId, library]
  )

  const handleUnStakePTP = useCallback(
    async (amount: BigNumber) => {
      if (!chainId || !library || !account) return
      setShowConfirm(true)
      setAttemptingTxn(true)
      setIsPTPUnStakeModalOpen(false)
      const masterPlatypusContract = getMasterPlatypusContract(chainId, library, account)
      let tnx_hash = ''

      await masterPlatypusContract.unStakingPTP(amount)
        .then((response) => {
          console.log('unStakingPTP: ', response)
          // setAttemptingTxn(false)          
          setTxHash(response.hash)
          tnx_hash = response.hash
        })
        .catch((e) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx          
          if (e?.code !== 4001) {
            console.error(e)
            setErrMessage(e.data.message ?? e.message)
          } else {
            setShowConfirm(false)
          }
        })

      const checkTnx = async () => {
        if (tnx_hash === '') return
        masterPlatypusContract
          .once('PTPUnStaked', (owner, tokenAddr, amt) => {
            console.log('== PTPUnStaked ==')
            console.log('owner: ', owner)
            console.log('tokenAddr: ', tokenAddr)
            console.log('amount: ', parseInt(amt._hex, 16) / (10 ** 18))

            masterPlatypusContract.provider
              .getTransactionReceipt(tnx_hash)
              .then((res) => {
                console.log('getTransactionReceipt: ', res)
              })
              .catch(e => {
                console.log('tnx_receipt_exception: ', e)
              })
              .finally(() => {
                console.log('finally called')
                setIsNeedRefresh(true)
                setAttemptingTxn(false)
              })
          })
      }

      checkTnx()
    }, [account, chainId, library]
  )

  const handleClaimVePTP = useCallback(
    async () => {
      if (!chainId || !library || !account) return
      setShowConfirm(true)
      setAttemptingTxn(true)
      setIsVePTPClaimModalOpen(false)
      const masterPlatypusContract = getMasterPlatypusContract(chainId, library, account)
      let tnx_hash = ''

      await masterPlatypusContract.claimVePTP()
        .then((response) => {
          console.log('claimVePTP: ', response)
          // setAttemptingTxn(false)          
          setTxHash(response.hash)
          tnx_hash = response.hash
        })
        .catch((e) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx          
          if (e?.code !== 4001) {
            console.error(e)
            setErrMessage(e.data.message ?? e.message)
          } else {
            setShowConfirm(false)
          }
        })

      const checkTnx = async () => {
        if (tnx_hash === '') return
        masterPlatypusContract
          .once('VePTPClaimed', (owner, amt) => {
            console.log('== ClaimVePTP: VePTPClaimed ==')
            console.log('owner: ', owner)
            console.log('amount: ', parseInt(amt._hex, 16) / (10 ** 18))

            masterPlatypusContract.provider
              .getTransactionReceipt(tnx_hash)
              .then((res) => {
                console.log('getTransactionReceipt: ', res)
              })
              .catch(e => {
                console.log('tnx_receipt_exception: ', e)
              })
              .finally(() => {
                console.log('finally called')
                setIsNeedRefresh(true)
                setAttemptingTxn(false)
              })
          })
      }

      checkTnx()
    }, [account, chainId, library]
  )

  useEffect(() => {
    const getBaseData = async () => {
      if (!chainId || !library || !account) return
      const masterPlatypusContract = getMasterPlatypusContract(chainId, library, account)
      const vePTPContract = getVePTPContract(chainId, library, account)
      const ptpContract = getPTPContract(chainId, library, account)

      const baseDatas: PTPStakedInfo = await Promise.all([
        masterPlatypusContract.ptpStakedInfo(account),
        vePTPContract.balanceOf(account),
        vePTPContract.totalSupply(),
        masterPlatypusContract.calcVePTPReward(account, baseData.totalPtpStakedAmount, 1), // 3600s
        ptpContract.allowance(account, MASTER_PLATYPUS_ADDRESS),
        ptpContract.balanceOf(account),
        ptpContract.lockInfo(account),
        ptpContract.activeLockedDeadline(account),

      ]).then(response => {
        const ptpAmount = BigNumber.from(response[0].ptpAmount._hex)
        const totalPtpAmount = BigNumber.from(response[0].totalPtpAmount._hex)
        const rewardAmount = BigNumber.from(response[0].rewardAmount._hex)
        const vePTPBalanceOf = BigNumber.from(response[1]._hex)
        const veTotalSupply = BigNumber.from(response[2]._hex)
        const calcVePTPAmount = BigNumber.from(response[3]._hex)
        const allowancePTP = BigNumber.from(response[4]._hex)
        const ptpBalanceOf = BigNumber.from(response[5]._hex)
        const lockedTimestamp = BigNumber.from(response[6].timestamp._hex)
        const lockedDeadline = BigNumber.from(response[6].deadline._hex)
        const lockedAmount = BigNumber.from(response[6].amount._hex)
        const lockedTotalAmount = BigNumber.from(response[6].totalAmount._hex)
        const curTimestamp = BigNumber.from(response[6].curTimestamp._hex)
        const relock = response[6].relock
        const activeLockedDeadline = BigNumber.from(response[7]._hex)

        const bData: PTPStakedInfo = {
          'ptpStakedAmount': ptpAmount,
          'totalPtpStakedAmount': totalPtpAmount,
          'vePTPrewardableAmount': rewardAmount,
          'vePTPBalanceOf': vePTPBalanceOf,
          'veTotalSupply': veTotalSupply,
          'calcVePTPAmount': calcVePTPAmount,
          'allowancePTP': allowancePTP,
          'ptpBalanceOf': ptpBalanceOf,
          'lockedTimestamp': lockedTimestamp,
          'lockedDeadline': lockedDeadline,
          'lockedAmount': lockedAmount,
          'lockedTotalAmount': lockedTotalAmount,
          'curTimestamp': curTimestamp,
          'relock': relock,
          'activeLockedDeadline': activeLockedDeadline
        }
        return bData
      }).catch((e) => {
        console.error(e)
        const bData: PTPStakedInfo = {
          'ptpStakedAmount': BigNumber.from(0),
          'totalPtpStakedAmount': BigNumber.from(0),
          'vePTPrewardableAmount': BigNumber.from(0),
          'vePTPBalanceOf': BigNumber.from(0),
          'veTotalSupply': BigNumber.from(0),
          'calcVePTPAmount': BigNumber.from(0),
          'allowancePTP': BigNumber.from(0),
          'ptpBalanceOf': BigNumber.from(0),
          'lockedTimestamp': BigNumber.from(0),
          'lockedDeadline': BigNumber.from(0),
          'lockedAmount': BigNumber.from(0),
          'lockedTotalAmount': BigNumber.from(0),
          'curTimestamp': BigNumber.from(0),
          'relock': false,
          'activeLockedDeadline': BigNumber.from(0),
        }
        return bData
      })

      if (!(baseData.ptpStakedAmount.eq(baseDatas.ptpStakedAmount)) ||
        !(baseData.totalPtpStakedAmount.eq(baseDatas.totalPtpStakedAmount)) ||
        !(baseData.vePTPrewardableAmount.eq(baseDatas.vePTPrewardableAmount)) ||
        !(baseData.vePTPBalanceOf.eq(baseDatas.vePTPBalanceOf)) ||
        !(baseData.veTotalSupply.eq(baseDatas.veTotalSupply)) ||
        !(baseData.calcVePTPAmount.eq(baseDatas.calcVePTPAmount)) ||
        !(baseData.allowancePTP.eq(baseDatas.allowancePTP)) ||
        !(baseData.ptpBalanceOf.eq(baseDatas.ptpBalanceOf)) ||
        !(baseData.lockedTimestamp.eq(baseDatas.lockedTimestamp)) ||
        !(baseData.lockedDeadline.eq(baseDatas.lockedDeadline)) ||
        !(baseData.lockedAmount.eq(baseDatas.lockedAmount)) ||
        !(baseData.lockedTotalAmount.eq(baseDatas.lockedTotalAmount)) ||
        (baseData.relock !== baseDatas.relock) ||
        !(baseData.activeLockedDeadline.eq(baseDatas.activeLockedDeadline))
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
  }, [account, chainId, library, baseData, isNeedRefresh])

  const handleRefresh = useCallback(
    () => {
      setIsNeedRefresh(true)
    }, []
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setTxHash('')
  }, [])

  const pendingText = 'Waiting For Confirmation.'

  return (
    <>
      {/* <MyMenu/> */}
      <PTPStakeModal
        isOpen={isPTPStakeModalOpen}
        token={PTP}
        baseData={baseData}
        onDismiss={closePTPStakeModal}
        onApprove={handleApprovePTPStaking}
        onStake={handleStakePTP}
        onRefresh={handleRefresh}
      />

      <PTPUnStakeModal
        isOpen={isPTPUnStakeModalOpen}
        token={PTP}
        baseData={baseData}
        onDismiss={closePTPUnStakeModal}
        onUnStake={handleUnStakePTP}
        onRefresh={handleRefresh}
      />

      <VePTPClaimModal
        isOpen={isVePTPClaimModalOpen}
        token={VEPTP}
        baseData={baseData}
        onDismiss={closeVePTPClaimModal}
        onClaimVePTP={handleClaimVePTP}
        onRefresh={handleRefresh}
      />

      <PTPLockModal
        isOpen={isPTPLockModalOpen}
        token={PTP}
        baseData={baseData}
        onDismiss={closePTPLockModal}
        onLock={handleLockPTP}
        onRefresh={handleRefresh}
      />

      <PTPLockTimeIncreaseModal
        isOpen={isPTPLockTimeIncreaseModalOpen}
        token={PTP}
        baseData={baseData}
        onDismiss={closePTPLockTimeIncreaseModal}
        onLock={handleLockTimeIncreasePTP}
        onRefresh={handleRefresh}
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

      <CalcModal
        isOpen={isCalcModalOpen}
        vePTPBalanceOf={baseData.vePTPBalanceOf}
        vePTPTotalSupply={baseData.veTotalSupply}
        ptpStakedAmount={baseData.ptpStakedAmount}
        onDismiss={closeCalcModal}
      />

      <CardNav activeIndex={3} />
      <MaxWidthDiv>
        <LightCard className="mt-2 p-3">
          <div className='mt-3' style={{ display: 'flex', justifyContent: 'center' }}>
            <Text fontSize='30px'>Stake MARKET to Boost Yield</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }} className='mt-4'>
            {
              account ? (
                <img src={MARKET_logo} alt='logo' style={{ width: '120px', height: '120px' }} />
              ) : (
                <img src={MARKET_logo_disabled} alt='logo' style={{ width: '120px', height: '120px' }} />
              )
            }
          </div>
          {
            baseData.ptpStakedAmount.gt(BigNumber.from(0)) ? (
              <div className="mt-4">
                <YellowCard>
                  <RowBetween>
                    <Text>My balance</Text>
                    <Text color='#ff720d'>{`${formatCurrency(nDecimals(2, norValue(baseData.vePTPBalanceOf)), 2)} veMARKET`}</Text>
                  </RowBetween>
                  <div className='mt-3'>
                    <Progress primaryStep={norValue(baseData.vePTPBalanceOf) / norValue(baseData.ptpStakedAmount)} />
                  </div>
                  <RowBetween className='mt-3'>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <Text color='#888' fontSize='14px'>{`Total veMARKET supply: ${formatCurrency(nDecimals(2, norValue(baseData.veTotalSupply)), 2)}`}</Text>
                      <QuestionColorHelper
                        text='Total veMARKET balance of all users'
                        color='white'
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <Text color='#888' fontSize='14px'>{`Max veMARKET to Earn: ${formatCurrency(nDecimals(2, norValue(baseData.ptpStakedAmount) * 100), 2)}`}</Text>
                      <QuestionColorHelper
                        text='Max veMARKET you can earn is 100 times of your staked MARKET'
                        color='white'
                      />
                    </div>
                  </RowBetween>
                </YellowCard>
              </div>
            ) : (
              <div className="mt-4">
                <Row>
                  <Col style={{ display: 'flex', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <img src={MARKET_logo_blank} alt='logo' style={{ width: '40px', height: '40px' }} />
                      <div className='ml-2'>
                        <Text color='#888'>0.00 Staked MARKET</Text>
                        <Text color='#888'>0.00 Locked MARKET</Text>
                      </div>
                    </div>
                  </Col>
                  <Col style={{ display: 'flex', justifyContent: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Text color='#888'>0 veMARKET/hour</Text>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <Text color='#888'>veMARKET Mine Rate</Text>
                        <QuestionColorHelper
                          text='Each staked MARKET generates 0.0 veMARKET per second'
                          color='white'
                        />
                      </div>
                    </div>
                  </Col>
                  <Col>
                    <Row>
                      <div style={{ height: '50px', width: '1px', backgroundColor: '#888' }} />
                      <Col>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                              <Text color='#888'>0.0</Text>
                            </div>
                            <Text color='#888'>veMARKET Mined</Text>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </div>
            )
          }

          <div className="mt-4" >
            <div style={{ width: '100%', height: '1px', backgroundColor: '#ff720d', position: 'relative', top: '13px' }} />
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', backgroundColor: '#0a0e17', paddingLeft: '10px', paddingRight: '10px' }}>
                <img src={MARKET_logo} alt='logo' style={{ width: '25px', height: '25px' }} />
                <Text className='ml-1'>veMARKET boosts MARKET APR (</Text>
                {
                  account ?
                    <Text className='textBtn' style={{ color: '#ff720d', cursor: 'pointer' }} onClick={openCalcModal}>Booster Calculator</Text> :
                    <Text className='textBtn' style={{ color: '#ff720d', cursor: 'pointer' }} >Booster Calculator</Text>
                }
                <Text>)</Text>
              </div>
            </div>
          </div>
          {
            baseData.ptpStakedAmount.gt(BigNumber.from(0)) ? (
              <div>
                <div className='mt-4'>
                  <Row>
                    <Col>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                          <Text>Claimable veMARKET</Text>
                          <QuestionColorHelper
                            text={`Each staked MARKET generates ${nDecimals(8, norValue(baseData.calcVePTPAmount) / norValue(baseData.totalPtpStakedAmount))} veMARKET per second`}
                            color='white'
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Text color='#ff720d' fontSize='25px'>{formatCurrency(nDecimals(2, norValue(baseData.vePTPrewardableAmount)), 2)}</Text>
                      </div>
                    </Col>
                    <Col>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Button variant='success' size='sm' onClick={openVePTPClaimModal}>Claim veMARKET</Button>
                      </div>
                    </Col>
                  </Row>
                </div>
                <div className='mt-3' style={{ width: '100%', height: '1px', backgroundColor: '#ff720d' }} />
                <div className="mt-4">
                  <Row>
                    <Col style={{ display: 'flex', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <img src={MARKET_logo_blank} alt='logo' style={{ width: '40px', height: '40px' }} />
                        <div className='ml-2'>
                          <Flex alignItems='center'>
                            <Text>{formatCurrency(nDecimals(5, norValue(baseData.ptpStakedAmount)), 5)} Staked MARKET</Text>
                            <QuestionColorHelper
                              text={`UnStakable: ${formatCurrency(nDecimals(5, norValue(baseData.ptpStakedAmount.sub(lockAmount))), 5)} MARKET`}
                              color='white'
                            />
                          </Flex>
                          <Text color='#888'>{formatCurrency(nDecimals(5, norValue(lockAmount)), 5)} Locked MARKET</Text>
                          <RowBetween>
                            <TimeDown
                              lockedTimestamp={baseData.lockedTimestamp}
                              lockedDeadline={baseData.lockedDeadline}
                              curTimestamp={baseData.curTimestamp}
                            />
                            {
                              lockAmount.gt(BigNumber.from(0)) ? (
                                <Edit color='#fff' size={18} style={{ cursor: 'pointer', marginRight: '3px' }} onClick={openPTPLockTimeIncreaseModal} />
                              ) : (
                                <></>
                              )
                            }
                          </RowBetween>
                        </div>
                      </div>
                    </Col>
                    <Col style={{ display: 'flex', justifyContent: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <Text>{`${formatCurrency(nDecimals(2, norValue(baseData.calcVePTPAmount) * 3600), 2)} veMARKET/hour`}</Text>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                          <Text color='#888'>veMARKET Mine Rate</Text>
                          <QuestionColorHelper
                            text={`Each staked MARKET generates ${nDecimals(8, norValue(baseData.calcVePTPAmount) / norValue(baseData.totalPtpStakedAmount))} veMARKET per second`}
                            color='white'
                          />
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
                <div className='mt-3'>
                  <Row>
                    <Col>
                      {
                        baseData.ptpStakedAmount.sub(lockAmount).gt(BigNumber.from(0)) ? (
                          <Button variant='secondary' onClick={openPTPUnStakeModal} fullWidth>Unstake</Button>
                        ) : (
                          <Button variant='secondary' disabled fullWidth>Unstake</Button>
                        )
                      }
                    </Col>
                    <Col>
                      <Button fullWidth onClick={openPTPStakeModal}>Stake</Button>
                    </Col>
                  </Row>
                  <Row className='p-3'>
                    {
                      baseData.ptpStakedAmount.sub(lockAmount).gt(BigNumber.from(0)) ? (
                        <Button fullWidth onClick={openPTPLockModal}>Lock MARKET to Boost your veMARKET yield</Button>
                      ) : (
                        <Button className='mt-2' fullWidth disabled>Lock MARKET to Boost your veMARKET yield</Button>
                      )
                    }
                  </Row>
                </div>
              </div>
            ) : (
              account ? (
                <div className='mt-3'>
                  <Button fullWidth onClick={openPTPStakeModal}>Stake</Button>
                  <Button className='mt-2' fullWidth disabled>Lock MARKET to Boost your veMARKET yield</Button>
                </div>
              ) : (
                <div className='mt-3'>
                  <Button fullWidth disabled>Stake</Button>
                  <Button className='mt-2' fullWidth disabled>Lock MARKET to Boost your veMARKET yield</Button>
                </div>
              )
            )
          }
        </LightCard>
      </MaxWidthDiv>

      {/* <MaxWidthDiv>
        {
          baseData.ptpStakedAmount.gt(BigNumber.from(0)) ? (
            <LightCard className="mt-3 p-3">                            
              <Flex className='mt-2 mb-2' alignItems="center" justifyContent="center">
                <Text fontSize='30px' style={{textAlign: 'center'}}>Lock MARKET to Boost your veMARKET yield</Text>
              </Flex>

              <Button fullWidth style={{ borderRadius: '15px' }}>Lock</Button>
            </LightCard>
          ) : (
            <GreyCard className="mt-3 p-3">                            
              <Flex className='mt-5 mb-5' alignItems="center" justifyContent="center">
                <Text fontSize='30px' color='#888' style={{textAlign: 'center'}}>Stake MARKET to access MARKET Locking Boost</Text>
              </Flex>

              <Button fullWidth disabled style={{ borderRadius: '15px' }}>Lock</Button>
            </GreyCard>
          )
        }
      </MaxWidthDiv> */}
    </>
  )
}
