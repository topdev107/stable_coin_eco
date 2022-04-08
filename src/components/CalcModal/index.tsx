import { Token } from '@pantherswap-libs/sdk'
import { AddIcon, Button, ChevronDownIcon, CloseIcon, IconButton, Text } from '@pantherswap-libs/uikit'
import { BigNumber, ethers } from 'ethers'
import React, { useCallback, useEffect, useState } from 'react'
import { Col, Form, Row } from 'react-bootstrap'
import { float2int, getUnitedValue, nDecimals, norValue, PTPStakedInfo } from 'utils'
import { YellowCard } from 'components/Card'
import styled from 'styled-components'
import { darken } from 'polished'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { useAllTokens } from 'hooks/Tokens'
import AmountInputPanel from '../AmountInputPanel'
import CurrencyLogo from '../CurrencyLogo'
import WideModal from '../WideModal'
import { RowBetween } from '../Row'
import vePTP_logo from '../../assets/vePTP_logo.png'

interface CalcModalProps {
  isOpen: boolean
  onDismiss: () => void
}

export default function CalcModal({
  isOpen,
  onDismiss
}: CalcModalProps) {

  const allTokens = useAllTokens()

  const [inputedValue, setInputedValue] = useState('')

  const [avaliable, setAvailable] = useState(false)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedToken, setSelectedToken] = useState<Token | undefined>()

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

  const onCurrencySelect = useCallback(
    (inputCurrency) => {
      const oneToken = Object.values(allTokens).find((d) => d.address.toLowerCase() === inputCurrency.address.toLowerCase())
      setSelectedToken(oneToken)
    }, [allTokens]
  )

  const handleDismissSearch = useCallback(() => {
    setModalOpen(false)
  }, [setModalOpen])

  useEffect(() => {
    if (isOpen === true) {
      setInputedValue('')
    }
  }, [setInputedValue, isOpen])



  const CurrencySelect = styled.button<{ selected: boolean }>`
  align-items: center;
  height: 34px;
  font-size: 16px;
  font-weight: 500;
  background-color: transparent;
  color: ${({ selected, theme }) => (selected ? theme.colors.text : '#FFFFFF')};
  border-radius: 12px;
  outline: none;
  cursor: pointer;
  user-select: none;
  border: none;
  padding: 0 0.5rem;
  width: 100%;

  :focus,
  :hover {    
    background-color: ${({ theme }) => darken(0.05, theme.colors.input)};
  }
`

  const disableCurrencySelect = false

  return (
    <>
      {!disableCurrencySelect && onCurrencySelect && (
        <CurrencySearchModal
          isOpen={modalOpen}
          onDismiss={handleDismissSearch}
          onCurrencySelect={onCurrencySelect}
          selectedCurrency={selectedToken}
          otherSelectedCurrency={selectedToken}
          showCommonBases
        />
      )}
      <WideModal isOpen={isOpen} onDismiss={handleClose} minHeight={30} maxHeight={90}>
        <div style={{ width: '100%', padding: '30px 30px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Text className="mr-3" fontSize='20px'>Booster Calculator</Text>
            </div>
            <div style={{ marginTop: '-30px', display: 'flex', justifyContent: 'end' }}>
              <CloseIcon onClick={handleClose} />
            </div>
          </div>
          <div className='mt-3'>
            <div style={{ width: '100%', height: '1px', backgroundColor: '#ff720d', position: 'relative', top: '12px' }} />
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#121827', paddingLeft: '15px', paddingRight: '0px' }}>
                <img src={vePTP_logo} alt='logo' style={{ width: '23px', height: '23px', marginRight: '3px' }} />
                <Text className="mr-3">My Staked Deposit</Text>
              </div>
            </div>
          </div>
          <div className='mt-3'>
            <YellowCard>
              <CurrencySelect
                selected={!!selectedToken}
                className="open-currency-select-button"
                onClick={() => {
                  if (!disableCurrencySelect) {
                    setModalOpen(true)
                  }
                }}
              >
                <div>
                  <Row className='pl-3 pr-3'>
                    <CurrencyLogo currency={selectedToken} size="24px" style={{ marginRight: '8px' }} />
                    <Text>
                      {(selectedToken && selectedToken.symbol && selectedToken.symbol.length > 20
                        ? `${selectedToken.symbol.slice(0, 4)
                        }...${selectedToken.symbol.slice(selectedToken.symbol.length - 5, selectedToken.symbol.length)}`
                        : selectedToken?.symbol) || <Text>Select a Token</Text>}
                    </Text>
                    {!disableCurrencySelect && <ChevronDownIcon />}
                  </Row>
                </div>
              </CurrencySelect>
            </YellowCard>
          </div>
        </div>
      </WideModal >
    </>
  )
}
