import { TestBed, inject } from '@angular/core/testing';

import { BusyIndicatorService } from './busy-indicator.service';

describe('BusyIndicatorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BusyIndicatorService]
    });
  });

  it('should be created', inject([BusyIndicatorService], (service: BusyIndicatorService) => {
    expect(service).toBeTruthy();
  }));
});
