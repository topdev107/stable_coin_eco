import { CurrencyAmount, Currency, Token, TokenAmount } from '@pantherswap-libs/sdk'
import { Button, Text } from '@pantherswap-libs/uikit'
import { useTokenAllowance } from 'data/Allowances'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import React, { useCallback, useEffect, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import { useSelector } from 'react-redux'
import { AppState } from 'state'
import { tryParseAmount, useSwapState } from 'state/swap/hooks'
import { getDecimalPartStr, getIntStr, getUnitedValue, getUsefulCount, nDecimals, PoolItemBaseData, getERC20Contract } from 'utils'
import { POOL_ADDRESS, T_FEE } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import AmountInputPanel from '../AmountInputPanel'
import CurrencyLogo from '../CurrencyLogo'
import Modal from '../Modal'
import { QuestionColorHelper } from '../QuestionHelper'
import { RowBetween } from '../Row'

interface DepositConfirmModalProps {
  isOpen: boolean
  token: Token | undefined
  baseData: PoolItemBaseData | undefined
  onDismiss: () => void
  onApprove: (amount: string, token: Token | undefined) => void
  onDeposit: (amount: string, token: Token | undefined) => void
  onRefresh: () => void
}

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

export default function DepositConfirmModal({
  isOpen,
  token,
  baseData,
  onDismiss,
  onApprove,
  onDeposit,
  onRefresh
}: DepositConfirmModalProps) {

  const { account, chainId, library } = useActiveWeb3React()
  const [inputedValue, setInputedValue] = useState('')
  
  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, token ?? undefined)

  const [avaliable, setAvailable] = useState(false)
  const [fee, setFee] = useState<number>(0)

  const [usefulCountFee, setUsefulCountFee] = useState<number>(0)

  const savedTnxs = useSelector<AppState, AppState['tnxs']['tnxs']>((state) => state.tnxs.tnxs)

  useEffect(() => {
    const usefulcnt = getUsefulCount(T_FEE)
    setUsefulCountFee(+usefulcnt)
  }, [])

  const handleTypeInput = useCallback(
    (val: string) => {
      setInputedValue(val)
      if (token !== undefined) {
        const valDecimalStr = getDecimalPartStr(+val)
        const valDecimalLen = valDecimalStr.length
        const fe = (+val) * T_FEE
        const intStr = getIntStr(fe)
        const decStr = getDecimalPartStr(fe)
        const usefulCount = usefulCountFee + valDecimalLen // val=12.131 -> 7 (3+4)

        let feeDecimalPartStr = ''
        for (let i = 0; i < usefulCount; i++) {
          feeDecimalPartStr += decStr.charAt(i)
        }
        const feeStr = intStr.concat('.').concat(feeDecimalPartStr)
        setFee(+feeStr)        
      }
    },
    [setInputedValue, token, usefulCountFee]
  )

  const handleMaxInput = useCallback(() => {
    if (selectedCurrencyBalance) {
      setInputedValue(selectedCurrencyBalance.toExact())
    }
  }, [selectedCurrencyBalance, setInputedValue])

  const handleClose = useCallback(
    () => {
      setInputedValue('')
      onDismiss()
    }, [setInputedValue, onDismiss]
  )

  useEffect(() => {
    if (isOpen === true) {
      setInputedValue('')
      setFee(0)
    }
  }, [setInputedValue, isOpen])

  useEffect(() => {
    if (selectedCurrencyBalance) {
      const maxDesposiableAmount = +selectedCurrencyBalance.toExact()
      const inputedAmount = +inputedValue
      if (inputedAmount > 0 && inputedAmount <= maxDesposiableAmount) {
        setAvailable(true)
      } else {
        setAvailable(false)
      }
    } else {
      setAvailable(false)
    }
  }, [selectedCurrencyBalance, inputedValue])

  const handleDeposit = useCallback(
    (e, value: string, tk: Token | undefined) => {
      if (tk !== undefined) {
        const val = nDecimals(6, value)
        const amount = getUnitedValue(val.toString(), tk?.decimals)
        onDeposit(amount.toString(), tk)
      }
    }, [onDeposit]
  )

  const handleApprove = useCallback(
    (e, value: string, tk: Token | undefined) => {
      if (tk !== undefined) {
        const amount = getUnitedValue(value, tk?.decimals)
        onApprove(amount.toString(), tk)
      }
    }, [onApprove]
  )

  return (
    <Modal isOpen={isOpen} onDismiss={handleClose} minHeight={50} maxHeight={90}>
      <div style={{ width: '100%', padding: '30px 30px' }}>
        <div style={CenterContainerStyle}>
          <Text className="mr-3" fontSize='20px'>Confirm Deposit</Text>
          <CurrencyLogo currency={token} size="25px" />
          <Text className="ml-1" fontSize='20px'>{token?.symbol}</Text>
        </div>

        <RowBetween className="mt-4">
          <Text fontSize="13px" color='#888888'>{`Deposited: ${nDecimals(6, baseData?.balanceOf)} ${token?.symbol}`}</Text>
          <Text fontSize='13px' color='#888888'>Balance: {selectedCurrencyBalance?.toSignificant(6)} {token?.symbol}</Text>
        </RowBetween>
        <Row className='mt-1'>
          <Col>
            <AmountInputPanel
              value={inputedValue}
              showMaxButton
              currency={token}
              onUserInput={handleTypeInput}
              onMax={handleMaxInput}
            />
          </Col>
        </Row>
        <RowBetween className='mt-3'>
          <Text fontSize="13px">Token Price</Text>
          <Text fontSize="13px">{`$${baseData?.price}`}</Text>
        </RowBetween>
        <RowBetween>
          <div style={CenterVerticalContainerStyle} >
            <Text fontSize="13px">Fee</Text>
            <QuestionColorHelper
              text={`A deposit fee may apply due to the pool's coverage ratio.`}
              color='white'
            />
          </div>
          <Text fontSize="13px">{`${fee} ${token?.symbol}`}</Text>
        </RowBetween>
        <RowBetween className='mt-2'>
          <div style={CenterVerticalContainerStyle} >
            <Text fontSize="13px">My Liquidity</Text>
            <QuestionColorHelper
              text='Liquidity owned by you after adding liquidity.'
              color='white'
            />
          </div>
          <Text fontSize="13px">{`${nDecimals(6, baseData?.balanceOf)} ${token?.symbol}`}</Text>
        </RowBetween>
        <RowBetween>
          <div style={CenterVerticalContainerStyle} >
            <Text fontSize="13px">Pool Share</Text>
            <QuestionColorHelper
              text='The share of the token pool you will own after adding the liquidity.'
              color='white'
            />
          </div>
          <Text fontSize="13px">{`${baseData?.poolShare}%`}</Text>
        </RowBetween>
        <Row className='mt-4'>
          <Col className='pl-3 pr-1'>
            <Button variant='secondary' style={{ borderRadius: '5px' }} fullWidth onClick={handleClose}>Cancel</Button>
          </Col>
          <Col className='pl-1 pr-3'>
            {
              avaliable && baseData !== undefined ?
                (baseData.allowance >= +inputedValue ?
                  <Button variant='primary' style={{ borderRadius: '5px' }} fullWidth onClick={(e) => handleDeposit(e, nDecimals(6, inputedValue).toString(), token)}>Deposit</Button> :
                  <Button variant='primary' style={{ borderRadius: '5px' }} fullWidth onClick={(e) => handleApprove(e, nDecimals(6, inputedValue).toString(), token)}>Approve</Button>) :
                <Button variant='primary' style={{ borderRadius: '5px' }} disabled fullWidth>Deposit</Button>
            }
          </Col>
        </Row>
      </div>
    </Modal>
  )
}
