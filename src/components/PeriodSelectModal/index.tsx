import { CloseIcon, Text } from '@pantherswap-libs/uikit'
import Row, { RowBetween } from 'components/Row'
import React, { useCallback } from 'react'
import { darken } from 'polished'
import styled from 'styled-components'
import Modal from '../Modal'


interface PeriodSelectModalProps {
  isOpen: boolean
  onDismiss: () => void
  onSelected: (idx: number) => void
}

export default function PeriodSelectModal({
  isOpen,
  onDismiss,
  onSelected
}: PeriodSelectModalProps) {

  const PeriodItem = styled.div`
  display: flex;
  align-items: center;
  height: 34px;
  font-size: 16px;
  font-weight: 500;
  background-color: transparent;
  color: #FFFFFF;
  cursor: pointer;
  width: 100%;

  :focus,
  :hover {    
    background-color: ${({ theme }) => darken(0.05, theme.colors.input)};
  }
`

  const handleSelected = useCallback(
    (e, selectedId: number) => {
      onSelected(selectedId)
      onDismiss()
    }, [onSelected, onDismiss]
  )

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={90} minHeight={30}>
      <div style={{ width: '100%', padding: '30px 30px' }}>
        <RowBetween>
          <Text fontSize='20px'>Staking Period</Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>

        <PeriodItem className='mt-3' onClick={(e) => handleSelected(e, 0)}>
          <div>
            <Text>2 months</Text>
          </div>
        </PeriodItem>

        <PeriodItem className='mt-3' onClick={(e) => handleSelected(e, 1)}>
          <Text>5 months</Text>
        </PeriodItem>

        <PeriodItem className='mt-3' onClick={(e) => handleSelected(e, 2)}>
          <Text>8 months</Text>
        </PeriodItem>

        <PeriodItem className='mt-3' onClick={(e) => handleSelected(e, 3)}>
          <Text>10 months (max vePTP cap reached)</Text>
        </PeriodItem>
      </div>
    </Modal>
  )
}
