import { CurrencyAmount, Currency, Token, TokenAmount } from '@pantherswap-libs/sdk'
import { Button, Text } from '@pantherswap-libs/uikit'
import Slider from 'components/Slider'
import { useTokenAllowance } from 'data/Allowances'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { borderColor } from 'polished'
import React, { useCallback, useEffect, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import { useSelector } from 'react-redux'
import { AppState } from 'state'
import { tryParseAmount, useSwapState } from 'state/swap/hooks'
import { getDecimalPartStr, getIntStr, getUnitedValue, getUsefulCount, nDecimals, PoolItemBaseData, getERC20Contract, calcFee } from 'utils'
import { POOL_ADDRESS, T_FEE } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import AmountInputPanel from '../AmountInputPanel'
import { DarkblueOutlineCard, LightCard, GreyCard } from '../Card'
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

interface WithdrawConfirmModalProps {
  isOpen: boolean
  token: Token | undefined
  baseData: PoolItemBaseData | undefined
  onDismiss: () => void
  onApprove: (amount: string, token: Token | undefined) => void
  onWithdraw: (amount: string, token: Token | undefined) => void
  onRefresh: () => void
}

export default function WithdrawConfirmModal({
  isOpen,
  token,
  baseData,
  onDismiss,
  onApprove,
  onWithdraw,
  onRefresh
}: WithdrawConfirmModalProps) {

  const { account, chainId, library } = useActiveWeb3React()

  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, token ?? undefined)

  const [selectedAmount, setSelectedAmount] = useState<number>(0)

  const [avaliable, setAvailable] = useState(false)
  const [fee, setFee] = useState<number>(0)

  const [usefulCountFee, setUsefulCountFee] = useState<number>(0)

  useEffect(() => {
    const usefulcnt = getUsefulCount(T_FEE)
    setUsefulCountFee(+usefulcnt)
  }, [])

  const handleMaxInput = useCallback(() => {
    if (baseData !== undefined) {
      setSelectedAmount(baseData.balanceOf * 100)
      const feeStr = calcFee(baseData.balanceOf, T_FEE, usefulCountFee)
      setFee(+feeStr)
    }
  }, [baseData, usefulCountFee])

  const handleClose = useCallback(
    () => {
      setSelectedAmount(0)
      onDismiss()
    }, [setSelectedAmount, onDismiss]
  )

  useEffect(() => {
    if (isOpen === true) {
      setSelectedAmount(0)
      setFee(0)
    }
  }, [setSelectedAmount, isOpen])

  useEffect(() => {
    if (selectedAmount > 0) {
      setAvailable(true)
    } else {
      setAvailable(false)
    }
  }, [selectedAmount])

  const handleWithdraw = useCallback(
    (e, value: string, tk: Token | undefined) => {
      if (tk !== undefined) {
        const val = nDecimals(6, value)
        const amount = getUnitedValue(val.toString(), tk?.decimals)
        onWithdraw(amount.toString(), tk)
      }
    }, [onWithdraw]
  )

  const handleApprove = useCallback(
    (e, value: string, tk: Token | undefined) => {
      if (tk !== undefined) {
        const amount = getUnitedValue(value, tk?.decimals)
        onApprove(amount.toString(), tk)
      }
    }, [onApprove]
  )

  const handleChange = useCallback(
    (val: number) => {
      setSelectedAmount(val)
      if (token !== undefined) {
        const feeStr = calcFee(val / 100, T_FEE, usefulCountFee)
        setFee(+feeStr)
      }
    }, [token, usefulCountFee]
  )

  return (
    <Modal isOpen={isOpen} onDismiss={handleClose} minHeight={50} maxHeight={90}>
      <div style={{ width: '100%', padding: '30px 30px' }}>
        <div style={CenterContainerStyle}>
          <Text className="mr-3" fontSize='20px'>Confirm Withdraw</Text>
          <CurrencyLogo currency={token} size="25px" />
          <Text className="ml-1" fontSize='20px'>{token?.symbol}</Text>
        </div>

        <RowBetween className="mt-4">
          <Text fontSize="13px" color='#888888'>{`Deposited: ${nDecimals(6, baseData?.balanceOf)} ${token?.symbol}`}</Text>
          <Text fontSize='13px' color='#888888'>Balance: {selectedCurrencyBalance?.toSignificant(6)} {token?.symbol}</Text>
        </RowBetween>
        <LightCard padding="15px 0px" className="mt-2">
          <RowBetween className="mt-1 pl-3 pr-4">
            {
              baseData !== undefined && baseData.balanceOf > 0 ?
                <Text fontSize="15px" >{`${nDecimals(0, selectedAmount / baseData.balanceOf)}%`}</Text> :
                <Text fontSize="13px" color='#888888'>0</Text>
            }
            <Row style={CenterVerticalContainerStyle}>
              <Text style={CenterVerticalContainerStyle} fontSize='13px' color='#888888'>/100%</Text>
              <Button variant='secondary' size='sm' style={{ borderRadius: '5px', border: '1px solid #ff720d', marginLeft: '7px' }} onClick={handleMaxInput}>Max</Button>
            </Row>
          </RowBetween>
          <Row className="mt-2">
            <Col>
              {
                baseData !== undefined && baseData.balanceOf > 0 ?
                  <Slider value={selectedAmount} onChange={handleChange} max={baseData?.balanceOf * 100} /> :
                  <Slider value={0} onChange={handleChange} max={0}/>                  
              }
            </Col>
          </Row>
        </LightCard>
        <RowBetween className='mt-3'>
          <Text fontSize="13px">Amount Withdrawing</Text>
          <Text fontSize="13px">{`${selectedAmount / 100} ${token?.symbol}`}</Text>
        </RowBetween>
        <RowBetween>
          <div style={CenterVerticalContainerStyle} >
            <Text fontSize="13px">Fee</Text>
            <QuestionColorHelper
              text={`A withdrawal fee may apply due to the pool's coverage ratio.`}
              color='white'
            />
          </div>
          <Text fontSize="13px">{`${fee} ${token?.symbol}`}</Text>
        </RowBetween>
        <RowBetween>
          <div style={CenterVerticalContainerStyle} >
            <Text fontSize="13px">Minimum Received</Text>
            <QuestionColorHelper
              text={`Your transaction will fail if you're unable to receive at least this amount.`}
              color='white'
            />
          </div>
          <Text fontSize="13px">{`${selectedAmount / 100 - fee} ${token?.symbol}`}</Text>
        </RowBetween>
        <RowBetween className='mt-3'>
          <Text fontSize="13px">My Remaining Liquidity</Text>
          {
            baseData !== undefined && baseData.balanceOf > 0 ?
              <Text fontSize="13px">{`${baseData.balanceOf - selectedAmount / 100} ${token?.symbol}`}</Text> :
              <Text fontSize="13px">{`0 ${token?.symbol}`}</Text>
          }
        </RowBetween>
        <RowBetween>
          <Text fontSize="13px">My Remaining Share</Text>
          {
            baseData !== undefined && baseData.totalSupply > 0 ?
              <Text fontSize="13px">{`${nDecimals(2, (baseData.balanceOf - selectedAmount / 100)/baseData.totalSupply*100)}%`}</Text> :
              <Text fontSize="13px">0%</Text>
          }
        </RowBetween>
        <Row className='mt-4'>
          <Col className='pl-3 pr-1'>
            <Button variant='secondary' style={{ borderRadius: '5px' }} fullWidth onClick={handleClose}>Cancel</Button>
          </Col>
          <Col className='pl-1 pr-3'>
            {
              avaliable && baseData !== undefined ?
                (baseData.allowance_lp >= +selectedAmount/100 ?
                  <Button variant='primary' style={{ borderRadius: '5px' }} fullWidth onClick={(e) => handleWithdraw(e, nDecimals(6, +selectedAmount/100).toString(), token)}>Withdraw</Button> :
                  <Button variant='primary' style={{ borderRadius: '5px' }} fullWidth onClick={(e) => handleApprove(e, nDecimals(6, +selectedAmount/100).toString(), token)}>Approve</Button>) :
                <Button variant='primary' style={{ borderRadius: '5px' }} disabled fullWidth>Deposit</Button>
            }
          </Col>
        </Row>
      </div>
    </Modal>
  )
}
