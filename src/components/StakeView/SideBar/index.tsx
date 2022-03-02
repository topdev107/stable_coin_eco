import React, { useContext, useState, useCallback } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Text, Button, ChevronDownIcon, CloseIcon } from '@pantherswap-libs/uikit'
import { Token } from '@pantherswap-libs/sdk'
import { right } from '@popperjs/core'
import { Row, Col } from 'react-bootstrap'
import Question from '../../QuestionHelper'
import { DarkblueOutlineCard } from '../../Card'
import CurrencyLogo from '../../CurrencyLogo'
import { TYPE } from '../../Shared'


const SideBar = ({ token, ...rest }: any) => {
  const theme = useContext(ThemeContext)

  const [stakeOpened, setStakeOpened] = useState<boolean>(false);

  const open = useCallback(() => setStakeOpened(true), [setStakeOpened])
  const close = useCallback(() => setStakeOpened(false), [setStakeOpened])

  const FixedHeightStyle = {
    height: '25px',
    display: 'flex',
    alignItems: 'center'
  }

  const VerticalBarStyle = {
    width: '2px',
    height: '25px',
    backgroundColor: '#aaa',
    marginTop: '1px',
    marginBottom: '1px'
  }

  return (
    <Row>
        <Col md={9} xs={6}>
            <div style={FixedHeightStyle}><Text fontSize='12px' className='text-right w-100'>Claim</Text></div>
            <div style={FixedHeightStyle}><Text fontSize='12px' className='text-right w-100'>Stake</Text></div>
            <div style={FixedHeightStyle}><Text fontSize='12px' className='text-right w-100'>Unstake</Text></div>
        </Col>
        <Col md={3} xs={6}>
            <div style={VerticalBarStyle}/>
            <div style={VerticalBarStyle}/>
            <div style={VerticalBarStyle}/>
        </Col>
    </Row>
  )
}

export default SideBar;

