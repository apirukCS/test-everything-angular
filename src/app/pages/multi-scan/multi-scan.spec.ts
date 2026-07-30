import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MultiScan } from './multi-scan';

describe('MultiScan', () => {
  let component: MultiScan;
  let fixture: ComponentFixture<MultiScan>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiScan],
    }).compileComponents();

    fixture = TestBed.createComponent(MultiScan);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
