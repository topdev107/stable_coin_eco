import { Currency, Pair } from '@pantherswap-libs/sdk'
import { Button } from '@pantherswap-libs/uikit'
import React from 'react'
import styled from 'styled-components'
import { useActiveWeb3React } from '../../hooks'
import { Input as NumericalInput } from '../NumericalInput'

const InputRow = styled.div<{ selected: boolean }>`
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  padding: ${({ selected }) => (selected ? '0.75rem 0.5rem 0.75rem 1rem' : '0.75rem 0.75rem 0.75rem 1rem')};
`


const InputPanel = styled.div<{ hideInput?: boolean }>`
  display: flex;
  flex-flow: column nowrap;
  position: relative;
  border-radius: ${({ hideInput }) => (hideInput ? '8px' : '20px')};
  background-color: ${({ theme }) => theme.colors.background};
  z-index: 1;
`

const Container = styled.div<{ hideInput: boolean }>`
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.input};
  box-shadow: ${({ theme }) => theme.shadows.inset};
`

interface AmountInputPanelProps {
  value: string
  onUserInput: (value: string) => void
  onMax?: () => void
  showMaxButton: boolean
  currency?: Currency | null
  disableCurrencySelect?: boolean
  hideBalance?: boolean
  pair?: Pair | null
  hideInput?: boolean
  showCommonBases?: boolean
}

export default function AmountInputPanel({
  value,
  onUserInput,
  onMax,
  showMaxButton,
  currency,
  disableCurrencySelect = false,
  hideBalance = false,
  pair = null, // used for double token logo
  hideInput = false,
  showCommonBases
}: AmountInputPanelProps) {
  const { account } = useActiveWeb3React()

  return (
    <InputPanel>
      <Container hideInput={hideInput}>        
        <InputRow style={hideInput ? { padding: '0', borderRadius: '8px' } : {}} selected={disableCurrencySelect}>
          {!hideInput && (
            <>
              <NumericalInput
                className="token-amount-input"
                value={value}
                onUserInput={val => {
                  onUserInput(val)
                }}
              />
              {account && currency && showMaxButton && (
                <Button onClick={onMax} size="sm" variant="text">
                  MAX
                </Button>
              )}
            </>
          )}          
        </InputRow>
      </Container>      
    </InputPanel>
  )
}
