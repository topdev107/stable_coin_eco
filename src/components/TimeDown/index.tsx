import React, { useMemo, useState, useEffect } from 'react'
import { Text } from '@pantherswap-libs/uikit'
import { BigNumber } from 'ethers'
import { pad } from 'utils'

interface TimeDownProps {
  lockedTimestamp: BigNumber,
  lockedDeadline: BigNumber,
  curTimestamp: BigNumber
}

export default function TimeDown({
  lockedTimestamp,
  lockedDeadline,
  curTimestamp
}: TimeDownProps) {

  // const [expireTime, setExpireTime] = useState<string>('')
  const [lockDeadline, setLockDeadline] = useState<number>(0)

  useEffect(
    () => {
      let ldeadline = lockedTimestamp.add(lockedDeadline).gte(curTimestamp) ? lockedTimestamp.add(lockedDeadline).sub(curTimestamp).toNumber() : 0
      const interval = setInterval(() => {
        ldeadline = ldeadline > 1 ? ldeadline - 1 : 0
        setLockDeadline(ldeadline)        
      }, 1000);

      return () => window.clearInterval(interval);
    }, [lockedTimestamp, lockedDeadline, curTimestamp]
  )

  const expireTime = useMemo(() => {
    const lweeks = Math.floor(lockDeadline / 604800)
    const ldays = Math.floor(lockDeadline % 604800 / 86400)
    const lhours = Math.floor(lockDeadline % 86400 / 3600)
    const lminutes = Math.floor(lockDeadline % 3600 / 60)
    const lseconds = Math.floor(lockDeadline % 60)
    const expiretime = lweeks > 0 ? `${lweeks} weeks ${ldays} days` :
      ldays > 0 ? `${ldays} days ${pad(lhours)} hours` : `${pad(lhours)}:${pad(lminutes)}:${pad(lseconds)}`
    
    return expiretime
  }, [lockDeadline])

  // useEffect(
  //   () => {
  //     let ldeadline = lockedTimestamp.add(lockedDeadline).gte(curTimestamp) ? lockedTimestamp.add(lockedDeadline).sub(curTimestamp).toNumber() : 0
  //     const interval = setInterval(() => {
  //       ldeadline = ldeadline > 1 ? ldeadline - 1 : 0
  //       const lweeks = Math.floor(ldeadline / 604800)
  //       const ldays = Math.floor(ldeadline % 604800 / 86400)
  //       const lhours = Math.floor(ldeadline % 86400 / 3600)
  //       const lminutes = Math.floor(ldeadline % 3600 / 60)
  //       const lseconds = Math.floor(ldeadline % 60)
  //       const expiretime = lweeks > 0 ? `${lweeks} weeks ${ldays} days` :
  //         ldays > 0 ? `${ldays} days ${pad(lhours)} hours` : `${pad(lhours)}:${pad(lminutes)}:${pad(lseconds)}`
  //       setExpireTime(expiretime)
  //     }, 1000);

  //     return () => window.clearInterval(interval);
  //   }, [lockedTimestamp, lockedDeadline, curTimestamp]
  // )

  return (
    <>
      {
        lockedTimestamp.add(lockedDeadline).lt(curTimestamp) ? (
          <></>
        ) : (<Text color='#f00'>{expireTime}</Text>)
      }      
    </>
  )
}
