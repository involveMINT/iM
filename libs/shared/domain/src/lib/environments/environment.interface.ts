import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { FirebaseScryptOptions } from 'firebase-scrypt';

export interface Env {
  production: boolean;
  test: boolean;
  host: string;
  apiUrl: string;
  appUrl: string;
  storageBucket: string;
  adminPasswordHash: string;
  typeOrmConfig: TypeOrmModuleOptions;
  firebaseEnv: {
    apiKey: string;
    authDomain: string;
    databaseURL: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
  };
  mailgun: {
    apiKey: string;
    domain: string;
  };
  twilio: {
    accountSid: string;
    authToken: string;
    sendingPhone: string;
  };
  
  scrypt: FirebaseScryptOptions;
}
