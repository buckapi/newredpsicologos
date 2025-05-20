import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { GlobalService } from '../../../service/global.service';
import Swal from 'sweetalert2';
import { AuthPocketbaseService } from '../../../service/auth-pocketbase.service';
import { RealtimeProfessionalsService } from '../../../service/realtime-professionals';
import { RealtimePlanesService } from '../../../service/realtime-planes.service';
import { PaymentService } from '../../../service/payment.service';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-planning', 
  standalone: true,
  imports: [CommonModule],
  templateUrl: './planning.component.html',
  styleUrl: './planning.component.css'
})
export class PlanningComponent {
  imageUrl: string = 'assets/images/user.png'; 
  paymentStatus: any;
  user: any = {};
  isProcessing: boolean = false; // Propiedad nueva
  public processUrl: string = '';
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
 /*  const requestId = this.route.snapshot.queryParams['requestId'];
  if (requestId) {
    this.checkPaymentStatus(requestId);
  } */
  
}
startSubscription(planId: string) {
  if (this.isProcessing) return;
  
  this.isProcessing = true;
  this.paymentStatus = null;

  this.realtimePlanes.planes$.subscribe(plans => {
    const selectedPlan = plans.find(p => p.id === planId);
    if (!selectedPlan) {
      this.handleError('Plan no encontrado');
      return;
    }

    // Validar que el RUT esté correctamente formateado
    const rut = this.global.professionalInfo?.rut;
    if (!this.validateRUT(rut)) {
      this.handleError('El RUT no es válido');
      return;
    }

    const paymentRequest = {
      locale: 'es_CL',
      buyer: {
        name: this.global.professionalInfo?.name || 'Cliente',
        surname: this.global.professionalInfo?.lastName || 'Anónimo',
        email: this.global.professionalInfo?.email || 'cliente@example.com',
        document: rut,
        documentType: 'CLRUT',
        mobile: this.formatPhoneNumber(this.global.professionalInfo?.phone)
      },
      payment: {
        reference: `SUB_${planId}_${Date.now()}`,
        description: `Suscripción a ${selectedPlan.name}`,
        amount: {
          currency: 'CLP',
          total: selectedPlan.price
        },
        recurring: {
          periodicity: 'monthly',
          interval: 1,
          maxPayments: 12,
          dueDate: this.getNextDueDate()
        }
      },
      expiration: new Date(Date.now() + 3600000).toISOString(),
      returnUrl: `${environment.returnUrl}?type=subscription&planId=${planId}`,
      cancelUrl: environment.cancelUrl,
      ipAddress: this.getUserIP(), // Método para obtener IP real en producción
      userAgent: navigator.userAgent
    };

    this.paymentService.createPaymentSession(paymentRequest, true).subscribe({
      next: (response: any) => {
        if (response.status?.status === 'OK') {
          // Redirigir al checkout de GetNet
          window.location.href = response.processUrl;
        } else {
          this.handleError(response.status?.message || 'Error al crear sesión de pago');
        }
      },
      error: (err) => {
        this.handleError(this.parseGetnetError(err));
      }
    });
  });
}

private getUserIP(): string {
  return navigator.userAgent;
}

// Métodos auxiliares
private validateRUT(rut: string): boolean {
  if (!rut) return false;
  // Implementar validación de RUT chileno
  return true;
}

private formatPhoneNumber(phone: string): string {
  if (!phone) return '+56912345678';
  // Formatear número chileno
  return phone.startsWith('+56') ? phone : `+56${phone}`;
}

private getNextDueDate(): string {
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  return nextMonth.toISOString().split('T')[0];
}

private parseGetnetError(error: any): string {
  if (!error.error) return 'Error desconocido';
  
  const getnetErrorCodes = {
    '100': 'Autenticación mal formada',
    '101': 'Credenciales incorrectas',
    '102': 'TranKey inválido',
    '103': 'Diferencia de tiempo mayor a 5 minutos',
    '104': 'Cuenta inactiva'
  };
  
  return getnetErrorCodes[error.error.status?.reason as keyof typeof getnetErrorCodes] || 
         error.error.status?.message || 
         'Error en el procesamiento del pago';
}

private handleError(message: string) {
  Swal.fire('Error', message, 'error');
  this.isProcessing = false;
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
