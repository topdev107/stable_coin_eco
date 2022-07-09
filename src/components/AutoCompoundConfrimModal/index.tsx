import { Button, Text } from '@pantherswap-libs/uikit'
import React, { useCallback } from 'react'
import { Col, Row } from 'react-bootstrap'
import { Flex } from 'rebass'
import Modal from '../Modal'

const CenterContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}

interface AutoCompoundConfirmModalProps {
  isOpen: boolean
  isAutoCompound: boolean
  isUpdateEnableDisablePeriod: boolean
  onSetAutoCompound: () => void
  onDismiss: () => void
}

export default function AutoCompoundConfirmModal({
  isOpen,
  isAutoCompound,
  isUpdateEnableDisablePeriod,
  onSetAutoCompound,
  onDismiss
}: AutoCompoundConfirmModalProps) {

  const handleClose = useCallback(
    () => {      
      onDismiss()
    }, [onDismiss]
  )

  return (
    <Modal isOpen={isOpen} onDismiss={handleClose} minHeight={20} maxHeight={90}>
      <div style={{ width: '100%', padding: '30px 30px' }}>
        <div style={CenterContainerStyle}>
          <Text className="mr-3" fontSize='20px'>Confirm Auto Compound</Text>
        </div>        
        <Flex justifyContent="center" className="mt-4">
          {
            isUpdateEnableDisablePeriod ? (
              isAutoCompound ? 
                <Text style={{textAlign: 'center'}}>Are you sure want to disable auto compound?</Text>:
                <Text style={{textAlign: 'center'}}>Are you sure want to enable auto compound?</Text>
            ) : (              
              <Text style={{textAlign: 'center'}}>Are you sure want to change period of auto compound?</Text>
            )            
          }          
        </Flex>                
        <Row className='mt-4'>
          <Col className='pl-3 pr-1'>
            <Button variant='secondary' style={{ borderRadius: '5px' }} fullWidth onClick={handleClose}>Cancel</Button>
          </Col>
          <Col className='pl-1 pr-3'>
            <Button variant='primary' style={{ borderRadius: '5px' }} onClick={onSetAutoCompound} fullWidth>Confirm</Button>
          </Col>
        </Row>
      </div>
    </Modal>
  )
}
