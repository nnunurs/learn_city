import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  UnorderedList,
  ListItem,
} from "@chakra-ui/react";
import { useDisclosure } from "@chakra-ui/hooks";
import { useEffect } from "react";
import { useCookies } from "react-cookie";

export const Changelog = ({ version, changes }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [versionCookie, setVersionCookie] = useCookies(["version"]);

  useEffect(() => {
    if (versionCookie.version !== version) {
      setVersionCookie("version", version);
      onOpen();
    }
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Co nowego w wersji {version}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <UnorderedList>
            {changes.map((change, i) => (
              <ListItem key={i}>{change}</ListItem>
            ))}
          </UnorderedList>
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="teal" onClick={onClose}>
            OK
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
