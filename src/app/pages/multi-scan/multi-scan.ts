import { Component, OnInit } from '@angular/core';
import { BarcodeFormat } from '@zxing/library';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

@Component({
  selector: 'app-multi-scan',
  templateUrl: './multi-scan.html',
  imports: [ZXingScannerModule],
})
export class MultiScanComponent implements OnInit {
  // controls
  scannerEnabled = false;
  selectedDevice?: MediaDeviceInfo;
  availableDevices: MediaDeviceInfo[] = [];

  // mode: 'qr' | 'code128' | 'both' | 'image'
  mode: 'qr' | 'code128' | 'both' | 'image' = 'both';

  // formats bound to zxing-scanner
  allowedFormats = [BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128];

  lastResult = '';

  ngOnInit(): void {}

  // cameras found event
  onCamerasFound(devices: MediaDeviceInfo[]) {
    this.availableDevices = devices;
    // prefer back/rear/environment
    const back = devices.find((d) => /back|rear|environment/i.test(d.label));
    this.selectedDevice = back ?? devices[0];
  }

  // camera permission
  onPermissionResponse(hasPermission: boolean) {
    if (!hasPermission) {
      alert('Camera permission denied');
      this.scannerEnabled = false;
    }
  }

  // buttons
  openScanQr() {
    this.mode = 'qr';
    this.allowedFormats = [BarcodeFormat.QR_CODE];
    this.startScanner();
  }

  openScanCode128() {
    this.mode = 'code128';
    this.allowedFormats = [BarcodeFormat.CODE_128];
    this.startScanner();
  }

  openScanBoth() {
    this.mode = 'both';
    this.allowedFormats = [BarcodeFormat.QR_CODE, BarcodeFormat.CODE_128];
    this.startScanner();
  }

  openScanFromImage() {
    this.mode = 'image';
    this.scannerEnabled = false;
    // show file input or open camera capture via input[file] capture="camera"
    // (you can trigger a hidden file input here)
  }

  startScanner() {
    this.lastResult = '';
    this.scannerEnabled = true;
  }

  stopScanner() {
    this.scannerEnabled = false;
  }

  // result handler
  onScanSuccess(result: string) {
    // don't stop immediately if you want to validate more
    const text = result.trim();
    this.lastResult = text;

    // Example validation: if code128 expected numeric 16-chars
    if (this.mode === 'code128' && /^\d{16}$/.test(text)) {
      this.handleFinalResult(text, 'CODE_128');
      return;
    }

    // For QR or both, accept and close
    if (this.mode === 'qr' || this.mode === 'both') {
      this.handleFinalResult(text, 'QR_OR_CODE128');
      return;
    }

    // fallback: keep scanner running if invalid
  }

  handleFinalResult(text: string, type: string) {
    // do what you need: close dialog, call API, etc.
    console.log('Scanned:', type, text);
    // stop scanner to avoid repeated reads
    this.stopScanner();
  }

  // optional: scan error/failure handlers
  onScanError(err: any) {
    console.error('scan error', err);
  }
  onScanFailure(err: any) {
    // NotFoundExceptions are normal while scanning continuously
    // you can ignore or log for debugging
  }
}
