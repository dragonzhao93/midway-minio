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
    client: {
      endPoint: 'play.min.io',
      port: 9000,
      useSSL: true,
      accessKey: 'Q3AM3UQ867SPQQA43P2F',
      secretKey: 'zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG',
      bucket: 'test',
    },
  },
} as MidwayConfig;
```

使用组件

```ts
import { Inject, Provide } from '@midwayjs/core';
import { MinioService } from 'midway-minio';
import { createReadStream } from 'fs';
import { join } from 'path';

@Provide()
export class UserService {

  @Inject()
  minioService: MinioService;

  async saveFile() {

    const localFile = join(__dirname, 'test.log');
    const fileStream = fs.createReadStream(localFile);
    const result = await this.ossService.putObject('bucketName','/path/to/file', fileStream, function (err, objInfo) {
      if (err) {
        return console.log(err) // err should be null
      }
      console.log('Success', objInfo)
    });

    // => result.url
  }
}
```
更多方法可以见[MinIO SDK文档](https://minio.org.cn/docs/minio/linux/developers/javascript/API.html)


