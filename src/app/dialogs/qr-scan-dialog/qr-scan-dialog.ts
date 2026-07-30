import { Component, ViewChild, inject, signal, AfterViewInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { NgxScannerQrcodeComponent, ScannerQRCodeResult } from 'ngx-scanner-qrcode';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

interface CameraDevice {
  label: string;
  deviceId: string;
  kind: string;
  groupId: string;
}

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

  devices = signal<CameraDevice[]>([]);
  selectedDeviceId = signal('');
  scannerEnabled = signal(true);
  result = signal('');
  isLoading = signal(false);

  private started = false;
  private dataSub?: Subscription;

  ngAfterViewInit() {
    this.scanner.start().subscribe({
      next: () => {
        console.log('scanner started');
        this.started = true;
      },
      error: (err) => console.error('scanner start error', err),
    });

    this.scanner.devices.subscribe((deviceList: any[]) => {
      const mapped = deviceList.map((d: any) => ({
        label: d.label,
        deviceId: d.deviceId,
        kind: d.kind,
        groupId: d.groupId,
      }));

      this.devices.set(mapped);
      console.log('devices:', mapped);

      const backCamera = this.findBackCamera(mapped);
      if (backCamera) {
        console.log('default back camera:', backCamera);
        this.selectedDeviceId.set(backCamera.deviceId);

        queueMicrotask(() => {
          this.playDevice(backCamera.deviceId);
        });
      }
    });

    this.dataSub = this.scanner.data.subscribe((results: ScannerQRCodeResult[]) => {
      if (!this.scannerEnabled() || !results.length) return;
      this.onScanSuccess(results[0].value);
    });
  }

  private findBackCamera(devices: CameraDevice[]): CameraDevice | null {
    if (!devices.length) return null;

    const normalized = (s: string) => (s || '').toLowerCase();

    const backKeywords = [
      'กล้องด้านหลัง',
      'กล้องหลัง',
      'กล้องคู่ด้านหลัง',
      'กล้องด้านหลังมุมกว้าง',
      'กล้องด้านหลังอัลตร้าไวด์',
      'back',
      'rear',
      'environment',
    ];

    const backDevices = devices.filter((d) => {
      const label = normalized(d.label);
      return backKeywords.some((k) => label.includes(k.toLowerCase()));
    });

    if (!backDevices.length) return devices.at(-1) ?? null;

    const priority = [
      /ultra.*wide|ultrawide|อัลตร้าไวด์/,
      /wide|มุมกว้าง/,
      /rear|back|environment/,
    ];

    for (const rule of priority) {
      const found = backDevices.find((d) => rule.test(normalized(d.label)));
      if (found) return found;
    }

    return backDevices[0];
  }

  playDevice(deviceId: string) {
    // this.isLoading(true);
    this.scanner.stop();

    setTimeout(() => {
      this.scanner.playDevice(deviceId).subscribe({
        next: () => {
          console.log('playDevice success:', deviceId);
          // this.isLoading(false);
        },
        error: (err) => {
          console.error('playDevice error:', err);
          // this.isLoading(false);
        },
      });
    }, 150);
  }

  onCameraChange(event: Event) {
    const deviceId = (event.target as HTMLSelectElement).value;
    this.selectedDeviceId.set(deviceId);
    this.playDevice(deviceId);
  }

  async onScanSuccess(data: string) {
    if (!this.scannerEnabled()) return;
    this.result.set(data);
    this.dialogRef.close(data);
  }

  onScannerError(error: any) {
    
  }

  close() {
    this.dataSub?.unsubscribe();
    this.scanner.stop();
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.close();
  }
}
