import { tagAnatomy } from "@chakra-ui/anatomy";
import { createMultiStyleConfigHelpers } from "@chakra-ui/react";
const { definePartsStyle, defineMultiStyleConfig } =
  createMultiStyleConfigHelpers(tagAnatomy.keys);

const darkGreen = definePartsStyle({
  container: {
    bg: "green.700",
  },
});

const yellow = definePartsStyle({
  container: {
    bg: "yellow.300",
  },
});

const red = definePartsStyle({
  container: {
    bg: "red.500",
  },
});

export const tagTheme = defineMultiStyleConfig({
  variants: {
    darkGreen,
    yellow,
    red,
  },
});
