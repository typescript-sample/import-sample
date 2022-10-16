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
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: 'abcd1234',
    database: 'masterdata',
    multipleStatements: true,
    connectionLimit: 10
  },
  error: {
    directory: './log/',
    prefix: 'error_',
    suffix: '.txt'
  },
  info: {
    directory: './log/',
    prefix: 'log_',
    suffix: '.txt'
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
