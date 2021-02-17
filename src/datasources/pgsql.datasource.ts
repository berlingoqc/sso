import {
  inject,
  lifeCycleObserver,
  LifeCycleObserver,
  ValueOrPromise,
} from '@loopback/core';
import { juggler } from '@loopback/repository';

@lifeCycleObserver('datasource')
export class PgsqlDataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'pgsql';

  constructor(
    @inject('datasources.config.pgsql', { optional: true })
    dsConfig: object,
  ) {
    console.log('connection ', dsConfig);
    super(dsConfig);
  }

  /**
   * Start the datasource when application is started
   */
  start(): ValueOrPromise<void> {
    // Add your logic here to be invoked when the application is started
  }

  /**
   * Disconnect the datasource when application is stopped. This allows the
   * application to be shut down gracefully.
   */
  stop(): ValueOrPromise<void> {
    return super.disconnect();
  }
}
