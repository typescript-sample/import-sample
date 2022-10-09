export const config = {
  service: 'import-user',
  log: {
    level: 'debug',
    map: {
      time: '@timestamp',
      msg: 'message',
    },
    db: true,
  },
  file: {
    path: './scan_dir/',
    prefix: 'user_'
  },
  db: {
    host: 'sql6.freesqldatabase.com',
    port: 3306,
    user: 'sql6520711',
    password: 'WvGUYNPsjy',
    database: 'sql6520711',
    multipleStatements: true,
    connectionLimit: 10
  }
};

export const env = {
  sit: {
    log: {
      level: 'info',
      db: false,
    }
  },
  prd: {
    log: {
      level: 'error',
      db: false,
    }
  },
};
