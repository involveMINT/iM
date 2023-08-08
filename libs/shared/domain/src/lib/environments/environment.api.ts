import { ServiceEnv } from "./environment.interface.api";
/** Develop environment variables. */
export const apiEnvironment: ServiceEnv = {
    gcp: {
        type: 'service_account',
        project_id: 'project-id',
        private_key_id: 'Your Private Key',
        private_key:
            '-----BEGIN PRIVATE KEY-----\nYour Private Key\n-----END PRIVATE KEY-----\n',
        client_email: 'Your client email',
        client_id: 'client id',
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url:
            'cert url',
    },
    gcpApiKey: 'insert your key here',
    production: false
}
