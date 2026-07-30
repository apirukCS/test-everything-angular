import { Component, inject, OnInit, signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { QrScanDialog } from './dialogs/qr-scan-dialog/qr-scan-dialog';
import { LOAD_WASM } from 'ngx-scanner-qrcode';

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('tmg-element-test');

  private dialog = inject(MatDialog);

  ngOnInit(): void {
    LOAD_WASM('assets/wasm/ngx-scanner-qrcode.wasm').subscribe();
    this.requestCameraPermission();
  }

  private async requestCameraPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
        },
        audio: false,
      });

      stream.getTracks().forEach((track) => track.stop());

      return true;
    } catch (err) {
      console.error('Camera permission denied:', err);
      return false;
    }
  }

  onClickScan() {
    const dialogRef = this.dialog.open(QrScanDialog, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      console.log('result ', result);
    });
  }
}
