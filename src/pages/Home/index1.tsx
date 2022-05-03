import { Text } from '@pantherswap-libs/uikit'
import React, { useEffect, useRef, useState } from 'react'
import { Col, Row } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import CardNav from 'components/CardNav'
import styled from 'styled-components'
import PTP_logo from '../../assets/PTP_logo.png'
import PTP_logo_edge3 from '../../assets/PTP_logo_edge3.png'
import Roadmap from '../../assets/roadmap.png'
import graphicProblemSlippage from '../../assets/graphic-problem-slippage.png'

import graphicProblemBadUx from '../../assets/graphic-problem-bad-ux.png'
import benefitGraphicSlippage from '../../assets/benefit-graphic-slippage.png'
import benefitGraphicScalability from '../../assets/benefit-graphic-scalability.png'
import benefitGraphicUx from '../../assets/benefit-graphic-ux.png'

import auditorHacken from '../../assets/auditor-01-Hacken.png'
import auditorOmniscia from '../../assets/auditor-02-Omniscia.png'
import logoTwitter from '../../assets/sn-logo-twitter.inline.svg'
import logoTelegram from '../../assets/sn-logo-telegram.inline.svg'
import logoDiscord from '../../assets/sn-logo-discord.inline.svg'
import logoMedium from '../../assets/sn-logo-medium.inline.svg'

export default function Home() {


  const RoundEdgeBtn = styled.button<any>`
  background-color: ${({ backgroundColor }) => backgroundColor};
  width: ${({ width }) => width};
  height: ${({ height }) => height};
  border-width: ${({ borderWidth }) => borderWidth};
  border-color: ${({ borderColor }) => borderColor};
  border-style: solid;
  border-radius: ${({ borderRadius }) => borderRadius};
  font-size: ${({ fontSize }) => fontSize};
  font-weight: ${({ fontWeight }) => fontWeight};
  color: ${({ color }) => color};
  text-align: center;
  cursor: pointer;
  transition-duration: 0.4s;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  margin-right: 20px;

  :hover {
    background-color: ${({ hoverBackgroundColor }) => hoverBackgroundColor};
    border-color: ${({ hoverBorderColor }) => hoverBorderColor};
    color: ${({ hoverColor }) => hoverColor};
  }
`

  return (
    <>
      <CardNav/>
      
      <div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <img src={PTP_logo_edge3} alt='logo' style={{ width: '500px', height: '500px', marginTop: '120px' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Text style={{ transitionDelay: '2s, 4ms', fontSize: '60px' }}>This Changes Everything</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Text style={{ transitionDelay: '2s, 4ms', fontSize: '45px', color: '#ff720d' }}>A whole new kind of AMM for stableswap</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Text style={{ transitionDelay: '2s, 4ms', fontSize: '40px' }}>Lower Slippage. Simpler UX.</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
          <Link to='/swap'>
            <RoundEdgeBtn
              width='200px'
              height='60px'
              borderRadius='30px'
              backgroundColor='transparent'
              borderWidth='3px'
              borderColor='#ff720d'
              fontSize='20px'
              fontWeight='semi-bold'
              color='#ff720d'
              hoverBorderColor='#903f06'
              hoverColor='#903f06'
              hoverBackgroundColor='#131c30'
            >
              Launch App
            </RoundEdgeBtn>
          </Link>
          <RoundEdgeBtn
            width='200px'
            height='60px'
            borderRadius='30px'
            backgroundColor='transparent'
            borderWidth='3px'
            borderColor='white'
            fontSize='20px'
            fontWeight='semi-bold'
            color='white'
            hoverBorderColor='#dddddd'
            hoverColor='#dddddd'
            hoverBackgroundColor='#425684'
          >
            Join Community
          </RoundEdgeBtn>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '250px' }}>
          <Text style={{ fontSize: '50px', color: '#ff720d' }}>The Current Problems of Other Stableswaps</Text>
        </div>
        <div style={{ marginTop: '70px' }}>
          <Row>
            <Col className='col-2' />
            <Col>
              <div style={{ paddingLeft: '60px', paddingRight: '60px' }}>
                <Text style={{ fontSize: '30px' }}>Liquidity Fragmentation</Text>
                <Text style={{ fontSize: '20px', marginTop: '20px' }}>One of the major problems found in the first generation stableswaps’ Closed liquidity pools is liquidity fragmentation, where the liquidity of different pools cannot be shared with one another, resulting in higher slippage.</Text>
              </div>
            </Col>
            <Col>
              <div style={{ paddingLeft: '60px', paddingRight: '60px' }}>
                <Text style={{ fontSize: '30px' }}>Bad User Experience</Text>
                <Text style={{ fontSize: '20px', marginTop: '20px' }}>The design of other stableswaps requires multiple tokens of equal value within a pool, often complicating its pool compositions (pairing up LP token with new tokens). It significantly hinders the scalability of the protocol and leads to bad user experience.</Text>
              </div>
            </Col>
            <Col className='col-2' />
          </Row>
          <Row className='mt-5'>
            <Col className='col-2' />
            <Col>
              <div style={{ paddingLeft: '70px', paddingRight: '70px' }}>
                <img src={graphicProblemSlippage} alt='img' />
              </div>
            </Col>
            <Col>
              <div style={{ paddingLeft: '70px', paddingRight: '70px' }}>
                <img src={graphicProblemBadUx} alt='img' />
              </div>
            </Col>
            <Col className='col-2' />
          </Row>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '250px' }}>
          <Text style={{ fontSize: '50px', color: '#ff720d' }}>Thoughtfully Crafted</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
          <Text style={{ fontSize: '30px' }}>The mechanism of Platypus</Text>
        </div>
        <div style={{ marginTop: '70px' }}>
          <Row>
            <Col className='col-2' />
            <Col>
              <div style={{ paddingLeft: '60px', paddingRight: '60px' }}>
                <Text style={{ fontSize: '20px', marginTop: '20px' }}>Platypus invents a whole new AMM on Binance - Open liquidity single-sided AMM managing risk autonomously based on the coverage ratio, allowing maximal capital efficiency.</Text>
              </div>
            </Col>
            <Col>
              <div style={{ paddingLeft: '60px', paddingRight: '60px' }}>
                <Text style={{ fontSize: '20px', marginTop: '20px' }}>The key concept underpinning Platypus’ design is asset liability management (ALM). Platypus is the first of its kind to use a single-variant slippage function instead of invariant curves.</Text>
              </div>
            </Col>
            <Col className='col-2' />
          </Row>
          <Row className='mt-5'>
            <Col className='col-2' />
            <Col>
              <div style={{ paddingLeft: '70px', paddingRight: '70px' }}>
                <img src={benefitGraphicSlippage} alt='img' />
              </div>
            </Col>
            <Col>
              <div style={{ paddingLeft: '70px', paddingRight: '70px' }}>
                <img src={benefitGraphicScalability} alt='img' />
              </div>
            </Col>
            <Col>
              <div style={{ paddingLeft: '70px', paddingRight: '70px' }}>
                <img src={benefitGraphicUx} alt='img' />
              </div>
            </Col>
            <Col className='col-2' />
          </Row>
          <Row className='mt-5'>
            <Col className='col-2' />
            <Col>
              <div style={{ paddingLeft: '60px', paddingRight: '60px' }}>
                <Text style={{ fontSize: '25px' }}>Lower Slippage.</Text>
                <Text style={{ fontSize: '20px', marginTop: '20px' }}>Our open liquidity pool design enables higher capital efficiency and lower slippage rate comparing with other stableswaps.</Text>
              </div>
            </Col>
            <Col>
              <div style={{ paddingLeft: '60px', paddingRight: '60px' }}>
                <Text style={{ fontSize: '25px' }}>Higher Scalability.</Text>
                <Text style={{ fontSize: '20px', marginTop: '20px' }}>Flexible pool composition allows each asset to scale naturally based on its organic supply.</Text>
              </div>
            </Col>
            <Col>
              <div style={{ paddingLeft: '60px', paddingRight: '60px' }}>
                <Text style={{ fontSize: '25px' }}>Better User Experience.</Text>
                <Text style={{ fontSize: '20px', marginTop: '20px' }}>You can always deposit and withdraw token in the same kind, without worrying about the pool compositions or pool size.</Text>
              </div>
            </Col>
            <Col className='col-2' />
          </Row>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '150px' }}>
          <Text style={{ fontSize: '50px', color: '#ff720d', marginTop: '100px' }}>Investors</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '70px', alignItems: 'center' }}>
          <img src='https://platypus.finance/static/9c59a81c41bb541263fb3ddaf4866bda/investor-01-Three-Arrows.png' width='372' height='auto' alt='img' />
          <img className='ml-5' src='https://platypus.finance/static/e477dcdfe7655afb24ce0706104b5b15/investor-02-Defiance.png' width='245' height='auto' alt='img' />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', alignItems: 'center' }}>
          <img src='https://platypus.finance/static/0c8f42f3e1fd1984d33eb9bc4f50fc37/investor-03-0xVenturesDAO.png' width='61' height='100' alt='img' />
          <img style={{ marginLeft: '100px' }} src='https://platypus.finance/static/6eefc8d491483c4de800ca6be4cc8b8a/investor-04-Avalanche.png' width='81' height='81' alt='img' />
          <img style={{ marginLeft: '100px' }} src='https://platypus.finance/static/2db05b4f2b35fe8a3b0642919c918574/investor-05-Avalaunch.png' width='108' height='87' alt='img' />
          <img style={{ marginLeft: '100px' }} src='https://platypus.finance/static/6f37e7bc14c5ced513b6b1b5ff7fec46/investor-06-Avatar.png' width='170' height='52' alt='img' />
          <img style={{ marginLeft: '100px' }} src='https://platypus.finance/static/9b4e13db6d57ef7c3a23c6bbd87146d5/investor-07-AVenturesDAO.png' width='94' height='108' alt='img' />
          <img style={{ marginLeft: '100px' }} src='https://platypus.finance/static/9cda02157d1ad305d2f8a3041fc47687/investor-08-Benqi.png' width='149' height='40' alt='img' />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', alignItems: 'center' }}>
          <img src='https://platypus.finance/static/ac148f0542dc546fe1c5f1988eba3b9c/investor-09-CMS.png' width='154' height='58' alt='img' />
          <img style={{ marginLeft: '100px' }} src='https://platypus.finance/static/a173e5ec59ae71a0da722f8ba3296c48/investor-10-Colony.png' width='168' height='31' alt='img' />
          <img style={{ marginLeft: '100px' }} src='https://platypus.finance/static/414cadd639566f1702b9fd1c98c75009/investor-11-GBV.png' width='157' height='78' alt='img' />
          <img style={{ marginLeft: '100px' }} src='https://platypus.finance/static/d486f0d1cb8aff33fd812f27c838e5e6/investor-12-Hailstone.png' width='232' height='96' alt='img' />
          <img style={{ marginLeft: '100px' }} src='https://platypus.finance/static/20b8ff46db2976f63bc91d5295f7e72a/investor-13-Keychain.png' width='168' height='57' alt='img' />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', alignItems: 'center' }}>
          <img src='https://platypus.finance/static/c520fc3f91f75782b1f151a1013eecae/investor-14-Mechanism.png' width='174' height='67' alt='img' />
          <img style={{ marginLeft: '100px' }} src='https://platypus.finance/static/f227362b781ad2b9f8288825d0093b3c/investor-15-Muhabbit.png' width='108' height='60' alt='img' />
          <img style={{ marginLeft: '100px' }} src='https://platypus.finance/static/badb0143752608351eebd3c2d4c67994/investor-16-TPS.png' width='216' height='37' alt='img' />
          <img style={{ marginLeft: '100px' }} src='https://platypus.finance/static/b4d17bce34d2d2f02a69e2faee5e692f/investor-17-Valhalla.png' width='178' height='37' alt='img' />
          <img style={{ marginLeft: '100px' }} src='https://platypus.finance/static/c07ff0dbcf90916be32ae5425c7cfa6e/investor-18-YieldYak.png' width='147' height='60' alt='img' />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '250px' }}>
          <Text style={{ fontSize: '50px', color: '#ff720d' }}>Audits</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '70px', alignItems: 'center' }}>
          <img src={auditorHacken} width='76' height='86' alt='img' />
          <img className='ml-5' src={auditorOmniscia} width='81' height='88' alt='img' />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '150px' }}>
          <Text style={{ fontSize: '50px', color: '#ff720d', marginTop: '100px' }}>Roadmap</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '170px', alignItems: 'center' }}>
          <img src={Roadmap} width='600' height='800' alt='img' />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '150px' }}>
          <Text style={{ fontSize: '50px', color: '#ff720d', marginTop: '100px' }}>Join Our Community</Text>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '70px', marginBottom: '150px', alignItems: 'center' }}>
          <img style={{cursor: 'pointer'}} src={logoTwitter} width='53' height='43' alt='img' />
          <img style={{ marginLeft: '100px', cursor: 'pointer'}} src={logoTwitter} width='50' height='50' alt='img' />
          <img style={{ marginLeft: '100px', cursor: 'pointer'}} src={logoDiscord} width='58' height='44' alt='img' />
          <img style={{ marginLeft: '100px', cursor: 'pointer'}} src={logoMedium} width='65' height='37' alt='img' />
        </div>
      </div>
    </>
  )
}
