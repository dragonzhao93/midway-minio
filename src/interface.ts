import * as Minio from 'minio';

export { Minio };

export type MWMinioOptions = Minio.ClientOptions & { bucket: string };

export type MinioServiceFactoryReturnType = Minio.Client;
