import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScriptLoaderService {
  loadScript(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(`Error loading script: ${src}`);
      document.body.appendChild(script);
    });
  }
  loadScriptsInOrder(scripts: string[]): Promise<void[]> {
    const promises = [];
    for (const script of scripts) {
      promises.push(this.loadScript(script));
    }
    return Promise.all(promises);
  }
}