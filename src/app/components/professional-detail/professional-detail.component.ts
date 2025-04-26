import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { GlobalService } from '../../service/global.service';

@Component({
  selector: 'app-professional-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './professional-detail.component.html',
  styleUrl: './professional-detail.component.css'
})
export class ProfessionalDetailComponent implements OnInit, AfterViewInit {
name: string = '';
phone: number = 0;
email: string = '';
profesional: any;
constructor(
  public global: GlobalService
){}
ngOnInit() {
  this.profesional = this.global.previewProfesionals;
  
}
ngAfterViewInit() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth' // Opcional: para un scroll suave
  });
}

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
  const langs = this.global.previewProfesionals?.languages;
  if (!langs || !Object.values(langs).length) return 'No especificado';
  return Object.keys(langs).filter(lang => langs[lang as keyof typeof langs]).join(', ');
}

getRegionDisplay(): string {
  const regionId = this.global.previewProfesionals?.region;
  const region = this.global.storedRegiones?.find(r => r.id === regionId);
  return region ? region.name : 'No especificado';
}
getSelectedDays(daysObj: {[key: string]: boolean}): string[] {
  if (!daysObj) return [];
  return Object.keys(daysObj).filter(day => daysObj[day]);
}
}
