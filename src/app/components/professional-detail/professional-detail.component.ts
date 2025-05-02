import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { GlobalService } from '../../service/global.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-professional-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
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
  this.resetForm();  
}
ngAfterViewInit() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth' // Opcional: para un scroll suave
  });
}

private cleanPhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

sendToWhatsApp() {
  // Get the professional's phone number from the previewProfesionals object
  const professionalPhone = this.global.previewProfesionals?.phone || '';
  const cleanPhone = this.cleanPhoneNumber(professionalPhone);
  
  // Build the message with all form data
  const message = `Hola, mi nombre es ${this.name}.\n` +
                  `Mi teléfono es: ${this.phone}\n` +
                  `Mi correo electrónico es: ${this.email}\n` +
                  `Me gustaría contactarte para una consulta.`;
  
  // Create WhatsApp URL with the professional's phone number
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  
  // Log the phone number being used (for debugging)
  console.log('Sending WhatsApp message to:', cleanPhone);
  
  window.open(whatsappUrl, '_blank');
  this.resetForm();
}

sendToEmail() {
  const message = `Hola, mi nombre es ${this.name}.`;
  const emailUrl = `mailto:${this.email}?subject=Consulta&body=${encodeURIComponent(message)}`;
  window.open(emailUrl, '_blank');
  this.resetForm();
}
resetForm() {
  this.name = '';
  this.phone = 0;
  this.email = '';
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
