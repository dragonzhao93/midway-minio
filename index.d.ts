import { MWMinioOptions } from './dist';

export * from './dist/index';

declare module '@midwayjs/core/dist/interface' {
  interface MidwayConfig {
    minio?: ServiceFactoryConfigOption<MWMinioOptions>;
  }
}
