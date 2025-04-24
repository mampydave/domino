import Database from './Database';

class PlayerRepository {
  constructor() {
    this.db = Database;
  }

  // Initialisation (à appeler au démarrage de l'app)
  async init() {
    await this.db.init();
  }

  // Créer un joueur
  async createPlayer(name) {
    try {
      let result;
      await this.db.db.transaction(async (tx) => {
        result = await tx.executeSql(
          'INSERT INTO player (name) VALUES (?)',
          [name]
        );
      });
      return result.insertId;
    } catch (error) {
      console.error('Erreur création joueur:', error);
      throw error;
    }
  }

  // Récupérer tous les joueurs
  async getAllPlayers() {
    try {
      let players = [];
      await this.db.db.transaction(async (tx) => {
        const result = await tx.executeSql('SELECT * FROM player ORDER BY name');
        for (let i = 0; i < result.rows.length; i++) {
          players.push(result.rows.item(i));
        }
      });
      return players;
    } catch (error) {
      console.error('Erreur récupération joueurs:', error);
      throw error;
    }
  }

  // Mettre à jour un joueur
  async updatePlayer(id, name) {
    try {
      await this.db.db.transaction(async (tx) => {
        await tx.executeSql(
          'UPDATE player SET name = ? WHERE idplayer = ?',
          [name, id]
        );
      });
      return true;
    } catch (error) {
      console.error('Erreur mise à jour joueur:', error);
      throw error;
    }
  }

  // Supprimer un joueur
  async deletePlayer(id) {
    try {
      await this.db.db.transaction(async (tx) => {
        await tx.executeSql(
          'DELETE FROM player WHERE idplayer = ?',
          [id]
        );
      });
      return true;
    } catch (error) {
      console.error('Erreur suppression joueur:', error);
      throw error;
    }
  }
}

export default new PlayerRepository();