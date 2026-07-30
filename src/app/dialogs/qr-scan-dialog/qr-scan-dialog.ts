import { Component, ViewChild, inject, signal, AfterViewInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { NgxScannerQrcodeComponent, ScannerQRCodeResult } from 'ngx-scanner-qrcode';
import { CommonModule } from '@angular/common';

interface ScannerDeviceInfo {
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
export class QrScanDialog implements AfterViewInit {
  public dialogRef = inject(MatDialogRef<QrScanDialog>);

  @ViewChild('scanner', { static: true })
  scanner!: NgxScannerQrcodeComponent;

  scannerEnabled = signal(true);
  isLoading = signal(false);
  result = signal('');

  // เก็บ devices สำหรับ dropdown
  devices = signal<ScannerDeviceInfo[]>([]);
  selectedDeviceId = signal<string>('');

  ngAfterViewInit() {
    // เริ่ม scanner
    this.scanner.start().subscribe({
      next: () => console.log('scanner start'),
      error: (err) => console.error('scanner start error', err),
    });

    // subscribe รายการ devices
    this.scanner.devices.subscribe((deviceList: any[]) => {
      const mapped = deviceList.map((d: any, i: number) => {
        const info: ScannerDeviceInfo = {
          label: d.label,
          deviceId: d.deviceId,
          kind: d.kind,
          groupId: d.groupId,
        };
        console.log(i, info);
        return info;
      });

      this.devices.set(mapped);

      // auto เลือกกล้องหลังครั้งแรก
      const backCamera = this.findBackCamera(mapped);
      if (backCamera) {
        this.selectedDeviceId.set(backCamera.deviceId);
        this.playDevice(backCamera.deviceId);
      }
    });

    // ผลการ scan
    this.scanner.data.subscribe((results: ScannerQRCodeResult[]) => {
      if (!this.scannerEnabled() || !results.length) return;
      this.onScanSuccess(results[0].value);
    });
  }

  private findBackCamera(devices: ScannerDeviceInfo[]): ScannerDeviceInfo | null {
    if (!devices.length) return null;
    const norm = (s: string) => (s || '').toLowerCase();

    const backKeywords = ['กล้องด้านหลัง', 'กล้องหลัง', 'back', 'rear', 'environment'];

    const backDevices = devices.filter((d) => {
      const label = norm(d.label);
      return backKeywords.some((k) => label.includes(k.toLowerCase()));
    });

    if (!backDevices.length) {
      return devices.at(-1) ?? null;
    }

    const wide = backDevices.find((d) => {
      const label = norm(d.label);
      return !/tele|zoom|2x|3x|aux|macro|ระยะไกล|depth/.test(label);
    });

    return wide ?? backDevices[0];
  }

  private playDevice(deviceId: string) {
    this.isLoading.set(true);
    this.scanner.playDevice(deviceId).subscribe({
      next: () => {
        console.log('playDevice success', deviceId);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('playDevice error', err);
        this.isLoading.set(false);
      },
    });
  }

  onCameraSelectChange(event: Event) {
    const deviceId = (event.target as HTMLSelectElement).value;
    this.selectedDeviceId.set(deviceId);
    this.playDevice(deviceId);
  }

  async onScanSuccess(data: string) {
    if (!this.scannerEnabled()) return;
    this.result.set(data);
    this.dialogRef.close(data);
  }

  close() {
    this.scanner.stop();
    this.dialogRef.close();
  }
}
