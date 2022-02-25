import React from 'react'
import { useWeb3React } from '@web3-react/core'
import { Button, ButtonProps, ConnectorId, useWalletModal } from '@pantherswap-libs/uikit'
import { injected, walletconnect } from 'connectors'
import styled from 'styled-components'
// import * as CSS from 'csstype';

const ConnectWalletMenuButton: React.FC<ButtonProps> = props => {

  const buttonStyle = {
    width: '150px',
  }

const EllipsisButtonText = styled.div`
  width: 150px;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 150px;
`
  
  const { account, activate, deactivate } = useWeb3React()

  const handleLogin = (connectorId: ConnectorId) => {
    if (connectorId === 'walletconnect') {
      return activate(walletconnect)
    }
    return activate(injected)
  }

  const { onPresentConnectModal } = useWalletModal(
    handleLogin, 
    deactivate, 
    account as string
  );  

  const { onPresentAccountModal } = useWalletModal(
    () => null,
    () => null,
    account as string
  );

  return (
    <div>
      {!account ?
        (<Button style={buttonStyle} size="sm" onClick={onPresentConnectModal} {...props}>
          <EllipsisButtonText>Connect</EllipsisButtonText>
        </Button>) 
        : 
        (<Button style={buttonStyle} size="sm" variant="secondary" onClick={onPresentAccountModal} {...props}>          
          <EllipsisButtonText>{account}</EllipsisButtonText>
        </Button>)
      }    
    </div>
  )
}

export default ConnectWalletMenuButton
