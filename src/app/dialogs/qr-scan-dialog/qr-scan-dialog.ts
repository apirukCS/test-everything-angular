import { Component, ViewChild, inject, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { NgxScannerQrcodeComponent, ScannerQRCodeResult } from 'ngx-scanner-qrcode';

// import { UtilsService } from '@services/utils/utils';
// import { CardService } from '@services/card/card.service';
// import { ScanCardPayload } from '@services/card/card-payload.model';
// import { DialogService } from '@services/dialog/dialog.service';
// import { ErrorMassageService } from '@services/error-message/error-massage.service';

@Component({
  selector: 'app-qr-scan-dialog',
  imports: [NgxScannerQrcodeComponent],
  templateUrl: './qr-scan-dialog.html',
  styleUrl: './qr-scan-dialog.scss',
})
export class QrScanDialog {
  // private cardService = inject(CardService);
  // private utilService = inject(UtilsService);
  // private dialog = inject(DialogService);
  // private errorMassageService = inject(ErrorMassageService);

  public dialogRef = inject(MatDialogRef<QrScanDialog>);

  @ViewChild('scanner', { static: true })
  scanner!: NgxScannerQrcodeComponent;

  scannerEnabled = signal(true);
  isLoading = signal(false);
  result = signal('');

  ngAfterViewInit() {
    this.scanner
      .start((devices: any[]) => {
        const backCamera =
          devices.find((d) => /back|rear|environment/i.test(d.label)) ?? devices.at(-1);

        if (backCamera) {
          this.scanner.playDevice(backCamera.deviceId).subscribe({
            next: () => console.log('playDevice success'),
            error: (err) => console.error('playDevice error', err),
          });
        }
      })
      .subscribe({
        next: (res) => console.log('scanner start', res),
        error: (err) => console.error('scanner start error', err),
        complete: () => console.log('scanner start complete'),
      });
    this.scanner.data.subscribe((results: ScannerQRCodeResult[]) => {
      if (!this.scannerEnabled()) return;
      if (!results.length) return;

      const data = results[0].value;

      this.onScanSuccess(data);
    });
  }

  cameraConstraints: MediaStreamConstraints = {
    audio: false,
    video: {
      facingMode: {
        ideal: 'environment',
      },
    },
  };

  onScannerError(error: any) {
    console.error('Scanner component error:', error);
    this.handleScannerError(error);
  }

  private handleScannerError(error: any) {
    console.error('Scanner error:', error);

    if (error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError') {
      alert('ไม่ได้รับอนุญาตใช้งานกล้อง');
    } else if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
      alert('ไม่พบกล้อง');
    } else {
      alert('เกิดข้อผิดพลาด');
    }
  }

  async onScanSuccess(data: string) {
    if (!this.scannerEnabled()) return;

    this.result.set(data);
  }

  close() {
    this.scanner.stop();
    this.dialogRef.close();
  }
}
