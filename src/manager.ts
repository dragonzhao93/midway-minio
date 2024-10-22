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
import { Client } from 'minio';
import * as assert from 'assert';
import type {
  MinioServiceFactoryReturnType,
  MWMinioOptions,
} from './interface';

function checkBucketConfig(config) {
  assert(
    config.endpoint,
    "[midway:minio] Must set `endpoint` in minio's config"
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

  bucket: string;

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
    this.bucket = config.bucket;
    // @ts-expect-error because this code can return the correct type, but TS still reports an error
    return new Client(config);
  }

  getName(): string {
    return 'minio';
  }
}

@Provide()
@Scope(ScopeEnum.Singleton)
export class MinioService implements Client {
  @Inject()
  private serviceFactory: MinioServiceFactory;

  private instance: Client;

  @Init()
  async init() {
    this.instance = this.serviceFactory.get(
      this.serviceFactory.getDefaultClientName?.() || 'default'
    );
    if (!this.instance) {
      throw new MidwayCommonError('minio default instance not found.');
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MinioService extends Client {
  // empty
  bucket: string;
}

delegateTargetPrototypeMethod(MinioService, [Client]);
