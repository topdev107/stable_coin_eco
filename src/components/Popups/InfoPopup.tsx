import { InfoIcon } from '@pantherswap-libs/uikit'
import React, { useContext } from 'react'
import { CheckCircle } from 'react-feather'
import styled, { ThemeContext } from 'styled-components'
import { AutoColumn } from '../Column'
import { AutoRow } from '../Row'
import { TYPE } from '../Shared'

const { body: Body } = TYPE

const RowNoFlex = styled(AutoRow)`
  flex-wrap: nowrap;
`

export default function InfoPopup({
  desc
}: {  
  desc?: string
}) {

  const theme = useContext(ThemeContext)

  return (
    <RowNoFlex>
      <div style={{ paddingRight: 16 }}>
        {/* <CheckCircle color={theme.colors.success} size={24} /> */}
        <InfoIcon color={theme.colors.success} />
      </div>
      <AutoColumn gap="8px">
        <Body fontWeight={500}>{desc}</Body>
      </AutoColumn>
    </RowNoFlex>
  )
}
