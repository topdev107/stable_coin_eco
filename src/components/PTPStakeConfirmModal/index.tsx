import { Token } from '@pantherswap-libs/sdk'
import { Button, Text } from '@pantherswap-libs/uikit'
import { BigNumber, ethers } from 'ethers'
import React, { useCallback, useEffect, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import { formatCurrency, nDecimals, norValue, PTPStakedInfo } from 'utils'
import { PTP } from '../../constants'
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

interface PTPStakeConfirmModalProps {
  isOpen: boolean
  token: Token | undefined
  baseData: PTPStakedInfo | undefined
  onDismiss: () => void
  onApprove: (amount: BigNumber, token: Token | undefined) => void
  onStake: (amount: BigNumber, token: Token | undefined) => void
  onRefresh: () => void
}

export default function PTPStakeConfirmModal({
  isOpen,
  token,
  baseData,
  onDismiss,
  onApprove,
  onStake,
  onRefresh
}: PTPStakeConfirmModalProps) {

  const [inputedValue, setInputedValue] = useState('')

  const [avaliable, setAvailable] = useState(false)

  const handleTypeInput = useCallback(
    (val: string) => {
      setInputedValue(val)
    },
    [setInputedValue]
  )

  const handleMaxInput = useCallback(() => {
    setInputedValue(norValue(baseData?.ptpBalanceOf).toString())
  }, [setInputedValue, baseData?.ptpBalanceOf])

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
    const max = norValue(baseData?.ptpBalanceOf)
    if (+inputedValue > 0 && +inputedValue <= max) {
      setAvailable(true)
    } else {
      setAvailable(false)
    }
    
  }, [inputedValue, baseData?.ptpBalanceOf])

  const handleStake = useCallback(
    (e, value: BigNumber, tk: Token | undefined) => {
      if (tk !== undefined) {
        onStake(value, tk)
      }
    }, [onStake]
  )

  const handleApprove = useCallback(
    (e, value: BigNumber, tk: Token | undefined) => {
      if (tk !== undefined) {
        onApprove(value, tk)
      }
    }, [onApprove]
  )

  return (
    <Modal isOpen={isOpen} onDismiss={handleClose} minHeight={30} maxHeight={90}>
      <div style={{ width: '100%', padding: '30px 30px' }}>
        <div style={CenterContainerStyle}>
          <Text className="mr-3" fontSize='20px'>Confirm Stake</Text>
          <CurrencyLogo currency={token} size="25px" />
          <Text className="ml-1" fontSize='20px'>{token?.symbol}</Text>
        </div>

        <RowBetween className="mt-4">
          <Text fontSize="13px" color='#888888'>{`Staked: ${formatCurrency(nDecimals(2, norValue(baseData?.ptpStakedAmount)), 2)} ${token?.symbol}`}</Text>
          <Text fontSize='13px' color='#888888'>Stakable: {formatCurrency(nDecimals(2, norValue(baseData?.ptpBalanceOf, PTP.decimals)), 2)} {token?.symbol}</Text>
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
        <Text fontSize="13px">Total Stake</Text>
          {
            baseData?.ptpBalanceOf !== undefined && baseData?.ptpStakedAmount !== undefined ? (
              <div style={CenterVerticalContainerStyle} >                
                <Text fontSize='13px' color='#888888'>{`${formatCurrency(nDecimals(2, norValue(baseData?.ptpBalanceOf.add(baseData.ptpStakedAmount))), 2)} ${token?.symbol}`}</Text>                              
              </div>
            ) : (
              <div style={CenterVerticalContainerStyle} >
                <Text fontSize='13px' color='#888888'>0.0</Text>                
              </div>
            )
          }
        </RowBetween>
        <RowBetween className='mt-3'>
          <Text fontSize="13px">Auto Claimable veMARKET</Text>
          <Text fontSize="13px">{`${formatCurrency(norValue(baseData?.vePTPrewardableAmount), 2)}`}</Text>
        </RowBetween>
        {/* <RowBetween className='mt-3'>
          <Text fontSize="13px">Token Price</Text>
          <Text fontSize="13px">{`$${norValue(baseData?.price, 8)}`}</Text>
        </RowBetween> */}        
        <Row className='mt-4'>
          <Col className='pl-3 pr-1'>
            <Button variant='secondary' style={{ borderRadius: '5px' }} fullWidth onClick={handleClose}>Cancel</Button>
          </Col>
          <Col className='pl-1 pr-3'>
            {/* {
              avaliable && baseData !== undefined && token !== undefined ?
                (baseData.allowancePTP.gte(BigNumber.from(float2int(getUnitedValue(inputedValue, token?.decimals).toString()))) ?
                  <Button variant='primary' style={{ borderRadius: '5px' }} fullWidth onClick={(e) => handleStake(e, BigNumber.from(float2int(getUnitedValue(inputedValue, token.decimals).toString())), token)}>Stake</Button> :
                  <Button variant='primary' style={{ borderRadius: '5px' }} fullWidth onClick={(e) => handleApprove(e, BigNumber.from(float2int(getUnitedValue(inputedValue, token.decimals).toString())), token)}>Approve</Button>) :
                <Button variant='primary' style={{ borderRadius: '5px' }} disabled fullWidth>Deposit</Button>
            } */}
            {
              avaliable && baseData !== undefined && token !== undefined && inputedValue !== '' ?
                (baseData.allowancePTP.gte(ethers.utils.parseUnits(inputedValue, token?.decimals)) ?
                  <Button variant='primary' style={{ borderRadius: '5px' }} fullWidth onClick={(e) => handleStake(e, ethers.utils.parseUnits(inputedValue, token?.decimals), token)}>Stake</Button> :
                  <Button variant='primary' style={{ borderRadius: '5px' }} fullWidth onClick={(e) => handleApprove(e, ethers.utils.parseUnits(inputedValue, token?.decimals), token)}>Approve</Button>) :
                <Button variant='primary' style={{ borderRadius: '5px' }} disabled fullWidth>Stake</Button>
            }
          </Col>
        </Row>
      </div>
    </Modal>
  )
}
