import {
  Config,
  Init,
  Inject,
  Logger,
  MidwayCommonError,
  Provide,
  Scope,
  ScopeEnum,
  ServiceFactory,
  delegateTargetPrototypeMethod,
  ILogger,
} from '@midwayjs/core';
import * as assert from 'assert';
import type {
  MinioServiceFactoryReturnType,
  MWMinioOptions,
} from './interface';
import { Client } from 'minio';

import type { ResultCallback } from 'minio/dist/main/internal/type';
import type {
  NotificationConfig,
  NotificationEvent,
  NotificationPoller,
} from 'minio/dist/main/notification';
import type {
  BucketStream,
  IncompleteUploadedBucketItem,
  BucketItem,
} from 'minio/dist/main/internal/type';
import type { NoResultCallback } from 'minio/dist/main/internal/client';
import type {
  BucketItemStat,
  BucketVersioningConfiguration,
  EncryptionConfig,
  GetObjectLegalHoldOptions,
  GetObjectOpts,
  GetObjectRetentionOpts,
  ItemBucketMetadata,
  LifecycleConfig,
  LifeCycleConfigParam,
  ObjectLockInfo,
  ObjectMetaData,
  ObjectRetentionInfo,
  PreSignRequestParams,
  PutObjectLegalHoldOptions,
  RemoveObjectsParam,
  RemoveObjectsResponse,
  ReplicationConfig,
  ReplicationConfigOpts,
  Retention,
  SelectOptions,
  StatObjectOpts,
  Tag,
  TaggingOpts,
  Tags,
  UploadedObjectInfo,
} from 'minio/dist/main/internal/type';
import { MinioClientProxy } from './proxy';
import * as stream from 'node:stream';
import { RemoveOptions, LEGAL_HOLD_STATUS, SelectResults } from 'minio';
function checkBucketConfig(config) {
  assert(
    config.endPoint,
    "[midway:minio] Must set `endPoint` in minio's config"
  );
  assert(
    config.accessKey && config.secretKey,
    "[midway:minio] Must set `accessKey` and `secretKey` in minio's config"
  );
}

@Provide()
@Scope(ScopeEnum.Singleton)
export class MinioServiceFactory<
  T extends MinioServiceFactoryReturnType = MinioServiceFactoryReturnType
> extends ServiceFactory<T> {
  @Config('minio')
  minioConfig: MWMinioOptions;

  @Logger('coreLogger')
  logger: ILogger;

  @Init()
  async init() {
    await this.initClients(this.minioConfig);
  }

  // @ts-ignore
  async createClient(config: MWMinioOptions): Promise<T> {
    this.logger.info(
      '[midway:minio] connecting bucket：%s with accessKey: %s',
      config.bucket,
      config.accessKey
    );
    checkBucketConfig(config);

    return new MinioClientProxy(config) as T;
  }

  getName(): string {
    return 'minio';
  }
}

@Provide()
@Scope(ScopeEnum.Singleton)
// @ts-ignore
export class MinioService implements Client {
  @Inject()
  private serviceFactory: MinioServiceFactory;

  private instance: MinioServiceFactoryReturnType;

  public bucketName: string;

  @Init()
  async init() {
    this.instance = this.serviceFactory.get(
      this.serviceFactory.getDefaultClientName?.() || 'default'
    );
    this.bucketName = this.instance.bucketName;
    if (!this.instance) {
      throw new MidwayCommonError('minio default instance not found.');
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
// @ts-ignore
export interface MinioService extends Client {
  // empty
  bucket: string;

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
  ): Promise<UploadedObjectInfo>;
  fPutObject(
    objectName: string,
    filePath: string,
    metaData: ObjectMetaData
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
  ): Promise<LEGAL_HOLD_STATUS>;
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
}
delegateTargetPrototypeMethod(MinioService, [Client]);
