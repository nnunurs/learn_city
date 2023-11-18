import { extendTheme } from '@chakra-ui/react'
import { tagTheme } from './Tag'

export const theme = extendTheme({
  components: { Tag: tagTheme },
})