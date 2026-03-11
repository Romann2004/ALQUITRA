import { TestBed } from '@angular/core/testing';

import { TrajeService } from './traje.service';

describe('TrajeService', () => {
  let service: TrajeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrajeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
