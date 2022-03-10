
import { Token } from '@pantherswap-libs/sdk'
import { Button, Text } from '@pantherswap-libs/uikit'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import React, { useCallback, useEffect, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import { Field } from 'state/swap/actions'
import { tryParseAmount, useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import styled from 'styled-components'
import { POOL_ADDRESS } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import AmountInputPanel from '../AmountInputPanel'
import CurrencyLogo from '../CurrencyLogo'
import Modal from '../Modal'
import { QuestionColorHelper } from '../QuestionHelper'
import { RowBetween } from '../Row'

interface DepositConfirmModalProps {
  isOpen: boolean
  token: Token | undefined
  onDismiss: () => void
  // onApprove: (token: Token) => void
  onDeposit: (amount: string, token: Token | undefined) => void
}

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

export default function DepositConfirmModal({
  isOpen,
  token,
  onDismiss,
  onDeposit
}: DepositConfirmModalProps) {

  const [inputedValue, setInputedValue] = useState('')

  const [approvalA, approveACallback] = useApproveCallback(tryParseAmount(inputedValue, token), POOL_ADDRESS)

  const { account } = useActiveWeb3React()
  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, token ?? undefined)

  const handleTypeInput = useCallback(
    (val: string) => {
      setInputedValue(val)
    },
    [setInputedValue]
  )


  const handleMaxInput = useCallback(() => {
    if (selectedCurrencyBalance) {
      setInputedValue(selectedCurrencyBalance.toExact())
    }
  }, [selectedCurrencyBalance, setInputedValue])
  
  const handleClose = useCallback (
    () => {
      setInputedValue('')
      onDismiss()
    }, [setInputedValue, onDismiss]
  )

  const handleDeposit = useCallback (
    (e, value: string, tk: Token | undefined) => {
      if (tk !== undefined) {
        const amount = (+value)*10**(tk?.decimals)
        onDeposit(amount.toString(), tk)
      }
    }, [onDeposit]
  )

  return (
    <Modal isOpen={isOpen} onDismiss={handleClose} minHeight={50} maxHeight={90}>      
      <div style={{width: '100%', padding: '30px 30px'}}>

        <div style={CenterContainerStyle}>
          <Text className="mr-3" fontSize='20px'>Confirm Deposit</Text>
          <CurrencyLogo currency={token} size="25px" />
          <Text className="ml-1" fontSize='20px'>{token?.symbol}</Text>
        </div>

        <RowBetween className="mt-4">
          <Text fontSize="13px" color='#888888'>Deposited: 0.0 {token?.symbol}</Text>
          <Text fontSize='13px' color='#888888'>Balance: {selectedCurrencyBalance?.toSignificant(6)} {token?.symbol}</Text>
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
        <RowBetween className='mt-3'>
          <Text fontSize="13px">Token Price</Text>
          <Text fontSize="13px">$1.001</Text>
        </RowBetween>
        <RowBetween>
          <div style={CenterVerticalContainerStyle} >
            <Text fontSize="13px">Fee</Text>
            <QuestionColorHelper
              text={`A deposit fee may apply due to the pool's coverage ratio.`}
              color='white'
            />
          </div>
          <Text fontSize="13px">0.0 {token?.symbol}</Text>
        </RowBetween>
        <RowBetween className='mt-2'>
          <div style={CenterVerticalContainerStyle} >
            <Text fontSize="13px">My Liquidity</Text>
            <QuestionColorHelper
              text='Liquidity owned by you after adding liquidity.'
              color='white'
            />            
          </div>
          <Text fontSize="13px">0.0 {token?.symbol}</Text>
        </RowBetween>
        <RowBetween>
          <div style={CenterVerticalContainerStyle} > 
            <Text fontSize="13px">Pool Share</Text>
            <QuestionColorHelper
              text='The share of the token pool you will own after adding the liquidity.'
              color='white'
            />
          </div>
          <Text fontSize="13px">0.0%</Text>
        </RowBetween>
        <Row className='mt-4'>
          <Col className='pl-3 pr-1'>
            <Button variant='secondary' style={{borderRadius: '5px'}} fullWidth onClick={handleClose}>Cancel</Button>
          </Col>          
          <Col className='pl-1 pr-3'>
            {
              (approvalA === ApprovalState.UNKNOWN || approvalA === ApprovalState.PENDING || approvalA === ApprovalState.NOT_APPROVED) ?
              <Button variant='primary' style={{borderRadius: '5px'}} fullWidth onClick={approveACallback}>Approve</Button> : 
              <Button variant='primary' style={{borderRadius: '5px'}} fullWidth onClick={(e) => handleDeposit(e, inputedValue, token)}>Deposit</Button>        
            }             
          </Col>          
        </Row>
      </div>
    </Modal>
  )  
}
