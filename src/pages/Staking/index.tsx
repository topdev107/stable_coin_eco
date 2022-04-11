import React, { useEffect, useState, useCallback } from 'react'
import CardNav from 'components/CardNav'
import { Button, ChevronDownIcon, CloseIcon, Progress, Text } from '@pantherswap-libs/uikit'
import styled from 'styled-components'
import { DarkblueOutlineCard, LightCard, GreyCard, YellowCard, PinkCard } from 'components/Card'
import { Col, ProgressBar, Row } from 'react-bootstrap'
import Question, { QuestionColorHelper } from 'components/QuestionHelper'
import { useActiveWeb3React } from 'hooks'
import { PTPStakedInfo, getMasterPlatypusContract,getAssetContract, getVePTPContract, getPTPContract, norValue, nDecimals } from 'utils'
import { BigNumber } from 'ethers'
import { RowBetween } from 'components/Row'
import PTPStakeModal from 'components/PTPStakeConfirmModal'
import PTPUnStakeModal from 'components/PTPUnStakeConfirmModal'
import VePTPClaimModal from 'components/VePTPClaimConfirmModal'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import CalcModal from 'components/CalcModal'
import { MASTER_PLATYPUS_ADDRESS, PTP, VEPTP } from '../../constants'
import PTP_logo from '../../assets/PTP_logo.png'
import PTP_logo_blank from '../../assets/PTP_logo_blank.png'
import PTP_logo_disabled from '../../assets/PTP_logo_disabled.png'
import vePTP_logo from '../../assets/vePTP_logo.png'

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
    'vePTPrewardableAmount': BigNumber.from(0),
    'vePTPBalanceOf': BigNumber.from(0),
    'veTotalSupply': BigNumber.from(0),
    'calcVePTPAmount': BigNumber.from(0),
    'allowancePTP': BigNumber.from(0),
    'ptpBalanceOf': BigNumber.from(0)
  }

  const [baseData, setBaseData] = useState<PTPStakedInfo>(initialBaseData)
  const [isNeedRefresh, setIsNeedRefresh] = useState<boolean>(true)
  const [isPTPStakeModalOpen, setIsPTPStakeModalOpen] = useState<boolean>(false);
  const [isPTPUnStakeModalOpen, setIsPTPUnStakeModalOpen] = useState<boolean>(false);
  const [isVePTPClaimModalOpen, setIsVePTPClaimModalOpen] = useState<boolean>(false);
  const [isCalcModalOpen, setIsCalcModalOpen] = useState<boolean>(false);

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
            setErrMessage(e.message)
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

  const handleStakePTP = useCallback(
    async (amount: BigNumber) => {
      if (!chainId || !library || !account) return
      setShowConfirm(true)
      setAttemptingTxn(true)
      setIsPTPStakeModalOpen(false)
      const masterPlatypusContract = getMasterPlatypusContract(chainId, library, account)
      let tnx_hash = ''

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
            setErrMessage(e.message)
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
            setErrMessage(e.message)
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
            setErrMessage(e.message)
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
        masterPlatypusContract.calcVePTPReward(baseData.ptpStakedAmount, 3600), // 3600s
        ptpContract.allowance(account, MASTER_PLATYPUS_ADDRESS),
        ptpContract.balanceOf(account),
        
      ]).then(response => {
        const ptpAmount = BigNumber.from(response[0].ptpAmount._hex)
        const rewardAmount = BigNumber.from(response[0].rewardAmount._hex)
        const vePTPBalanceOf = BigNumber.from(response[1]._hex)
        const veTotalSupply = BigNumber.from(response[2]._hex)
        const calcVePTPAmount = BigNumber.from(response[3]._hex)
        const allowancePTP = BigNumber.from(response[4]._hex)
        const ptpBalanceOf = BigNumber.from(response[5]._hex)

        const bData: PTPStakedInfo = {
          'ptpStakedAmount': ptpAmount,
          'vePTPrewardableAmount': rewardAmount,
          'vePTPBalanceOf': vePTPBalanceOf,
          'veTotalSupply': veTotalSupply,
          'calcVePTPAmount': calcVePTPAmount,
          'allowancePTP': allowancePTP,
          'ptpBalanceOf': ptpBalanceOf
        }
        return bData
      }).catch((e) => {
        console.error(e)
        const bData: PTPStakedInfo = {
          'ptpStakedAmount': BigNumber.from(0),
          'vePTPrewardableAmount': BigNumber.from(0),
          'vePTPBalanceOf': BigNumber.from(0),
          'veTotalSupply': BigNumber.from(0),
          'calcVePTPAmount': BigNumber.from(0),
          'allowancePTP': BigNumber.from(0),
          'ptpBalanceOf': BigNumber.from(0)
        }
        return bData
      })

      if (!(baseData.ptpStakedAmount.eq(baseDatas.ptpStakedAmount)) ||
        !(baseData.vePTPrewardableAmount.eq(baseDatas.vePTPrewardableAmount)) ||
        !(baseData.vePTPBalanceOf.eq(baseDatas.vePTPBalanceOf)) ||
        !(baseData.veTotalSupply.eq(baseDatas.veTotalSupply)) ||
        !(baseData.calcVePTPAmount.eq(baseDatas.calcVePTPAmount)) ||
        !(baseData.allowancePTP.eq(baseDatas.allowancePTP)) ||
        !(baseData.ptpBalanceOf.eq(baseDatas.ptpBalanceOf))
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

      <CardNav activeIndex={2} />
      <MaxWidthDiv>
        <LightCard className="mt-2 p-3">
          <div className='mt-3' style={{ display: 'flex', justifyContent: 'center' }}>
            <Text fontSize='30px'>Stake PTP to Boost Yield</Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }} className='mt-4'>
            {
              account ? (
                <img src={PTP_logo} alt='logo' style={{ width: '120px', height: '120px' }} />
              ) : (
                <img src={PTP_logo_disabled} alt='logo' style={{ width: '120px', height: '120px' }} />
              )
            }
          </div>
          {
            baseData.ptpStakedAmount.gt(BigNumber.from(0)) ? (
              <div className="mt-4">
                <YellowCard>
                  <RowBetween>
                    <Text>My balance</Text>
                    <Text color='#ff720d'>{`${nDecimals(2, norValue(baseData.vePTPBalanceOf))} vePTP`}</Text>
                  </RowBetween>
                  <div className='mt-3'>
                    <Progress primaryStep={norValue(baseData.vePTPBalanceOf) / norValue(baseData.ptpStakedAmount)} />
                  </div>
                  <RowBetween className='mt-3'>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <Text color='#888' fontSize='14px'>{`Total vePTP supply: ${norValue(baseData.veTotalSupply) / (10 ** 6)}M`}</Text>
                      <QuestionColorHelper
                        text='Total vePTP balance of all users'
                        color='white'
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                      <Text color='#888' fontSize='14px'>{`Max vePTP to Earn: ${norValue(baseData.ptpStakedAmount) * 100}`}</Text>
                      <QuestionColorHelper
                        text='Max vePTP you can earn is 100 times of your staked PTP'
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
                      <img src={PTP_logo_blank} alt='logo' style={{ width: '40px', height: '40px' }} />
                      <div className='ml-2'>
                        <Text color='#888'>0.00</Text>
                        <Text color='#888'>Staked PTP</Text>
                      </div>
                    </div>
                  </Col>
                  <Col style={{ display: 'flex', justifyContent: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Text color='#888'>0 vePTP/hour</Text>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <Text color='#888'>vePTP Mine Rate</Text>
                        <QuestionColorHelper
                          text='Each staked PTP generates 0.0 vePTP per second'
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
                            <Text color='#888'>vePTP Mined</Text>
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
                <img src={PTP_logo} alt='logo' style={{ width: '25px', height: '25px' }} />
                <Text className='ml-1'>vePTP boosts PTP APR (</Text>
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
                          <Text>Claimable vePTP</Text>
                          <QuestionColorHelper
                            text='Each staked PTP generates 0.0 vePTP per second'
                            color='white'
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <Text color='#ff720d' fontSize='25px'>{nDecimals(2, norValue(baseData.vePTPrewardableAmount))}</Text>
                      </div>
                    </Col>
                    <Col>
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Button variant='success' size='sm' onClick={openVePTPClaimModal}>Claim vePTP</Button>
                      </div>
                    </Col>
                  </Row>
                </div>
                <div className='mt-3' style={{ width: '100%', height: '1px', backgroundColor: '#ff720d' }} />
                <div className="mt-4">
                  <Row>
                    <Col style={{ display: 'flex', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                        <img src={PTP_logo_blank} alt='logo' style={{ width: '40px', height: '40px' }} />
                        <div className='ml-2'>
                          <Text>{nDecimals(2, norValue(baseData.ptpStakedAmount))}</Text>
                          <Text color='#888'>Staked PTP</Text>
                        </div>
                      </div>
                    </Col>
                    <Col style={{ display: 'flex', justifyContent: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <Text>{`${nDecimals(2, norValue(baseData.calcVePTPAmount))} vePTP/hour`}</Text>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                          <Text color='#888'>vePTP Mine Rate</Text>
                          <QuestionColorHelper
                            text='Each staked PTP generates 0.0 vePTP per second'
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
                      <Button variant='secondary' onClick={openPTPUnStakeModal} fullWidth>Unstake</Button>
                    </Col>
                    <Col>
                      <Button fullWidth onClick={openPTPStakeModal}>Stake</Button>
                    </Col>
                  </Row>
                </div>
              </div>
            ) : (
              account ? (
                <div className='mt-3'>
                  <Button fullWidth onClick={openPTPStakeModal}>Stake</Button>
                </div>
              ) : (
                <div className='mt-3'>
                  <Button fullWidth disabled>Stake</Button>
                </div>
              )
            )
          }
        </LightCard>
      </MaxWidthDiv>
    </>
  )
}
