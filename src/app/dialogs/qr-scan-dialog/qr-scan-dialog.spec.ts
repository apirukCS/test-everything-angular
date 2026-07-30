import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrScanDialog } from './qr-scan-dialog';

describe('QrScanDialog', () => {
  let component: QrScanDialog;
  let fixture: ComponentFixture<QrScanDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrScanDialog],
    }).compileComponents();

    fixture = TestBed.createComponent(QrScanDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
