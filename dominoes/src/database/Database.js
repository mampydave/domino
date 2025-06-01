import * as SQLite from 'expo-sqlite';
import { SCHEMA, SCHEMA_VERSION } from './schema';

class Database {
  constructor() {
    this.dbPromise = SQLite.openDatabaseAsync('game.db');
  }

  async init() {
    try {
      await this._createTables();
      return this.dbPromise;
    } catch (error) {
      console.error('Erreur initialisation DB:', error);
      throw error;
    }
  }

  async _createTables() {
    const db = await this.dbPromise;
    
    try {

      await db.execAsync('BEGIN TRANSACTION');
      

      for (const table of SCHEMA.tables) {
        const columns = table.columns.map(col =>
          col.type ? `${col.name} ${col.type}` : col.name
        ).join(', ');
        
        const sql = `CREATE TABLE IF NOT EXISTS ${table.name} (${columns})`;
        await db.execAsync(sql);
        console.log(`Table ${table.name} créée.`);
      }
      

      await db.execAsync('COMMIT');
    } catch (err) {
      await db.execAsync('ROLLBACK');
      console.error('Erreur lors de la création des tables:', err);
      throw err;
    }
  }

  async close() {
    console.warn("La fermeture explicite de la DB n'est pas supportée dans expo-sqlite.");
  }

  async delete() {
    console.warn("La suppression de la base n'est pas directement supportée avec expo-sqlite.");
  }
}

export default new Database();