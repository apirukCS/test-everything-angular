import { Component, inject, ViewChild, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import {
  NgxScannerQrcodeComponent,
  LOAD_WASM,
  ScannerQRCodeConfig,
  ScannerQRCodeResult,
} from 'ngx-scanner-qrcode';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

interface LogEntry {
  time: string;
  message: string;
  type: 'info' | 'error' | 'success' | 'warning';
}

@Component({
  selector: 'app-qr-scan-dialog',
  imports: [NgxScannerQrcodeComponent, CommonModule],
  templateUrl: './qr-scan-dialog.html',
  styleUrl: './qr-scan-dialog.scss',
})
export class QrScanDialog {
  public dialogRef = inject(MatDialogRef<QrScanDialog>);

  @ViewChild('scanner', { static: true })
  scanner!: NgxScannerQrcodeComponent;

  scannerEnabled = signal(true);
  result = signal('');
  error = signal('');
  devices = signal<any[]>([]);

  ngAfterViewInit() {
    this.scanner
      .start((devices: any[]) => {
        this.devices.set(devices);
        const backCamera =
          devices.find((d) => /back|rear|environment/i.test(d.label)) ?? devices.at(-1);

        if (backCamera) {
          this.scanner.playDevice(backCamera.deviceId).subscribe({
            next: () => alert('playDevice success'),
            error: (err) => alert('playDevice error'),
          });
        }
      })
      .subscribe({
        next: (res) => alert(`scanner start', ${res}`),
        error: (err) => alert(`scanner error', ${err}`),
        complete: () => alert('scanner start complete'),
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

    this.error.set(error);
  }

  async onScanSuccess(data: string) {
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

  close() {
    this.scanner.stop();
    this.dialogRef.close();
  }
}
