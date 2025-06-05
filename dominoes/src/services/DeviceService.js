import * as SecureStore from 'expo-secure-store';
import uuid from 'react-native-uuid';
import * as Application from 'expo-application';

let cachedDeviceId = null;



export async function getDeviceId() {
  if (cachedDeviceId) return cachedDeviceId;

  const androidId = Application.getAndroidId();
  console.log("Android ID :", androidId);
  
  // let deviceId = await SecureStore.getItemAsync('device_id');
  let deviceId = androidId;
  if (!deviceId) {
    deviceId = uuid.v4();
    await SecureStore.setItemAsync('device_id', deviceId);
  }

  cachedDeviceId = deviceId;
  return deviceId;
}
