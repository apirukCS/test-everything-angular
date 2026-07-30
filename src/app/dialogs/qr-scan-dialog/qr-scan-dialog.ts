import { Component, ViewChild, inject, signal } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { NgxScannerQrcodeComponent, ScannerQRCodeResult } from 'ngx-scanner-qrcode';

@Component({
  selector: 'app-qr-scan-dialog',
  imports: [NgxScannerQrcodeComponent],
  templateUrl: './qr-scan-dialog.html',
  styleUrl: './qr-scan-dialog.scss',
})
export class QrScanDialog {
  public dialogRef = inject(MatDialogRef<QrScanDialog>);

  @ViewChild('scanner', { static: true })
  scanner!: NgxScannerQrcodeComponent;

  scannerEnabled = signal(true);
  isLoading = signal(false);
  result = signal('');

  ngAfterViewInit() {
    this.scanner
      .start((devices: any[]) => {
        // แสดง log ดูว่า device มีอะไรบ้าง
        console.log('📱 Available cameras:', devices);
        devices.forEach((d: any, i: number) => {
          console.log(`[${i}] ${d.label} (${d.deviceId})`);
        });

        // หา rear camera ที่ไม่ใช่ telephoto
        const backCamera = this.selectBestBackCamera(devices);

        if (backCamera) {
          console.log('✅ Selected camera:', backCamera.label);

          this.scanner.playDevice(backCamera.deviceId).subscribe({
            next: () => console.log('playDevice success'),
            error: (err) => console.error('playDevice error', err),
          });
        }
      })
      .subscribe({
        next: (res) => console.log('scanner start', res),
        error: (err) => console.error('scanner start error', err),
      });

    this.scanner.data.subscribe((results: ScannerQRCodeResult[]) => {
      if (!this.scannerEnabled() || !results.length) return;

      const data = results[0].value;
      this.onScanSuccess(data);
    });
  }

  // ฟังก์ชันเลือกกล้องหลังที่ดีที่สุด
  private selectBestBackCamera(devices: any[]): any {
    if (!devices || devices.length === 0) return null;

    // 1. หา rear/back camera ทั้งหมด
    const backCameras = devices.filter((d: any) => /back|rear|environment/i.test(d.label));

    if (backCameras.length === 0) {
      // ถ้าไม่มี rear camera เลย ใช้ตัวสุดท้าย (มักเป็น rear)
      return devices.at(-1);
    }

    // 2. เลือก camera ที่ไม่ใช่ telephoto/zoom
    // iPhone: telephoto มักมีคำว่า "tele", "zoom", "2x"
    // Android: telephoto มักมีคำว่า "tele", "zoom", "aux"
    const wideCamera = backCameras.find((d: any) => {
      const label = d.label.toLowerCase();
      return !/tele|zoom|2x|3x|aux|macro|depth/.test(label);
    });

    if (wideCamera) {
      return wideCamera;
    }

    // 3. ถ้าไม่มี wide camera จริงๆ ให้ใช้ rear camera ตัวแรก
    return backCameras[0];
  }

  // กล้อง tele มักมี resolution สูงกว่า
  cameraConstraints: MediaStreamConstraints = {
    audio: false,
    video: {
      facingMode: {
        ideal: 'environment',
      },
      // จำกัด resolution ไม่ให้สูงเกินไป (เลี่ยง telephoto)
      width: {
        ideal: 1280, // Full HD
        max: 1920, // ไม่เกิน 2K
      },
      height: {
        ideal: 720,
        max: 1080,
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
