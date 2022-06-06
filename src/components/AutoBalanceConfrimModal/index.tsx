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

interface AutoBalanceConfirmModalProps {
  isOpen: boolean
  isAutoBalance: boolean
  isUpdateEnableDisablePeriod: boolean
  period: number
  pendingPeriod: number
  onSetAutoBalance: () => void
  onDismiss: () => void
  onRefresh: () => void
}

export default function AutoBalanceConfirmModal({
  isOpen,
  isAutoBalance,
  isUpdateEnableDisablePeriod,
  period,
  pendingPeriod,
  onSetAutoBalance,
  onDismiss, 
  onRefresh
}: AutoBalanceConfirmModalProps) {

  const handleClose = useCallback(
    () => {      
      onDismiss()
    }, [onDismiss]
  )

  return (
    <Modal isOpen={isOpen} onDismiss={handleClose} minHeight={20} maxHeight={90}>
      <div style={{ width: '100%', padding: '30px 30px' }}>
        <div style={CenterContainerStyle}>
          <Text className="mr-3" fontSize='20px'>Confirm Auto Balance</Text>
        </div>        
        <Flex justifyContent="center" className="mt-4">
          {
            isUpdateEnableDisablePeriod ? (
              isAutoBalance ? 
                <Text >Are you sure want to disable auto balance?</Text>:
                <Text >Are you sure want to enable auto balance?</Text>
            ) : (              
              <Text>Are you sure want to change period of auto balancing?</Text>
            )            
          }          
        </Flex>                
        <Row className='mt-4'>
          <Col className='pl-3 pr-1'>
            <Button variant='secondary' style={{ borderRadius: '5px' }} fullWidth onClick={handleClose}>Cancel</Button>
          </Col>
          <Col className='pl-1 pr-3'>
            <Button variant='primary' style={{ borderRadius: '5px' }} onClick={onSetAutoBalance} fullWidth>Confirm</Button>
          </Col>
        </Row>
      </div>
    </Modal>
  )
}
