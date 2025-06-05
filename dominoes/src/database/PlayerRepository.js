import Database from './Database';

import uuid from 'react-native-uuid';
import { getDeviceId } from './../services/DeviceService';


class PlayerRepository {
  constructor() {
    this.db = Database;
  }

  async init() {
    await this.db.init();
  }


  async createPlayer(name) {
    try {
      const deviceId = await getDeviceId();
      const db = await this.db.dbPromise;
      const uuidval = uuid.v4();

      const result = await db.runAsync(
        'INSERT INTO player (idplayer, device_id, name) VALUES (?, ?, ?)',
        [uuidval, deviceId, name]
      );
      return uuidval;
    } catch (error) {
      console.error('Erreur création joueur:', error);
      throw error;
    }
  }

  async createFullPlayerIfNotExists(player) {
    try {
      const db = await this.db.dbPromise;

      const idplayer = player.idplayer ?? uuid.v4();
      const deviceId = player.device_id ?? await getDeviceId();
      const uuidval = player.uuid ?? '1';
      const name = player.name;
      const is_synced = player.is_synced ?? 1;
      const createdAt = player.created_at ?? new Date().toISOString();
      const updatedAt = player.updated_at ?? new Date().toISOString();

      const existing = await db.getFirstAsync(
        `SELECT * FROM player WHERE idplayer = ? OR uuid = ?`,
        [idplayer, uuidval]
      );

      if (!existing) {
        await db.runAsync(
          `INSERT INTO player 
          (idplayer, uuid, name, device_id, is_synced, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [idplayer, uuidval, name, deviceId, is_synced, createdAt, updatedAt]
        );
        return idplayer;
      } else {
        console.log(`Joueur déjà existant : ${idplayer} / ${uuidval}`);
        return existing.idplayer;
      }

    } catch (error) {
      console.error('Erreur lors de la création du joueur (doublon ?) :', error);
      throw error;
    }
  }



  async getAllPlayers() {
    try {
      const db = await this.db.dbPromise;
      const result = await db.getAllAsync('SELECT * FROM player ORDER BY name');
      return result;
    } catch (error) {
      console.error('Erreur récupération joueurs:', error);
      throw error;
    }
  }

  async getUnsyncedPlayers() {
    try {
      const db = await this.db.dbPromise;
      const result = await db.getAllAsync('SELECT * FROM player WHERE is_synced = 0');
      return result;
    } catch (error) {
      console.error('Erreur récupération joueurs non synchronisés:', error);
      throw error;
    }
  }

  async markPlayersAsSynced(ids) {
    try {
      const db = await this.db.dbPromise;
      const placeholders = ids.map(() => '?').join(',');
      await db.runAsync(
        `UPDATE player SET is_synced = 1 WHERE idplayer IN (${placeholders})`,
        ids
      );
      return true;
    } catch (error) {
      console.error('Erreur mise à jour sync joueurs:', error);
      throw error;
    }
  }


  async updatePlayer(id, name) {
    try {
      const db = await this.db.dbPromise;
      const updatedAt = new Date().toISOString();

      await db.runAsync(
        'UPDATE player SET name = ?, updated_at = ? WHERE idplayer = ?',
        [name, updatedAt, id]
      );
      return true;
    } catch (error) {
      console.error('Erreur mise à jour joueur:', error);
      throw error;
    }
  }

  async deletePlayer(id) {
    try {
      const db = await this.db.dbPromise;
      await db.runAsync('DELETE FROM player WHERE idplayer = ?', [id]);
      return true;
    } catch (error) {
      console.error('Erreur suppression joueur:', error);
      throw error;
    }
  }
}

export default new PlayerRepository();