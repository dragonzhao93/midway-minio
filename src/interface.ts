import * as Minio from 'minio';
import { ProxyClient } from './proxy';

export { Minio };

export type MWMinioOptions = Minio.ClientOptions & { bucket: string };

export type MinioServiceFactoryReturnType = ProxyClient & {
  bucketName: string;
};
