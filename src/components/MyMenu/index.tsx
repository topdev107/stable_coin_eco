import React from 'react'
import styled from 'styled-components'
import { Heading } from '@pantherswap-libs/uikit'
import ConnectWalletMenuButton from 'components/ConnectWalletMenuButton'
// import * as CSS from 'csstype';

const TopBar = styled.div`
  width: 100%;
  height: 70px;
  background-color: #0e1a35;
  border-bottom: 2px solid #ff720d;
  position: relative;
  display: inline-block;
`
const HeadingArea = styled.div`
  margin: 0;
  position: absolute;
  left: 20px;
  top: 50%;
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
`
const ConnectButtonArea = styled.div`
  float: right;
  margin: 0;
  position: absolute;
  right: 20px;  
  top: 50%;
  -ms-transform: translateY(-50%);
  transform: translateY(-50%);
`

const MyMenu: React.FC = () => {
  
  return (
    <TopBar>
      <HeadingArea>
        <Heading size="lg">Platypus</Heading>
      </HeadingArea>      
      <ConnectButtonArea>       
        <ConnectWalletMenuButton/>
      </ConnectButtonArea>      
    </TopBar>
  )
}

export default MyMenu
