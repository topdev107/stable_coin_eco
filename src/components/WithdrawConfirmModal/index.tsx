
import { Token } from '@pantherswap-libs/sdk'
import { Button, Text } from '@pantherswap-libs/uikit'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import React, { useCallback, useState } from 'react'
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

interface WithdrawConfirmModalProps {
  isOpen: boolean
  token: Token
  onDismiss: () => void
  // onApprove: (token: Token) => void
  // onDeposit: (amount: string, token: Token) => void
}


const StyleableDiv = styled.div<any>`
  width: ${({ width }) => width};
  padding: ${({ padding }) => padding};
  margin: ${({ margin }) => margin};
`

const CenterContainer = styled.div<any>`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: ${({ padding }) => padding};
`
const CenterVerticalContainer = styled.div<any>`
    height: 100%;
    display: flex;
    align-items: center;
    padding: ${({ padding }) => padding};
`

export default function WithdrawConfirmModal({
  isOpen,
  token,
  onDismiss
}: WithdrawConfirmModalProps) {

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

  

  return (
    <Modal isOpen={isOpen} onDismiss={handleClose} minHeight={50} maxHeight={90}>
      <StyleableDiv width='100%' padding='30px 30px'>
        <CenterContainer>
          <Text className="mr-3" fontSize='20px'>Confirm Withdraw</Text>
          <CurrencyLogo currency={token} size="25px" />
          <Text className="ml-1" fontSize='20px'>{token.symbol}</Text>
        </CenterContainer>  
        <RowBetween className="mt-4">
          <Text fontSize="13px" color='#888888'>Deposited: 0.0 {token.symbol}</Text>
          <Text fontSize='13px' color='#888888'>Balance: {selectedCurrencyBalance?.toSignificant(6)} {token.symbol}</Text>
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
          <CenterVerticalContainer >
            <Text fontSize="13px">Fee</Text>
            <QuestionColorHelper
              text={`A deposit fee may apply due to the pool's coverage ratio.`}
              color='white'
            />
          </CenterVerticalContainer>
          <Text fontSize="13px">0.0 {token.symbol}</Text>
        </RowBetween>
        <RowBetween className='mt-2'>
          <CenterVerticalContainer >
            <Text fontSize="13px">My Liquidity</Text>
            <QuestionColorHelper
              text='Liquidity owned by you after adding liquidity.'
              color='white'
            />            
          </CenterVerticalContainer>
          <Text fontSize="13px">0.0 {token.symbol}</Text>
        </RowBetween>
        <RowBetween>
          <CenterVerticalContainer >
            <Text fontSize="13px">Pool Share</Text>
            <QuestionColorHelper
              text='The share of the token pool you will own after adding the liquidity.'
              color='white'
            />
          </CenterVerticalContainer>
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
              <Button variant='primary' style={{borderRadius: '5px'}} fullWidth >Withdraw</Button>        
            }             
          </Col>          
        </Row>
      </StyleableDiv>
    </Modal>
  )  
}
