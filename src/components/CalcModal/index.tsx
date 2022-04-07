import { Token } from '@pantherswap-libs/sdk'
import { Button, Text } from '@pantherswap-libs/uikit'
import { BigNumber, ethers } from 'ethers'
import React, { useCallback, useEffect, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import { float2int, getUnitedValue, nDecimals, norValue, PTPStakedInfo } from 'utils'
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

interface CalcModalProps {
  isOpen: boolean
  onDismiss: () => void
}

export default function CalcModal({
  isOpen,
  onDismiss
}: CalcModalProps) {

  const [inputedValue, setInputedValue] = useState('')

  const [avaliable, setAvailable] = useState(false)

  const handleTypeInput = useCallback(
    (val: string) => {
      setInputedValue(val)
    },
    [setInputedValue]
  )

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
  

  return (
    <Modal isOpen={isOpen} onDismiss={handleClose} minHeight={30} maxHeight={90}>
      <div style={{ width: '100%', padding: '30px 30px' }}>
        <div style={CenterContainerStyle}>
          <Text className="mr-3" fontSize='20px'>Booster Calculator</Text>
        </div>
        <Row className='mt-4'>
          <Col className='pl-3 pr-1'>
            <Button variant='secondary' style={{ borderRadius: '5px' }} fullWidth onClick={handleClose}>Cancel</Button>
          </Col>          
        </Row>
      </div>
    </Modal>
  )
}
