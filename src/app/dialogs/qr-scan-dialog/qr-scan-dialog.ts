import { Component, ViewChild, inject, signal, AfterViewInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { NgxScannerQrcodeComponent, ScannerQRCodeResult } from 'ngx-scanner-qrcode';
import { CommonModule } from '@angular/common';

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
  selectedDeviceId = signal<string>('');
  devices = signal<any[]>([]);

  ngAfterViewInit() {
    // เริ่ม scanner
    this.scanner
      .start()
      .subscribe({
        next: (res) => console.log('🚀 Scanner started', res),
        error: (err) => console.error('❌ Scanner error', err),
      });

    // Subscribe devices
    this.scanner.devices.subscribe((deviceList: any[]) => {
      console.log('📱 Available cameras:', deviceList);
      this.devices.set(deviceList);

      deviceList.forEach((d: any, i: number) => {
        console.log(`[${i}] ${d.label || 'Unknown'} (${d.deviceId})`);
      });

      // เลือกกล้องที่ดีที่สุดอัตโนมัติ
      const bestCamera = this.selectBestBackCamera(deviceList);
      if (bestCamera) {
        console.log('✅ Auto-selected:', bestCamera.label);
        this.selectedDeviceId.set(bestCamera.deviceId);
        this.playSelectedCamera(bestCamera.deviceId);
      }
    });

    // Handle scan results
    this.scanner.data.subscribe((results: ScannerQRCodeResult[]) => {
      if (!this.scannerEnabled() || !results.length) return;
      const data = results[0].value;
      console.log('📦 Scanned:', data);
      this.onScanSuccess(data);
    });
  }

  // ฟังก์ชันเลือกกล้องหลังที่ดีที่สุด
  private selectBestBackCamera(devices: any[]): any {
    if (!devices || devices.length === 0) return null;

    // 1. หา rear/back camera ทั้งหมด
    const backCameras = devices.filter((d: any) => 
      /back|rear|environment/i.test(d.label?.toLowerCase() || '')
    );

    console.log('🔍 Back cameras found:', backCameras.map(d => d.label));

    if (backCameras.length === 0) {
      return devices.at(-1); // ใช้ตัวสุดท้าย
    }

    // 2. เลือก camera ที่ไม่ใช่ telephoto/zoom
    const wideCamera = backCameras.find((d: any) => {
      const label = d.label?.toLowerCase() || '';
      return !/tele|zoom|2x|3x|aux|macro|depth/.test(label);
    });

    if (wideCamera) {
      console.log('✅ Found wide camera:', wideCamera.label);
      return wideCamera;
    }

    // 3. ใช้ rear camera ตัวแรก
    return backCameras[0];
  }

  // ฟังก์ชันเล่น camera ที่เลือก
  private playSelectedCamera(deviceId: string) {
    console.log('🎬 Playing camera:', deviceId);
    
    this.scanner.playDevice(deviceId).subscribe({
      next: () => {
        console.log('✅ Camera changed successfully');
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('❌ Camera change error:', err);
        this.isLoading.set(false);
      },
    });
  }

  // ฟังก์ชันที่ user เลือก camera เอง
  onCameraChange(event: Event) {
    const deviceId = (event.target as HTMLSelectElement).value;
    console.log('👤 User selected camera:', deviceId);
    
    this.selectedDeviceId.set(deviceId);
    this.isLoading.set(true);
    this.playSelectedCamera(deviceId);
  }

  // กล้อง tele มักมี resolution สูงกว่า
  cameraConstraints: MediaStreamConstraints = {
    audio: false,
    video: {
      facingMode: {
        ideal: 'environment',
      },
      width: {
        ideal: 1280,
        max: 1920,
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
    
    // Vibrate feedback (ถ้ามี)
    if (navigator.vibrate) {
      navigator.vibrate(200);
    }
    
    // auto close หลัง scan ได้
    setTimeout(() => {
      this.dialogRef.close(data);
    }, 300);
  }

  close() {
    this.scanner.stop();
    this.dialogRef.close();
  }
}