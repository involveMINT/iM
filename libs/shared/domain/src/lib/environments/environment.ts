import { Env } from './environment.interface';

const host = 'localhost';

/** Develop environment variables. */
export const environment: Env = {
  production: false,
  test: false,
  host,
  apiUrl: `http://${host}:3335`,
  appUrl: `http://${host}:4202`,
  storageBucket: 'your storage bucket',
  adminPasswordHash:
    'sZfCJx5X3sGSwkokIs9IVFxDfxWd2lEKsAhkOSDfEK8u2YS98y5rJAmXmtrJs7AQ29xkHMmz0bDfLkXCKS9/+A==',
  typeOrmConfig: {
    type: 'postgres',
    host: '127.0.0.1',
    port: 5432,
    username: 'postgres',
    password: '1Qazxsw2',
    database: 'involvemint',
    synchronize: true,
    autoLoadEntities: true,
    ssl: false,
  },
  firebaseEnv: {
    apiKey: 'insert your key here',
    authDomain: 'firebase auth domain',
    databaseURL: '',
    projectId: 'your project id',
    storageBucket: 'Your project storage bucket', //your-something.appspot.com
    messagingSenderId: '',
    appId: 'your app id',
    measurementId: 'Your measurementId',
  },
  // mailgun and twilio are optional
  mailgun: {
    apiKey: '',
    domain: '',
  },
  twilio: {
    accountSid: '',
    authToken: '',
    sendingPhone: '',
  },
  // I don't think this is used
  scrypt: {
    memCost: 14,
    rounds: 8,
    saltSeparator: 'Bw==',
    signerKey: 'de/PQ/Gy53mgslvUgDUKDCgHJPArYqbFnGILLQZNe5My/CvqIThVL/CsndU8oudZ9lc4B7PT8w3sAar2/luQxA==',
  },
};
