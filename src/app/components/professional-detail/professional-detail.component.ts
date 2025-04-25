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
}
