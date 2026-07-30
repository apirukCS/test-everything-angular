import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpendingDetail } from './spending-detail';

describe('SpendingDetail', () => {
  let component: SpendingDetail;
  let fixture: ComponentFixture<SpendingDetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpendingDetail]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SpendingDetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
