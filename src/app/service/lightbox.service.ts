// lightbox.service.ts
import { Injectable } from '@angular/core';

declare const P: any; // Declarar el SDK de Getnet

@Injectable({
  providedIn: 'root'
})
export class LightboxService {
  private isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  openLightbox(processUrl: string) {
    if (this.isMobile) {
      // Redirección para móviles
      window.location.href = processUrl;
    } else {
      // Lightbox para desktop
      P.init(processUrl);
    }
  }
}