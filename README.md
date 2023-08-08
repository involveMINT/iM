# Official involveMINT Web App Repository

## Build Prerequisites

Prerequisites:

- Node.js
- Docker

## Steps to Set Up Environment

1. Fork and clone this repository. Ensure that you uncheck the "copy main branch only" checkbox. Once you forked the repository, clone it to a directory on your local machine and `cd` into it.

2. Checkout the "develop" branch: `git checkout develop`.
3. Ensure you have Node.js installed. If you don't, please look at the section on [installing node.js](#installing-nodejs).
4. Ensure you have Docker installed. If you don't, please navigate to the [official website](https://docs.docker.com/get-docker/) and follow the instructions. Run `docker --version` in your terminal after it's installed to ensure you have installed everything correctly.

### Installing Node.js

Run the following commands.

1. `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash`
2. `export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"`
3. `[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"`
4. Refresh your shell (close and reopen). If you're using zsh, here's a shortcut: `source ~/.zshrc`
5. If the following command does not throw an error, you're good so far: `nvm -v`
6. `nvm install --lts`
7. `nvm use --lts`

### Configuring Firebase

In order to run this code, you will need to navigate to [firebase](https://console.firebase.google.com/). You will see a screen that looks like ![firebase-landing](/assets/firebase-landing.png) and click "Create a project" (if you don't already have a GCP account and an existing project where you want to use Firebase). Once you have a project, you should see a screen like ![this](assets/firebase-dashboard.png) Once here, click the little gear and you'll see a screen that looks like ![this](assets/firebase-settings.png) Select the "Service accounts" tab and you'll see a screen that looks like ![this](assets/firebase-service-accounts.png) Hit the "Manage service account permissions" hyperlink which will take you to your GCP project. You will see a screen that looks like ![this](/assets/googlecloud-service-accounts.png). Click the account and then hit the "Keys" tab. You should see a screen that looks like ![this](/assets/service-account-keys.png). Click "Add Key" and then choose the "JSON" option to download it as a JSON file.

Ensure you are in the project directory (the directory that this file is in). Run the following command: `cp libs/shared/domain/src/lib/environments/environment.ts libs/shared/domain/src/lib/environments/environment.prod.ts` and open the new file (environment.prod.ts) in your editor. It should look like this at first:

```typescript
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
  gcpApiKey: 'insert your key here',
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
  gcp: {
    type: 'service_account',
    project_id: 'project-id',
    private_key_id: 'Your Private Key',
    private_key: '-----BEGIN PRIVATE KEY-----\nYour Private Key\n-----END PRIVATE KEY-----\n',
    client_email: 'Your client email',
    client_id: 'client id',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: 'cert url',
  },
  // I don't think this is used
  scrypt: {
    memCost: 14,
    rounds: 8,
    saltSeparator: 'Bw==',
    signerKey: 'de/PQ/Gy53mgslvUgDUKDCgHJPArYqbFnGILLQZNe5My/CvqIThVL/CsndU8oudZ9lc4B7PT8w3sAar2/luQxA==',
  },
};
```

Under the key "typeOrmConfig", please change the password field to "postgres". Under the key "gcp", please change the fields to match the fields in your service account JSON file that you just downloaded in the previous step.

### Starting the Containers

Run `docker compose up` in the root directory, which will spin up a PostgreSQL database on port 5432 and a PgAdmin UI on port 8889.

### Starting the Apps

Open a terminal and run `npm i` to install all the required packages. Once done, run `export NODE_OPTIONS=--openssl-legacy-provider` because otherwise there will be an error with OpenSSL. To start the client, run `npm run start:client`. To start the server, open a new terminal, export the same environment variable as before (`export NODE_OPTIONS=--openssl-legacy-provider`), run `npm run build`, and then `npm run start`.

For any issues, or to suggest improvements to this documentation, please contact Anish Sinha <<anish@developforgood.org>>
