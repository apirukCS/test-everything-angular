import { AfterViewInit, Component, inject, OnDestroy, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';
import {
  NgxScannerQrcodeComponent,
  ScannerQRCodeConfig,
  ScannerQRCodeDevice,
  ScannerQRCodeResult,
} from 'ngx-scanner-qrcode';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-qr-scan-dialog',
  imports: [NgxScannerQrcodeComponent, CommonModule],
  templateUrl: './qr-scan-dialog.html',
  styleUrl: './qr-scan-dialog.scss',
})
export class QrScanDialog implements AfterViewInit, OnDestroy {
  public dialogRef = inject(MatDialogRef<QrScanDialog>);

  @ViewChild('scanner', { static: true })
  scanner!: NgxScannerQrcodeComponent;

  readonly cameraConfig: ScannerQRCodeConfig = {
    constraints: {
      audio: false,
      video: { facingMode: { ideal: 'environment' } },
    },
  };

  devices = signal<ScannerQRCodeDevice[]>([]);
  selectedDeviceId = signal('');
  scannerEnabled = signal(true);
  result = signal('');
  isLoading = signal(false);

  private dataSub?: Subscription;
  private playbackCheck?: ReturnType<typeof setTimeout>;
  private restartTimer?: ReturnType<typeof setTimeout>;
  private restartAttempts = 0;
  private isClosing = false;

  ngAfterViewInit(): void {
    this.isLoading.set(true);
    // Permission has already been requested from the Scan button. Calling start()
    // here would open and immediately close a second temporary stream before
    // playDevice() opens the real one, which fails on some mobile devices.
    void this.selectInitialCamera();

    this.dataSub = this.scanner.data.subscribe((results: ScannerQRCodeResult[]) => {
      if (!this.scannerEnabled() || !results.length) return;
      this.onScanSuccess(results[0].value);
    });
  }

  private async selectInitialCamera(): Promise<void> {
    try {
      const devices = await this.getCameraDevices();

      // ngx-scanner-qrcode uses this list inside playDevice(), so keep both lists
      // in sync with the post-permission values.
      this.scanner.devices.next(devices);
      this.devices.set(devices);

      const selected = this.findBackCamera(devices);
      if (!selected) throw new Error('No camera detected.');

      this.selectedDeviceId.set(selected.deviceId);
      this.playDevice(selected.deviceId);
    } catch (err) {
      this.onScannerError(err);
    }
  }

  private async getCameraDevices(): Promise<ScannerQRCodeDevice[]> {
    // A few devices return an empty list briefly after their permission prompt
    // closes. Retry enumeration before reporting that no camera exists.
    for (let attempt = 0; attempt < 3; attempt++) {
      const devices: ScannerQRCodeDevice[] = (await navigator.mediaDevices.enumerateDevices())
        .filter((device) => device.kind === 'videoinput')
        .map(({ deviceId, groupId, kind, label }) => ({ deviceId, groupId, kind, label }));

      if (devices.length) return devices;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    return [];
  }

  private findBackCamera(devices: ScannerQRCodeDevice[]): ScannerQRCodeDevice | null {
    if (!devices.length) return null;

    const normalized = (value: string) => value.toLowerCase();
    const isRearCamera = (device: ScannerQRCodeDevice) =>
      /กล้องด้านหลัง|กล้องหลัง|back|rear|environment/.test(normalized(device.label));
    const rearDevices = devices.filter(isRearCamera);

    if (!rearDevices.length) return devices.at(-1) ?? null;

    return (
      rearDevices.find((device) => /ultra.*wide|ultrawide|อัลตร้าไวด์/.test(normalized(device.label))) ??
      rearDevices.find((device) => /wide|มุมกว้าง/.test(normalized(device.label))) ??
      rearDevices[0]
    );
  }

  private playDevice(deviceId: string, retry = 0): void {
    this.isLoading.set(true);
    // playDevice() stops the current stream itself. Calling stop() followed by a
    // timeout races the library and can make a reopened dialog select the front camera.
    this.scanner.playDevice(deviceId).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.checkCameraPlayback();
      },
      error: (err: DOMException) => {
        // The permission probe has just stopped its track. Some Android WebViews
        // need a moment before the camera can be acquired again.
        if (retry === 0 && err?.name === 'NotReadableError') {
          setTimeout(() => this.playDevice(deviceId, 1), 300);
          return;
        }
        this.restartScanner(err);
      },
    });
  }

  private checkCameraPlayback(): void {
    clearTimeout(this.playbackCheck);
    this.playbackCheck = setTimeout(() => {
      const video = this.scanner.video?.nativeElement;
      const track = (video?.srcObject as MediaStream | null)?.getVideoTracks()[0];
      const hasFrame = (video?.readyState ?? 0) >= HTMLMediaElement.HAVE_CURRENT_DATA;

      if (track?.readyState === 'live' && hasFrame) {
        this.restartAttempts = 0;
        return;
      }

      this.restartScanner(new Error('Camera stream did not become active.'));
    }, 1_000);
  }

  private restartScanner(error: unknown): void {
    if (!this.canRetryCamera(error) || this.restartAttempts >= 1) {
      this.onScannerError(error);
      return;
    }

    this.restartAttempts++;
    this.isLoading.set(true);
    clearTimeout(this.playbackCheck);
    this.stopScanner();

    // Let the browser release the previous camera handle before start() creates
    // the library's permission stream again.
    this.restartTimer = setTimeout(() => {
      if (this.isClosing) return;
      this.scanner.start(() => void this.selectInitialCamera()).subscribe({
        error: (startError) => this.onScannerError(startError),
      });
    }, 300);
  }

  private canRetryCamera(error: unknown): boolean {
    if (!(error instanceof DOMException)) return true;
    return error.name !== 'NotAllowedError' && error.name !== 'SecurityError';
  }

  onCameraChange(event: Event): void {
    const deviceId = (event.target as HTMLSelectElement).value;
    this.selectedDeviceId.set(deviceId);
    this.playDevice(deviceId);
  }

  onScanSuccess(data: string): void {
    if (!this.scannerEnabled()) return;

    this.scannerEnabled.set(false);
    this.result.set(data);
    this.cancelPendingCameraWork();
    this.stopScanner();
    this.dialogRef.close(data);
  }

  onScannerError(error: unknown): void {
    this.isLoading.set(false);
    console.error('QR scanner error:', error);
  }

  close(): void {
    this.cancelPendingCameraWork();
    this.stopScanner();
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.dataSub?.unsubscribe();
    this.cancelPendingCameraWork();
    this.stopScanner();
  }

  private cancelPendingCameraWork(): void {
    this.isClosing = true;
    clearTimeout(this.playbackCheck);
    clearTimeout(this.restartTimer);
  }

  private stopScanner(): void {
    if (this.scanner?.isStart) {
      this.scanner.stop().subscribe({ error: (err) => this.onScannerError(err) });
    }
  }
}
