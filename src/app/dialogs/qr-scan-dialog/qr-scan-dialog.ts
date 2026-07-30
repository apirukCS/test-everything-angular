import { AfterViewInit, Component, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import {
  NgxScannerQrcodeComponent,
  ScannerQRCodeConfig,
  ScannerQRCodeDevice,
  ScannerQRCodeResult,
} from 'ngx-scanner-qrcode';
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

  readonly cameraConfig: ScannerQRCodeConfig = {
    constraints: {
      audio: false,
      video: { facingMode: { ideal: 'environment' } },
    },
  };

  devices = signal<ScannerQRCodeDevice[]>([]);
  selectedDeviceId = signal('');
  scannerEnabled = signal(true);
  result = signal('');
  isLoading = signal(false);

  private dataSub?: Subscription;

  ngAfterViewInit(): void {
    this.isLoading.set(true);
    this.scanner.start((initialDevices: ScannerQRCodeDevice[]) => {
      // Labels are often blank before permission. Refresh the list afterwards,
      // then choose the rear camera before the library starts a video stream.
      void this.selectInitialCamera(initialDevices);
    }).subscribe({
      error: (err) => this.onScannerError(err),
    });

    this.dataSub = this.scanner.data.subscribe((results: ScannerQRCodeResult[]) => {
      if (!this.scannerEnabled() || !results.length) return;
      this.onScanSuccess(results[0].value);
    });
  }

  private async selectInitialCamera(initialDevices: ScannerQRCodeDevice[]): Promise<void> {
    try {
      const devices: ScannerQRCodeDevice[] = (await navigator.mediaDevices.enumerateDevices())
        .filter((device) => device.kind === 'videoinput')
        .map(({ deviceId, groupId, kind, label }) => ({ deviceId, groupId, kind, label }));

      // ngx-scanner-qrcode uses this list inside playDevice(), so keep both lists
      // in sync with the post-permission values.
      this.scanner.devices.next(devices);
      this.devices.set(devices);

      const selected = this.findBackCamera(devices) ?? initialDevices[0];
      if (!selected) throw new Error('No camera detected.');

      this.selectedDeviceId.set(selected.deviceId);
      this.playDevice(selected.deviceId);
    } catch (err) {
      this.onScannerError(err);
    }
  }

  private findBackCamera(devices: ScannerQRCodeDevice[]): ScannerQRCodeDevice | null {
    if (!devices.length) return null;

    const normalized = (value: string) => value.toLowerCase();
    const isRearCamera = (device: ScannerQRCodeDevice) =>
      /กล้องด้านหลัง|กล้องหลัง|back|rear|environment/.test(normalized(device.label));
    const rearDevices = devices.filter(isRearCamera);

    if (!rearDevices.length) return devices.at(-1) ?? null;

    return (
      rearDevices.find((device) => /ultra.*wide|ultrawide|อัลตร้าไวด์/.test(normalized(device.label))) ??
      rearDevices.find((device) => /wide|มุมกว้าง/.test(normalized(device.label))) ??
      rearDevices[0]
    );
  }

  private playDevice(deviceId: string): void {
    this.isLoading.set(true);
    // playDevice() stops the current stream itself. Calling stop() followed by a
    // timeout races the library and can make a reopened dialog select the front camera.
    this.scanner.playDevice(deviceId).subscribe({
      next: () => this.isLoading.set(false),
      error: (err) => this.onScannerError(err),
    });
  }

  onCameraChange(event: Event): void {
    const deviceId = (event.target as HTMLSelectElement).value;
    this.selectedDeviceId.set(deviceId);
    this.playDevice(deviceId);
  }

  onScanSuccess(data: string): void {
    if (!this.scannerEnabled()) return;

    this.scannerEnabled.set(false);
    this.result.set(data);
    this.stopScanner();
    this.dialogRef.close(data);
  }

  onScannerError(error: unknown): void {
    this.isLoading.set(false);
    console.error('QR scanner error:', error);
  }

  close(): void {
    this.stopScanner();
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.dataSub?.unsubscribe();
    this.stopScanner();
  }

  private stopScanner(): void {
    if (this.scanner?.isStart) {
      this.scanner.stop().subscribe({ error: (err) => this.onScannerError(err) });
    }
  }
}
