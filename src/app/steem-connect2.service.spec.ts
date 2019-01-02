import { TestBed, inject } from '@angular/core/testing';

import { SteemConnect2Service } from './steem-connect2.service';

describe('SteemConnect2Service', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SteemConnect2Service]
    });
  });

  it('should be created', inject([SteemConnect2Service], (service: SteemConnect2Service) => {
    expect(service).toBeTruthy();
  }));
});
