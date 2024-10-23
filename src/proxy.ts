import { Client } from 'minio';
import type { MWMinioOptions } from './interface';
import type { BucketItem } from 'minio/dist/main/internal/type';
import { ProxyClientFunc } from './type';

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

// @ts-ignore
export class ProxyClient extends Client implements ProxyClientFunc {
  async listObjectsAsync(...methodArgs) {
    return new Promise<BucketItem[]>((resolve, reject) => {
      // @ts-ignore
      const stream = this.listObjects(...methodArgs);
      const data = [];
      stream.on('data', function (obj) {
        data.push(obj);
      });
      stream.on('end', function () {
        resolve(data);
      });
      stream.on('error', function (err) {
        reject(err);
      });
    });
  }

  async listObjectsV2Async(...methodArgs) {
    return new Promise<BucketItem[]>((resolve, reject) => {
      // @ts-ignore
      const stream = this.listObjectsV2(...methodArgs);
      const data = [];
      stream.on('data', function (obj) {
        data.push(obj);
      });
      stream.on('end', function () {
        resolve(data);
      });
      stream.on('error', function (err) {
        reject(err);
      });
    });
  }
}

// @ts-ignore
export interface ProxyClient extends ProxyClientFunc {}

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
      const result = Reflect.get(target, propKey, receiver);
      return result;
    },
  });
}
