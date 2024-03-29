import { CloseIcon, Text } from '@pantherswap-libs/uikit'
import Row, { RowBetween } from 'components/Row'
import React, { useCallback } from 'react'
import { darken } from 'polished'
import styled from 'styled-components'
import Modal from '../Modal'

interface AutoPeriodSelectModalProps {
  isOpen: boolean
  title: string
  items: string[]
  onDismiss: () => void
  onSelected: (idx: number) => void
}

export default function AutoPeriodSelectModal({
  isOpen,
  title,
  items,
  onDismiss,
  onSelected
}: AutoPeriodSelectModalProps) {

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
    <Modal isOpen={isOpen} onDismiss={onDismiss} maxHeight={120} minHeight={30}>
      <div style={{ width: '100%', padding: '30px 30px' }}>
        <RowBetween>
          <Text fontSize='20px'>{title}</Text>
          <CloseIcon onClick={onDismiss} />
        </RowBetween>
        {
          Object.values(items).map((item, index) => {
            return (
              <PeriodItem className='mt-3' onClick={(e) => handleSelected(e, index)}>
                <div>
                  <Text>{item}</Text>
                </div>
              </PeriodItem>
            )
          })
        }        
      </div>
    </Modal>
  )
}
