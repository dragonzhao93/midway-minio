import * as Minio from 'minio';
import type { ProxyClientFunc } from './type';

export { Minio };

export type MWMinioOptions = Minio.ClientOptions & { bucket: string };

export type MinioServiceFactoryReturnType = ProxyClientFunc & {
  bucketName: string;
};
