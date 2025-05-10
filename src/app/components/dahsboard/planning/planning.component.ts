import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { GlobalService } from '../../../service/global.service';
import Swal from 'sweetalert2';
import { AuthPocketbaseService } from '../../../service/auth-pocketbase.service';
import { RealtimeProfessionalsService } from '../../../service/realtime-professionals';
import { RealtimePlanesService } from '../../../service/realtime-planes.service';
import PocketBase from 'pocketbase';

@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './planning.component.html',
  styleUrl: './planning.component.css'
})
export class PlanningComponent {
  imageUrl: string = 'assets/images/resource/profile-3.png'; 
  private pb = new PocketBase('https://db.redpsicologos.cl:8090');

constructor(
 public global: GlobalService,
 public authService: AuthPocketbaseService,
 public realtimeProfesionales: RealtimeProfessionalsService,
 public realtimePlanes: RealtimePlanesService
) { }

 ngOnInit() {
  // Primero verificar si ya hay datos en localStorage
  const cachedInfo = localStorage.getItem('professionalInfo');
  
  if (cachedInfo) {
    const profesional = JSON.parse(cachedInfo);
    this.global.setPreviewProfesional(profesional);
    this.setImage();
  } else {
    // Si no hay datos en cache, cargarlos del servidor
    this.global.loadProfessionalInfo();
    this.getProfessionlInfo();
  }
}
confirmLogout() {
  Swal.fire({
    title: '¿Quieres cerrar sesión?',
    text: "",
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, cerrar sesión',
    cancelButtonText: 'Mantenerme aquí'
  }).then((result) => {
    if (result.isConfirmed) {
      // Limpiar los datos específicos del usuario antes de cerrar sesión
      
      this.authService.logoutUser(); 
      Swal.fire(
        '¡Cerrado!',
        'Has cerrado sesión con éxito.',
        'success'
      );
    }
  });
}
async getProfessionlInfo() {
  try {
    // Limpiar datos existentes primero
    
    const profesional = await this.realtimeProfesionales.getProfesionalById(this.authService.getUserId()).toPromise();
    
    if (profesional) {
      // Inicializar objetos vacíos si no existen
      profesional.languages = profesional.languages || {};
      profesional.targets = profesional.targets || {};
      profesional.payments = profesional.payments || {};
      profesional.days = profesional.days || {};
      profesional.typeAttention = profesional.typeAttention || {};
      
      // Guardar en el servicio global
      this.global.setPreviewProfesional(profesional);
      
      // Guardar en localStorage solo los datos necesarios
      localStorage.setItem('professionalInfo', JSON.stringify(profesional));
      
      this.setImage();
      
      
    }
  } catch (error) {
    console.error('Error al cargar info profesional:', error);
    // Limpiar datos si hay error
  }
}
setImage() {
  const professionalInfo = JSON.parse(localStorage.getItem('professionalInfo') || '{}');  
  this.imageUrl = professionalInfo.images?.[0] || 'assets/images/user.png'; 
}
hasSelectedItems(obj: any): boolean {
  if (!obj) return false;
  return Object.values(obj).some(val => val === true);
}

getSelectedItems(obj: any): string[] {
  if (!obj) return [];
  return Object.keys(obj).filter(key => obj[key]);
}
}
