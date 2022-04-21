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

// interface LPStakeConfirmModalProps {
//   isOpen: boolean
//   token: Token | undefined
//   baseData: PoolItemBaseData | undefined
//   onDismiss: () => void
//   onApprove: (amount: string, token: Token | undefined) => void
//   onStakeLP: (amount: string, token: Token | undefined) => void
//   onRefresh: () => void
// }


interface LPStakeConfirmModalProps {
  isOpen: boolean
  token: Token | undefined
  baseData: PoolItemBaseData | undefined
  onDismiss: () => void
  onApprove: (amount: BigNumber, token: Token | undefined) => void
  onStakeLP: (amount: BigNumber, token: Token | undefined) => void
  onRefresh: () => void
}

export default function LPStakeConfirmModal({
  isOpen,
  token,
  baseData,
  onDismiss,
  onApprove,
  onStakeLP,
  onRefresh
}: LPStakeConfirmModalProps) {

  const handleStakeLP = useCallback(    
    (e, value: BigNumber, tk: Token | undefined) => {
      if (tk !== undefined) {      
        onStakeLP(value, tk)
      }
    }, [onStakeLP]
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
          <Text className="mr-3" fontSize='20px'>Confirm Stake</Text>
          <CurrencyLogo currency={token} size="25px" />
          <Text className="ml-1" fontSize='20px'>{token?.symbol}</Text>
        </div>
        <RowBetween className="mt-4">
          <div style={CenterVerticalContainerStyle} >
            <Text fontSize="13px" color='#888888'>{`Staked: ${nDecimals(2, norValue(baseData?.stakedLPAmount))} ${token?.symbol}`}</Text>
            <QuestionColorHelper
              text={`Amount of your deposited ${token?.symbol} (as LP token) which is currently staked and generating PTP`}
              color='white'
            />
          </div>
          {
            baseData?.balanceOf !== undefined && baseData?.stakedLPAmount !== undefined ? (
              <div style={CenterVerticalContainerStyle} >
                <Text fontSize='13px' color='#888888'>{`Stakable: ${nDecimals(2, norValue(baseData?.balanceOf))} ${token?.symbol}`}</Text>
                <QuestionColorHelper
                  text={`Amount of your deposited ${token?.symbol} (as LP token) which can be staked to generate yield in PTP`}
                  color='white'
                />
              </div>
            ) : (
              <div style={CenterVerticalContainerStyle} >
                <Text fontSize='13px' color='#888888'>Stakable: 0.0</Text>
                <QuestionColorHelper
                  text={`Amount of your deposited ${token?.symbol} (as LP token) which can be staked to generate yield in PTP`}
                  color='white'
                />
              </div>
            )
          }
        </RowBetween>
        <Row className='mt-1'>
          <Col>
            <GreyCard style={{ textAlign: 'right' }}>
              <Text>{nDecimals(6, norValue(baseData?.balanceOf))}</Text>                          
            </GreyCard>
          </Col>
        </Row>
        <RowBetween className='mt-3'>
          <div style={CenterVerticalContainerStyle} >
            <Text fontSize="13px">Total Stake</Text>
            <QuestionColorHelper
              text={`Total amount of your deposited ${token?.symbol} (as LP token) staked after the transaction`}
              color='white'
            />
          </div>
          {
            baseData?.balanceOf !== undefined && baseData?.stakedLPAmount !== undefined ? (              
              <Text fontSize="13px">{`${nDecimals(6, (norValue(baseData?.balanceOf) + norValue(baseData?.stakedLPAmount)))} ${token?.symbol}`}</Text>
            ) : (
              <Text>0.0</Text>
            )
          }

        </RowBetween>
        <Row className='mt-4'>
          <Col className='pl-3 pr-1'>
            <Button variant='secondary' style={{ borderRadius: '5px' }} fullWidth onClick={onDismiss}>Cancel</Button>
          </Col>
          <Col className='pl-1 pr-3'>
            {
              baseData?.balanceOf !== undefined ?
                (baseData.allowance_lp_master.gte(baseData?.balanceOf) ?
                  <Button variant='primary' style={{ borderRadius: '5px' }} fullWidth onClick={(e) => handleStakeLP(e, baseData?.balanceOf, token)}>Stake All</Button> :
                  <Button variant='primary' style={{ borderRadius: '5px' }} fullWidth onClick={(e) => handleApprove(e, baseData?.balanceOf, token)}>Approve</Button>) :
                <Button variant='primary' style={{ borderRadius: '5px' }} disabled fullWidth>Stake All</Button>
            } 
          </Col>
        </Row>
      </div>
    </Modal>
  )
}
