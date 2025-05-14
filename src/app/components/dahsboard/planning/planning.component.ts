import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { GlobalService } from '../../../service/global.service';
import Swal from 'sweetalert2';
import { AuthPocketbaseService } from '../../../service/auth-pocketbase.service';
import { RealtimeProfessionalsService } from '../../../service/realtime-professionals';
import { RealtimePlanesService } from '../../../service/realtime-planes.service';
import PocketBase from 'pocketbase';
import { PaymentService } from '../../../service/payment.service';
import { ActivatedRoute } from '@angular/router';
import { lastValueFrom } from 'rxjs';
@Component({
  selector: 'app-planning',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './planning.component.html',
  styleUrl: './planning.component.css'
})
export class PlanningComponent {
  imageUrl: string = 'assets/images/user.png'; 
  private pb = new PocketBase('https://db.redpsicologos.cl:8090');
  paymentStatus: string = '';
  user: any = {};
  isProcessing: boolean = false; // Propiedad nueva
constructor(
 public global: GlobalService,
 public authService: AuthPocketbaseService,
 public realtimeProfesionales: RealtimeProfessionalsService,
 public realtimePlanes: RealtimePlanesService,
 public paymentService: PaymentService,
 private route: ActivatedRoute
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
  const requestId = this.route.snapshot.queryParams['requestId'];
  if (requestId) {
    this.checkPaymentStatus(requestId);
  }
  
}

/* async startPayment() {
  try {
    const response = await lastValueFrom(
      this.paymentService.createSubscription('premium', this.user)
    );
    window.location.href = response.processUrl;
  } catch (err) {
    Swal.fire('Error', 'No se pudo iniciar el pago.', 'error');
  }
} */

startSubscription(planId: string) { // ⚠️ Recibir el ID del plan
  if (!this.global.professionalInfo?.rut) {
    Swal.fire('Error', 'Actualiza tu RUT en el perfil para continuar.', 'error');
    return;
  }

  this.isProcessing = true;

  this.paymentService.createSubscription(planId, { // ⚠️ Usar planId recibido
    name: this.global.professionalInfo.name,
    email: this.global.professionalInfo.email,
    document: this.global.professionalInfo.rut
  }).subscribe({
    next: (response) => {
      window.location.href = response.processUrl;
    },
    error: (err) => {
      this.isProcessing = false;
      Swal.fire('Error', 'Error al contactar con Getnet: ' + err.error.details, 'error');
    }
  });
}

// Método para verificar estado de pago
checkPaymentStatus(requestId: string) {
  this.paymentService.checkPaymentStatus(requestId).subscribe({
    next: (statusResponse) => {
      this.paymentStatus = statusResponse.status;
      if (this.paymentStatus === 'APPROVED') {
        Swal.fire('¡Pago exitoso!', 'Tu suscripción está activa.', 'success');
      } else if (this.paymentStatus === 'REJECTED') {
        Swal.fire('Pago rechazado', 'Por favor intenta nuevamente.', 'error');
      }
    },
    error: (err) => {
      console.error('Error:', err);
      Swal.fire('Error', 'No se pudo verificar el estado del pago.', 'error');
    }
  });
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
      this.user = {
        id: profesional.id,
        name: profesional.name,
        email: profesional.email,
        rut: this.global.professionalInfo?.rut || profesional.rut
      };
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
