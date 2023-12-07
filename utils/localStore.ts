import AsyncStorage from "@react-native-async-storage/async-storage";

export const storeLocalData = async (key: string, value: string) => {
  await AsyncStorage.setItem(key, value);
};

export const getLocalData = async (key: string, isJson: boolean = false) => {
  const value = await AsyncStorage.getItem(key);
  if (isJson) {
    return value != null ? JSON.parse(value) : null;
  }
  return value;
};
