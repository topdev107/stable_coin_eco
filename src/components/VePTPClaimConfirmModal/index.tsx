import { Token } from '@pantherswap-libs/sdk'
import { Button, Text } from '@pantherswap-libs/uikit'
import { GreyCard } from 'components/Card'
import { BigNumber } from 'ethers'
import React, { useCallback } from 'react'
import { Col, Row } from 'react-bootstrap'
import { formatCurrency, nDecimals, norValue, PoolItemBaseData, PTPStakedInfo } from 'utils'
import { VEPTP } from '../../constants'
import CurrencyLogo from '../CurrencyLogo'
import Modal from '../Modal'


const CenterContainerStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}

interface VePTPClaimConfirmModalProps {
  isOpen: boolean 
  token: Token | undefined
  baseData: PTPStakedInfo | undefined
  onDismiss: () => void
  onClaimVePTP: (token: Token | undefined) => void
  onRefresh: () => void
}

export default function VePTPClaimConfirmModal({
  isOpen,
  token,
  baseData,
  onDismiss,
  onClaimVePTP,
  onRefresh
}: VePTPClaimConfirmModalProps) {

  const handleClaimVePTP = useCallback(
    (e, tk: Token | undefined) => {
      if (tk !== undefined) {
        onClaimVePTP(tk)
      }
    }, [onClaimVePTP]
  )

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} minHeight={30} maxHeight={90}>
      <div style={{ width: '100%', padding: '30px 30px' }}>
        <div style={CenterContainerStyle}>
          <Text className="mr-3" fontSize='20px'>Confirm Claim</Text>
          <CurrencyLogo currency={VEPTP} size="25px" />
          <Text className="ml-1" fontSize='20px'>{VEPTP.symbol}</Text>
        </div>
        <Text fontSize="13px" className='mt-4' color='#888888'>{`Claimable: ${formatCurrency(nDecimals(2, norValue(baseData?.vePTPrewardableAmount)), 2)} vePTP`}</Text>
        <Row className='mt-1'>
          <Col>
            <GreyCard style={{ textAlign: 'right' }}>
              <Text>{nDecimals(6, norValue(baseData?.vePTPrewardableAmount))}</Text>
            </GreyCard>
          </Col>
        </Row>
        <Row className='mt-4'>
          <Col className='pl-3 pr-1'>
            <Button variant='secondary' style={{ borderRadius: '5px' }} fullWidth onClick={onDismiss}>Cancel</Button>
          </Col>
          <Col className='pl-1 pr-3'>
            {
              baseData?.vePTPrewardableAmount !== undefined && baseData?.vePTPrewardableAmount.gt(BigNumber.from(0)) ?
              <Button variant='primary' style={{ borderRadius: '5px' }} fullWidth onClick={(e) => handleClaimVePTP(e, token)}>Claim</Button> :
              <Button variant='primary' style={{ borderRadius: '5px' }} disabled fullWidth>Claim</Button>             
            }
          </Col>
        </Row>
      </div>
    </Modal>
  )
}
