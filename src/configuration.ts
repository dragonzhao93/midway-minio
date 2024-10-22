import { Configuration } from '@midwayjs/core';
import { MinioServiceFactory } from './manager';

@Configuration({
  namespace: 'minio',
  importConfigs: [
    {
      default: {
        minio: {},
      },
    },
  ],
})
export class MinioConfiguration {
  async onReady(container) {
    await container.getAsync(MinioServiceFactory);
  }
}
