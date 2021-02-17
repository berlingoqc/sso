import {Entity, model, property} from '@loopback/repository';

export class Map {
  [id: string]: unknown;
}
@model()
export class ExtraField extends Entity {
  @property({id: true, generated: true})
  id: number;

  @property()
  type: string;

  @property()
  name: string;

  @property()
  defaultValue?: unknown;

  @property({
    type: 'boolean',
  })
  editable = true;

  @property({
    type: 'boolean',
  })
  required = false;

  @property()
  validators: any;

  constructor(data?: Partial<ExtraField>) {
    super(data);
  }
}

export interface ExtraFieldRelations {
  // describe navigational properties here
}

export type ExtraFieldWithRelations = ExtraField & ExtraFieldRelations;
