### MidwayJS-MinIO

用于在MidwayJS项目中快捷访问Minio，支持多客户端连接。

#### 安装使用

```bash
$ npm install midway-minio
```

在configuration中引入minio

```ts
import * as minio from 'midway-minio';
// ......

@Configuration({
  imports: [
    // ......
    minio, // 引入minio
  ],
  importConfigs: [
    join(__dirname, 'config')
  ]
})
export class MainConfiguration {
}
```

在配置文件中添加minio相关的配置

```ts
export default {
  // ......
  minio: {
    // 单个客户端配置
    client: {
      endPoint: 'play.min.io',
      port: 9000,
      useSSL: true,
      accessKey: 'Q3AM3UQ867SPQQA43P2F',
      secretKey: 'zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG',
      bucket: 'test',
    },
    // 多个客户端配置
    clients: {
      bucket1: {
        endPoint: 'play.min.io',
        port: 9000,
        useSSL: true,
        accessKey: 'Q3AM3UQ867SPQQA43P2F',
        secretKey: 'zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG',
        bucket: 'test',
      }
    },
  },
} as MidwayConfig;
```

使用组件

```ts
import { Inject, Provide, InjectClient } from '@midwayjs/core';
import { MinioService } from 'midway-minio';
import { createReadStream } from 'fs';
import { join } from 'path';

@Provide()
export class UserService {

  // 注入默认客户端
  @Inject()
  minioService: MinioService;

  // 使用工厂方法注入指定客户端
  @InjectClient(MinioServiceFactory, 'bucket1')
  bucket1MinioService: MinioService;

  async saveFile() {
    const localFile = join(__dirname, 'test.log');
    const fileStream = createReadStream(localFile);
    const result = await this.minioService.fputObjectAsync('/path/to/file', fileStream);
    const result1 = await this.bucket1MinioService.fputObjectAsync('/path/to/file', fileStream);

    // => result.url
  }
}
```
##### 方法调用
- 新增方法，以下为新增方法，使用配置中的bucket，其余属性与Minio SDK一致
  ```typescript
  // listObjects异步方法
  listObjectsAsync(prefix?: string, recursive?: boolean): Promise<BucketItem[]>;
  // listObjectsV2异步方法
  listObjectsV2Async(prefix?: string,recursive?: boolean,startAfter?: string): Promise<BucketItem[]>;
  // putObject异步方法
  putObjectAsync(objectName: string,stream: stream.Readable | Buffer | string,size?: number,metaData?: ItemBucketMetadata): Promise<UploadedObjectInfo>;
  // fPutObject异步方法
  fPutObjectAsync(objectName: string,filePath: string,metaData?: ItemBucketMetadata): Promise<UploadedObjectInfo>;
  ```
- 方法代理，以下为代理修改过的方法，移除了bucketName参数使用配置中的bucket，其余属性与Minio SDK一致
```
listObjects
listObjectsV2
listIncompleteUploads
setBucketVersioning
getBucketVersioning
setBucketReplication
getBucketReplication
removeBucketReplication
setBucketTagging
removeBucketTagging
getBucketTagging
setBucketLifecycle
getBucketLifecycle
removeBucketLifecycle
setObjectLockConfig
getObjectLockConfig
setBucketEncryption
getBucketEncryption
removeBucketEncryption
getObject
getPartialObject
fGetObject
putObject
fPutObject
statObject
removeObject
removeObjects
removeIncompleteUpload
putObjectRetention
getObjectRetention
setObjectTagging
removeObjectTagging
getObjectTagging
getObjectLegalHold
setObjectLegalHold
selectObjectContent
presignedUrl
presignedGetObject
presignedPutObject
getBucketNotification
setBucketNotification
removeAllBucketNotification
listenBucketNotification
getBucketPolicy
setBucketPolicy
```
Minio更多方法可以见[MinIO SDK文档](https://minio.org.cn/docs/minio/linux/developers/javascript/API.html)


