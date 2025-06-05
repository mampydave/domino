export const SCHEMA = {
  tables: [
    {
      name: 'player',
      columns: [
        { name: 'uuid', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
        { name: 'idplayer', type: 'TEXT UNIQUE NOT NULL' },
        { name: 'device_id', type: 'TEXT' },
        { name: 'name', type: 'TEXT NOT NULL' },
        { name: 'created_at', type: 'TEXT DEFAULT CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'TEXT DEFAULT CURRENT_TIMESTAMP' },
        { name: 'is_synced', type: 'INTEGER DEFAULT 0' }
      ]
    },
    {
      name: 'fond',
      columns: [
        { name: 'idfond', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
        { name: 'uuid', type: 'TEXT UNIQUE NOT NULL' },
        { name: 'device_id', type: 'TEXT' },
        { name: 'amount', type: 'INTEGER' },
        { name: 'updated_at', type: 'TEXT DEFAULT CURRENT_TIMESTAMP' },
        { name: 'is_synced', type: 'INTEGER DEFAULT 0' }
      ]
    },
    {
      name: 'gagnant',
      columns: [
        { name: 'idgagnant', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
        { name: 'uuid', type: 'TEXT UNIQUE NOT NULL' },
        { name: 'device_id', type: 'TEXT' },
        { name: 'idplayer', type: 'INTEGER' },
        { name: 'date', type: 'TEXT' },
        { name: 'fond', type: 'INTEGER' },
        { name: 'updated_at', type: 'TEXT DEFAULT CURRENT_TIMESTAMP' },
        { name: 'is_synced', type: 'INTEGER DEFAULT 0' },
        {
          name: 'FOREIGN KEY(idplayer) REFERENCES player(idplayer)',
          type: ''
        }
      ]
    },
    {
      name: 'perte',
      columns: [
        { name: 'idperte', type: 'INTEGER PRIMARY KEY AUTOINCREMENT' },
        { name: 'uuid', type: 'TEXT UNIQUE NOT NULL' },
        { name: 'device_id', type: 'TEXT' },
        { name: 'idplayer', type: 'INTEGER' },
        { name: 'date', type: 'TEXT' },
        { name: 'fond', type: 'INTEGER' },
        { name: 'updated_at', type: 'TEXT DEFAULT CURRENT_TIMESTAMP' },
        { name: 'is_synced', type: 'INTEGER DEFAULT 0' },
        {
          name: 'FOREIGN KEY(idplayer) REFERENCES player(idplayer)',
          type: ''
        }
      ]
    }
  ]
};

export const SCHEMA_VERSION = 1;
