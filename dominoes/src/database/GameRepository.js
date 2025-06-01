import Database from './Database';

class GameRepository {
  constructor() {
    this.db = Database;
  }

  async init() {
    await this.db.init();
  }

  async createFund(amount) {
    try {
      const db = await this.db.dbPromise;
      const result = await db.runAsync('INSERT INTO fond (amount) VALUES (?)', [amount]);
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Erreur création fond:', error);
      throw error;
    }
  }

  async getLastFund() {
    try {
      const db = await this.db.dbPromise;
      const result = await db.getFirstAsync('SELECT * FROM fond ORDER BY idfond DESC LIMIT 1');
      return result;
    } catch (error) {
      console.error('Erreur récupération dernier fond:', error);
      throw error;
    }
  }
  
  async addWinner(playerId, date, fundId) {
    try {
      const db = await this.db.dbPromise;
      await db.runAsync('INSERT INTO gagnant (idplayer, date, fond) VALUES (?, ?, ?)', 
        [playerId, date, fundId]);
      return true;
    } catch (error) {
      console.error('Erreur ajout gagnant:', error);
      throw error;
    }
  }

  async addLosers(losersIds, date, fundId) {
    try {
      const db = await this.db.dbPromise;
      await db.execAsync('BEGIN TRANSACTION');
      
      try {
        for (const playerId of losersIds) {
          await db.runAsync('INSERT INTO perte (idplayer, date, fond) VALUES (?, ?, ?)', 
            [playerId, date, fundId]);
        }
        await db.execAsync('COMMIT');
        return true;
      } catch (error) {
        await db.execAsync('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Erreur ajout perdants:', error);
      throw error;
    }
  }

  async getTopPlayersByWins() {
    try {
      const db = await this.db.dbPromise;
      
      console.log('gagnant',await db.getAllAsync('SELECT * FROM gagnant'));
            console.log('perdant',await db.getAllAsync('SELECT * FROM perte'));
      // console.log('player',await db.getAllAsync('SELECT * FROM player LIMIT 5'));
      const result = await db.getAllAsync(`
        SELECT p.idplayer, p.name, 
               COUNT(g.idgagnant) as totalWins, 
               SUM(g.fond) as totalAmount,g.date as date
        FROM player p
        JOIN gagnant g ON p.idplayer = g.idplayer
        GROUP BY p.idplayer
        ORDER BY totalAmount DESC
        LIMIT 5
      `);
      return result;
    } catch (error) {
      console.error('Error getting top players:', error);
      return [];
    }
  }

  async getWorstPlayersByLosses() {
    try {
      const db = await this.db.dbPromise;
      const result = await db.getAllAsync(`
        SELECT p.idplayer, p.name, 
               COUNT(pe.idperte) as totalLosses, 
               SUM(pe.fond) as totalAmount,pe.date as date
        FROM player p
        JOIN perte pe ON p.idplayer = pe.idplayer
        GROUP BY p.idplayer
        ORDER BY totalAmount DESC
        LIMIT 5
      `);
      return result;
    } catch (error) {
      console.error('Error getting worst players:', error);
      return [];
    }
  }

  async getTotalFunds() {
    try {
      const db = await this.db.dbPromise;
      const result = await db.getFirstAsync('SELECT SUM(amount) as total FROM fond');
      return result?.total || 0;
    } catch (error) {
      console.error('Error getting total funds:', error);
      return 0;
    }
  }

  async getGlobalStats() {
    try {
      const db = await this.db.dbPromise;
      const stats = {};
      
      // Exécution en parallèle pour meilleure performance
      const [wins, losses, avgWin, avgLoss] = await Promise.all([
        db.getFirstAsync('SELECT COUNT(*) as count FROM gagnant'),
        db.getFirstAsync('SELECT COUNT(*) as count FROM perte'),
        db.getFirstAsync('SELECT AVG(fond) as avg FROM gagnant'),
        db.getFirstAsync('SELECT AVG(fond) as avg FROM perte')
      ]);
      
      return {
        totalWins: wins?.count || 0,
        totalLosses: losses?.count || 0,
        avgWinAmount: avgWin?.avg || 0,
        avgLossAmount: avgLoss?.avg || 0
      };
    } catch (error) {
      console.error('Error getting global stats:', error);
      return {
        totalWins: 0,
        totalLosses: 0,
        avgWinAmount: 0,
        avgLossAmount: 0
      };
    }
  }
  
  async getGameHistory() {
    try {
      const db = await this.db.dbPromise;
      const funds = await db.getAllAsync('SELECT * FROM fond ORDER BY idfond DESC');
      
      const history = await Promise.all(funds.map(async fund => {
        const [winner, losers] = await Promise.all([
          db.getFirstAsync(`
            SELECT p.* FROM gagnant g 
            JOIN player p ON g.idplayer = p.idplayer 
            WHERE g.idfond = ?`, [fund.idfond]),
          db.getAllAsync(`
            SELECT p.* FROM perte pe 
            JOIN player p ON pe.idplayer = p.idplayer 
            WHERE pe.idfond = ?`, [fund.idfond])
        ]);
        
        return {
          fund,
          winner,
          losers,
          date: fund.date
        };
      }));
      
      return history;
    } catch (error) {
      console.error('Erreur récupération historique:', error);
      throw error;
    }
  }

    async fetchAllWinsData() {
      try {
        const db = await this.db.dbPromise;
        return await db.getAllAsync(`
          SELECT 
            g.idgagnant as id,
            g.idplayer,
            p.name,
            g.fond as amount,
            g.date,
            'win' as type
          FROM gagnant g
          LEFT JOIN player p ON g.idplayer = p.idplayer
          ORDER BY g.date DESC
        `);
      } catch (error) {
        console.error('Error fetching raw win transactions:', error);
        return [];
      }
    }

  async fetchAllLossesData() {
    try {
      const db = await this.db.dbPromise;
      return await db.getAllAsync(`
        SELECT 
          pe.idperte as id,
          pe.idplayer,
          p.name,
          pe.fond as amount,
          pe.date,
          'loss' as type
        FROM perte pe
        LEFT JOIN player p ON pe.idplayer = p.idplayer
        ORDER BY pe.date DESC
      `);
    } catch (error) {
      console.error('Error fetching raw loss transactions:', error);
      return [];
    }
  }

  async resetAllData() {
    try {
      const db = await this.db.dbPromise;
      await db.execAsync('BEGIN TRANSACTION');
      
      try {
        await db.runAsync('DELETE FROM player');
        await db.runAsync("DELETE FROM sqlite_sequence WHERE name = 'player'");
        await db.runAsync('DELETE FROM fond');
        await db.runAsync("DELETE FROM sqlite_sequence WHERE name = 'fond'");
        await db.runAsync('DELETE FROM gagnant');
        await db.runAsync("DELETE FROM sqlite_sequence WHERE name = 'gagnant'");
        await db.runAsync('DELETE FROM perte');
        await db.runAsync("DELETE FROM sqlite_sequence WHERE name = 'perte'");
        
        await db.execAsync('COMMIT');
        console.log('Toutes les données ont été réinitialisées.');
      } catch (error) {
        await db.execAsync('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Erreur lors de la réinitialisation des données :', error);
      throw error;
    }
  }
}

export default new GameRepository();