import {model, property, Entity} from '@loopback/repository';

@model()
export class StaticRessource extends Entity {
  @property({
    type: 'string',
  })
  name: string;

  @property({
    type: 'string',
  })
  thumbnailURL: string;

  @property({
    type: 'string',
  })
  bannerURL: string;
}
