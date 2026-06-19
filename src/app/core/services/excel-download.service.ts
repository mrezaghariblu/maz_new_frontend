import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ExcelDownloadService {
  download(obs: Observable<Blob>, filename: string) {
    obs.subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      },
    });
  }
}
