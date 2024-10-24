import { Client } from 'minio';
import type { MWMinioOptions } from './interface';
import { createReadStream } from 'fs';
import type {
  BucketVersioningConfiguration,
  EncryptionConfig,
  GetObjectOpts,
  GetObjectRetentionOpts,
  ObjectMetaData,
  ObjectRetentionInfo,
  PreSignRequestParams,
  RemoveObjectsParam,
  RemoveObjectsResponse,
  SelectOptions,
  StatObjectOpts,
  TaggingOpts,
  UploadedObjectInfo,
  LifeCycleConfigParam,
  ResultCallback,
  Tags,
} from 'minio/dist/main/internal/type';
import * as stream from 'node:stream';
import type {
  RemoveOptions,
  SelectResults,
  NotificationConfig,
  NotificationEvent,
  NotificationPoller,
  BucketItem,
  BucketItemStat,
  BucketStream,
  GetObjectLegalHoldOptions,
  IncompleteUploadedBucketItem,
  ItemBucketMetadata,
  LifecycleConfig,
  ObjectLockInfo,
  PutObjectLegalHoldOptions,
  ReplicationConfig,
  ReplicationConfigOpts,
  Retention,
  Tag,
} from 'minio';

import type { NoResultCallback } from 'minio/dist/main/internal/client';
const proxyBucketNameMethods = [
  'listObjects',
  'listObjectsV2',
  'listIncompleteUploads',
  'setBucketVersioning',
  'getBucketVersioning',
  'setBucketReplication',
  'getBucketReplication',
  'removeBucketReplication',
  'setBucketTagging',
  'removeBucketTagging',
  'getBucketTagging',
  'setBucketLifecycle',
  'getBucketLifecycle',
  'removeBucketLifecycle',
  'setObjectLockConfig',
  'getObjectLockConfig',
  'setBucketEncryption',
  'getBucketEncryption',
  'removeBucketEncryption',
  'getObject',
  'getPartialObject',
  'fGetObject',
  'putObject',
  'fPutObject',
  'statObject',
  'removeObject',
  'removeObjects',
  'removeIncompleteUpload',
  'putObjectRetention',
  'getObjectRetention',
  'setObjectTagging',
  'removeObjectTagging',
  'getObjectTagging',
  'getObjectLegalHold',
  'setObjectLegalHold',
  'selectObjectContent',
  'presignedUrl',
  'presignedGetObject',
  'presignedPutObject',
  'getBucketNotification',
  'setBucketNotification',
  'removeAllBucketNotification',
  'listenBucketNotification',
  'getBucketPolicy',
  'setBucketPolicy',
];

async function streamToArray<T>(stream) {
  return new Promise<T[]>((resolve, reject) => {
    const data: T[] = [];
    stream.on('data', obj => data.push(obj));
    stream.on('end', () => resolve(data));
    stream.on('error', err => reject(err));
  });
}

async function callbackToPromise<T>(func, args) {
  return new Promise<{ etag: string; versionId: string }>((resolve, reject) => {
    func(...args, (err, objInfo) => {
      if (err) return reject(err);
      resolve(objInfo);
    });
  });
}

// @ts-ignore
export class ProxyClient extends Client {
  /**
   * listObjects异步方法
   * @param methodArgs
   */
  async listObjectsAsync(...methodArgs) {
    const stream = this.listObjects(...methodArgs);
    return streamToArray<BucketItem>(stream);
  }

  /**
   * listObjectsV2异步方法
   * @param methodArgs
   */
  async listObjectsV2Async(...methodArgs) {
    const stream = this.listObjectsV2(...methodArgs);
    return streamToArray<BucketItem>(stream);
  }

  /**
   * putObject异步方法
   * @param methodArgs
   */
  async putObjectAsync(...methodArgs) {
    const [objectName, fileStream, ...resetArgs] = methodArgs;
    return callbackToPromise(this.putObject, [
      objectName,
      fileStream,
      ...resetArgs,
    ]);
  }

  /**
   * fPutObject异步方法
   * @param methodArgs
   */
  async fPutObjectAsync(...methodArgs) {
    const [objectName, filePath, ...resetArgs] = methodArgs;
    return new Promise<{ etag: string; versionId: string }>(
      (resolve, reject) => {
        const fileStream = createReadStream(filePath);
        this.putObject(
          objectName,
          fileStream,
          ...resetArgs,
          function (err, objInfo) {
            if (err) return reject(err);
            resolve(objInfo);
          }
        );
      }
    );
  }
}

// @ts-ignore
export interface ProxyClient extends Client {
  listObjects(prefix?: string, recursive?: boolean): BucketStream<BucketItem>;
  listObjectsV2(
    prefix?: string,
    recursive?: boolean,
    startAfter?: string
  ): BucketStream<BucketItem>;
  listIncompleteUploads(
    prefix?: string,
    recursive?: boolean
  ): BucketStream<IncompleteUploadedBucketItem>;
  setBucketVersioning(
    versioningConfig: BucketVersioningConfiguration
  ): Promise<void>;
  getBucketVersioning(): Promise<BucketVersioningConfiguration>;
  setBucketReplication(replicationConfig: ReplicationConfigOpts): Promise<void>;
  getBucketReplication(): Promise<ReplicationConfig>;
  removeBucketReplication(): Promise<void>;
  setBucketTagging(tags: Tags): Promise<void>;
  removeBucketTagging(): Promise<void>;
  getBucketTagging(): Promise<Tag[]>;
  setBucketLifecycle(lifeCycleConfig: LifeCycleConfigParam): Promise<void>;
  getBucketLifecycle(): Promise<LifecycleConfig | null>;
  removeBucketLifecycle(): Promise<void>;
  setObjectLockConfig(
    lockConfigOpts: Omit<ObjectLockInfo, 'objectLockEnabled'>
  ): Promise<void>;
  getObjectLockConfig(): Promise<ObjectLockInfo>;
  setBucketEncryption(encryptionConfig?: EncryptionConfig): Promise<void>;
  getBucketEncryption(): Promise<string>;
  removeBucketEncryption(): Promise<void>;
  getObject(
    objectName: string,
    getOpts: GetObjectOpts
  ): Promise<stream.Readable>;
  getPartialObject(
    objectName: string,
    offset: number,
    length: number,
    getOpts: GetObjectOpts
  ): Promise<stream.Readable>;
  fGetObject(
    objectName: string,
    filePath: string,
    getOpts: GetObjectOpts
  ): Promise<void>;
  putObject(
    objectName: string,
    stream: stream.Readable | Buffer | string,
    size?: number,
    metaData?: ItemBucketMetadata
  ): Promise<void>;
  fPutObject(
    objectName: string,
    filePath: string,
    metaData?: ObjectMetaData
  ): Promise<void>;
  statObject(
    objectName: string,
    statOpts: StatObjectOpts
  ): Promise<BucketItemStat>;
  removeObject(objectName: string, removeOpts?: RemoveOptions): Promise<void>;
  removeObjects(
    objectsList: RemoveObjectsParam
  ): Promise<RemoveObjectsResponse[]>;
  removeIncompleteUpload(objectName: string): Promise<void>;
  putObjectRetention(
    objectName: string,
    retentionOpts: Retention
  ): Promise<void>;
  getObjectRetention(
    objectName: string,
    getOpts?: GetObjectRetentionOpts
  ): Promise<ObjectRetentionInfo | null | undefined>;
  setObjectTagging(
    objectName: string,
    tags: Tags,
    putOpts: TaggingOpts
  ): Promise<void>;
  removeObjectTagging(
    objectName: string,
    removeOpts: TaggingOpts
  ): Promise<void>;
  getObjectTagging(objectName: string, getOpts: GetObjectOpts): Promise<Tag[]>;
  getObjectLegalHold(
    objectName: string,
    getOpts?: GetObjectLegalHoldOptions
  ): Promise<'ON' | 'OFF'>;
  setObjectLegalHold(
    objectName: string,
    setOpts: PutObjectLegalHoldOptions
  ): Promise<void>;
  selectObjectContent(
    objectName: string,
    selectOpts: SelectOptions
  ): Promise<SelectResults | undefined>;
  presignedUrl(
    method: string,
    objectName: string,
    expires?: number | PreSignRequestParams | undefined,
    reqParams?: PreSignRequestParams | Date,
    requestDate?: Date
  ): Promise<string>;
  presignedGetObject(
    objectName: string,
    expires?: number,
    respHeaders?: PreSignRequestParams | Date,
    requestDate?: Date
  ): Promise<string>;
  presignedPutObject(objectName: string, expires?: number): Promise<string>;
  // Bucket Policy & Notification operations
  getBucketNotification(callback: ResultCallback<NotificationConfig>): void;
  getBucketNotification(): Promise<NotificationConfig>;
  setBucketNotification(
    bucketNotificationConfig: NotificationConfig,
    callback: NoResultCallback
  ): void;
  setBucketNotification(
    bucketNotificationConfig: NotificationConfig
  ): Promise<void>;
  removeAllBucketNotification(callback: NoResultCallback): void;
  removeAllBucketNotification(): Promise<void>;
  listenBucketNotification(
    prefix: string,
    suffix: string,
    events: NotificationEvent[]
  ): NotificationPoller;
  getBucketPolicy(): Promise<string>;
  setBucketPolicy(policy: string): Promise<void>;
  listObjectsAsync(prefix?: string, recursive?: boolean): Promise<BucketItem[]>;
  listObjectsV2Async(
    prefix?: string,
    recursive?: boolean,
    startAfter?: string
  ): Promise<BucketItem[]>;
  putObjectAsync(
    objectName: string,
    stream: stream.Readable | Buffer | string,
    size?: number,
    metaData?: ItemBucketMetadata
  ): Promise<UploadedObjectInfo>;
  fPutObjectAsync(
    objectName: string,
    filePath: string,
    metaData?: ItemBucketMetadata
  ): Promise<UploadedObjectInfo>;
}

export const MinioClientProxy = new Proxy(ProxyClient, {
  construct(target, args: [MWMinioOptions]) {
    // 实例化原来的类
    // @ts-ignore
    const instance = new target(args[0]) as unknown as Client & {
      bucketName: string;
    };
    // 动态添加 bucketName 属性
    instance.bucketName = args[0].bucket; // 从构造参数中获取 bucketName
    // 通过返回一个新的 Proxy 拦截方法调用
    return createInstanceProxy(instance);
  },
});

export function createInstanceProxy(instance) {
  return new Proxy(instance, {
    get(target, propKey, receiver) {
      const originalMethod = Reflect.getPrototypeOf(target)[propKey];

      // 拦截 MinioClient 方法
      if (typeof propKey === 'string') {
        // 判断方法属于忽略传入bucketName的方法
        if (proxyBucketNameMethods.includes(propKey)) {
          // 特殊处理，第一个参数为method
          if ('presignedUrl' === propKey) {
            return function (...methodArgs) {
              const [method, ...resetArgs] = methodArgs;
              return originalMethod.call(
                target,
                method,
                instance.bucketName,
                ...resetArgs
              );
            };
          }
          return function (...methodArgs) {
            return originalMethod.call(
              target,
              instance.bucketName,
              ...methodArgs
            );
          };
        }
      }

      // 对于其他方法，返回原来的方法
      return Reflect.get(target, propKey, receiver);
    },
  });
}
