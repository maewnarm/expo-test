import { Button, Card, Dialog, Icon } from "@rneui/themed";
import { BarCodeScanningResult, Camera, CameraType } from "expo-camera";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet } from "react-native";

import dayjs from "dayjs";
import { BarCodeScanner } from "expo-barcode-scanner";
import { saveScannedResult } from "../../actions/scanner";
import { Text, View } from "../../components/Themed";
import { API_KEY, API_URL } from "../../constants/Environments";
import { LocalResultType } from "../../constants/Types";
import { getLocalData, storeLocalData } from "../../utils/localStore";

export default function TabOneScreen() {
  const [type, setType] = useState(CameraType.back);
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [enableCamera, setEnableCamera] = useState(false);
  const [scanList, setScanList] = useState<string[]>([]);
  const scanResult = useRef<string[]>([]);
  const [clearDialogVisible, setClearDialogVisible] = useState(false);
  const [localSaveDialogVisible, setLocalSaveDialogVisible] = useState(false);

  const toggleCamera = () => {
    setEnableCamera(!enableCamera);
  };

  const toggleCameraType = () => {
    setType((current) =>
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  const onScanned = useCallback(
    (result: BarCodeScanningResult) => {
      const { data } = result;
      console.log("scanned result:", data);
      if (scanResult.current.indexOf(data) === -1) {
        const list = [...scanResult.current];
        list.push(data);
        scanResult.current = list;
        setScanList(scanResult.current);
      }
    },
    [scanResult]
  );

  const onSavePress = async () => {
    console.log("save");
    const body = {
      id: scanResult.current,
    };
    const res = await saveScannedResult(body);
    if (res.status === 200) {
      onClearResultPress();
    } else {
      setLocalSaveDialogVisible(true);
    }
    // TODO separate function to scan lane and input amount
    // TODO define QR code structure for encryption+group_id+marker_no
    // TODO move camera to modal instead
    // TODO create interval to transfer data to local
    // TODO add line, cart selector dropdown
  };

  const onDeleteResultPress = (index: number) => {
    const list = [...scanResult.current];
    list.splice(index, 1);
    scanResult.current = list;
    setScanList(scanResult.current);
  };

  const onClearResultPress = () => {
    scanResult.current = [];
    setScanList([]);
    setClearDialogVisible(false);
  };

  const toggleClearDialog = () => {
    setClearDialogVisible(!clearDialogVisible);
  };

  const toggleLocalSaveDialog = () => {
    setLocalSaveDialogVisible(!localSaveDialogVisible);
  };

  const onLocalSaveResultPress = async () => {
    const data = await getLocalData("localResult", true);
    const body: LocalResultType = {
      ts: dayjs(),
      data: scanResult.current,
    };
    console.log(body);
    let newData = data ? data : [];
    newData.push(body);
    await storeLocalData("localResult", JSON.stringify(newData));
    setLocalSaveDialogVisible(false);
  };

  const getLocal = async () => {
    const data = await getLocalData("localResult", true);
    console.log(data);
  };

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scanner</Text>
      {enableCamera ? (
        <View style={styles.cameraContainer}>
          <Camera
            style={styles.camera}
            type={type}
            barCodeScannerSettings={{
              barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
            }}
            onBarCodeScanned={onScanned}
          >
            <View style={styles.buttonContainer}>
              <Pressable style={styles.button} onPress={toggleCameraType}>
                <Text style={styles.cameraText}>Flip Camera</Text>
              </Pressable>
              <Pressable style={styles.button} onPress={toggleCamera}>
                <Text style={styles.cameraText}>Close Camera</Text>
              </Pressable>
            </View>
          </Camera>
        </View>
      ) : (
        <Button title={"Open camera"} onPress={toggleCamera} />
      )}
      <Card containerStyle={styles.cardContainer}>
        <Card.Title style={styles.cardTitle}>
          <Text>Result</Text>
        </Card.Title>
        <Card.FeaturedSubtitle style={styles.cardSubtitle}>
          <Text
            style={styles.cardSubtitle_text}
          >{`Found ${scanList.length} codes`}</Text>
        </Card.FeaturedSubtitle>
        <Card.Divider />
        <ScrollView style={styles.cardScoll}>
          {scanList.length > 0 ? (
            scanList.map((res, idx) => (
              <View key={idx} style={styles.codeResult}>
                <Text style={styles.codeResult_text}>{res}</Text>
                <Button
                  type="solid"
                  buttonStyle={styles.codeResult_button}
                  color={"red"}
                  onPress={() => onDeleteResultPress(idx)}
                >
                  <Icon name="x" type="feather" size={20} color={"white"} />
                </Button>
              </View>
            ))
          ) : (
            <Text style={styles.codeResult_empty}>not have any result</Text>
          )}
        </ScrollView>
      </Card>
      <View style={styles.resultAction}>
        <Button onPress={onSavePress} disabled={scanList.length === 0}>
          Save
          <Icon name="save" type="feather" size={20} color={"white"} />
        </Button>
        <Button
          title={"Clear"}
          onPress={toggleClearDialog}
          color={"red"}
          disabled={scanList.length === 0}
        >
          Clear
          <Icon name="trash" type="feather" size={20} color={"white"} />
        </Button>
        <Button title={"Clear"} onPress={getLocal} color={"red"}>
          Get Local
          <Icon name="trash" type="feather" size={20} color={"white"} />
        </Button>
      </View>
      <Dialog
        isVisible={clearDialogVisible}
        onBackdropPress={toggleClearDialog}
      >
        <Dialog.Title title="Clear confirm" />
        <Text style={{ color: "black" }}>Are you sure to clear result ?</Text>
        <Dialog.Actions>
          <Dialog.Button title="Cancel" onPress={toggleClearDialog} />
          <Dialog.Button title="Confirm" onPress={onClearResultPress} />
        </Dialog.Actions>
      </Dialog>
      <Dialog
        isVisible={localSaveDialogVisible}
        onBackdropPress={toggleLocalSaveDialog}
      >
        <Dialog.Title title="Connection error" titleStyle={{ color: "red" }} />
        <Text style={{ color: "black" }}>
          Connect to server was error, do you want to save on local ?
        </Text>
        <Dialog.Actions>
          <Dialog.Button title="No" onPress={toggleLocalSaveDialog} />
          <Dialog.Button title="Yes" onPress={onLocalSaveResultPress} />
        </Dialog.Actions>
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
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
  cameraContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    width: "100%",
  },
  camera: {
    flex: 1,
    width: "100%",
    minHeight: "100%",
    maxHeight: "100%",
  },
  buttonContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "transparent",
    margin: 10,
    gap: 15,
  },
  button: {
    flex: 1,
    alignSelf: "flex-end",
    alignItems: "center",
    borderColor: "white",
    borderStyle: "solid",
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  cameraText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "black",
  },
  cardContainer: {
    padding: 2,
    width: "80%",
    minHeight: "30%",
    maxHeight: "30%",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  cardTitle: {
    margin: 0,
  },
  cardScoll: {
    minHeight: "20%",
    maxHeight: "60%",
  },
  cardSubtitle: {
    textAlign: "right",
  },
  cardSubtitle_text: {
    fontWeight: "normal",
  },
  codeResult: {
    paddingHorizontal: 5,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  codeResult_text: {
    fontSize: 20,
  },
  codeResult_button: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderColor: "red",
  },
  codeResult_empty: {
    fontStyle: "italic",
    opacity: 0.5,
  },
  resultAction: {
    display: "flex",
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
});
