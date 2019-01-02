import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SteemConnect2Component } from './steem-connect2.component';

describe('SteemConnect2Component', () => {
  let component: SteemConnect2Component;
  let fixture: ComponentFixture<SteemConnect2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SteemConnect2Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SteemConnect2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
