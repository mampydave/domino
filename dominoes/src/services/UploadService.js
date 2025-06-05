import NetInfo from '@react-native-community/netinfo';
import SyncService from './SyncService';
import PlayerRepository from '../database/PlayerRepository';
import GameRepository from '../database/GameRepository';
import { database } from '../firebase/config';
import { ref, set } from 'firebase/database';
import { Alert } from 'react-native';
import { fetchPlayersFromFirebase, fetchWinnersFromFirebase, fetchLossesFromFirebase } from './FirebaseService';

export async function handleUploadWithConfirmation(setLoading) {
  const netState = await NetInfo.fetch();

  if (!netState.isConnected || !netState.isInternetReachable) {
    Alert.alert(
      'Pas de connexion Internet',
      'Veuillez activer votre connexion pour effectuer la mise en ligne.'
    );
    return;
  }

  Alert.alert(
    'Confirmation',
    'Souhaitez-vous mettre les données en ligne ?',
    [
      {
        text: 'Annuler',
        style: 'cancel'
      },
      {
        text: 'Oui',
        onPress: () => uploadData(setLoading)
      }
    ]
  );
}


async function uploadData(setLoading) {
  try {
    setLoading(true);

    const data = await SyncService.getAllUnsyncedData();

    const noDataToSync =
      data.players.length === 0 &&
      data.funds.length === 0 &&
      data.winners.length === 0 &&
      data.losses.length === 0;

    if (noDataToSync) {
        const firebasePlayers = await fetchPlayersFromFirebase();
        const firebaseWinners = await fetchWinnersFromFirebase();
        const firebaseLosses = await fetchLossesFromFirebase();


        for (const player of firebasePlayers) {
            await PlayerRepository.createFullPlayerIfNotExists(player);
        }
        for (const gagnant of firebaseWinners) {
            await GameRepository.createFullGagnantIfNotExists(gagnant);
        }

        for (const perte of firebaseLosses) {
            await GameRepository.createFullPerteIfNotExists(perte);
        }
      Alert.alert('Info', 'Vous êtes à jour, aucune donnée à synchroniser.');
      return;
    }

    const uploadTasks = [];

    for (const player of data.players) {
      const syncedPlayer = { ...player, is_synced: 1 };
      uploadTasks.push(set(ref(database, `players/${player.uuid}`), syncedPlayer));
    }

    for (const fund of data.funds) {
      const syncedFund = { ...fund, is_synced: 1 };
      uploadTasks.push(set(ref(database, `funds/${fund.uuid}`), syncedFund));
    }

    for (const win of data.winners) {
      const syncedWinner = { ...win, is_synced: 1 };
      uploadTasks.push(set(ref(database, `winners/${win.uuid}`), syncedWinner));
    }

    for (const loss of data.losses) {
      const syncedLoss = { ...loss, is_synced: 1 };
      uploadTasks.push(set(ref(database, `losses/${loss.uuid}`), syncedLoss));
    }

    await Promise.all(uploadTasks);

    await PlayerRepository.markPlayersAsSynced(data.players.map(p => p.idplayer));
    await GameRepository.markFundsAsSynced(data.funds.map(f => f.idfond));
    await GameRepository.markWinnersAsSynced(data.winners.map(w => w.idgagnant));
    await GameRepository.markLossesAsSynced(data.losses.map(l => l.idperte));

    const firebasePlayers = await fetchPlayersFromFirebase();
    const firebaseWinners = await fetchWinnersFromFirebase();
    const firebaseLosses = await fetchLossesFromFirebase();


    for (const player of firebasePlayers) {
        await PlayerRepository.createFullPlayerIfNotExists(player);
    }
    for (const gagnant of firebaseWinners) {
        await GameRepository.createFullGagnantIfNotExists(gagnant);
    }

    for (const perte of firebaseLosses) {
        await GameRepository.createFullPerteIfNotExists(perte);
    }


    Alert.alert('Succès', 'Données synchronisées avec succès');
  } catch (error) {
    console.error('Erreur de mise en ligne :', error);
    Alert.alert('Erreur', 'Une erreur est survenue pendant la mise en ligne');
  } finally {
    setLoading(false);
  }
}
