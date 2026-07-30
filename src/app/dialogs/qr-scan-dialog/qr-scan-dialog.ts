import { Component, inject, signal, ViewChild } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { LOAD_WASM, NgxScannerQrcodeComponent } from 'ngx-scanner-qrcode';
import { AsyncPipe, CommonModule } from '@angular/common';

LOAD_WASM('assets/wasm/ngx-scanner-qrcode.wasm').subscribe();

@Component({
  selector: 'app-qr-scan-dialog',
  imports: [ZXingScannerModule, NgxScannerQrcodeComponent, AsyncPipe, CommonModule],
  templateUrl: './qr-scan-dialog.html',
  styleUrl: './qr-scan-dialog.scss',
})
export class QrScanDialog {
  public dialogRef = inject(MatDialogRef<QrScanDialog>);

  @ViewChild('scanner', { static: false })
  scanner!: NgxScannerQrcodeComponent;

  start() {
    this.scanner.start();
  }

  stop() {
    this.scanner.stop();
  }

  // allowedFormats = [BarcodeFormat.CODE_128];
  // scannedResult = signal('');
  // scannerEnabled = signal(true);
  // isLoading = signal(false);

  // onScanSuccess(data: string) {
  //   if (!this.scannerEnabled()) return;
  //   this.scannerEnabled.set(false);
  //   this.scannedResult.set(data);

  //   console.log('scannedResult ', this.scannedResult());
  // }

  // onScanError(data: unknown) {
  //   console.log('onScanError: ', data);
  // }

  // onCamerasFound(data: unknown) {
  //   console.log('onCamerasFound: ', data);
  // }

  // onPermissionResponse(hasPermission: boolean) {
  //   if (!hasPermission) {
  //     // this.dialogRef.close();
  //     console.log('ALERT.CAMERA_PERMISSION_DENIED');
  //   }
  // }

  // close() {
  //   this.dialogRef.close();
  // }
}
