// qr-scan-dialog.ts
import { Component, inject, signal, ViewChild, AfterViewInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { LOAD_WASM, NgxScannerQrcodeComponent } from 'ngx-scanner-qrcode';
import { AsyncPipe, CommonModule } from '@angular/common';

interface LogEntry {
  time: string;
  message: string;
  type: 'info' | 'error' | 'success' | 'warning';
}

@Component({
  selector: 'app-qr-scan-dialog',
  imports: [ZXingScannerModule, NgxScannerQrcodeComponent, AsyncPipe, CommonModule],
  templateUrl: './qr-scan-dialog.html',
  styleUrl: './qr-scan-dialog.scss',
})
export class QrScanDialog implements AfterViewInit {
  public dialogRef = inject(MatDialogRef<QrScanDialog>);

  @ViewChild('scanner', { static: false })
  scanner!: NgxScannerQrcodeComponent;

  logs: LogEntry[] = [];
  scannerData: any = null;

  ngAfterViewInit() {
    this.addLog('Component initialized', 'info');
    this.checkCameraPermission();
  }

  addLog(message: string, type: LogEntry['type'] = 'info') {
    const time = new Date().toLocaleTimeString('th-TH');
    this.logs.unshift({ time, message, type });
    console.log(`[${type.toUpperCase()}] ${time}: ${message}`);
  }

  async checkCameraPermission() {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.addLog('Camera API available', 'info');

        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        this.addLog('Camera permission granted', 'success');

        // Stop stream after checking
        stream.getTracks().forEach((track) => track.stop());
      } else {
        this.addLog('Camera API not available on this device', 'error');
      }
    } catch (error: any) {
      this.addLog(`Camera permission error: ${error.name} - ${error.message}`, 'error');
    }
  }

  start() {
    this.addLog('Starting scanner...', 'info');

    if (!this.scanner) {
      this.addLog('Scanner component not initialized', 'error');
      return;
    }

    // ต้อง subscribe ถึงจะเริ่มทำงาน
    const subscription = this.scanner.start().subscribe({
      next: (result: any) => {
        this.addLog(`Scanner result: ${JSON.stringify(result)}`, 'success');
        if (result?.text) {
          this.scannerData = result;
          this.addLog(`📦 QR Code: ${result.text}`, 'success');
        }
      },
      error: (error: any) => {
        this.addLog(`❌ Error: ${error?.message || error}`, 'error');
      },
      complete: () => {
        this.addLog('Scanner completed', 'info');
      },
    });

    // เก็บ subscription ไว้ unsubscribe ทีหลังถ้าจำเป็น
    this.addLog('✅ Scanner started', 'success');
  }
  stop() {
    this.addLog('Stopping scanner...', 'info');

    try {
      this.scanner.stop();
      this.addLog('Scanner stopped', 'info');
    } catch (error: any) {
      this.addLog(`Stop error: ${error.message || error}`, 'error');
    }
  }

  onScanError(error: any) {
    this.addLog(`Scan error: ${error?.message || error}`, 'error');
  }

  onScanData(data: any) {
    this.scannerData = data;
    this.addLog(`Scanned: ${data?.text || JSON.stringify(data)}`, 'success');
  }
}
