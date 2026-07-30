import { Component, inject, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { NgxScannerQrcodeComponent, LOAD_WASM, ScannerQRCodeConfig } from 'ngx-scanner-qrcode';
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
export class QrScanDialog implements AfterViewInit, OnDestroy {
  public dialogRef = inject(MatDialogRef<QrScanDialog>);

  @ViewChild('scanner', { static: false })
  scanner!: NgxScannerQrcodeComponent;

  logs: LogEntry[] = [];
  scannedData: any = null;
  errorMessage: string = '';
  private scannerSubscription?: Subscription;

  // Config สำหรับกล้อง
  scannerConfig: ScannerQRCodeConfig = {
    constraints: {
      video: {
        facingMode: 'environment', // ใช้กล้องหลัง
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    },
    isBeep: true,
    vibrate: 200,
  };

  ngAfterViewInit() {
    this.addLog('🔧 Component initialized', 'info');
    this.initWasm();
  }

  // โหลด WASM ก่อนใช้งาน
  initWasm() {
    this.addLog('⏳ Loading WASM...', 'info');
    
    try {
      // โหลด WASM จาก CDN (หรือ local path)
      LOAD_WASM().subscribe({
        next: () => {
          this.addLog('✅ WASM loaded successfully', 'success');
        },
        error: (err) => {
          this.addLog(`❌ WASM error: ${err}`, 'error');
          this.errorMessage = 'Failed to load scanner engine';
        }
      });
    } catch (error: any) {
      this.addLog(`❌ WASM init error: ${error.message}`, 'error');
    }
  }

  addLog(message: string, type: LogEntry['type'] = 'info') {
    const time = new Date().toLocaleTimeString('th-TH');
    this.logs.unshift({ time, message, type });
    console.log(`[${type.toUpperCase()}] ${time}: ${message}`);
  }

  toggleScanner() {
    if (this.scanner.isStart) {
      this.stop();
    } else {
      this.start();
    }
  }

  start() {
    this.addLog('🚀 Starting scanner...', 'info');
    this.errorMessage = '';

    if (!this.scanner) {
      this.addLog('❌ Scanner not initialized', 'error');
      return;
    }

    // ตรวจสอบ HTTPS
    if (location.protocol === 'http:' && location.hostname !== 'localhost') {
      this.addLog('⚠️ WARNING: Must use HTTPS on mobile!', 'warning');
      this.errorMessage = 'HTTPS required for camera access on mobile';
    }

    // ตรวจสอบว่าพร้อมหรือยัง
    if (!this.scanner.isReady) {
      this.addLog('⏳ Waiting for scanner to be ready...', 'info');
    }

    // Stop ก่อนถ้ากำลังทำงาน
    this.stop();

    // Start และ Subscribe
    try {
      this.scannerSubscription = this.scanner.start().subscribe({
        next: (result: any) => {
          this.addLog(`📱 Scanner active`, 'info');
          
          if (result && Array.isArray(result) && result.length > 0) {
            const qr = result[0];
            this.scannedData = qr;
            this.addLog(`✅ ${qr.typeName}: ${qr.value}`, 'success');
            
            // Vibrate บนมือถือ
            if (navigator.vibrate) {
              navigator.vibrate(200);
            }
          }
        },
        error: (error: any) => {
          this.addLog(`❌ Error: ${error?.message || error}`, 'error');
          this.errorMessage = error?.message || 'Camera access failed';
          
          // แก้ไขปัญหาพบบ่อย
          if (error?.name === 'NotAllowedError') {
            this.addLog('🚫 Camera permission denied by user', 'error');
          } else if (error?.name === 'NotFoundError') {
            this.addLog('📷 No camera found on device', 'error');
          } else if (error?.name === 'NotReadableError') {
            this.addLog('🔒 Camera is being used by another app', 'error');
          } else if (error?.name === 'OverconstrainedError') {
            this.addLog('⚙️ Camera constraints not supported', 'error');
          }
        },
        complete: () => {
          this.addLog('⏹️ Scanner completed', 'info');
        }
      });

      this.addLog('✅ Scanner started', 'success');
    } catch (error: any) {
      this.addLog(`❌ Exception: ${error.message}`, 'error');
      this.errorMessage = error.message;
    }
  }

  stop() {
    this.addLog('⏹️ Stopping scanner...', 'info');

    if (this.scannerSubscription) {
      this.scannerSubscription.unsubscribe();
      this.scannerSubscription = undefined;
      this.addLog('🔌 Subscription unsubscribed', 'info');
    }

    if (this.scanner && this.scanner.isStart) {
      this.scanner.stop();
      this.addLog('✅ Scanner stopped', 'info');
    }
  }

  ngOnDestroy() {
    this.stop();
  }
}