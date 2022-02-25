import React from 'react'
import { useWeb3React } from '@web3-react/core'
import { Button, ButtonProps, ConnectorId, useWalletModal } from '@pantherswap-libs/uikit'
import { injected, walletconnect } from 'connectors'


const ConnectWalletMenuButton: React.FC<ButtonProps> = props => {
  
  const { account, activate, deactivate } = useWeb3React()

  const handleLogin = (connectorId: ConnectorId) => {
    if (connectorId === 'walletconnect') {
      return activate(walletconnect)
    }
    return activate(injected)
  }

  const { onPresentConnectModal } = useWalletModal(handleLogin, deactivate, account as string)  

  const { onPresentAccountModal } = useWalletModal(
    () => null,
    () => null,
    account as string
  );

  return (
    <div>
      {!account ?
        (<Button onClick={onPresentConnectModal} {...props}>
          Connect
        </Button>) 
        : 
        (<Button variant="secondary" onClick={onPresentAccountModal} {...props}>
          {account}
        </Button>)
      }    
    </div>
  )
}

export default ConnectWalletMenuButton
