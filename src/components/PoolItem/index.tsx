import { Token } from '@pantherswap-libs/sdk'
import { Button, ChevronDownIcon, CloseIcon, Text } from '@pantherswap-libs/uikit'
import React, { useCallback, useContext, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import styled, { ThemeContext } from 'styled-components'
import { PoolItemBaseData, nDecimals } from 'utils'
import { useActiveWeb3React } from '../../hooks'
import { DarkblueOutlineCard } from '../Card'
import CurrencyLogo from '../CurrencyLogo'
import Question from '../QuestionHelper'
import { TYPE } from '../Shared'
import StakeView from "../StakeView"




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

interface PoolItemProps {
  token: Token | undefined
  baseData: PoolItemBaseData | undefined
  openDepositModal: () => void
}

export default function PoolItem({
  token,
  baseData,
  openDepositModal
}: PoolItemProps) {
  const theme = useContext(ThemeContext)

  const [stakeOpened, setStakeOpened] = useState<boolean>(false);

  const open = useCallback(() => setStakeOpened(true), [setStakeOpened])
  const close = useCallback(() => setStakeOpened(false), [setStakeOpened])

  const { account, chainId, library } = useActiveWeb3React()

  return (
    <>
      <DarkblueOutlineCard padding="0px">
        <Body color={theme.colors.textDisabled} textAlign="center">
          <PaddingDiv padding="0px">
            <Row>
              <Col md={3} sm={12} className="mt-3 mb-2">
                <CenterContainer>
                  <div>
                    <CenterContainer>
                      <CurrencyLogo currency={token} size="30px" />
                      <Text ml={2}>{token?.symbol}</Text>
                    </CenterContainer>
                    <PaddingDiv padding="3px" />
                    <CenterContainer>
                      <div className='text-right'>
                        <Text color='#888888' fontSize='10px'>
                          <LineHeightedTextDiv>
                            Coverage
                          </LineHeightedTextDiv>
                        </Text>
                        <Text color='#888888' fontSize='10px'>
                          <LineHeightedTextDiv>
                            Ratio
                          </LineHeightedTextDiv>
                        </Text>
                      </div>
                      <div>
                        <CenterVerticalContainer>
                          <Text ml={2} fontSize='12px'>93.31%</Text>
                          <Question
                            text='The coverage ratio is the asset-to-liability ratio of a pool. It determines the swapping slippage, withdrawal and deposit fee in our protocol.'
                          />
                        </CenterVerticalContainer>
                      </div>
                    </CenterContainer>
                  </div>
                </CenterContainer>
              </Col>
              <Col md={5} sm={12}>
                <Row>
                  <Col md={4} sm={4} className="mt-3 mb-2">
                    <CenterContainer>
                      <div>
                        <Text color='#888888' fontSize='12px'>Pool Deposits</Text>
                        {
                          baseData === undefined ?
                            <Text>$0</Text> :
                            <Text>{`$${nDecimals(2,baseData.totalSupply * baseData.price)}`}</Text>
                        }
                        <Text color='#888888' fontSize='12px'>{`${baseData?.totalSupply}${token?.symbol}`}</Text>
                      </div>
                    </CenterContainer>
                  </Col>
                  <Col md={4} sm={4} className="mt-3 mb-2">
                    <CenterContainer>
                      <div>
                        <Text color='#888888' fontSize='12px'>Volume(24H)</Text>
                        {
                          baseData === undefined ?
                            <Text>$0</Text> :
                            <Text>{`$${nDecimals(2,baseData.volume24 * baseData.price)}`}</Text>
                        }                        
                        <Text color='#888888' fontSize='12px'>{`${baseData?.volume24}${token?.symbol}`}</Text>
                      </div>
                    </CenterContainer>
                  </Col>
                  <Col md={4} sm={4} className="mt-3 mb-2">
                    <CenterContainer>
                      <div>
                        <Text color='#888888' fontSize='12px'>My Deposits</Text>
                        {
                          baseData === undefined ?
                            <Text>$0</Text> :
                            <Text>{`$${nDecimals(2,baseData.balanceOf * baseData.price)}`}</Text>
                        }
                        <Text color='#888888' fontSize='12px'>{`${baseData?.balanceOf}${token?.symbol}`}</Text>
                      </div>
                    </CenterContainer>
                  </Col>
                </Row>
              </Col>
              <Col md={4} sm={12} className="mt-3 mb-2">
                <CenterContainer style={verticalCenterContainerStyle}>
                  <CenterVerticalContainer>
                    <Row>
                      <Button size='sm' style={borderRadius7} variant='secondary' onClick={openDepositModal}>Deposit</Button>
                      <Button size='sm' style={borderRadius7} variant='secondary' className="ml-2" >Withdraw</Button>
                    </Row>
                  </CenterVerticalContainer>
                </CenterContainer>
              </Col>
            </Row>
          </PaddingDiv>

          <SeperaterLine />
          <PaddingDiv padding="0px">
            <Row>
              <Col md={2} sm={6} className="mt-2 mb-3">
                <CenterContainer>
                  <div className='mt-1'>
                    <CenterContainer>
                      <Text color='#888888' fontSize='10px' className="mr-1">Reward</Text>
                      <CurrencyLogo currency={token} size="15px" />
                    </CenterContainer>
                  </div>
                </CenterContainer>
              </Col>
              <Col md={2} sm={6} className="mt-2 mb-3">
                <CenterContainer>
                  <div>
                    <CenterContainer>
                      <Text color='#888888' fontSize='10px' className="mr-1">Base APR</Text>
                      <Text fontSize='11px'>7.8%</Text>
                      <Question
                        text={`Base APR of this pool for the users who have deposited and staked ${token?.symbol}`}
                      />
                    </CenterContainer>
                  </div>
                </CenterContainer>
              </Col>
              <Col md={3} sm={6} className="mt-2 mb-3">
                <CenterContainer>
                  <div>
                    <CenterContainer>
                      <Text color='#888888' fontSize='10px' className="mr-1">Median Boosted APR</Text>
                      <Text fontSize='11px'>29.4%</Text>
                      <Question
                        text={`The median boosted APR of this pool for the users who have staked ${token?.symbol} and hold vePTP. Half of the users get higher than the median APR. It does not include the Base APR.`}
                      />
                    </CenterContainer>
                  </div>
                </CenterContainer>
              </Col>
              <Col md={3} sm={6} className="mt-2 mb-3">
                <CenterContainer>
                  <div>
                    <CenterContainer>
                      <Text color='#888888' fontSize='10px' className="mr-1">My Boosted APR</Text>
                      <Text fontSize='11px'>0.0%</Text>
                      <Question
                        text={`The exact boosted APR you are currently earning at. The value depends on your vePTP balance and staked ${token?.symbol} amount.`}
                      />
                    </CenterContainer>
                  </div>
                </CenterContainer>
              </Col>
              <Col md={2} sm={6} className="mt-2 mb-3">
                <CenterContainer>
                  {
                    stakeOpened ?
                      <CloseIcon onClick={close} />
                      :
                      <Button size='sm' onClick={open}>Stake<ChevronDownIcon /></Button>
                  }
                </CenterContainer>
              </Col>
            </Row>
            {
              stakeOpened ? (
                <StakeView token={token} />
              ) : (
                <></>
              )
            }
          </PaddingDiv>
        </Body>
      </DarkblueOutlineCard>
    </>
  )
}

