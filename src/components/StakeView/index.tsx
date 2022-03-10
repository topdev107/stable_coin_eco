import { Button, Text } from '@pantherswap-libs/uikit'
import React, { useContext, useState } from 'react'
import { Col, Form, Row } from 'react-bootstrap'
import styled, { ThemeContext } from 'styled-components'
import { GreyCard } from '../Card'
import Question, { QuestionColorHelper } from '../QuestionHelper'
import { TYPE } from '../Shared'

const { body: Body } = TYPE

const PaddingDiv = styled.div<any>`
    padding: ${({ padding }) => padding};
`
const PaddingBottomDiv = styled.div<any>`
    padding-bottom: ${({ paddingBottom }) => paddingBottom};
`

const CenterVerticalContainer = styled.div<any>`
    height: 100%;
    display: flex;
    align-items: center;
    padding: ${({ padding }) => padding};
`

const verticalCenterContainerStyle = {
  height: '75px',
  display: 'flex',
  alignItems: 'center'
}

const verticalCenterContainerStyle100 = {
  height: '100%',
  display: 'flex',
  alignItems: 'center'
}

const borderRadius7 = {
  borderRadius: '5px'
}

const RadioColorOrangeStyle = {
  color: 'white',
  accentColor: '#ff720d'
}

export default function StakeView ({ token, staked, ...rest }: any) {
  const theme = useContext(ThemeContext)

  const [radio, setRadio] = useState("stake"); // claim, stake, unstake

  const handleChange = (evt) => {  
    const { value } = evt.target;
    setRadio(value);
  };


  return (
    <Body color={theme.colors.textDisabled} textAlign="center">
      <PaddingBottomDiv paddingBottom="20px">
        <Row className="justify-content-md-center">
          <Col md={2} xs={12}>
            {/* <SideBar /> */}
            <Form>
              <Form.Check type="radio" name={`radio-${token.symbol}`} id={`claim-${token.symbol}`} value="claim" label="Claim" onChange={handleChange} checked={radio==='claim'} style={RadioColorOrangeStyle}/>              
              <Form.Check type="radio" name={`radio-${token.symbol}`} id={`stake-${token.symbol}`} value="stake" label="Stake" onChange={handleChange} checked={radio==='stake'} style={RadioColorOrangeStyle}/>
              <Form.Check type="radio" name={`radio-${token.symbol}`} id={`unstake-${token.symbol}`} value="unstake" label="Unstake" onChange={handleChange} checked={radio==='unstake'} style={RadioColorOrangeStyle}/>
            </Form>
          </Col>
          <Col md={4} xs={12}>            
            <GreyCard borderRadius="10px" height="75px" className="mt-1">
              <Row style={verticalCenterContainerStyle100}>
                <Col style={verticalCenterContainerStyle100}>
                  
                  {
                    radio==='claim'? (
                      <div>
                        <CenterVerticalContainer>                      
                          <Text fontSize='11px'>Earned</Text>                          
                        </CenterVerticalContainer>
                      </div>
                    ):(
                      <div>
                        <CenterVerticalContainer>                      
                          <Text fontSize='11px' color='darkOrange'>{radio==='stake'? 'Staked': 'Stakable'}</Text>
                          <Question                       
                            text={radio==='stake'?
                              `Amount of your deposited ${token.symbol} (as LP token) which is currently staked and generating PTP`:
                              `Amount of your deposited ${token.symbol} (as LP token) which can be staked to generate yield in PTP`
                            }                        
                          />
                        </CenterVerticalContainer>
                        <CenterVerticalContainer >
                          <Text fontSize='11px' >{radio==='stake'? 'Stakable': 'Staked'}</Text>                      
                          <QuestionColorHelper
                            text={radio==='stake'?
                              `Amount of your deposited ${token.symbol} (as LP token) which can be staked to generate yield in PTP`:
                              `Amount of your deposited ${token.symbol} (as LP token) which is currently staked and generating PTP`
                            }
                            color='white'
                          />                      
                        </CenterVerticalContainer>
                      </div>
                    )
                  } 
                </Col>
                <Col style={verticalCenterContainerStyle100} className='text-right'>
                  {
                    radio==='claim'? (
                      <div className="w-100">
                        <Row>
                          <Col style={verticalCenterContainerStyle100}>
                            <Text className='text-right w-100' >{`<0.01`}</Text>
                            <Text fontSize='11px' className='text-right ml-1'> PTP</Text>
                          </Col>
                        </Row>                                          
                      </div>
                    ) : (
                      <div className="w-100">
                        <Text fontSize='11px' className='text-right w-100 mt-1' color='darkOrange'>{radio==='stake'? 0.0 : 1.09} {token.symbol}</Text>
                        <Row>
                          <Col style={verticalCenterContainerStyle100}>
                            <Text className='text-right w-100 mt-1' >{radio==='stake'? 1.09 : 0.0} </Text>
                            <Text fontSize='11px' className='text-right mt-1 ml-1'> {token.symbol}</Text>
                          </Col>
                        </Row>                    
                      </div>
                    )
                  }                  
                </Col>
              </Row>
            </GreyCard>
          </Col>
          <Col md={4} xs={12} style={verticalCenterContainerStyle}>
            {
              radio==='claim'? (
                staked? (
                  <Button style={borderRadius7} fullWidth>Claim</Button>
                ) : (
                  <Button style={borderRadius7} disabled fullWidth>Claim</Button>
                )                
              ) : (
                radio==='stake'? (
                  <div>
                    <Text fontSize='10px'>Earned PTP will be automatically claimed on staking</Text>
                    {
                      staked? (
                        <Button style={borderRadius7} disabled fullWidth>Stake All</Button>
                      ) : (
                        <Button style={borderRadius7} fullWidth>Stake All</Button>
                      )
                    }                    
                  </div>
                ) : (
                  <div>
                    <Text fontSize='10px'>Earned PTP will be automatically claimed on unstaking</Text>
                    {
                      staked? (
                        <Button style={borderRadius7} fullWidth>Unstake All</Button>
                      ) : (
                        <Button style={borderRadius7} disabled fullWidth>Unstake All</Button>
                      )
                    }                    
                  </div>
                )                
              )
            }            
          </Col>
        </Row>
      </PaddingBottomDiv>
    </Body>
  )
}

