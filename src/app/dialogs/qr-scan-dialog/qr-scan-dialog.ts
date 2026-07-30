import { AfterViewInit, Component, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import {
  NgxScannerQrcodeComponent,
  ScannerQRCodeConfig,
  ScannerQRCodeDevice,
  ScannerQRCodeResult,
} from 'ngx-scanner-qrcode';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-qr-scan-dialog',
  imports: [NgxScannerQrcodeComponent, CommonModule],
  templateUrl: './qr-scan-dialog.html',
  styleUrl: './qr-scan-dialog.scss',
})
export class QrScanDialog implements AfterViewInit, OnDestroy {
  public dialogRef = inject(MatDialogRef<QrScanDialog>);

  @ViewChild('scanner', { static: true })
  scanner!: NgxScannerQrcodeComponent;

  scannerEnabled = signal(true);
  result = signal('');
  error = signal('');
  devices = signal<ScannerQRCodeDevice[]>([]);

  readonly cameraConfig: ScannerQRCodeConfig = {
    constraints: {
      audio: false,
      video: {
        facingMode: { ideal: 'environment' },
      },
    },
  };

  private readonly subscriptions = new Subscription();

  ngAfterViewInit(): void {
    this.subscriptions.add(
      this.scanner
      .start((devices: ScannerQRCodeDevice[]) => {
        this.devices.set(devices);
        const backCamera =
          devices.find((device) => /back|rear|environment/i.test(device.label)) ?? devices[0];

        if (backCamera) {
          this.scanner.playDevice(backCamera.deviceId).subscribe({
            error: (err) => this.handleScannerError(err),
          });
        }
      })
      .subscribe({
        error: (err) => this.handleScannerError(err),
      }),
    );

    this.subscriptions.add(
      this.scanner.data.subscribe((results: ScannerQRCodeResult[]) => {
        if (!this.scannerEnabled() || !results.length) return;

        this.onScanSuccess(results[0].value);
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.scanner?.isStart) {
      this.scanner.stop();
    }
  }

  private handleScannerError(error: unknown): void {
    console.error('Scanner error:', error);
    this.error.set(error instanceof Error ? error.message : String(error));
  }

  onScanSuccess(data: string): void {
    if (!this.scannerEnabled()) return;

    this.scannerEnabled.set(false);
    this.scanner.stop();

    const dataCleaned = data.replace(/\s/g, '');

    if (dataCleaned.length === 16) {
      this.dialogRef.close(dataCleaned);
      return;
    }

    this.result.set(data);
  }

  close(): void {
    if (this.scanner.isStart) {
      this.scanner.stop();
    }
    this.dialogRef.close();
  }
}
