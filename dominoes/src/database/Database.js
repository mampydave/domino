import SQLite from 'react-native-sqlite-storage';
import { SCHEMA, SCHEMA_VERSION } from './schema';

// Active le mode debug si nécessaire
SQLite.DEBUG(true);
SQLite.enablePromise(true);

class Database {
  constructor() {
    this.db = null;
    this.dbName = 'game.db';
  }

  // Initialisation de la base de données
  async init() {
    try {
      this.db = await SQLite.openDatabase(
        this.dbName,
        SCHEMA_VERSION,
        'Jeu de domino Database',
        -1, // Taille max (infinie si -1)
        this._onDatabaseOpen,
        this._onDatabaseError
      );
      
      await this._createTables();
      return this.db;
    } catch (error) {
      console.error('Erreur initialisation DB:', error);
      throw error;
    }
  }

  // Création des tables
  async _createTables() {
    try {
      await this.db.transaction(async (tx) => {
        for (const table of SCHEMA.tables) {
          // Construction de la requête CREATE TABLE
          const columns = table.columns.map(col => {
            if (col.type) {
              return `${col.name} ${col.type}`;
            }
            return col.name; // Pour les contraintes sans type
          }).join(', ');
          
          await tx.executeSql(
            `CREATE TABLE IF NOT EXISTS ${table.name} (${columns})`,
            []
          );
        }
      });
    } catch (error) {
      console.error('Erreur création tables:', error);
      throw error;
    }
  }

  // Callback pour ouverture réussie
  _onDatabaseOpen(db) {
    console.log('Database OPENED:', db);
  }

  // Callback pour erreurs
  _onDatabaseError(error) {
    console.error('Database ERROR:', error);
  }

  // Fermer la base de données
  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  // Supprimer la base (pour développement)
  async delete() {
    await SQLite.deleteDatabase(this.dbName);
    this.db = null;
  }
}

// Exportez une instance unique (singleton)
export default new Database();