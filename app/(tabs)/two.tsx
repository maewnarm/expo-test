import { StyleSheet } from "react-native";

import { Button, Dialog, Icon, ListItem } from "@rneui/themed";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";

import { saveScannedResult } from "../../actions/scanner";
import EditScreenInfo from "../../components/EditScreenInfo";
import { Text, View } from "../../components/Themed";
import { LocalResultType } from "../../constants/Types";
import { getLocalData, storeLocalData } from "../../utils/localStore";

export default function TabTwoScreen() {
  const [expanded, setExpanded] = useState<boolean[]>([]);
  const [localResult, setLocalResult] = useState<LocalResultType[]>([]);
  const [errorDialogVisible, setErrorDialogVisible] = useState(false);
  const deleteIndex = useRef(-1);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [clearDialogVisible, setClearDialogVisible] = useState(false);

  const getLocalStorage = async () => {
    const data = await getLocalData("localResult", true);
    setLocalResult(data || []);
  };

  const setExpandedList = (index: number) => {
    let list = [...expanded];
    list[index] = !list[index];
    setExpanded(list);
  };

  const onResend = async (index: number) => {
    const body = {
      id: localResult[index].data,
    };
    const res = await saveScannedResult(body);
    if (res.status === 200) {
      // clear result at index
      const current = [...localResult];
      current.splice(index, 1);
      await storeLocalData("localResult", JSON.stringify(current));
      await getLocalStorage();
    } else {
      setErrorDialogVisible(true);
    }
  };

  const onDelete = (index: number) => {
    deleteIndex.current = index;
    setDeleteDialogVisible(!deleteDialogVisible);
  };

  const onDeleteConfirm = async () => {
    let list = [...localResult];
    list.splice(deleteIndex.current, 1);
    await storeLocalData("localResult", JSON.stringify(list));
    await getLocalStorage();
    setDeleteDialogVisible(false);
  };

  const toggleErrorDialogVisible = () => {
    setErrorDialogVisible(!errorDialogVisible);
  };

  const toggleClearDialog = () => {
    setClearDialogVisible(!clearDialogVisible);
  };

  const toggleDeleteDialog = () => {
    setDeleteDialogVisible(!deleteDialogVisible);
  };

  const onClearLocalResultPress = async () => {
    await storeLocalData("localResult", JSON.stringify([]));
    await getLocalStorage();
    setClearDialogVisible(false);
  };

  useEffect(() => {
    getLocalStorage();
  }, []);

  useEffect(() => {
    console.log("localResult ", localResult);
    setExpanded(Array(localResult.length).fill(false));
  }, [localResult]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Local Storage</Text>
      <Button
        title={"Clear"}
        onPress={toggleClearDialog}
        color={"red"}
        disabled={localResult.length === 0}
        style={styles.clearButton}
      >
        Clear
        <Icon name="trash" type="feather" size={20} color={"white"} />
      </Button>
      {localResult.map((result, idx) => (
        <ListItem.Accordion
          key={idx}
          style={styles.listItem}
          content={
            <ListItem.Content>
              <ListItem.Title>{`Result ${idx + 1}`}</ListItem.Title>
              <ListItem.Subtitle>
                {dayjs(result.ts).format("DD/MMM/YYYY HH:mm:ss")}
              </ListItem.Subtitle>
            </ListItem.Content>
          }
          isExpanded={expanded[idx]}
          onPress={() => setExpandedList(idx)}
          bottomDivider
        >
          {result.data?.map((code, idx2) => (
            <ListItem key={idx2} containerStyle={styles.listItem_child}>
              <Text style={styles.listItem_child_text}>{code}</Text>
            </ListItem>
          ))}
          <View style={styles.listItem_buttonContainer}>
            <Button
              onPress={() => onResend(idx)}
              containerStyle={styles.listItem_button}
            >
              Resend
              <Icon name="send" type="feather" size={20} color={"white"} />
            </Button>
            <Button
              onPress={() => onDelete(idx)}
              color="red"
              containerStyle={styles.listItem_button}
            >
              Delete
              <Icon name="trash" type="feather" size={20} color={"white"} />
            </Button>
          </View>
        </ListItem.Accordion>
      ))}
      <Dialog
        isVisible={errorDialogVisible}
        onBackdropPress={toggleErrorDialogVisible}
      >
        <Dialog.Title title="Connection error" titleStyle={{ color: "red" }} />
        <Text style={{ color: "black" }}>Connect to server error</Text>
      </Dialog>
      <Dialog
        isVisible={clearDialogVisible}
        onBackdropPress={toggleClearDialog}
      >
        <Dialog.Title title="Clear confirm" />
        <Text style={{ color: "black" }}>Are you sure to clear result ?</Text>
        <Dialog.Actions>
          <Dialog.Button title="Cancel" onPress={toggleClearDialog} />
          <Dialog.Button title="Confirm" onPress={onClearLocalResultPress} />
        </Dialog.Actions>
      </Dialog>
      <Dialog
        isVisible={deleteDialogVisible}
        onBackdropPress={toggleDeleteDialog}
      >
        <Dialog.Title title="Clear confirm" />
        <Text style={{ color: "black" }}>Are you sure to clear result ?</Text>
        <Dialog.Actions>
          <Dialog.Button title="Cancel" onPress={toggleDeleteDialog} />
          <Dialog.Button title="Confirm" onPress={onDeleteConfirm} />
        </Dialog.Actions>
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: "80%",
  },
  clearButton: { marginVertical: 10 },
  listItem: {
    minWidth: "100%",
  },
  listItem_child: {
    width: 300,
    textAlign: "left",
    flex: 1,
    padding: 10,
  },
  listItem_child_text: {
    color: "black",
  },
  listItem_buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
  },
  listItem_button: {
    flex: 1,
  },
});
