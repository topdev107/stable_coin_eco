import React, { useContext, useState, useCallback } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Text, Button, ChevronDownIcon, CloseIcon } from '@pantherswap-libs/uikit'
import { Token } from '@pantherswap-libs/sdk'
import { Row, Col } from 'react-bootstrap'
import Question from '../QuestionHelper'
import { DarkblueOutlineCard } from '../Card'
import CurrencyLogo from '../CurrencyLogo'
import { TYPE } from '../Shared'
import SideBar from './SideBar'

const { body: Body } = TYPE

const SeperaterLine = styled.div`  
  background-color: ${({ theme }) => theme.colors.textDisabled};
  width: 100%;
  height: 1px;
`
const PaddingDiv = styled.div<any>`
    padding: ${({ padding }) => padding};
`
const CenterContainer = styled.div<any>`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: ${({ padding }) => padding};
`
const CenterVerticalContainer = styled.div<any>`
    height: 100%;
    display: flex;
    align-items: center;
    padding: ${({ padding }) => padding};
`

const LineHeightedTextDiv = styled.div<any>`
  line-height: 1
`
const borderRadius7 = {
  borderRadius: '5px',
  border: '1px solid #ff720d'
}

const verticalCenterContainerStyle = {
  height: '100%',
  display: 'flex',
  alignItems: 'center'
}

const cardAreaStyle = {
  marginTop: '1px',
  width: '90%',
  height: '75px',
  backgroundColor: '#ffdfdd'
}

const StakeView = ({ token, ...rest }: any) => {
  const theme = useContext(ThemeContext)

  const [stakeOpened, setStakeOpened] = useState<boolean>(false);

  const open = useCallback(() => setStakeOpened(true), [setStakeOpened])
  const close = useCallback(() => setStakeOpened(false), [setStakeOpened])

  return (
    <Body color={theme.colors.textDisabled} textAlign="center">
      <PaddingDiv padding="0px">
        <Row>
          <Col md={3}>
            <SideBar />
          </Col>
          <Col md={4}>
            <div style={cardAreaStyle} />
          </Col>
          <Col md={3}>
            <Button>Stake All</Button>
          </Col>
        </Row>
      </PaddingDiv>
    </Body>
  )
}

export default StakeView;

