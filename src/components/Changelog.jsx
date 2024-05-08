import { useEffect } from "react";
import { useCookies } from "react-cookie";

export const Changelog = ({ version, changes }) => {
  // const { isOpen, onOpen, onClose } = useDisclosure();
  const [versionCookie, setVersionCookie] = useCookies(["version"]);

  useEffect(() => {
    if (versionCookie.version !== version) {
      setVersionCookie("version", version);
    }
    document.getElementById("changelog_modal").showModal();
  }, []);

  return (
    <dialog id="changelog_modal" className="modal">
      <div className="modal-box p-8 flex flex-col gap-4">
        <p className="font-bold text-2xl">Co nowego w wersji {version}</p>
        <ul className="list-disc mx-4">
          {changes.map((change, i) => (
            <li key={i}>{change}</li>
          ))}
        </ul>
        <div className="modal-action">
          <form method="dialog">
            <button className="btn">Zamknij</button>
          </form>
        </div>
      </div>
    </dialog>
    // <Modal isOpen={isOpen} onClose={onClose}>
    //   <ModalOverlay />
    //   <ModalContent className="glass">
    //     <ModalHeader>Co nowego w wersji {version}</ModalHeader>
    //     <ModalCloseButton />
    //     <ModalBody>
    //       <UnorderedList>
    //         {changes.map((change, i) => (
    //           <ListItem key={i}>{change}</ListItem>
    //         ))}
    //       </UnorderedList>
    //     </ModalBody>
    //
    //     <ModalFooter>
    //       <Button colorScheme="teal" onClick={onClose}>
    //         OK
    //       </Button>
    //     </ModalFooter>
    //   </ModalContent>
    // </Modal>
  );
};
