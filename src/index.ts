import { StarterApplication } from './application';
import { AlbAuthConfig } from '@berlingoqc/lb-extensions';

export * from './models';
export * from './utils';
export * from './repositories';
export * from './component';

export { StarterApplication };

export async function main(options: AlbAuthConfig = {}) {
  options.strategy = 'local';
  options.pkg = require('../package.json');
  options.dirname = __dirname;
  const app = new StarterApplication(options);
  app.basePath('/api');
  await app.boot();
  await app.migrateSchema();
  await app.start();

  const url = app.restServer.url;
  console.log(`Server is running at ${url}`);
  console.log(`Try ${url}/ping`);

  return app;
}
