import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { AppDispatch } from '../index'
import { addOrUpdatePoolItem } from './reducer'


// export default function setPoolItem(key: string, token_address: string): void {
//   const dispatch = useDispatch<AppDispatch>()
//   useEffect(() => {
//     dispatch(
//       addOrUpdatePoolItem({
//         key: key,
//         token_address: token_address
//       })
//     )    
//   })
// }
