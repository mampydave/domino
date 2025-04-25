export const SCHEMA = {
    tables: [
      {
        name: 'player',
        columns: [
          { name: 'idplayer', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
          { name: 'name', type: 'TEXT NOT NULL' },
          { name: 'created_at', type: 'TEXT DEFAULT CURRENT_TIMESTAMP' }
        ]
      },
      {
        name: 'fond',
        columns: [
          { name: 'idfond', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
          { name: 'amount', type: 'INTEGER' }
        ]
      },
      {
        name: 'gagnant',
        columns: [
          { name: 'idgagnant', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
          { name: 'idplayer', type: 'INTEGER' },
          { name: 'date', type: 'TEXT' },
          { name: 'fond', type: 'INTEGER' },
          { 
            name: 'FOREIGN KEY(idplayer) REFERENCES player(idplayer)',
            type: '' // Spécial pour les contraintes
          }
        ]
      },
      {
        name: 'perte',
        columns: [
          { name: 'idperte', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
          { name: 'idplayer', type: 'INTEGER' },
          { name: 'date', type: 'TEXT' },
          { name: 'fond', type: 'INTEGER' },
          {
            name: 'FOREIGN KEY(idplayer) REFERENCES player(idplayer)',
            type: ''
          }
        ]
      }
    ]
  };
  

  export const SCHEMA_VERSION = 1;