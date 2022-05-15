import React from 'react'
import styled from 'styled-components'
import { Text } from '@pantherswap-libs/uikit'

const Card = styled.div<any>`
  width: 100%;
  border-radius: 16px;
  padding: 1.25rem;
  padding: ${({ padding }) => padding};
  border: ${({ border }) => border};
  border-radius: ${({ borderRadius }) => borderRadius};
  height: ${({height}) => height};
`
export default Card

const RCard = styled.div<any>`
  width: 100%;
  border-radius: 7px;
  padding: 10px;
  padding: ${({ padding }) => padding};
  border: ${({ border }) => border};
  border-radius: ${({ borderRadius }) => borderRadius};
  height: ${({height}) => height};
`

export const LightCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.colors.invertedContrast};
  background-color: ${({ theme }) => theme.colors.invertedContrast};
`

export const DarkblueOutlineCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.colors.primaryDark};
  background-color: ${({ theme }) => theme.colors.invertedContrast};
  margin: ${({margin}) => margin};
`

export const GreyCard = styled(Card)`
  background-color: ${({ theme }) => theme.colors.tertiary};
`

export const OutlineCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.colors.tertiary};
`

export const YellowCard = styled(Card)`
  background-color: rgba(243, 132, 30, 0.05);
  color: ${({ theme }) => theme.colors.binance};
  font-weight: 500;
`

export const PinkCard = styled(Card)`
  background-color: rgba(255, 0, 122, 0.03);
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 500;
`

const BlueCardStyled = styled(Card)`
  background-color: ${({ theme }) => theme.colors.primaryDark};
  color: ${({ theme }) => theme.colors.primary};
  border-radius: 12px;
  width: fit-content;
`

export const BlueCard = ({ children, ...rest }: any) => {
  return (
    <BlueCardStyled {...rest}>
      <Text color="#24c7d6">{children}</Text>
    </BlueCardStyled>
  )
}

export const LightRCard = styled(RCard)`
  border: 1px solid ${({ theme }) => theme.colors.invertedContrast};
  background-color: ${({ theme }) => theme.colors.invertedContrast};
`

export const DarkblueOutlineRCard = styled(RCard)`
  border: 1px solid ${({ theme }) => theme.colors.primaryDark};
  background-color: ${({ theme }) => theme.colors.invertedContrast};
  margin: ${({margin}) => margin};
`

export const GreyRCard = styled(RCard)`
  background-color: ${({ theme }) => theme.colors.tertiary};
`
export const GreyOutlineRCard = styled(RCard)`
  border: 1px solid ${({ theme }) => theme.colors.primaryDark};
  background-color: ${({ theme }) => theme.colors.tertiary};
`

export const OutlineRCard = styled(RCard)`
  border: 1px solid ${({ theme }) => theme.colors.tertiary};
`

export const YellowRCard = styled(RCard)`
  background-color: rgba(243, 132, 30, 0.05);
  color: ${({ theme }) => theme.colors.binance};
  font-weight: 500;
`

export const PinkRCard = styled(RCard)`
  background-color: rgba(255, 0, 122, 0.03);
  color: ${({ theme }) => theme.colors.primary};
  font-weight: 500;
`

export const BlueRCardStyled = styled(RCard)`
  background-color: ${({ theme }) => theme.colors.primaryDark};
  color: ${({ theme }) => theme.colors.primary};
  border-radius: 12px;
  width: fit-content;
`
