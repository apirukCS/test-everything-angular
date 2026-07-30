import { AfterViewInit, Component, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { QrScanDialog } from './dialogs/qr-scan-dialog/qr-scan-dialog';
import { LOAD_WASM } from 'ngx-scanner-qrcode';
import { DialogService } from './services/dialog';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements AfterViewInit {
  protected readonly title = signal('tmg-element-test');
  private dialogService = inject(DialogService);

  ngAfterViewInit(): void {
    // this.dialogService.requestCameraPermission();
    LOAD_WASM('assets/wasm/ngx-scanner-qrcode.wasm').subscribe({
      error: (err) => alert(`Unable to load QR scanner decoder: ${err}`),
    });
  }

  async onClickScan() {
    const result = await this.dialogService.openQrScanner();
    alert(result);
  }
}
