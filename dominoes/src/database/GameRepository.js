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
      let result;
      await this.db.db.transaction(async (tx) => {
        result = await tx.executeSql(
          'INSERT INTO fond (amount) VALUES (?)',
          [amount]
        );
      });
      return result.insertId;
    } catch (error) {
      console.error('Erreur création fond:', error);
      throw error;
    }
  }


    async getLastFund() {
        try {
        let fund = null;
        await this.db.transaction(async (tx) => {
            const result = await tx.executeSql(
            'SELECT * FROM fond ORDER BY idfond DESC LIMIT 1'
            );
            if (result.rows.length > 0) {
                fund = result.rows.item(0);
            }
        });
        return fund;
        } catch (error) {
        console.error('Erreur récupération dernier fond:', error);
        throw error;
        }
   }
  
   async addWinner(playerId, date, fundId) {
    try {
      await this.db.db.transaction(async (tx) => {
        await tx.executeSql(
          'INSERT INTO gagnant (idplayer, date, fond) VALUES (?, ?, ?)',
          [playerId, date, fundId]
        );
      });
      return true;
    } catch (error) {
      console.error('Erreur ajout gagnant:', error);
      throw error;
    }
  }

  async addLosers(losersIds, date, fundId) {
    try {
      await this.db.db.transaction(async (tx) => {
        for (const playerId of losersIds) {
          await tx.executeSql(
            'INSERT INTO perte (idplayer, date, fond) VALUES (?, ?, ?)',
            [playerId, date, fundId]
          );
        }
      });
      return true;
    } catch (error) {
      console.error('Erreur ajout perdants:', error);
      throw error;
    }
  }


async getTopPlayersByWins() {
  try {
    let players = [];
    await this.db.transaction(async (tx) => {
      const result = await tx.executeSql(`
        SELECT p.idplayer, p.name, 
               COUNT(g.idgagnant) as totalWins, 
               SUM(g.fond) as totalAmount
        FROM player p
        JOIN gagnant g ON p.idplayer = g.idplayer
        GROUP BY p.idplayer
        ORDER BY totalAmount DESC
        LIMIT 5
      `);
      for (let i = 0; i < result.rows.length; i++) {
        players.push(result.rows.item(i));
      }
    });
    return players;
  } catch (error) {
    console.error('Error getting top players:', error);
    return [];
  }
}

async getWorstPlayersByLosses() {
  try {
    let players = [];
    await this.db.transaction(async (tx) => {
      const result = await tx.executeSql(`
        SELECT p.idplayer, p.name, 
               COUNT(pe.idperte) as totalLosses, 
               SUM(pe.fond) as totalAmount
        FROM player p
        JOIN perte pe ON p.idplayer = pe.idplayer
        GROUP BY p.idplayer
        ORDER BY totalAmount DESC
        LIMIT 5
      `);
      for (let i = 0; i < result.rows.length; i++) {
        players.push(result.rows.item(i));
      }
    });
    return players;
  } catch (error) {
    console.error('Error getting worst players:', error);
    return [];
  }
}

async getTotalFunds() {
  try {
    let total = 0;
    await this.db.transaction(async (tx) => {
      const result = await tx.executeSql('SELECT SUM(amount) as total FROM fond');
      if (result.rows.length > 0) {
        total = result.rows.item(0).total || 0;
      }
    });
    return total;
  } catch (error) {
    console.error('Error getting total funds:', error);
    return 0;
  }
}

async getGlobalStats() {
  try {
    const stats = {
      totalWins: 0,
      totalLosses: 0,
      avgWinAmount: 0,
      avgLossAmount: 0
    };
    
    await this.db.transaction(async (tx) => {
      // Nombre total de victoires
      const wins = await tx.executeSql('SELECT COUNT(*) as count FROM gagnant');
      stats.totalWins = wins.rows.item(0).count;
      
      // Nombre total de pertes
      const losses = await tx.executeSql('SELECT COUNT(*) as count FROM perte');
      stats.totalLosses = losses.rows.item(0).count;
      
      // Moyenne des gains
      const avgWin = await tx.executeSql('SELECT AVG(fond) as avg FROM gagnant');
      stats.avgWinAmount = avgWin.rows.item(0).avg;
      
      // Moyenne des pertes
      const avgLoss = await tx.executeSql('SELECT AVG(fond) as avg FROM perte');
      stats.avgLossAmount = avgLoss.rows.item(0).avg;
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting global stats:', error);
    return stats;
  }
}

  
  async getGameHistory() {
    try {
      let history = [];
      await this.db.db.transaction(async (tx) => {
        const funds = await tx.executeSql('SELECT * FROM fond ORDER BY idfond DESC');
        
        for (let i = 0; i < funds.rows.length; i++) {
          const fund = funds.rows.item(i);
          
          const winner = await tx.executeSql(
            'SELECT p.* FROM gagnant g JOIN player p ON g.idplayer = p.idplayer WHERE g.idfond = ?',
            [fund.idfond]
          );
          
          const losers = await tx.executeSql(
            'SELECT p.* FROM perte pe JOIN player p ON pe.idplayer = p.idplayer WHERE pe.idfond = ?',
            [fund.idfond]
          );
          
          history.push({
            fund,
            winner: winner.rows.item(0),
            losers: losers.rows._array,
            date: fund.date
          });
        }
      });
      return history;
    } catch (error) {
      console.error('Erreur récupération historique:', error);
      throw error;
    }
  }
}

export default new GameRepository();