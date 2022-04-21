import { Token } from '@pantherswap-libs/sdk'
import { Button, Text } from '@pantherswap-libs/uikit'
import { GreyCard } from 'components/Card'
import { BigNumber } from 'ethers'
import React, { useCallback } from 'react'
import { Col, Row } from 'react-bootstrap'
import { nDecimals, norValue, PoolItemBaseData } from 'utils'
import CurrencyLogo from '../CurrencyLogo'
import Modal from '../Modal'
import { QuestionColorHelper } from '../QuestionHelper'
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

interface LPUnStakeConfirmModalProps {  
  isOpen: boolean
  token: Token | undefined
  baseData: PoolItemBaseData | undefined
  onDismiss: () => void
  onApprove: (amount: BigNumber, token: Token | undefined) => void
  onUnStakeLP: (amount: BigNumber, token: Token | undefined) => void
  onRefresh: () => void
}

export default function LPUnStakeConfirmModal({
  isOpen,
  token,
  baseData,
  onDismiss,
  onApprove,
  onUnStakeLP,
  onRefresh
}: LPUnStakeConfirmModalProps) {

  const handleUnStakeLP = useCallback(    
    (e, value: BigNumber, tk: Token | undefined) => {
      if (tk !== undefined) {                
        onUnStakeLP(value, tk)
      }
    }, [onUnStakeLP]
  )

  const handleApprove = useCallback(
    (e, value: BigNumber, tk: Token | undefined) => {
      if (tk !== undefined) {        
        onApprove(value, tk)
      }
    }, [onApprove]
  )

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} minHeight={30} maxHeight={90}>
      <div style={{ width: '100%', padding: '30px 30px' }}>
        <div style={CenterContainerStyle}>
          <Text className="mr-3" fontSize='20px'>Confirm Unstake</Text>
          <CurrencyLogo currency={token} size="25px" />
          <Text className="ml-1" fontSize='20px'>{token?.symbol}</Text>
        </div>
        <Text className='mt-4' fontSize="13px" color='#888888'>{`Unstakable: ${nDecimals(2, norValue(baseData?.stakedLPAmount))} ${token?.symbol}`}</Text>
        <Row className='mt-1'>
          <Col>
            <GreyCard style={{ textAlign: 'right' }}>
              <Text>{nDecimals(6, norValue(baseData?.stakedLPAmount))}</Text>
            </GreyCard>
          </Col>
        </Row>
        <RowBetween className='mt-3'>
          <div style={CenterVerticalContainerStyle} >
            <Text fontSize="13px">Auto Claim</Text>
            <QuestionColorHelper
              text='This amount of PTP reward will be automatically claimed in this transaction'
              color='white'
            />
          </div>
          <Text fontSize="13px">{`${nDecimals(6, norValue(baseData?.rewardablePTPAmount))} PTP`}</Text>
        </RowBetween>
        <Row className='mt-4'>
          <Col className='pl-3 pr-1'>
            <Button variant='secondary' style={{ borderRadius: '5px' }} fullWidth onClick={onDismiss}>Cancel</Button>
          </Col>
          <Col className='pl-1 pr-3'>
            {              
              baseData?.stakedLPAmount !== undefined && baseData?.stakedLPAmount.gt(BigNumber.from(0)) ?
                <Button variant='primary' style={{ borderRadius: '5px' }} fullWidth onClick={(e) => handleUnStakeLP(e, baseData?.stakedLPAmount, token)}>Unstake All</Button> :
                <Button variant='primary' style={{ borderRadius: '5px' }} disabled fullWidth>Unstake All</Button>
            }
          </Col>
        </Row>
      </div>
    </Modal>
  )
}
