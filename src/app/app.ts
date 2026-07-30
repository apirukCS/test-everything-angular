import { AfterViewInit, Component, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { QrScanDialog } from './dialogs/qr-scan-dialog/qr-scan-dialog';
import { LOAD_WASM } from 'ngx-scanner-qrcode';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements AfterViewInit {
  protected readonly title = signal('tmg-element-test');

  private dialog = inject(MatDialog);

  ngAfterViewInit(): void {
    // Load the decoder before the dialog opens; camera permission is requested by the scanner.
    LOAD_WASM('assets/wasm/ngx-scanner-qrcode.wasm').subscribe({
      error: (err) => console.error('Unable to load QR scanner decoder:', err),
    });
  }

  onClickScan() {
    const dialogRef = this.dialog.open(QrScanDialog, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      alert(result);
    });
  }
}
