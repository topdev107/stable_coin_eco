import React from 'react'
import styled from 'styled-components'
import { Input as NumericalInput } from '../NumericalInput'

const InputRow = styled.div`
  
  padding: 0.5rem 0.75rem 0.5rem 1rem;
`

const InputPanel = styled.div<{ hideInput?: boolean }>`
  
  
  border-radius: ${({ hideInput }) => (hideInput ? '8px' : '20px')};
  background-color: ${({ theme }) => theme.colors.background};
`

const Container = styled.div`
  border-radius: 16px;
  background-color: ${({ theme }) => theme.colors.input};
  box-shadow: ${({ theme }) => theme.shadows.inset};
`

interface PercentInputPanelProps {
  value: string,
  min: number,
  max: number,
  onUserInput: (value: string) => void,
  style: React.CSSProperties | undefined
}

export default function PercentInputPanel({
  value,
  min,
  max,
  onUserInput,
  style
}: PercentInputPanelProps) { 

  return (
    <InputPanel>
      <Container>
        <InputRow>
          <NumericalInput
            style={style}
            className="token-amount-input"
            value={value}
            onUserInput={val => {
              if (+val < min) onUserInput(min.toString())
              else if (+val > max) onUserInput(max.toString())
              else {
                onUserInput(val)
              }
            }}
          />
        </InputRow>
      </Container>
    </InputPanel>
  )
}
