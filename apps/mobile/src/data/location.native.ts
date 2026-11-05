import * as Location from 'expo-location';
export async function currentLocation(){const permission=await Location.requestForegroundPermissionsAsync();if(permission.status!=='granted')throw new Error('location_denied');const p=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced});return {latitude:p.coords.latitude,longitude:p.coords.longitude};}
