import { CurrencyAmount, Token, Trade } from '@pantherswap-libs/sdk'
import { ArrowDownIcon, Button, CardBody, IconButton, Text } from '@pantherswap-libs/uikit'
import AddressInputPanel from 'components/AddressInputPanel'
import Card, { GreyCard } from 'components/Card'
import CardNav from 'components/CardNav'
import { AutoColumn } from 'components/Column'
import ConnectWalletButton from 'components/ConnectWalletButton'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Loader from 'components/Loader'
import MyMenu from 'components/MyMenu'
import PageHeader from 'components/PageHeader'
import ProgressSteps from 'components/ProgressSteps'
import { AutoRow, RowBetween } from 'components/Row'
import { LinkStyledButton, TYPE } from 'components/Shared'
import AdvancedSwapDetailsDropdown from 'components/swap/AdvancedSwapDetailsDropdown'
import confirmPriceImpactWithoutFee from 'components/swap/confirmPriceImpactWithoutFee'
import { ArrowWrapper, BottomGrouping, SwapCallbackError, Wrapper } from 'components/swap/styleds'
import TradePrice from 'components/swap/TradePrice'
import SyrupWarningModal from 'components/SyrupWarningModal'
import TokenWarningModal from 'components/TokenWarningModal'
import TransactionConfirmationModal, { TransactionErrorContent } from 'components/TransactionConfirmationModal'
import { INITIAL_ALLOWED_SLIPPAGE } from 'constants/index'
import { BigNumber, ethers } from 'ethers'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallbackFromTrade } from 'hooks/useApproveCallback'
import { useSwapCallback } from 'hooks/useSwapCallback'
import useWrapCallback, { WrapType } from 'hooks/useWrapCallback'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { ArrowDown } from 'react-feather'
import { Field } from 'state/swap/actions'
import { useDefaultsFromURLSearch, useDerivedSwapInfo, useSwapActionHandlers, useSwapState } from 'state/swap/hooks'
import { useExpertModeManager, useUserDeadline, useUserSlippageTolerance } from 'state/user/hooks'
import { ThemeContext } from 'styled-components'
import { getERC20Contract, getPoolContract, getPriceProviderContract, getUnitedValue } from 'utils'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { computeTradePriceBreakdown, warningSeverity } from 'utils/prices'
import { TranslateString } from 'utils/translateTextHelpers'
import { POOL_ADDRESS } from '../../constants'
import { useAllTokens } from '../../hooks/Tokens'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import AppBody from '../AppBody'


const { main: Main } = TYPE

const Swap = () => {
  const loadedUrlParams = useDefaultsFromURLSearch()

  // token warning stuff
  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.inputCurrencyId),
    useCurrency(loadedUrlParams?.outputCurrencyId),
  ]
  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const [isSyrup, setIsSyrup] = useState<boolean>(false)
  const [syrupTransactionType, setSyrupTransactionType] = useState<string>('')
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c instanceof Token) ?? [],
    [loadedInputCurrency, loadedOutputCurrency]
  )
  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  const handleConfirmSyrupWarning = useCallback(() => {
    setIsSyrup(false)
    setSyrupTransactionType('')
  }, [])

  const { account, library, chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)

  const allTokens = useAllTokens()

  const [isExpertMode] = useExpertModeManager()

  // get custom setting values for user
  const [deadline] = useUserDeadline()
  const [allowedSlippage] = useUserSlippageTolerance()

  // swap state
  const { independentField, typedValue, recipient } = useSwapState()
  const { v2Trade, currencyBalances, parsedAmount, currencies, inputError: swapInputError } = useDerivedSwapInfo()
  const { wrapType, execute: onWrap, inputError: wrapInputError } = useWrapCallback(
    currencies[Field.INPUT],
    currencies[Field.OUTPUT],
    typedValue
  )
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE
  const trade = v2Trade

  const parsedAmounts = showWrap
    ? {
      [Field.INPUT]: parsedAmount,
      [Field.OUTPUT]: parsedAmount,
    }
    : {
      [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
      [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
    }

  const { onSwitchTokens, onCurrencySelection, onUserInput, onChangeRecipient } = useSwapActionHandlers()
  const isValid = !swapInputError
  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT

  // 
  const [inputValueA, setInputValueA] = useState<string>('')
  const [inputValueB, setInputValueB] = useState<string>('')
  const [selectedTokenA, setSelectedTokenA] = useState<Token | undefined>()
  const [selectedTokenB, setSelectedTokenB] = useState<Token | undefined>()
  const [isInsufficientCash, setIsInsufficientCash] = useState<boolean>(false)
  const [allowanceAmount, setAllowanceAmount] = useState<number>(0)

  const handleTypeInput = useCallback(
    (value: string) => {
      setInputValueA(value)
      if (value === '') {
        setIsInsufficientCash(false)
        setInputValueB('')
      }
    },
    [setInputValueA]
  )

  const handleTypeOutput = useCallback(
    (value: string) => {
      setInputValueB(value)
    },
    [setInputValueB]
  )

  const handleChangeTokenPair = useCallback(
    () => {
      setInputValueA('')
      setInputValueB('')
      const tmpToken = selectedTokenA
      setSelectedTokenA(selectedTokenB)
      setSelectedTokenB(tmpToken)
      onSwitchTokens()
    }, [onSwitchTokens, selectedTokenA, selectedTokenB]
  )

  // modal and loading
  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: Trade | undefined
    attemptingTxn: boolean
    swapErrorMessage: string
    txHash: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: '',
    txHash: undefined,
  })

  const [tnxHash, setTnxHash] = useState<string | undefined>()

  const route = trade?.route

  // check whether the user has approved the router on the input token
  const [approval, approveCallback] = useApproveCallbackFromTrade(trade, allowedSlippage)

  // check if user has gone through approval process, used to show two step buttons, reset on token change
  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  useEffect(() => {
    if (approval === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approval, approvalSubmitted])

  const selectedCurrencyBalance = useCurrencyBalance(account ?? undefined, selectedTokenA ?? undefined)
  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalances[Field.INPUT])
  const atMaxAmountInput = Boolean(maxAmountInput && parsedAmounts[Field.INPUT]?.equalTo(maxAmountInput))

  // the callback to execute the swap
  const { callback: swapCallback, error: swapCallbackError } = useSwapCallback(
    trade,
    allowedSlippage,
    deadline,
    recipient
  )

  const { priceImpactWithoutFee } = computeTradePriceBreakdown(trade)

  const handleSwap = useCallback(() => {
    if (priceImpactWithoutFee && !confirmPriceImpactWithoutFee(priceImpactWithoutFee)) {
      return
    }
    if (!swapCallback) {
      return
    }
    setSwapState((prevState) => ({ ...prevState, attemptingTxn: true, swapErrorMessage: '', txHash: undefined }))
    swapCallback()
      .then((hash) => {
        setSwapState((prevState) => ({
          ...prevState,
          attemptingTxn: false,
          swapErrorMessage: '',
          txHash: hash,
        }))
      })
      .catch((error) => {
        setSwapState((prevState) => ({
          ...prevState,
          attemptingTxn: false,
          swapErrorMessage: error.message,
          txHash: undefined,
        }))
      })
  }, [priceImpactWithoutFee, swapCallback, setSwapState])

  // errors
  const [showInverted, setShowInverted] = useState<boolean>(false)

  // warnings on slippage
  const priceImpactSeverity = warningSeverity(priceImpactWithoutFee)

  // show approve flow when: no error on inputs, not approved or pending, or approved in current session
  // never show if price impact is above threshold in non expert mode
  const showApproveFlow =
    !swapInputError &&
    (approval === ApprovalState.NOT_APPROVED ||
      approval === ApprovalState.PENDING ||
      (approvalSubmitted && approval === ApprovalState.APPROVED)) &&
    !(priceImpactSeverity > 3 && !isExpertMode)

  // This will check to see if the user has selected Syrup to either buy or sell.
  // If so, they will be alerted with a warning message.
  const checkForSyrup = useCallback(
    (selected: string, purchaseType: string) => {
      if (selected === 'syrup') {
        setIsSyrup(true)
        setSyrupTransactionType(purchaseType)
      }
    },
    [setIsSyrup, setSyrupTransactionType]
  )

  const handleInputSelect = useCallback(
    (inputCurrency) => {
      const oneToken = Object.values(allTokens).find((d) => d.address.toLowerCase() === inputCurrency.address.toLowerCase())
      if (selectedTokenB?.address !== oneToken?.address) {
        setSelectedTokenA(oneToken)
      } else {
        setSelectedTokenA(selectedTokenB)
        setSelectedTokenB(selectedTokenA)
      }
      setInputValueA('')
      setInputValueB('')
      setAllowanceAmount(0)
      setIsInsufficientCash(false)
      console.log('inputTokenSelected: ', selectedTokenA?.address)


      setApprovalSubmitted(false) // reset 2 step UI for approvals
      onCurrencySelection(Field.INPUT, inputCurrency)
      if (inputCurrency.symbol.toLowerCase() === 'syrup') {
        checkForSyrup(inputCurrency.symbol.toLowerCase(), 'Selling')
      }
    },
    [onCurrencySelection, setApprovalSubmitted, checkForSyrup, allTokens, selectedTokenA, selectedTokenB]
  )

  const handleMaxInput = useCallback(() => {
    if (selectedCurrencyBalance) {
      setInputValueA(selectedCurrencyBalance.toExact())
    }
  }, [selectedCurrencyBalance, setInputValueA])

  const handleOutputSelect = useCallback(
    (outputCurrency) => {
      const oneToken = Object.values(allTokens).find((d) => d.address.toLowerCase() === outputCurrency.address.toLowerCase())
      if (selectedTokenA?.address !== oneToken?.address) {
        setSelectedTokenB(oneToken)        
      } else {
        setSelectedTokenA(selectedTokenB)
        setSelectedTokenB(selectedTokenA)
      }
      console.log('outputTokenSelected: ', selectedTokenB?.address)
      onCurrencySelection(Field.OUTPUT, outputCurrency)
      if (outputCurrency.symbol.toLowerCase() === 'syrup') {
        checkForSyrup(outputCurrency.symbol.toLowerCase(), 'Buying')
      }
    },
    [onCurrencySelection, checkForSyrup, allTokens, selectedTokenB, selectedTokenA]
  )

  const handleDismissConfirmation = useCallback(() => {
    setSwapState((prevState) => ({ ...prevState, showConfirm: false, txHash: undefined }))

  }, [])

  const handleApprove = useCallback(
    () => {
      if (!chainId || !library || !account || !selectedTokenA) return
      const tkn = selectedTokenA
      // const amount = getUnitedValue(inputValueA, tkn.decimals)
      const amount = ethers.utils.parseUnits(inputValueA, tkn.decimals)
      setTnxHash(undefined)
      setSwapState((prevState) => ({ showConfirm: true, tradeToConfirm: undefined, attemptingTxn: true, swapErrorMessage: '', txHash: undefined }))
      const erc20Contract = getERC20Contract(chainId, tkn.address, library, account)

      const approveCall = async () => {
        await erc20Contract.approve(POOL_ADDRESS, amount.toString())
          .then((response) => {
            console.log('approved: ', response)
            setSwapState((prevState) => ({ ...prevState, txHash: response.hash }))
            setTnxHash(response.hash)
            erc20Contract
              .once('Approval', (owner, spender, allowanceAmt) => {
                console.log('== Approval ==')
                console.log('owner: ', owner)
                console.log('spender: ', spender)
                console.log('amount: ', parseInt(allowanceAmt._hex, 16) / (10 ** 18))

                if (response.hash === undefined) {
                  console.log('response.hash: ', response.hash)
                  console.log('txHash: ', txHash)
                  return
                }
                erc20Contract.provider
                  .getTransactionReceipt(response.hash)
                  .then((res) => {
                    console.log('getTransactionReceipt: ', res)
                  })
                  .catch(e => {
                    console.log('tnx_receipt_exception: ', e)
                  })
                  .finally(() => {
                    console.log('finally called')
                    console.log('txHash: ', txHash)
                    setAllowanceAmount(parseInt(allowanceAmt._hex, 16) / (10 ** 18))
                    setSwapState((prevState) => ({ ...prevState, showConfirm: false, attemptingTxn: false }))
                  })
              })
          })
          .catch((e) => {
            setSwapState((prevState) => ({ ...prevState, attemptingTxn: false }))
            // we only care if the error is something _other_ than the user rejected the tx          
            if (e?.code !== 4001) {
              console.error(e)
              setSwapState((prevState) => ({ ...prevState, swapErrorMessage: e.message }))
            } else {
              setSwapState((prevState) => ({ ...prevState, showConfirm: false }))
            }
          })
      }

      approveCall()
    }, [account, chainId, library, inputValueA, selectedTokenA, txHash]
  )


  const handleSwapTokens = useCallback(
    () => {
      if (!chainId || !library || !account || !selectedTokenB || !selectedTokenA) return

      const fromToken = selectedTokenA.address
      const toToken = selectedTokenB.address
      const fromAmount = ethers.utils.parseUnits(inputValueA, selectedTokenA.decimals)
      const minimumToAmount = ethers.utils.parseUnits(inputValueB, selectedTokenB.decimals).sub(ethers.utils.parseUnits(inputValueB, selectedTokenB.decimals).div(BigNumber.from(10000)))           
      console.log('inputValueB: ', inputValueB)
      console.log('mininumToAmount: ', (+inputValueB) - (+inputValueB * allowedSlippage / 10000))
      console.log('allowedSlipage: ', allowedSlippage)
      const to = account
      const tnxDeadline = Date.now() + deadline * 1000

      setTnxHash(undefined)
      setSwapState((prevState) => ({ showConfirm: true, tradeToConfirm: undefined, attemptingTxn: true, swapErrorMessage: '', txHash: undefined }))
      const poolContract = getPoolContract(chainId, library, account)

      const swapCall = async () => {
        // await poolContract.swap(fromToken, toToken, fromAmount, minimumToAmount, to, tnxDeadline)
        await poolContract.swapBasedPrice(fromToken, toToken, fromAmount, minimumToAmount, to, tnxDeadline)
          .then((response) => {
            console.log('swap: ', response)
            setTnxHash(response.hash)
            setSwapState((prevState) => ({ ...prevState, txHash: response.hash }))

            poolContract
              .once('Swap', (sender, fromToken1, toToken1, fromAmount1, toAmount1, to1) => {
                console.log('== Swap ==')
                console.log('sender: ', sender)
                console.log('fromToken: ', fromToken1)
                console.log('toToken: ', toToken1)
                console.log('fromAmount: ', parseInt(fromAmount1._hex, 16) / (10 ** 18))
                console.log('toAmount: ', parseInt(toAmount1._hex, 16) / (10 ** 18))
                console.log('to: ', to1)

                poolContract.provider
                  .getTransactionReceipt(response.hash)
                  .then((res) => {
                    console.log('getTransactionReceipt: ', res)
                    setInputValueA('0.0')
                    setInputValueA('')
                  })
                  .catch(e => {
                    console.log('tnx_receipt_exception: ', e)
                    setSwapState((prevState) => ({ ...prevState, swapErrorMessage: e.message }))
                  })
                  .finally(() => {
                    console.log('finally called')
                    setSwapState((prevState) => ({ ...prevState, attemptingTxn: false }))
                  })
              })
          })
          .catch((e) => {
            setSwapState((prevState) => ({ ...prevState, attemptingTxn: false }))
            // we only care if the error is something _other_ than the user rejected the tx          
            if (e?.code !== 4001) {
              console.error(e)
              setSwapState((prevState) => ({ ...prevState, swapErrorMessage: e.message }))
            } else {
              setSwapState((prevState) => ({ ...prevState, showConfirm: false }))
            }
          })
      }

      swapCall()
    }, [account, chainId, library, deadline, selectedTokenB, selectedTokenA, inputValueA, inputValueB, allowedSlippage]
  )

  useEffect(() => {
    if (!account || !library || !chainId) return
    if (selectedTokenA?.address === undefined ||
      selectedTokenB?.address === undefined ||
      inputValueA === '') return

    const checkPotentialSwap = async () => {
      const poolContract = getPoolContract(chainId, library, account)
      const tnxDeadline = Date.now() + deadline * 1000
      const inAmount = ethers.utils.parseUnits(inputValueA, selectedTokenA.decimals)      
      await poolContract.quotePotentialSwap(selectedTokenA?.address, selectedTokenB?.address, inAmount.toString())
        .then((response) => {
          const expectValue = parseInt(response.potentialOutcome._hex, 16) / (10 ** selectedTokenB.decimals)
          console.log('potentialSwap: ', response)
          console.log('Expected Value: ', expectValue)
          setIsInsufficientCash(false)
          setInputValueB(expectValue.toString())
        })
        .catch((e) => {
          console.log('=== potentialSwap_Exception ===')
          console.log(e)
          if (e.data !== undefined && e.data.message !== undefined) {
            console.log(e.data.message)
            if (e.data.message === 'execution reverted: INSUFFICIENT_CASH') {
              setIsInsufficientCash(true)
            }
          }
          setInputValueB('')
        })
    }

    const checkApproval = async () => {
      const erc20Contract = getERC20Contract(chainId, selectedTokenA.address, library, account)
      await erc20Contract.allowance(account, POOL_ADDRESS)
        .then((response) => {
          const allowance = parseInt(response._hex, 16) / (10 ** selectedTokenA?.decimals)
          setAllowanceAmount(allowance)
          console.log('Allowanced amount: ', allowanceAmount)
        })
        .catch(e => {
          console.log(e)
        })
    }

    const checkPrices = async () => {
      const priceProviderContract = getPriceProviderContract(chainId, library, account)
      await priceProviderContract.getAssetsPrices([selectedTokenA.address, selectedTokenB.address])
        .then((response) => {
          console.log('price: ', response)
          const priceA = parseInt(response[0]._hex, 16) / (10 ** 8)
          const priceB = parseInt(response[1]._hex, 16) / (10 ** 8)
          console.log('priceA: ', priceA)
          console.log('priceB: ', priceB)
          const inputB = priceA * (+inputValueA) / priceB
        })
    }

    checkPotentialSwap()
    checkApproval()

  }, [selectedTokenB?.address, selectedTokenB?.decimals, inputValueB, allowanceAmount, selectedTokenB?.symbol, selectedTokenA?.decimals, inputValueA, account, chainId, library, deadline, selectedTokenA?.address])

  const pendingText = 'Waiting For Confirmation.'

  return (
    <>
      <MyMenu/>
      <TokenWarningModal
        isOpen={urlLoadedTokens.length > 0 && !dismissTokenWarning}
        tokens={urlLoadedTokens}
        onConfirm={handleConfirmTokenWarning}
      />
      <SyrupWarningModal
        isOpen={isSyrup}
        transactionType={syrupTransactionType}
        onConfirm={handleConfirmSyrupWarning}
      />
      <CardNav />
      <AppBody>
        <Wrapper id="swap-page">
          <TransactionConfirmationModal
            isOpen={showConfirm}
            onDismiss={handleDismissConfirmation}
            attemptingTxn={attemptingTxn}
            hash={tnxHash}
            content={() => (
              <TransactionErrorContent
                message={swapErrorMessage}
                onDismiss={handleDismissConfirmation}
              />
            )}
            pendingText={pendingText}
          />
          <PageHeader title="Swap" description="" />
          <CardBody>
            <AutoColumn gap="md">
              <CurrencyInputPanel
                label={
                  independentField === Field.OUTPUT && !showWrap && trade
                    ? 'From (estimated)'
                    : TranslateString(76, 'From')
                }
                value={inputValueA}
                showMaxButton={!atMaxAmountInput}
                currency={selectedTokenA}
                onUserInput={handleTypeInput}
                onMax={handleMaxInput}
                onCurrencySelect={handleInputSelect}
                otherCurrency={selectedTokenB}
                id="swap-currency-input"
              />
              <AutoColumn justify="space-between">
                <AutoRow justify={isExpertMode ? 'space-between' : 'center'} style={{ padding: '0 1rem' }}>
                  <ArrowWrapper clickable>
                    <IconButton
                      variant="tertiary"
                      onClick={() => {
                        setApprovalSubmitted(false) // reset 2 step UI for approvals
                        // onSwitchTokens()
                        handleChangeTokenPair()
                      }}
                      style={{ borderRadius: '50%' }}
                      size="sm"
                    >
                      <ArrowDownIcon color="primary" width="24px" />
                    </IconButton>
                  </ArrowWrapper>
                  {recipient === null && !showWrap && isExpertMode ? (
                    <LinkStyledButton id="add-recipient-button" onClick={() => onChangeRecipient('')}>
                      + Add a send (optional)
                    </LinkStyledButton>
                  ) : null}
                </AutoRow>
              </AutoColumn>
              <CurrencyInputPanel
                value={inputValueB}
                onUserInput={handleTypeOutput}
                label={
                  independentField === Field.INPUT && !showWrap && trade ? 'To (estimated)' : TranslateString(80, 'To')
                }
                showMaxButton={false}
                currency={selectedTokenB}
                onCurrencySelect={handleOutputSelect}
                otherCurrency={selectedTokenA}
                id="swap-currency-output"
              />

              {recipient !== null && !showWrap ? (
                <>
                  <AutoRow justify="space-between" style={{ padding: '0 1rem' }}>
                    <ArrowWrapper clickable={false}>
                      <ArrowDown size="16" color={theme.colors.textSubtle} />
                    </ArrowWrapper>
                    <LinkStyledButton id="remove-recipient-button" onClick={() => onChangeRecipient(null)}>
                      - Remove send
                    </LinkStyledButton>
                  </AutoRow>
                  <AddressInputPanel id="recipient" value={recipient} onChange={onChangeRecipient} />
                </>
              ) : null}

              {showWrap ? null : (
                <Card padding=".25rem .75rem 0 .75rem" borderRadius="20px">
                  <AutoColumn gap="4px">
                    {Boolean(trade) && (
                      <RowBetween align="center">
                        <Text fontSize="14px">Price</Text>
                        <TradePrice
                          price={trade?.executionPrice}
                          showInverted={showInverted}
                          setShowInverted={setShowInverted}
                        />
                      </RowBetween>
                    )}
                    {allowedSlippage !== INITIAL_ALLOWED_SLIPPAGE && (
                      <RowBetween align="center">
                        <Text fontSize="14px">Slippage Tolerance</Text>
                        <Text fontSize="14px">{allowedSlippage / 100}%</Text>
                      </RowBetween>
                    )}
                  </AutoColumn>
                </Card>
              )}
            </AutoColumn>
            <BottomGrouping>
              {!account ? (
                <ConnectWalletButton fullWidth />
              ) : isInsufficientCash ? (
                <GreyCard style={{ textAlign: 'center' }}>
                  <Main mb="4px">Insufficient liquidity for this trade.</Main>
                </GreyCard>
              ) : (inputValueA === '' || selectedTokenA === undefined || selectedTokenB === undefined) ? (
                <GreyCard style={{ textAlign: 'center' }}>
                  <Main mb="4px">Enter an amount</Main>
                </GreyCard>
              ) : (inputValueA !== '' && +inputValueA > allowanceAmount) ? (
                <Button
                  onClick={handleApprove}
                  fullWidth
                  variant='primary'
                >Approve</Button>
              ) : (inputValueA !== '' && +inputValueA <= allowanceAmount) ? (
                <Button
                  onClick={handleSwapTokens}
                  fullWidth
                  variant='primary'
                >Swap</Button>
              ) : showApproveFlow ? (
                <RowBetween>
                  <Button
                    onClick={approveCallback}
                    disabled={approval !== ApprovalState.NOT_APPROVED || approvalSubmitted}
                    style={{ width: '48%' }}
                    variant={approval === ApprovalState.APPROVED ? 'success' : 'primary'}
                  >
                    {approval === ApprovalState.PENDING ? (
                      <AutoRow gap="6px" justify="center">
                        Approving <Loader stroke="white" />
                      </AutoRow>
                    ) : approvalSubmitted && approval === ApprovalState.APPROVED ? (
                      'Approved'
                    ) : (
                      `Approve ${currencies[Field.INPUT]?.symbol}`
                    )}
                  </Button>
                  <Button
                    onClick={() => {
                      if (isExpertMode) {
                        handleSwap()
                      } else {
                        setSwapState({
                          tradeToConfirm: trade,
                          attemptingTxn: false,
                          swapErrorMessage: '',
                          showConfirm: true,
                          txHash: undefined,
                        })
                      }
                    }}
                    style={{ width: '48%' }}
                    id="swap-button"
                    disabled={
                      !isValid || approval !== ApprovalState.APPROVED || (priceImpactSeverity > 3 && !isExpertMode)
                    }
                    variant={isValid && priceImpactSeverity > 2 ? 'danger' : 'primary'}
                  >
                    {priceImpactSeverity > 3 && !isExpertMode
                      ? `Price Impact High`
                      : `Swap${priceImpactSeverity > 2 ? ' Anyway' : ''}`}
                  </Button>
                </RowBetween>
              ) : (
                <Button
                  onClick={() => {
                    if (isExpertMode) {
                      handleSwap()
                    } else {
                      setSwapState({
                        tradeToConfirm: trade,
                        attemptingTxn: false,
                        swapErrorMessage: '',
                        showConfirm: true,
                        txHash: undefined,
                      })
                    }
                  }}
                  id="swap-button"
                  disabled={!isValid || (priceImpactSeverity > 3 && !isExpertMode) || !!swapCallbackError}
                  variant={isValid && priceImpactSeverity > 2 && !swapCallbackError ? 'danger' : 'primary'}
                  fullWidth
                >
                  {swapInputError ||
                    (priceImpactSeverity > 3 && !isExpertMode
                      ? `Price Impact Too High`
                      : `Swap${priceImpactSeverity > 2 ? ' Anyway' : ''}`)}
                </Button>
              )}
              {showApproveFlow && <ProgressSteps steps={[approval === ApprovalState.APPROVED]} />}
              {isExpertMode && swapErrorMessage ? <SwapCallbackError error={swapErrorMessage} /> : null}
            </BottomGrouping>
          </CardBody>
        </Wrapper>
      </AppBody>
      <AdvancedSwapDetailsDropdown trade={trade} />
    </>
  )
}

export default Swap
