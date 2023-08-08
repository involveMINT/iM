/**
 * Environment file for api
 * @type {{production: boolean; gcpApiKey: string; gcp: {}}}
 */
export interface ServiceEnv {
    production: boolean;
    gcpApiKey: string;
    // eslint-disable-next-line @typescript-eslint/ban-types
    gcp: object;
}