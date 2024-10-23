import { createLightApp } from '@midwayjs/mock';
import * as custom from '../src';

describe('/test/index.test.ts', () => {
  it('test component', async () => {
    const app = await createLightApp('', {
      imports: [custom],
    });
    const minioService = await app
      .getApplicationContext()
      .getAsync(custom.MinioService);
    const minioFactory = await app
      .getApplicationContext()
      .getAsync(custom.MinioServiceFactory);
    const serviceFactory = minioFactory.get('bucket1');
    const res1 = await minioService?.listObjectsAsync('', true);
    const res2 = await serviceFactory.listObjectsAsync('', true);
    const res3 = await new Promise<any[]>(resolve => {
      const stream = minioService?.listObjects('', true);
      const data = [];
      stream.on('data', obj => data.push(obj));
      stream.on('end', () => resolve(data));
    });
    const res4 = await new Promise<any[]>(resolve => {
      const stream = serviceFactory?.listObjects('', true);
      const data = [];
      stream.on('data', obj => data.push(obj));
      stream.on('end', () => resolve(data));
    });
    expect(res1.length === res2.length && res3.length === res4.length).toEqual(
      true
    );
  });
});
