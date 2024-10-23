import { Client } from 'minio';
import type {
  MinioServiceFactoryReturnType,
  MWMinioOptions,
} from './interface';
import type { BucketItem } from 'minio/dist/main/internal/type';

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

const hooksFunc = {
  async listObjectsAsync() {
    return new Promise<BucketItem[]>((resolve, reject) => {
      const self = this as unknown as MinioServiceFactoryReturnType;
      const stream = self.listObjects(self.bucketName, '', true);
      const data = [];
      stream.on('data', function (obj) {
        data.push(obj);
      });
      stream.on('end', function (obj) {
        resolve(data);
      });
      stream.on('error', function (err) {
        reject(err);
      });
    });
  },
};

export const MinioClientProxy = new Proxy(Client, {
  construct(target, args: [MWMinioOptions]) {
    // 实例化原来的类
    const instance = new target(args[0]) as unknown as Client & {
      bucketName: string;
    };
    // 动态添加 bucketName 属性
    instance.bucketName = args[0].bucket; // 从构造参数中获取 bucketName
    const hooksList = Object.keys(hooksFunc);
    // 通过返回一个新的 Proxy 拦截方法调用
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
          // 判断属于新增的hook方法
          if (hooksList.includes(propKey)) {
            return hooksFunc[propKey].bind(target);
          }
        }

        // 对于其他方法，返回原来的方法
        return Reflect.get(target, propKey, receiver);
      },
    });
  },
});
