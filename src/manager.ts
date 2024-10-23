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

import { MinioClientProxy, ProxyClient } from './proxy';
import { Client } from 'minio';
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
export class MinioService implements ProxyClient {
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
export interface MinioService extends ProxyClient {
  // empty
  bucket: string;
}

delegateTargetPrototypeMethod(MinioService, [Client, ProxyClient]);
