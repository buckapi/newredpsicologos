import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { GlobalService } from '../../service/global.service';
interface profesional {
  name: string;
  specialty: string;
  address: string;
  phone: string;
  biography: string;
  region: string;
  images: string[];
}
@Component({
  selector: 'app-professional-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './professional-detail.component.html',
  styleUrl: './professional-detail.component.css'
})
export class ProfessionalDetailComponent {
name: string = '';
phone: number = 0;
email: string = '';
constructor(
  public global: GlobalService
){}
sendToWhatsApp() {
  const message = `Hola, mi nombre es ${this.name}.`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}
getSelectedItems(items: any[]) {
  return items.map(item => item.name);
}
hasSelectedItems(items: any[]) {
  return items.length > 0;
}
getLanguagesDisplay(): string {
  const langs = this.global.previewProfesionals.languages;
  if (!langs || typeof langs !== 'object') return 'No especificado';
  const map: Record<string, string> = { es: 'Español', en: 'Inglés', fr: 'Francés', de: 'Alemán' };
  const selected = Object.keys(langs)
    .filter(key => langs[key as keyof typeof langs])
    .map(key => map[key] || key);
  return selected.length > 0 ? selected.join(', ') : 'No especificado';
}

getRegionDisplay(): string {
  const region = this.global.previewProfesionals.region;

  // Si es un objeto, intenta obtener los valores
  if (typeof region === 'object') {
    const values = Object.values(region).filter(Boolean);
    return values.length > 0 ? values.join(', ') : 'No especificado';
  }
  return 'No especificado';
}
}
