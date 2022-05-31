import { Token } from '@pantherswap-libs/sdk'
import { Button, Text } from '@pantherswap-libs/uikit'
import { LightCard } from 'components/Card'
import CardNav from 'components/CardNav'
import PoolItem from 'components/PoolItem'
import { RowBetween } from 'components/Row'
import { BigNumber } from 'ethers'
import { useActiveWeb3React } from 'hooks'
import { isAbsolute } from 'path'
import React, { useCallback, useEffect, useState } from 'react'
import { useTnxHandler } from 'state/tnxs/hooks'
import styled from 'styled-components'
import MyMenu from 'components/MyMenu'
import AutoProModal from 'components/AutoProModal'
import { useAddPopup, useRemovePopup } from 'state/application/hooks'
import { float2int, formatCurrency, getAssetContract, getERC20Contract, getMasterPlatypusContract, getPoolContract, getPriceProviderContract, getPTPContract, getVePTPContract, nDecimals, norValue, PoolItemBaseData } from 'utils'
import CurrencyLogo from '../../components/CurrencyLogo'
import DepositModal from '../../components/DepositConfirmModal'
import LPStakeModal from '../../components/LPStakeConfirmModal'
import LPUnStakeModal from '../../components/LPUnStakeConfirmModal'
import PTPClaimModal from '../../components/PTPClaimConfirmModal'
import TransactionConfirmationModal, { TransactionErrorContent } from '../../components/TransactionConfirmationModal'
import WithdrawModal from '../../components/WithdrawConfirmModal'
import { ASSET_DAI_ADDRESS, ASSET_USDC_ADDRESS, ASSET_USDT_ADDRESS, DAI_LP_ID, DEFAULT_DEADLINE_FROM_NOW, MASTER_PLATYPUS_ADDRESS, POOL_ADDRESS, PTP, T_FEE, USDC_LP_ID, USDT_LP_ID } from '../../constants'
import { useAllTokens } from '../../hooks/Tokens'
import { useUserSlippageTolerance } from '../../state/user/hooks'
import Question from '../../components/QuestionHelper'



export default function Pool() {
  const allTokens = useAllTokens()

  const addPopup = useAddPopup()
  const removePopup = useRemovePopup()

  const showPop = useCallback((descr) => {
    addPopup(
      {
        info: {
          desc: descr
        }
      },
      'someKey'
    )
  }, [addPopup])

  const removePop = useCallback(() => {
    removePopup('someKey')
  }, [removePopup])

  const { account, chainId, library } = useActiveWeb3React()

  const [baseData, setBaseData] = useState<PoolItemBaseData[]>([])
  const [preBaseData, setPreBaseData] = useState<PoolItemBaseData[]>([])
  const [selectedToken, setSelectedToken] = useState<Token | undefined>();
  const [selectedData, setSelectedData] = useState<PoolItemBaseData | undefined>()
  const [isDepositModalOpen, setIsDepositModalOpen] = useState<boolean>(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [isLPStakeModalOpen, setIsLPStakeModalOpen] = useState<boolean>(false);
  const [isLPUnStakeModalOpen, setIsLPUnStakeModalOpen] = useState<boolean>(false);
  const [isPTPClaimModalOpen, setIsPTPClaimModalOpen] = useState<boolean>(false);
  const [isAutoProModalOpen, setIsAutoProModalOpen] = useState<boolean>(false);
  const [isNeedRefresh, setIsNeedRefresh] = useState<boolean>(true)
  const [totalRewardablePTPAmount, setTotalRewardablePTPAmount] = useState<number>(0)

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm
  const [errMessage, setErrMessage] = useState<string>('')

  // txn values
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users
  const [txHash, setTxHash] = useState<string>('')

  const { saveTnx } = useTnxHandler()

  // const acnt = account === null ? undefined : account  
  // const tokenBalances = useTokenBalances(acnt, Object.values(allTokens))

  const openDepositModal = (token: Token) => () => {
    setIsDepositModalOpen(true)
    setSelectedToken(token)
    const oneData = baseData.find((d) => d.address.toLowerCase() === token.address.toLowerCase())
    setSelectedData(oneData)
  }

  const closeDepositModal = useCallback(() => setIsDepositModalOpen(false), [setIsDepositModalOpen]);

  const openWithdrawModal = (token: Token) => () => {
    setIsWithdrawModalOpen(true)
    setSelectedToken(token)
    const oneData = baseData.find((d) => d.address.toLowerCase() === token.address.toLowerCase())
    setSelectedData(oneData)
  }

  const closeWithdrawModal = useCallback(() => setIsWithdrawModalOpen(false), [setIsWithdrawModalOpen]);

  const openLPStakeModal = (token: Token) => () => {
    setIsLPStakeModalOpen(true)
    setSelectedToken(token)
    const oneData = baseData.find((d) => d.address.toLowerCase() === token.address.toLowerCase())
    setSelectedData(oneData)
  }

  const closeLPStakeModal = useCallback(() => setIsLPStakeModalOpen(false), [setIsLPStakeModalOpen]);

  const openLPUnStakeModal = (token: Token) => () => {
    setIsLPUnStakeModalOpen(true)
    setSelectedToken(token)
    const oneData = baseData.find((d) => d.address.toLowerCase() === token.address.toLowerCase())
    setSelectedData(oneData)
  }

  const closeLPUnStakeModal = useCallback(() => setIsLPUnStakeModalOpen(false), [setIsLPUnStakeModalOpen]);

  const openPTPClaimModal = (token: Token) => () => {
    setIsPTPClaimModalOpen(true)
    setSelectedToken(token)
    const oneData = baseData.find((d) => d.address.toLowerCase() === token.address.toLowerCase())
    setSelectedData(oneData)
  }

  const closePTPClaimModal = useCallback(() => setIsPTPClaimModalOpen(false), [setIsPTPClaimModalOpen]);

  const openAutoProModal = useCallback(() => { if (account !== null && account !== undefined) setIsAutoProModalOpen(true) }, [account, setIsAutoProModalOpen]);
  const closeAutoProModal = useCallback(() => setIsAutoProModalOpen(false), [setIsAutoProModalOpen]);

  const volume24_url = 'https://stable-coin-eco-api.vercel.app/api/v1/tnxs/'

  const handleDeposit = useCallback(
    async (amount: BigNumber, tkn: Token | undefined) => {
      if (!chainId || !library || !account || !tkn) return
      setShowConfirm(true)
      setIsDepositModalOpen(false)
      setAttemptingTxn(true)
      const poolContract = getPoolContract(chainId, library, account)
      const deadline = Date.now() + DEFAULT_DEADLINE_FROM_NOW * 1000

      let tnx_hash = ''
      await poolContract.deposit(tkn.address, amount, account, deadline)
        .then((response) => {
          setAttemptingTxn(false)
          console.log('deposit: ', response)
          setTxHash(response.hash)
          tnx_hash = response.hash
          showPop(popupDesc)

          const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token_address: tkn.address, amount: (+amount / (10 ** tkn.decimals)).toString(), timestamp: Date.now() })
          };
          fetch(volume24_url.concat('add_tnx/'), requestOptions)
            .then(res => res.json())
            .then(data => {
              fetch(volume24_url.concat('get_tnx_amount_24h/').concat(tkn.address))
                .then(res1 => res1.json())
                .then(data1 => {
                  const idx = baseData.findIndex((d) => d.address.toLowerCase() === tkn.address.toLowerCase())
                  const volume24h = baseData[idx].volume24
                  baseData[idx].volume24 = data1.status === 'success' ? data1.volume24 : volume24h
                  setIsNeedRefresh(true)
                })
            })
            .catch(e => {
              console.log(e)
            })
        })
        .catch((e) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx          
          if (e?.code !== 4001) {
            console.error(e)
            setErrMessage(e.message)
          } else {
            setShowConfirm(false)
          }
        })

      const checkTnx = async () => {
        if (tnx_hash === '') return
        poolContract.once('Deposit', (sender, token, depositAmount, liquidity, to) => {

          poolContract.provider
            .getTransactionReceipt(tnx_hash)
            .then((res) => {
              console.log('getTransactionReceipt: ', res)
            })
            .catch(e => {
              console.log('tnx_receipt_exception: ', e)
            })
            .finally(() => {
              console.log('finally called')
              setIsNeedRefresh(true)
              setAttemptingTxn(false)
              removePop()
            })
        })
      }

      checkTnx()

    }, [account, chainId, library, baseData, showPop, removePop]
  )

  const handleWithdraw = useCallback(
    async (amount: BigNumber, tkn: Token | undefined) => {
      if (!chainId || !library || !account || !tkn) return
      setShowConfirm(true)
      setIsWithdrawModalOpen(false)
      setAttemptingTxn(true)
      const poolContract = getPoolContract(chainId, library, account)
      const deadline = Date.now() + DEFAULT_DEADLINE_FROM_NOW * 1000

      // const minAmount = amount.sub(amount.div(BigNumber.from(1/T_FEE)))
      const minAmount = BigNumber.from(0)
      console.log('Withdraw Amount: ', amount.toString())
      console.log('Withdraw miniAmount: ', minAmount.toString())


      let tnx_hash = ''
      await poolContract.withdraw(tkn.address, amount, minAmount, account, deadline)
        .then((response) => {
          setAttemptingTxn(false)
          console.log('Withdraw: ', response)
          setTxHash(response.hash)
          tnx_hash = response.hash

          const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token_address: tkn.address, amount: (+amount / (10 ** tkn.decimals)).toString(), timestamp: Date.now() })
          };
          fetch(volume24_url.concat('add_tnx/'), requestOptions)
            .then(res => res.json())
            .then(data => {
              fetch(volume24_url.concat('get_tnx_amount_24h/').concat(tkn.address))
                .then(res1 => res1.json())
                .then(data1 => {
                  const idx = baseData.findIndex((d) => d.address.toLowerCase() === tkn.address.toLowerCase())
                  const volume24h = baseData[idx].volume24
                  baseData[idx].volume24 = data1.status === 'success' ? data1.volume24 : volume24h
                  setIsNeedRefresh(true)
                })
            })
            .catch(e => {
              console.log(e)
            })
        })
        .catch((e) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx          
          if (e?.code !== 4001) {
            console.error(e)
            setErrMessage(e.data.message)
          } else {
            setShowConfirm(false)
          }
        })

      const checkTnx = async () => {
        if (tnx_hash === '') return
        poolContract.once('Withdraw', (sender, token, withdrawAmount, liquidity, to) => {

          poolContract.provider
            .getTransactionReceipt(tnx_hash)
            .then((res) => {
              console.log('getTransactionReceipt: ', res)
            })
            .catch(e => {
              console.log('tnx_receipt_exception: ', e)
            })
            .finally(() => {
              console.log('finally called')
              setIsNeedRefresh(true)
              setAttemptingTxn(false)
            })
        })
      }

      checkTnx()
    }, [account, chainId, library, baseData]
  )

  const handleApprove = useCallback(
    async (amount: BigNumber, tkn: Token | undefined) => {
      if (!chainId || !library || !account || !tkn) return
      setShowConfirm(true)
      setAttemptingTxn(true)
      const erc20Contract = getERC20Contract(chainId, tkn.address, library, account)
      let tnx_hash = ''
      await erc20Contract.approve(POOL_ADDRESS, amount)
        .then((response) => {
          console.log('approved: ', response)
          // setAttemptingTxn(false)          
          setTxHash(response.hash)
          tnx_hash = response.hash
        })
        .catch((e) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx          
          if (e?.code !== 4001) {
            console.error(e)
            setErrMessage(e.message)
          } else {
            setShowConfirm(false)
          }
        })

      const checkTnx = async () => {
        if (tnx_hash === '') return
        erc20Contract
          .once('Approval', (owner, spender, allowanceAmount) => {
            console.log('== Approval ==')
            console.log('owner: ', owner)
            console.log('spender: ', spender)
            console.log('amount: ', parseInt(allowanceAmount._hex, 16) / (10 ** 18))

            erc20Contract.provider
              .getTransactionReceipt(tnx_hash)
              .then((res) => {
                console.log('getTransactionReceipt: ', res)
              })
              .catch(e => {
                console.log('tnx_receipt_exception: ', e)
              })
              .finally(() => {
                console.log('finally called')
                setIsNeedRefresh(true)
                console.log('setIsNeedRefresh: ', 'true')
                setAttemptingTxn(false)
                setShowConfirm(false)
              })
          })
      }

      checkTnx()
    }, [account, chainId, library]
  )

  const handleApproveWithdraw = useCallback(
    async (amount: BigNumber, token: Token | undefined) => {
      if (!chainId || !library || !account || !token) return
      const tokenAddress =
        token.symbol === 'DAI' ? ASSET_DAI_ADDRESS :
          token.symbol === 'USDC' ? ASSET_USDC_ADDRESS :
            token.symbol === 'USDT' ? ASSET_USDT_ADDRESS : '0x'
      setShowConfirm(true)
      setAttemptingTxn(true)
      const assetContract = getAssetContract(chainId, tokenAddress, library, account)
      let tnx_hash = ''
      await assetContract.approve(POOL_ADDRESS, amount)
        .then((response) => {
          console.log('approved: ', response)
          setTxHash(response.hash)
          tnx_hash = response.hash
        })
        .catch((e) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx          
          if (e?.code !== 4001) {
            console.error(e)
            setErrMessage(e.message)
          } else {
            setShowConfirm(false)
          }
        })

      const checkTnx = async () => {
        if (tnx_hash === '') return
        assetContract
          .once('Approval', (owner, spender, allowanceAmount) => {
            console.log('== Approval ==')
            console.log('owner: ', owner)
            console.log('spender: ', spender)
            console.log('amount: ', parseInt(allowanceAmount._hex, 16) / (10 ** 18))

            assetContract.provider
              .getTransactionReceipt(tnx_hash)
              .then((res) => {
                console.log('getTransactionReceipt: ', res)
              })
              .catch(e => {
                console.log('tnx_receipt_exception: ', e)
              })
              .finally(() => {
                console.log('finally called')
                setIsNeedRefresh(true)
                setAttemptingTxn(false)
              })
          })
      }

      checkTnx()

    }, [account, chainId, library]
  )

  const handleApproveLPStaking = useCallback(
    async (amount: BigNumber, token: Token | undefined) => {
      if (!chainId || !library || !account || !token) return
      const tokenAddress =
        token.symbol === 'DAI' ? ASSET_DAI_ADDRESS :
          token.symbol === 'USDC' ? ASSET_USDC_ADDRESS :
            token.symbol === 'USDT' ? ASSET_USDT_ADDRESS : '0x'
      setShowConfirm(true)
      setAttemptingTxn(true)
      const assetContract = getAssetContract(chainId, tokenAddress, library, account)
      let tnx_hash = ''
      await assetContract.approve(MASTER_PLATYPUS_ADDRESS, amount)
        .then((response) => {
          console.log('approved: ', response)
          setTxHash(response.hash)
          tnx_hash = response.hash
        })
        .catch((e) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx          
          if (e?.code !== 4001) {
            console.error(e)
            setErrMessage(e.message)
          } else {
            setShowConfirm(false)
          }
        })

      const checkTnx = async () => {
        if (tnx_hash === '') return
        assetContract
          .once('Approval', (owner, spender, allowanceAmount) => {
            console.log('== Approval ==')
            console.log('owner: ', owner)
            console.log('spender: ', spender)
            console.log('amount: ', parseInt(allowanceAmount._hex, 16) / (10 ** 18))

            assetContract.provider
              .getTransactionReceipt(tnx_hash)
              .then((res) => {
                console.log('getTransactionReceipt: ', res)
              })
              .catch(e => {
                console.log('tnx_receipt_exception: ', e)
              })
              .finally(() => {
                console.log('finally called')
                setIsNeedRefresh(true)
                setAttemptingTxn(false)
                setShowConfirm(false)
              })
          })
      }

      checkTnx()

    }, [account, chainId, library]
  )

  const handleStakeLP = useCallback(
    async (amount: BigNumber, token: Token | undefined) => {
      if (!chainId || !library || !account || !token) return
      setShowConfirm(true)
      setAttemptingTxn(true)
      setIsLPStakeModalOpen(false)
      const masterPlatypusContract = getMasterPlatypusContract(chainId, library, account)
      let tnx_hash = ''
      const lpID =
        token.symbol === 'DAI' ? DAI_LP_ID :
          token.symbol === 'USDC' ? USDC_LP_ID :
            token.symbol === 'USDT' ? USDT_LP_ID : '0'

      await masterPlatypusContract.stakingLP(lpID, amount)
        .then((response) => {
          console.log('stakingLP: ', response)
          // setAttemptingTxn(false)          
          setTxHash(response.hash)
          tnx_hash = response.hash
        })
        .catch((e) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx          
          if (e?.code !== 4001) {
            console.error(e)
            setErrMessage(e.message)
          } else {
            setShowConfirm(false)
          }
        })

      const checkTnx = async () => {
        if (tnx_hash === '') return
        masterPlatypusContract
          .once('LPStaked', (owner, tokenAddr, amt) => {
            console.log('== LPStaked ==')
            console.log('owner: ', owner)
            console.log('tokenAddr: ', tokenAddr)
            console.log('amount: ', parseInt(amt._hex, 16) / (10 ** 18))

            masterPlatypusContract.provider
              .getTransactionReceipt(tnx_hash)
              .then((res) => {
                console.log('getTransactionReceipt: ', res)
              })
              .catch(e => {
                console.log('tnx_receipt_exception: ', e)
              })
              .finally(() => {
                console.log('finally called')
                setIsNeedRefresh(true)
                setAttemptingTxn(false)
              })
          })
      }

      checkTnx()
    }, [account, chainId, library]
  )

  const handleUnStakeLP = useCallback(
    async (amount: BigNumber, token: Token | undefined) => {
      if (!chainId || !library || !account || !token) return
      setShowConfirm(true)
      setAttemptingTxn(true)
      setIsLPUnStakeModalOpen(false)
      const masterPlatypusContract = getMasterPlatypusContract(chainId, library, account)
      let tnx_hash = ''
      const lpID =
        token.symbol === 'DAI' ? DAI_LP_ID :
          token.symbol === 'USDC' ? USDC_LP_ID :
            token.symbol === 'USDT' ? USDT_LP_ID : '0'

      console.log('Unstake LP Amount: ', amount)
      await masterPlatypusContract.unStakingLP(lpID, amount)
        .then((response) => {
          console.log('unStakingLP: ', response)
          // setAttemptingTxn(false)          
          setTxHash(response.hash)
          tnx_hash = response.hash
        })
        .catch((e) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx          
          if (e?.code !== 4001) {
            console.error(e)
            setErrMessage(e.message)
          } else {
            setShowConfirm(false)
          }
        })

      const checkTnx = async () => {
        if (tnx_hash === '') return
        masterPlatypusContract
          .once('LPUnStaked', (owner, tokenAddr, amt) => {
            console.log('== LPUnStaked ==')
            console.log('owner: ', owner)
            console.log('tokenAddr: ', tokenAddr)
            console.log('amount: ', parseInt(amt._hex, 16) / (10 ** 18))

            masterPlatypusContract.provider
              .getTransactionReceipt(tnx_hash)
              .then((res) => {
                console.log('getTransactionReceipt: ', res)
              })
              .catch(e => {
                console.log('tnx_receipt_exception: ', e)
              })
              .finally(() => {
                console.log('finally called')
                setIsNeedRefresh(true)
                setAttemptingTxn(false)
              })
          })
      }

      checkTnx()
    }, [account, chainId, library]
  )

  const handleClaimPTP = useCallback(
    async (token: Token | undefined) => {
      if (!chainId || !library || !account || !token) return
      setShowConfirm(true)
      setAttemptingTxn(true)
      setIsPTPClaimModalOpen(false)
      const masterPlatypusContract = getMasterPlatypusContract(chainId, library, account)
      let tnx_hash = ''
      const lpID =
        token.symbol === 'DAI' ? DAI_LP_ID :
          token.symbol === 'USDC' ? USDC_LP_ID :
            token.symbol === 'USDT' ? USDT_LP_ID : '0'

      await masterPlatypusContract.claimPTP(lpID)
        .then((response) => {
          console.log('ClaimPTP: ', response)
          // setAttemptingTxn(false)          
          setTxHash(response.hash)
          tnx_hash = response.hash
        })
        .catch((e) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx          
          if (e?.code !== 4001) {
            console.error(e)
            setErrMessage(e.message)
          } else {
            setShowConfirm(false)
          }
        })

      const checkTnx = async () => {
        if (tnx_hash === '') return
        masterPlatypusContract
          .once('PTPClaimed', (owner, amt) => {
            console.log('== ClaimPTP: PTPClaimed ==')
            console.log('owner: ', owner)
            console.log('amount: ', parseInt(amt._hex, 16) / (10 ** 18))

            masterPlatypusContract.provider
              .getTransactionReceipt(tnx_hash)
              .then((res) => {
                console.log('getTransactionReceipt: ', res)
              })
              .catch(e => {
                console.log('tnx_receipt_exception: ', e)
              })
              .finally(() => {
                console.log('finally called')
                setIsNeedRefresh(true)
                setAttemptingTxn(false)
              })
          })
      }

      checkTnx()
    }, [account, chainId, library]
  )

  const handleMultiClaimPTP = useCallback(
    async () => {
      if (!chainId || !library || !account) return
      setShowConfirm(true)
      setAttemptingTxn(true)
      setIsPTPClaimModalOpen(false)
      const masterPlatypusContract = getMasterPlatypusContract(chainId, library, account)
      let tnx_hash = ''

      await masterPlatypusContract.multiClaimPTP()
        .then((response) => {
          console.log('MultiClaimPTP: ', response)
          // setAttemptingTxn(false)          
          setTxHash(response.hash)
          tnx_hash = response.hash
        })
        .catch((e) => {
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx          
          if (e?.code !== 4001) {
            console.error(e)
            setErrMessage(e.message)
          } else {
            setShowConfirm(false)
          }
        })

      const checkTnx = async () => {
        if (tnx_hash === '') return
        masterPlatypusContract
          .once('PTPClaimed', (owner, amt) => {
            console.log('== ClaimPTP: PTPClaimed ==')
            console.log('owner: ', owner)
            console.log('amount: ', parseInt(amt._hex, 16) / (10 ** 18))

            masterPlatypusContract.provider
              .getTransactionReceipt(tnx_hash)
              .then((res) => {
                console.log('getTransactionReceipt: ', res)
              })
              .catch(e => {
                console.log('tnx_receipt_exception: ', e)
              })
              .finally(() => {
                console.log('finally called')
                setIsNeedRefresh(true)
                setAttemptingTxn(false)
              })
          })
      }

      checkTnx()
    }, [account, chainId, library]
  )

  const handleRefresh = useCallback(
    () => {
      setIsNeedRefresh(true)
    }, []
  )

  useEffect(() => {
    if (!chainId || !library || !account) return
    setIsNeedRefresh(true)
  }, [account, library, chainId])

  useEffect(() => {
    // if (!isNeedRefresh) return undefined
    const getBaseData = async () => {
      if (!chainId || !library || !account) return
      const baseDatas = await Promise.all(Object.values(allTokens).map(async (token) => {
        const tokenAddress =
          token.symbol === 'DAI' ? ASSET_DAI_ADDRESS :
            token.symbol === 'USDC' ? ASSET_USDC_ADDRESS :
              token.symbol === 'USDT' ? ASSET_USDT_ADDRESS : '0x'

        const lpID =
          token.symbol === 'DAI' ? DAI_LP_ID :
            token.symbol === 'USDC' ? USDC_LP_ID :
              token.symbol === 'USDT' ? USDT_LP_ID : '0'

        const assetContract = getAssetContract(chainId, tokenAddress, library, account)
        const priceProviderContract = getPriceProviderContract(chainId, library, account)
        const erc20Contract = getERC20Contract(chainId, token.address, library, account)
        const masterPlatypusContract = getMasterPlatypusContract(chainId, library, account)
        const vePTPContract = getVePTPContract(chainId, library, account)
        const PTPContract = getPTPContract(chainId, library, account)

        const getVolume24h = async () => {
          const res = await fetch(volume24_url.concat('get_tnx_amount_24h/').concat(token.address))
          return res.json()
        }

        return Promise.all([
          assetContract.totalSupply(),
          assetContract.balanceOf(account),
          assetContract.cash(),
          assetContract.liability(),
          priceProviderContract.getAssetPrice(token.address),
          erc20Contract.allowance(account, POOL_ADDRESS),
          assetContract.allowance(account, POOL_ADDRESS),
          assetContract.allowance(account, MASTER_PLATYPUS_ADDRESS),
          masterPlatypusContract.lpStakedInfo(lpID, account),
          getVolume24h(),
          masterPlatypusContract.multiLpStakedInfo(account),
          masterPlatypusContract.rewardFactorVePTP(),
          vePTPContract.balanceOf(account),
          masterPlatypusContract.ptpStakedInfo(account),
          masterPlatypusContract.baseAPR(lpID),
          masterPlatypusContract.boostedAPR(lpID, account),
          masterPlatypusContract.medianBoostedAPR(lpID),
          masterPlatypusContract.coverageRatio(lpID),
          PTPContract.allowance(account, MASTER_PLATYPUS_ADDRESS)
        ])
          .then(response => {
            const totalSupply = BigNumber.from(response[0]._hex)
            const balanceOf = BigNumber.from(response[1]._hex)
            const poolShare = norValue(totalSupply) === 0 ? 0 : norValue(balanceOf) * 100 / norValue(totalSupply)
            const cash = BigNumber.from(response[2]._hex)
            const liability = BigNumber.from(response[3]._hex)
            const price = BigNumber.from(response[4]._hex) // decimals = 8
            const allowance = BigNumber.from(response[5]._hex)
            const allowance_lp_pool = BigNumber.from(response[6]._hex)
            const allowance_lp_master = BigNumber.from(response[7]._hex)
            const stakedLPAmount = BigNumber.from(response[8].lpAmount._hex)
            const rewardablePTPAmount = BigNumber.from(response[8].rewardAmount._hex)
            const volume24h = response[9].status === 'success' ? response[9].volume24 : 0
            const multiRewardablePTPAmount = BigNumber.from(response[10][0]._hex)
            const rewardFactorVePTP = BigNumber.from(response[11]._hex)
            const vePTPBalance = BigNumber.from(response[12]._hex)
            const stakedPTPAmount = BigNumber.from(response[13].ptpAmount._hex)
            const baseAPR = BigNumber.from(response[14]._hex)
            const boostAPR = BigNumber.from(response[15]._hex)
            const medianBoostedAPR = BigNumber.from(response[16]._hex)
            const coverageRatio = BigNumber.from(response[17]._hex)
            const allowance_ptp_master = BigNumber.from(response[18]._hex)

            setTotalRewardablePTPAmount(norValue(multiRewardablePTPAmount) * 10 ** PTP.decimals)

            const bData: PoolItemBaseData = {
              'symbol': token.symbol,
              'address': token.address,
              'totalSupply': totalSupply,
              'balanceOf': balanceOf,
              'cash': cash,
              'liability': liability,
              'poolShare': poolShare,
              'price': price,
              'allowance': allowance,
              'allowance_lp_pool': allowance_lp_pool,
              'allowance_lp_master': allowance_lp_master,
              'volume24': volume24h,
              'stakedLPAmount': stakedLPAmount,
              'rewardablePTPAmount': rewardablePTPAmount,
              'multiRewardablePTPAmount': multiRewardablePTPAmount,
              'rewardFactorVePTP': rewardFactorVePTP,
              'vePTPBalance': vePTPBalance,
              'stakedPTPAmount': stakedPTPAmount,
              'baseAPR': baseAPR,
              'boostAPR': boostAPR,
              'medianBoostedAPR': medianBoostedAPR,
              'coverageRatio': coverageRatio,
              'allowance_ptp_master': allowance_ptp_master
            }
            return bData
          })
          .catch((e) => {
            console.error(e)
            const bData: PoolItemBaseData = {
              'symbol': token.symbol,
              'address': token.address,
              'totalSupply': BigNumber.from(0),
              'balanceOf': BigNumber.from(0),
              'cash': BigNumber.from(0),
              'liability': BigNumber.from(0),
              'poolShare': 0,
              'price': BigNumber.from(0),
              'allowance': BigNumber.from(0),
              'allowance_lp_master': BigNumber.from(0),
              'allowance_lp_pool': BigNumber.from(0),
              'volume24': 0,
              'stakedLPAmount': BigNumber.from(0),
              'rewardablePTPAmount': BigNumber.from(0),
              'multiRewardablePTPAmount': BigNumber.from(0),
              'rewardFactorVePTP': BigNumber.from(0),
              'vePTPBalance': BigNumber.from(0),
              'stakedPTPAmount': BigNumber.from(0),
              'baseAPR': BigNumber.from(0),
              'boostAPR': BigNumber.from(0),
              'medianBoostedAPR': BigNumber.from(0),
              'coverageRatio': BigNumber.from(0),
              'allowance_ptp_master': BigNumber.from(0)
            }
            return bData
          })

      }))
        .then(response => {
          return response
        })
        .catch((e) => {
          console.log(e)
          return []
        })

      let isSameData = true
      if (baseData.length > 0) {
        for (let i = 0; i < baseData.length; i++) {
          const bd = baseData[i]
          const bds = baseDatas[i]
          if (bd.symbol !== bds.symbol) isSameData = false
          if (bd.address.toLowerCase() !== bds.address.toLowerCase()) isSameData = false
          if (!(bd.totalSupply.eq(bds.totalSupply))) isSameData = false
          if (!(bd.balanceOf.eq(bds.balanceOf))) isSameData = false
          if (!(bd.cash.eq(bds.cash))) isSameData = false
          if (!(bd.liability.eq(bds.liability))) isSameData = false
          if (bd.poolShare !== bds.poolShare) isSameData = false
          if (!(bd.price.eq(bds.price))) isSameData = false
          if (!(bd.allowance.eq(bds.allowance))) isSameData = false
          if (!(bd.allowance_lp_master.eq(bds.allowance_lp_master))) isSameData = false
          if (!(bd.allowance_lp_pool.eq(bds.allowance_lp_pool))) isSameData = false
          if (bd.volume24 !== bds.volume24) isSameData = false
          if (!(bd.stakedLPAmount.eq(bds.stakedLPAmount))) isSameData = false
          if (!(bd.rewardablePTPAmount.eq(bds.rewardablePTPAmount))) isSameData = false
          if (!(bd.multiRewardablePTPAmount.eq(bds.multiRewardablePTPAmount))) isSameData = false
          if (!(bd.rewardFactorVePTP.eq(bds.rewardFactorVePTP))) isSameData = false
          if (!(bd.vePTPBalance.eq(bds.vePTPBalance))) isSameData = false
          if (!(bd.stakedPTPAmount.eq(bds.stakedPTPAmount))) isSameData = false
          if (!(bd.baseAPR.eq(bds.baseAPR))) isSameData = false
          if (!(bd.boostAPR.eq(bds.boostAPR))) isSameData = false
          if (!(bd.medianBoostedAPR.eq(bds.medianBoostedAPR))) isSameData = false
          if (!(bd.coverageRatio.eq(bds.coverageRatio))) isSameData = false
        }

        if (!isSameData) {
          setBaseData(baseDatas)
        }
      } else {
        setBaseData(baseDatas)
      }

      setIsNeedRefresh(false)
      console.log('baseData: ', baseDatas)

      if (selectedToken !== undefined) {
        const oneData = baseData.find((d) => d.address.toLowerCase() === selectedToken.address.toLowerCase())
        setSelectedData(oneData)
      }
    }

    getBaseData()

    const interval = setInterval(() => {
      getBaseData()
    }, 20000);

    return () => window.clearInterval(interval);
  }, [account, chainId, library, allTokens, isNeedRefresh, baseData, selectedToken])

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setTxHash('')
  }, [])

  const pendingText = 'Waiting For Confirmation.'
  const popupDesc = 'Your deposited tokens will appear in the Pool as soon as Pool has had a chance to read the updated blockchain.'

  const MaxWidthDiv = styled.div`
    width: 100%;
    max-width: 950px;
  `
  const borderRadius7 = {
    borderRadius: '5px',
    border: '1px solid #ff720d'
  }

  const CenterContainer = styled.div<any>`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: ${({ padding }) => padding};
  `

  const verticalCenterContainerStyle = {
    height: '100%',
    display: 'flex',
    alignItems: 'center'
  }

  return (
    <>
      {/* <MyMenu/> */}
      <DepositModal
        isOpen={isDepositModalOpen}
        token={selectedToken}
        baseData={selectedData}
        onDismiss={closeDepositModal}
        onApprove={handleApprove}
        onDeposit={handleDeposit}
        onRefresh={handleRefresh}
      />

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        token={selectedToken}
        baseData={selectedData}
        onDismiss={closeWithdrawModal}
        onApprove={handleApproveWithdraw}
        onWithdraw={handleWithdraw}
        onRefresh={handleRefresh}
      />

      <LPStakeModal
        isOpen={isLPStakeModalOpen}
        token={selectedToken}
        baseData={selectedData}
        onDismiss={closeLPStakeModal}
        onApprove={handleApproveLPStaking}
        onStakeLP={handleStakeLP}
        onRefresh={handleRefresh}
      />

      <LPUnStakeModal
        isOpen={isLPUnStakeModalOpen}
        token={selectedToken}
        baseData={selectedData}
        onDismiss={closeLPUnStakeModal}
        onApprove={handleApproveLPStaking}
        onUnStakeLP={handleUnStakeLP}
        onRefresh={handleRefresh}
      />

      <PTPClaimModal
        isOpen={isPTPClaimModalOpen}
        token={selectedToken}
        baseData={selectedData}
        onDismiss={closePTPClaimModal}
        onClaimPTP={handleClaimPTP}
        onRefresh={handleRefresh}
      />

      <AutoProModal
        isOpen={isAutoProModalOpen}
        baseData={baseData}
        preBaseData={preBaseData}
        setPreBaseData={setPreBaseData}
        onDismiss={closeAutoProModal}
        onShowPopup={showPop}
        onRemovePopup={removePop}
      />

      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        content={() => (
          <TransactionErrorContent
            message={errMessage}
            onDismiss={handleDismissConfirmation}
          />
        )}
        pendingText={pendingText}
      />

      <CardNav activeIndex={2} />
      <MaxWidthDiv>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Button size='sm' onClick={openAutoProModal}>Get Started Investing In MARKET</Button>          
        </div>
        <LightCard className="mt-4 ml-1">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              {
                totalRewardablePTPAmount > 0.01 ? (
                  <div>
                    <CenterContainer>
                      <Text style={verticalCenterContainerStyle}>Pools Earning: <CurrencyLogo currency={PTP} size="20px" style={{ marginLeft: '5px', marginRight: '5px' }} /> {`${formatCurrency(nDecimals(6, totalRewardablePTPAmount), 2)} MARKET`}</Text>
                      <Question
                        text={`${totalRewardablePTPAmount} MARKET`}
                      />
                    </CenterContainer>
                  </div>
                ) : (
                  <div>
                    <CenterContainer>
                      <Text style={verticalCenterContainerStyle}>Pools Earning: <CurrencyLogo currency={PTP} size="20px" style={{ marginLeft: '5px', marginRight: '5px' }} /> {`< 0.01 MARKET`}</Text>
                      <Question
                        text={`${totalRewardablePTPAmount} MARKET`}
                      />
                    </CenterContainer>
                  </div>
                )
              }
            </div>
            <Button variant='secondary' size='sm' style={borderRadius7} onClick={handleMultiClaimPTP}>Claim MARKET</Button>
          </div>
        </LightCard>

        {
          Object.values(allTokens).map((onetoken, index) => {
            return (
              <PoolItem
                token={onetoken}
                baseData={baseData.find((d) => d.address.toLowerCase() === onetoken.address.toLowerCase())}
                openDepositModal={openDepositModal(onetoken)}
                openWithdrawModal={openWithdrawModal(onetoken)}
                openLPStakeModal={openLPStakeModal(onetoken)}
                openLPUnStakeModal={openLPUnStakeModal(onetoken)}
                openPTPClaimModal={openPTPClaimModal(onetoken)}
                onRefresh={handleRefresh}
              />
            )
          })
        }
      </MaxWidthDiv>
    </>
  )
}
