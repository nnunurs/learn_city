import { FormControl, FormLabel, Input } from "@chakra-ui/react";

export const UserLoginInput = ({ type, placeholder, value, setter, label }) => {
  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <Input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setter(e.target.value)}
      />
    </FormControl>
  );
};
