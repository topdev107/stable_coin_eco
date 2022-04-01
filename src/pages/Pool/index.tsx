import { Token } from '@pantherswap-libs/sdk'
import { Button, LogoIcon, Text } from '@pantherswap-libs/uikit'
import { LightCard } from 'components/Card'
import CardNav from 'components/CardNav'
import PoolItem from 'components/PoolItem'
import { useActiveWeb3React } from 'hooks'
import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { Col, Row } from 'react-bootstrap'
import styled from 'styled-components'
import { getAssetContract, getVePTPContract, getPTPContract, getMasterPlatypusContract, getERC20Contract, getPoolContract, getPriceProviderContract, PoolItemBaseData } from 'utils'
import { useTnxHandler } from 'state/tnxs/hooks'
import { useSelector } from 'react-redux'
import { AppState } from 'state'
import { clearInterval } from 'timers'
import { useCurrencyBalance, useTokenBalances } from 'state/wallet/hooks'
import { RowBetween } from 'components/Row'
import DepositModal from '../../components/DepositConfirmModal'
import WithdrawModal from '../../components/WithdrawConfirmModal'
import LPStakeModal from '../../components/LPStakeConfirmModal'
import LPUnStakeModal from '../../components/LPUnStakeConfirmModal'
import PTPClaimModal from '../../components/PTPClaimConfirmModal'
import CurrencyLogo from '../../components/CurrencyLogo'
import TransactionConfirmationModal, { TransactionErrorContent } from '../../components/TransactionConfirmationModal'
import { PTP, USDT_LP_ID, BUSD_LP_ID, DAI_LP_ID, USDC_LP_ID, ASSET_BUSD_ADDRESS, ASSET_DAI_ADDRESS, ASSET_USDC_ADDRESS, ASSET_USDT_ADDRESS, DEFAULT_DEADLINE_FROM_NOW, POOL_ADDRESS, T_FEE, MASTER_PLATYPUS_ADDRESS } from '../../constants'
import { useAllTokens } from '../../hooks/Tokens'
import { useUserSlippageTolerance } from '../../state/user/hooks'


export default function Pool() {
  const allTokens = useAllTokens()

  const { account, chainId, library } = useActiveWeb3React()

  const [baseData, setBaseData] = useState<PoolItemBaseData[]>([])
  const [selectedToken, setSelectedToken] = useState<Token | undefined>();
  const [selectedData, setSelectedData] = useState<PoolItemBaseData | undefined>()
  const [isDepositModalOpen, setIsDepositModalOpen] = useState<boolean>(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [isLPStakeModalOpen, setIsLPStakeModalOpen] = useState<boolean>(false);
  const [isLPUnStakeModalOpen, setIsLPUnStakeModalOpen] = useState<boolean>(false);
  const [isPTPClaimModalOpen, setIsPTPClaimModalOpen] = useState<boolean>(false);
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

  // const volume24_url = 'http://localhost:5000/api/v1/tnxs/'
  const volume24_url = 'https://fathomless-savannah-95001.herokuapp.com/api/v1/tnxs/'

  const handleDeposit = useCallback(
    async (amount: string, tkn: Token | undefined) => {
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
          console.log('== Deposit ==')
          console.log('Sender: ', sender)
          console.log('Token: ', token)
          console.log('Amount: ', parseInt(depositAmount._hex, 16) / (10 ** 18))
          console.log('Liquidity: ', parseInt(liquidity._hex, 16) / (10 ** 18))
          console.log('To: ', to)

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

  const handleWithdraw = useCallback(
    async (amount: string, tkn: Token | undefined) => {
      if (!chainId || !library || !account || !tkn) return
      setShowConfirm(true)
      setIsWithdrawModalOpen(false)
      setAttemptingTxn(true)
      const poolContract = getPoolContract(chainId, library, account)
      const deadline = Date.now() + DEFAULT_DEADLINE_FROM_NOW * 1000

      const minimumAmount = (+amount) - (+amount) * T_FEE
      let tnx_hash = ''
      await poolContract.withdraw(tkn.address, amount, minimumAmount.toString(), account, deadline)
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
            setErrMessage(e.message)
          } else {
            setShowConfirm(false)
          }
        })

      const checkTnx = async () => {
        if (tnx_hash === '') return
        poolContract.once('Withdraw', (sender, token, withdrawAmount, liquidity, to) => {
          console.log('== Withdraw ==')
          console.log('Sender: ', sender)
          console.log('Token: ', token)
          console.log('Amount: ', parseInt(withdrawAmount._hex, 16) / (10 ** 18))
          console.log('Liquidity: ', parseInt(liquidity._hex, 16) / (10 ** 18))
          console.log('To: ', to)

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
    async (amount: string, tkn: Token | undefined) => {
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
                setAttemptingTxn(false)
                setShowConfirm(false)
              })
          })
      }

      checkTnx()
    }, [account, chainId, library]
  )

  const handleApproveWithdraw = useCallback(
    async (amount: string, token: Token | undefined) => {
      if (!chainId || !library || !account || !token) return
      const tokenAddress =
        token.symbol === 'DAI' ? ASSET_DAI_ADDRESS :
          token.symbol === 'USDC' ? ASSET_USDC_ADDRESS :
            token.symbol === 'USDT' ? ASSET_USDT_ADDRESS :
              token.symbol === 'BUSD' ? ASSET_BUSD_ADDRESS : '0x'
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
    async (amount: string, token: Token | undefined) => {
      if (!chainId || !library || !account || !token) return
      const tokenAddress =
        token.symbol === 'DAI' ? ASSET_DAI_ADDRESS :
          token.symbol === 'USDC' ? ASSET_USDC_ADDRESS :
            token.symbol === 'USDT' ? ASSET_USDT_ADDRESS :
              token.symbol === 'BUSD' ? ASSET_BUSD_ADDRESS : '0x'
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
    async (amount: string, token: Token | undefined) => {
      if (!chainId || !library || !account || !token) return
      setShowConfirm(true)
      setAttemptingTxn(true)
      setIsLPStakeModalOpen(false)
      const masterPlatypusContract = getMasterPlatypusContract(chainId, library, account)
      let tnx_hash = ''
      const lpID =
        token.symbol === 'DAI' ? DAI_LP_ID :
          token.symbol === 'USDC' ? USDC_LP_ID :
            token.symbol === 'USDT' ? USDT_LP_ID :
              token.symbol === 'BUSD' ? BUSD_LP_ID : '0'

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
    async (amount: string, token: Token | undefined) => {
      if (!chainId || !library || !account || !token) return
      setShowConfirm(true)
      setAttemptingTxn(true)
      setIsLPUnStakeModalOpen(false)
      const masterPlatypusContract = getMasterPlatypusContract(chainId, library, account)
      let tnx_hash = ''
      const lpID =
        token.symbol === 'DAI' ? DAI_LP_ID :
          token.symbol === 'USDC' ? USDC_LP_ID :
            token.symbol === 'USDT' ? USDT_LP_ID :
              token.symbol === 'BUSD' ? BUSD_LP_ID : '0'

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
            token.symbol === 'USDT' ? USDT_LP_ID :
              token.symbol === 'BUSD' ? BUSD_LP_ID : '0'

      await masterPlatypusContract.multiClaimPTP([lpID])
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
    if (!isNeedRefresh) return undefined
    const getBaseData = async () => {
      if (!chainId || !library || !account) return
      const baseDatas = await Promise.all(Object.values(allTokens).map(async (token) => {
        const tokenAddress =
          token.symbol === 'DAI' ? ASSET_DAI_ADDRESS :
            token.symbol === 'USDC' ? ASSET_USDC_ADDRESS :
              token.symbol === 'USDT' ? ASSET_USDT_ADDRESS :
                token.symbol === 'BUSD' ? ASSET_BUSD_ADDRESS : '0x'

        const lpID =
          token.symbol === 'DAI' ? DAI_LP_ID :
            token.symbol === 'USDC' ? USDC_LP_ID :
              token.symbol === 'USDT' ? USDT_LP_ID :
                token.symbol === 'BUSD' ? BUSD_LP_ID : '0'

        const assetContract = getAssetContract(chainId, tokenAddress, library, account)
        const priceProviderContract = getPriceProviderContract(chainId, library, account)
        const erc20Contract = getERC20Contract(chainId, token.address, library, account)
        const masterPlatypusContract = getMasterPlatypusContract(chainId, library, account)
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
          masterPlatypusContract.multiLpStakedInfo(account)
        ])
          .then(response => {            
            const totalSupply = parseInt(response[0]._hex, 16) / (10 ** 18)
            const balanceOf = parseInt(response[1]._hex, 16) / (10 ** 18)
            const poolShare = totalSupply === 0 ? 0 : balanceOf * 100 / totalSupply
            const cash = parseInt(response[2]._hex, 16) / (10 ** 18)
            const liability = parseInt(response[3]._hex, 16) / (10 ** 18)
            const price = parseInt(response[4]._hex, 16) / (10 ** 8)
            const allowance = parseInt(response[5]._hex, 16) / (10 ** 18)
            const allowance_lp_pool = parseInt(response[6]._hex, 16) / (10 ** 18)
            const allowance_lp_master = parseInt(response[7]._hex, 16) / (10 ** 18)
            const stakedLPAmount = parseInt(response[8].lpAmount._hex, 16) / (10 ** 18)
            const rewardablePTPAmount = parseInt(response[8].rewardAmount._hex, 16) / (10 ** 18)
            const volume24h = response[9].status === 'success' ? response[9].volume24 : 0
            const multiRewardablePTPAmount = parseInt(response[10][0]._hex, 16) / (10 ** 18)

            setTotalRewardablePTPAmount(multiRewardablePTPAmount)

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
              'multiRewardablePTPAmount': multiRewardablePTPAmount
            }
            return bData
          })
          .catch((e) => {
            console.error(e)
            const bData: PoolItemBaseData = {
              'symbol': token.symbol,
              'address': token.address,
              'totalSupply': 0,
              'balanceOf': 0,
              'cash': 0,
              'liability': 0,
              'poolShare': 0,
              'price': 0,
              'allowance': 0,
              'allowance_lp_master': 0,
              'allowance_lp_pool': 0,
              'volume24': 0,
              'stakedLPAmount': 0,
              'rewardablePTPAmount': 0,
              'multiRewardablePTPAmount': 0
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

      setBaseData(baseDatas)
      // setIsNeedRefresh(false)
      console.log('baseData: ', baseDatas)

      if (selectedToken !== undefined) {
        const oneData = baseData.find((d) => d.address.toLowerCase() === selectedToken.address.toLowerCase())
        setSelectedData(oneData)
      }
    }

    const interval = setInterval(() => {
      getBaseData()
    }, 20000);
    
    return () => window.clearInterval(interval);
    // getBaseData() 

  }, [account, chainId, library, allTokens, isNeedRefresh, baseData, selectedToken])

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setTxHash('')
  }, [])

  const pendingText = 'Waiting For Confirmation.'

  const MaxWidthDiv = styled.div`
    width: 100%;
    max-width: 900px;
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

      <CardNav activeIndex={1} />
      <MaxWidthDiv>
        <LightCard className="mt-2 ml-1">
          <RowBetween>
            <Text style={verticalCenterContainerStyle}>Pools Earning: <CurrencyLogo currency={PTP} size="20px" style={{ marginLeft: '5px', marginRight: '5px' }} /> {`${totalRewardablePTPAmount} PTP`}</Text>
            <Button variant='secondary' size='sm' style={borderRadius7} >Claim PTP</Button>
          </RowBetween>
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
