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

interface RelockConfirmModalProps {
  isOpen: boolean
  isLocked: boolean
  isRelock: boolean
  onRelockCheck: () => void
  onDismiss: () => void
}

export default function RelockConfirmModal({
  isOpen,
  isLocked,
  isRelock,
  onRelockCheck,
  onDismiss, 
}: RelockConfirmModalProps) {

  const handleClose = useCallback(
    () => {      
      onDismiss()
    }, [onDismiss]
  )

  return (
    <Modal isOpen={isOpen} onDismiss={handleClose} minHeight={20} maxHeight={90}>
      <div style={{ width: '100%', padding: '30px 30px' }}>
        <div style={CenterContainerStyle}>
          <Text className="mr-3" fontSize='20px'>Confirm Relock Staking</Text>
        </div>        
        <Flex justifyContent="center" className="mt-4">
          {
            // already relocked?
            isRelock ? (
              <Text>Are you sure want to disable relock staking?</Text>
            ) : (                            
              isLocked ? 
                <Text >Are you sure want to enable relock staking?</Text>:
                <Text >Are you sure want to enable lock and relock staking?</Text>
            )            
          }          
        </Flex>                
        <Row className='mt-4'>
          <Col className='pl-3 pr-1'>
            <Button variant='secondary' style={{ borderRadius: '5px' }} fullWidth onClick={handleClose}>Cancel</Button>
          </Col>
          <Col className='pl-1 pr-3'>
            <Button variant='primary' style={{ borderRadius: '5px' }} onClick={onRelockCheck} fullWidth>Confirm</Button>
          </Col>
        </Row>
      </div>
    </Modal>
  )
}
