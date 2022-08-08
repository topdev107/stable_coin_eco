import { CloseIcon, Text } from '@pantherswap-libs/uikit'
import Row, { RowBetween } from 'components/Row'
import React, { useCallback } from 'react'
import { darken } from 'polished'
import styled from 'styled-components'
import Modal from '../Modal'

interface AutoPeriodSelectScrollModalProps {
  isOpen: boolean
  title: string
  items: string[]
  disableMaxId: number
  onDismiss: () => void
  onSelected: (idx: number) => void
}

export default function AutoPeriodSelectScrollModal({
  isOpen,
  title,
  items,
  disableMaxId,
  onDismiss,
  onSelected
}: AutoPeriodSelectScrollModalProps) {

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

  const PeriodDisabledItem = styled.div`
  display: flex;
  align-items: center;
  height: 34px;
  font-size: 16px;
  font-weight: 500;
  background-color: transparent;
  color: #888888;
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
        <div style={{ height: '470px', overflowY: 'scroll' }}>
          {
            Object.values(items).map((item, index) => {
              return (
                index >= disableMaxId-1 ? (
                  <PeriodItem className='mt-3' onClick={(e) => handleSelected(e, index)}>
                    <div>
                      <Text>{item}</Text>
                    </div>
                  </PeriodItem>
                ) : (
                  <PeriodDisabledItem className='mt-3'>
                    <div>
                      <Text style={{color: '#888888'}}>{item}</Text>
                    </div>
                  </PeriodDisabledItem>
                )
              )
            })
          }
        </div>
      </div>
    </Modal>
  )
}
