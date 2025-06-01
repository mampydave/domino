import Database from './Database';

class PlayerRepository {
  constructor() {
    this.db = Database;
  }

  async init() {
    await this.db.init();
  }

  async createPlayer(name) {
    try {
      const db = await this.db.dbPromise;
      const result = await db.runAsync('INSERT INTO player (name) VALUES (?)', [name]);
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Erreur création joueur:', error);
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

  async updatePlayer(id, name) {
    try {
      const db = await this.db.dbPromise;
      await db.runAsync('UPDATE player SET name = ? WHERE idplayer = ?', [name, id]);
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