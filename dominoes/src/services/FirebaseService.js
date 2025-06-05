import { database } from './../firebase/config';
import { ref, get, child } from "firebase/database";
import { getDeviceId } from './DeviceService';

export async function fetchPlayersFromFirebase() {
  try {
    const currentDeviceId = await getDeviceId();
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, 'players'));

    if (snapshot.exists()) {
      const data = snapshot.val();

      return Object.values(data).filter(player => player.device_id !== currentDeviceId).map(player => ({
        idplayer: player.idplayer,
        name: player.name,
        device_id: player.device_id,
        is_synced: player.is_synced,
        created_at: player.created_at,
        updated_at: player.updated_at,
        uuid: player.uuid,
      }));
    } else {
      return [];
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des joueurs depuis Firebase:', error);
    throw error;
  }
}

export async function fetchWinnersFromFirebase() {
  try {
    const currentDeviceId = await getDeviceId();
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, 'winners'));

    if (snapshot.exists()) {
      const data = snapshot.val();

      return Object.values(data).filter(winner => winner.device_id !== currentDeviceId).map(winner => ({
        uuid: winner.uuid,
        date: winner.date,
        device_id: winner.device_id,
        fond: winner.fond,
        idgagnant: winner.idgagnant,
        idplayer: winner.idplayer,
        is_synced: winner.is_synced,
        updated_at: winner.updated_at
      }));
    } else {
      return [];
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des gagnants depuis Firebase:', error);
    throw error;
  }
}

export async function fetchLossesFromFirebase() {
  try {
    const currentDeviceId = await getDeviceId();
    const dbRef = ref(database);
    const snapshot = await get(child(dbRef, 'losses'));

    if (snapshot.exists()) {
      const data = snapshot.val();

      return Object.values(data).filter(loss => loss.device_id !== currentDeviceId).map(loss => ({
        uuid: loss.uuid,
        date: loss.date,
        device_id: loss.device_id,
        fond: loss.fond,
        idperte: loss.idperte,
        idplayer: loss.idplayer,
        is_synced: loss.is_synced,
        updated_at: loss.updated_at
      }));
    } else {
      return [];
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des perdants depuis Firebase:', error);
    throw error;
  }
}
