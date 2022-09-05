import { Token } from '@pantherswap-libs/sdk'
import { Button, Text, ChevronDownIcon, CloseIcon } from '@pantherswap-libs/uikit'
import { BigNumber, ethers } from 'ethers'
import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { Col, Row } from 'react-bootstrap'
import { Flex } from 'rebass'
import { darken } from 'polished'
import styled from 'styled-components'
import { formatCurrency, nDecimals, norValue, PTPStakedInfo } from 'utils'
import AutoPeriodSelectScrollModal from 'components/AutoPeriodSelectScrollModal'

import WideModal from '../WideModal'
import { RowBetween } from '../Row'
import AmountInputPanel from '../AmountInputPanel'


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
  width: 100%;

  :focus,
  :hover {    
    background-color: ${({ theme }) => darken(0.05, theme.colors.input)};
  }
`

interface PTPLockModalProps {
  isOpen: boolean
  token: Token | undefined
  baseData: PTPStakedInfo | undefined
  onDismiss: () => void
  onLock: (amount: BigNumber, deadline: number, relock: boolean) => void
  onRefresh: () => void
}

export default function PTPLockModal({
  isOpen,
  token,
  baseData,
  onDismiss,
  onLock,
  onRefresh
}: PTPLockModalProps) {

  const MAX_LOCK_PERIOD = 52

  const [inputedValue, setInputedValue] = useState('')

  const [avaliable, setAvailable] = useState(false)

  const lockPeriodTxts = useMemo(() => {
    const weeks: string[] = [];
    for (let i = 1; i <= MAX_LOCK_PERIOD; i++) {
      if (i === 1) {
        weeks.push(i.toString().concat(' week'))
      } else {
        weeks.push(i.toString().concat(' weeks'))
      }
    }

    return weeks
  }, [])

  const [lockPeriodId, setLockPeriodId] = useState<number>(MAX_LOCK_PERIOD - 1)
  const [isLockPeriodModalOpen, setIsLockPeriodModalOpen] = useState(false)
  const lockPeriodTxt = useMemo(() => {
    return lockPeriodTxts[lockPeriodId]
  }, [lockPeriodTxts, lockPeriodId])

  const lockAmount = useMemo(() => {
    return baseData?.lockedTimestamp.add(baseData?.lockedDeadline).gte(baseData?.curTimestamp) ? baseData?.lockedAmount : BigNumber.from(0)
  }, [baseData?.lockedTimestamp, baseData?.lockedDeadline, baseData?.curTimestamp, baseData?.lockedAmount])

  const unlockedAmount = useMemo(() => {
    return baseData?.ptpStakedAmount.sub(lockAmount)
  }, [baseData?.ptpStakedAmount, lockAmount])

  const lockedDeadlineId = useMemo(() => {
    return baseData !== undefined ? baseData.activeLockedDeadline.toNumber() / 300 : MAX_LOCK_PERIOD
  }, [baseData])

  const handleTypeInput = useCallback(
    (val: string) => {
      setInputedValue(val)
    },
    [setInputedValue]
  )

  const handleMaxInput = useCallback(() => {
    setInputedValue(norValue(unlockedAmount).toString())
  }, [setInputedValue, unlockedAmount])

  const handleClose = useCallback(
    () => {
      setInputedValue('')
      setLockPeriodId(MAX_LOCK_PERIOD - 1)
      onDismiss()
    }, [setInputedValue, onDismiss]
  )

  useEffect(() => {
    if (isOpen === true) {
      setInputedValue('')
    }
  }, [setInputedValue, isOpen])

  useEffect(() => {
    const max = norValue(unlockedAmount)
    if (+inputedValue > 0 && +inputedValue <= max) {
      setAvailable(true)
    } else {
      setAvailable(false)
    }

  }, [inputedValue, unlockedAmount])

  const handleLock = useCallback(
    (e, value: BigNumber, deadline: number) => {
      if (baseData !== undefined) {
        onLock(value, deadline, baseData?.relock)
      }
    }, [onLock, baseData]
  )

  const handleLockPeriodSelect = useCallback(
    (selectedId) => {
      setLockPeriodId(selectedId)
    }, [setLockPeriodId]
  )

  const handleLockPeriodDismiss = useCallback(() => {
    setIsLockPeriodModalOpen(false)
  }, [setIsLockPeriodModalOpen])

  return (
    <>
      <AutoPeriodSelectScrollModal
        isOpen={isLockPeriodModalOpen}
        title='Lock Period Select'
        items={lockPeriodTxts}
        disableMaxId={lockedDeadlineId}
        onDismiss={handleLockPeriodDismiss}
        onSelected={handleLockPeriodSelect}
      />
      <WideModal isOpen={isOpen} onDismiss={handleClose} minHeight={30} maxHeight={90}>
        <div style={{ width: '100%', padding: '30px 30px' }}>
          <Flex justifyContent='center'>
            <Text fontSize='20px' style={{ textAlign: 'center' }}>Lock MARKET to Boost your</Text>
          </Flex>
          <Flex style={{ marginTop: '-30px'}} justifyContent='end'>
            <CloseIcon onClick={handleClose} />
          </Flex>
          <Flex justifyContent='center'>
            <Text fontSize='20px' style={{ textAlign: 'center' }}>veMARKET yield</Text>
          </Flex>

          <Row className='mt-1' style={{ alignItems: 'center' }}>
            <Col className="col-4" />
            <Col>
              <RowBetween className="mt-4">
                <Text fontSize="13px" color='#888888'>Unlocked:</Text>
                <Text fontSize='13px' color='#888888'>{formatCurrency(nDecimals(2, norValue(unlockedAmount)), 2)} MARKET</Text>
              </RowBetween>
            </Col>
          </Row>
          <Row className='mt-1' style={{ alignItems: 'center' }}>
            <Col className="col-4">
              <Text>Amount to lock</Text>
            </Col>
            <Col>
              <AmountInputPanel
                value={inputedValue}
                showMaxButton
                currency={token}
                onUserInput={handleTypeInput}
                onMax={handleMaxInput}
              />
            </Col>
          </Row>
          <Row className='mt-3' style={{ alignItems: 'center' }}>
            <Col className="col-4">
              <Text>Time to lock</Text>
            </Col>
            <Col>
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
            </Col>
          </Row>

          <Row className='mt-4'>            
            <Col>              
              {
                avaliable && baseData !== undefined && token !== undefined && inputedValue !== '' ?
                  <Button variant='primary' style={{ borderRadius: '5px' }} fullWidth onClick={(e) => handleLock(e, ethers.utils.parseUnits(inputedValue, token?.decimals), (+lockPeriodId+1)*300)}>Lock</Button> :
                  <Button variant='primary' style={{ borderRadius: '5px' }} disabled fullWidth>Lock</Button>
              }
            </Col>
          </Row>
        </div>
      </WideModal>
    </>
  )
}
