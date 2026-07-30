import { inject, Service } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { QrScanDialog } from '../dialogs/qr-scan-dialog/qr-scan-dialog';
import { firstValueFrom } from 'rxjs';

@Service()
export class DialogService {
  private dialog = inject(MatDialog);

async requestCameraPermission(): Promise<boolean> {
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

  async openQrScanner(): Promise<any> {
    const granted = await this.requestCameraPermission();

    if (!granted) {
      alert('PERMISSION_DENIED');
      return undefined;
    }

    await new Promise((resolve) => setTimeout(resolve, 300));

    const dialogRef = this.dialog.open(QrScanDialog, {
      width: '100vw',
      height: '100vh',
      maxWidth: '100vw',
      maxHeight: '100vh',
      disableClose: true,
    });

    return await firstValueFrom(dialogRef.afterClosed());
  }
}
