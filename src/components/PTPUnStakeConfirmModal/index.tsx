import { Token } from '@pantherswap-libs/sdk'
import { Button, Text } from '@pantherswap-libs/uikit'
import { BigNumber, ethers } from 'ethers'
import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { Col, Row } from 'react-bootstrap'
import { Flex } from 'rebass'
import { float2int, formatCurrency, getUnitedValue, nDecimals, norValue, PTPStakedInfo } from 'utils'
import AmountInputPanel from '../AmountInputPanel'
import CurrencyLogo from '../CurrencyLogo'
import Modal from '../Modal'
import { RowBetween } from '../Row'

const CenterContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}

const CenterVerticalContainerStyle = {
  height: '100%',
  display: 'flex',
  alignItems: 'center'
}

interface PTPUnStakeConfirmModalProps {
  isOpen: boolean
  token: Token | undefined
  baseData: PTPStakedInfo | undefined
  onDismiss: () => void
  onUnStake: (amount: BigNumber, token: Token | undefined) => void
  onRefresh: () => void
}

export default function PTPUnStakeConfirmModal({
  isOpen,
  token,
  baseData,
  onDismiss,
  onUnStake,
  onRefresh
}: PTPUnStakeConfirmModalProps) {

  const [inputedValue, setInputedValue] = useState('')

  const [avaliable, setAvailable] = useState(false)

  const lockAmount = useMemo(() => {
    return baseData?.lockedTimestamp.add(baseData?.lockedDeadline).gte(baseData?.curTimestamp) ? baseData?.lockedAmount : BigNumber.from(0)
  }, [baseData])

  const unstakableMaxAmount = useMemo(() => {
    return baseData?.ptpStakedAmount.sub(lockAmount)
  }, [baseData, lockAmount])

  const handleTypeInput = useCallback(
    (val: string) => {
      setInputedValue(val)
    },
    [setInputedValue]
  )

  const handleMaxInput = useCallback(() => {
    setInputedValue(norValue(unstakableMaxAmount).toString())
  }, [setInputedValue, unstakableMaxAmount])

  const handleClose = useCallback(
    () => {
      setInputedValue('')
      onDismiss()
    }, [setInputedValue, onDismiss]
  )

  useEffect(() => {
    if (isOpen === true) {
      setInputedValue('')
    }
  }, [setInputedValue, isOpen])

  useEffect(() => {
    const max = norValue(unstakableMaxAmount)
    if (+inputedValue > 0 && +inputedValue <= max) {
      setAvailable(true)
    } else {
      setAvailable(false)
    }

  }, [inputedValue, unstakableMaxAmount])

  const handleStake = useCallback(
    (e, value: BigNumber, tk: Token | undefined) => {
      if (tk !== undefined) {
        onUnStake(value, tk)
      }
    }, [onUnStake]
  )

  return (
    <Modal isOpen={isOpen} onDismiss={handleClose} minHeight={30} maxHeight={90}>
      <div style={{ width: '100%', padding: '30px 30px' }}>
        <div style={CenterContainerStyle}>
          <Text className="mr-3" fontSize='20px'>Confirm Unstake</Text>
          <CurrencyLogo currency={token} size="25px" />
          <Text className="ml-1" fontSize='20px'>{token?.symbol}</Text>
        </div>

        <Flex justifyContent="center" className='mt-2'>
          <Text style={{ color: 'red' }}>Warning</Text>
        </Flex>
        <Flex justifyContent="center">
          <Text style={{ color: 'red', fontSize: '13px', textAlign: 'center' }}>You will lose all of your accumulated veMARKET {`(${formatCurrency(norValue(baseData?.vePTPBalanceOf), 2)})`} and pending veMARKET {`(${formatCurrency(norValue(baseData?.vePTPrewardableAmount), 2)})`} after unstaking MARKET</Text>
        </Flex>
        <RowBetween className="mt-4">
          <Text fontSize="13px" color='#888888'>{`UnStakable: ${formatCurrency(nDecimals(2, norValue(unstakableMaxAmount)), 2)} ${token?.symbol}`}</Text>
        </RowBetween>
        <Row className='mt-1'>
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
        <RowBetween className="mt-3">
          <Text fontSize="13px">My Remaining Stake</Text>
          {
            baseData?.ptpStakedAmount !== undefined ? (
              <div style={CenterVerticalContainerStyle} >
                {
                  inputedValue !== '' ?
                    <Text fontSize='13px' color='#888888'>{`${formatCurrency(nDecimals(2, norValue(baseData?.ptpStakedAmount.sub(ethers.utils.parseUnits(inputedValue, token?.decimals)))), 2)} ${token?.symbol}`}</Text> :
                    <Text fontSize='13px' color='#888888'>{`${formatCurrency(nDecimals(2, norValue(baseData.ptpStakedAmount)), 2)}`}</Text>
                }
              </div>
            ) : (
              <div style={CenterVerticalContainerStyle} >
                <Text fontSize='13px' color='#888888'>0.0</Text>
              </div>
            )
          }
        </RowBetween>
        {/* <RowBetween className='mt-3'>
          <Text fontSize="13px">Auto Claimable veMARKET</Text>
          <Text fontSize="13px">{`${formatCurrency(norValue(baseData?.vePTPrewardableAmount), 2)}`}</Text>
        </RowBetween> */}
        <Row className='mt-4'>
          <Col className='pl-3 pr-1'>
            <Button variant='secondary' style={{ borderRadius: '5px' }} fullWidth onClick={handleClose}>Cancel</Button>
          </Col>
          <Col className='pl-1 pr-3'>
            {
              avaliable && baseData !== undefined && token !== undefined && inputedValue !== '' ?
                <Button variant='primary' style={{ borderRadius: '5px' }} fullWidth onClick={(e) => handleStake(e, ethers.utils.parseUnits(inputedValue, token?.decimals), token)}>Unstake</Button> :
                <Button variant='primary' style={{ borderRadius: '5px' }} disabled fullWidth>Unstake</Button>
            }
          </Col>
        </Row>
      </div>
    </Modal>
  )
}
