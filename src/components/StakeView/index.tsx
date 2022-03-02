import React, { useContext, useState, useCallback } from 'react'
import styled, { ThemeContext } from 'styled-components'
import { Text, Button, ChevronDownIcon, CloseIcon, Radio } from '@pantherswap-libs/uikit'
import { Token } from '@pantherswap-libs/sdk'
import { Row, Col, Form } from 'react-bootstrap'
import Question, {QuestionColorHelper} from '../QuestionHelper'
import { BlueCard, DarkblueOutlineCard, GreyCard, YellowCard } from '../Card'
import CurrencyLogo from '../CurrencyLogo'
import { TYPE } from '../Shared'
import SideBar from './SideBar'

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
  accentColor: 'darkOrange'
}

const StakeView = ({ token, staked, ...rest }: any) => {
  const theme = useContext(ThemeContext)

  const [radio, setRadio] = useState("stake"); // claim, stake, unstake

  const handleChange = (evt) => {    
    console.info("fired");
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
              <Form.Check type="radio" name="radio" id="claim" label="Claim" style={RadioColorOrangeStyle}/>              
              <Form.Check type="radio" name="radio" id="stake" label="Stake" style={RadioColorOrangeStyle}/>
              <Form.Check type="radio" name="radio" id="unstake" label="Unstake" style={RadioColorOrangeStyle}/>
            </Form>
          </Col>
          <Col md={4} xs={12}>            
            <GreyCard borderRadius="10px" height="75px" className="mt-1">
              <Row style={verticalCenterContainerStyle100}>
                <Col style={verticalCenterContainerStyle100}>
                  <div>
                    <CenterVerticalContainer>
                      <Text fontSize='11px' color='darkOrange'>Staked</Text>
                      <Question 
                        text={'Amount of your deposited '.concat(token.symbol).concat(' (as LP token) which is currently staked and generating PTP')}                        
                      />
                    </CenterVerticalContainer>
                    <CenterVerticalContainer >
                      <Text fontSize='11px' >Stakable</Text>                      
                      <QuestionColorHelper
                        text={'Amount of your deposited '.concat(token.symbol).concat(' (as LP token) which can be staked to generate yield in PTP')}
                        color='white'
                      />
                    </CenterVerticalContainer>
                  </div>
                </Col>
                <Col style={verticalCenterContainerStyle100} className='text-right'>
                  <div className="w-100">
                    <Text fontSize='11px' className='text-right w-100 mt-1' color='darkOrange'>0.0 {token.symbol}</Text>
                    <Row>
                      <Col style={verticalCenterContainerStyle100}>
                        <Text className='text-right w-100 mt-1' >1.09 </Text>
                        <Text fontSize='11px' className='text-right mt-1 ml-1'> {token.symbol}</Text>
                      </Col>
                    </Row>                    
                  </div>
                </Col>
              </Row>
            </GreyCard>
          </Col>
          <Col md={4} xs={12} style={verticalCenterContainerStyle}>
            <div>
              <Text fontSize='10px'>Earned PTP will be automatically claimed on unstaking</Text>
              <Button style={borderRadius7} fullWidth>Stake All</Button>
            </div>
          </Col>
        </Row>
      </PaddingBottomDiv>
    </Body>
  )
}

export default StakeView;

