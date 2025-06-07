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
import { take } from 'rxjs';
import PocketBase from 'pocketbase';

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
  public plan: any = {};
  public suscripcionActiva: boolean = false;
  public pb: PocketBase;
constructor(
 public global: GlobalService,
 public authService: AuthPocketbaseService,
 public realtimeProfesionales: RealtimeProfessionalsService,
 public realtimePlanes: RealtimePlanesService,
 public paymentService: PaymentService,
 private route: ActivatedRoute

) { 
  this.pb = new PocketBase('https://db.redpsicologos.cl:8090');
}

ngOnInit() {
  const cachedInfo = localStorage.getItem('professionalInfo');
  if (cachedInfo) {
    const profesional = JSON.parse(cachedInfo);
    this.global.setPreviewProfesional(profesional);
    this.setImage();
  } else {
    this.global.loadProfessionalInfo();
    this.getProfessionlInfo();
  }

  const pendingPayment = localStorage.getItem('pendingPayment');
  if (pendingPayment) {
    const paymentData = JSON.parse(pendingPayment);
    const now = new Date().getTime();
    const elapsed = (now - paymentData.timestamp) / (1000 * 60);
    if (elapsed > 30) localStorage.removeItem('pendingPayment');
    this.verificarVencimiento();
  }

  this.route.queryParams.subscribe(params => {
    const requestId = params['requestId'];
    const planId = params['planId'];

    if (requestId && !localStorage.getItem('paymentHandled')) {
      console.log('🔁 Retorno desde GetNet. Verificando estado de pago...');
      localStorage.setItem('paymentHandled', 'true'); // Para evitar múltiples ejecuciones
      this.checkPaymentStatus(requestId, planId);
    }
  });
  this.checkSubscriptionStatus();
}

checkSubscriptionStatus(): void {
  const fechaInicioStr = localStorage.getItem('subscriptionStart');
  const duracionStr = localStorage.getItem('subscriptionDuration');

  if (!fechaInicioStr || !duracionStr) {
    this.suscripcionActiva = false;
    return;
  }

  const fechaInicio = new Date(fechaInicioStr);
  const durationMonths = parseInt(duracionStr, 10);

  const fechaExpiracion = new Date(fechaInicio);
  fechaExpiracion.setMonth(fechaExpiracion.getMonth() + durationMonths);

  this.suscripcionActiva = new Date() < fechaExpiracion;
}


verificarVencimiento() {
  const fechaInicioStr = localStorage.getItem('subscriptionStart');
  if (!fechaInicioStr) return;

  const fechaInicio = new Date(fechaInicioStr);
  const fechaExpiracion = new Date(fechaInicio);
  fechaExpiracion.setMonth(fechaExpiracion.getMonth() + 1);

  const ahora = new Date();

  if (ahora > fechaExpiracion) {
    Swal.fire({
      title: 'Suscripción vencida 📅',
      text: 'Tu suscripción ha expirado. Por favor, renueva para seguir disfrutando del servicio.',
      icon: 'warning',
      confirmButtonText: 'Renovar'
    });
  }
}

mostrarMensaje(tipo: 'payment-success' | 'payment-failure', planId?: string) {
  if (tipo === 'payment-success') {
    Swal.fire({
      title: '¡Pago exitoso! 🎉',
      html: `Tu suscripción ha sido activada correctamente.<br>Plan ID: <strong>${planId || 'Desconocido'}</strong>`,
      icon: 'success',
      showCancelButton: true,
      confirmButtonText: 'Ir a Suscripción',
      cancelButtonText: 'Cerrar',
    }).then(result => {
      if (result.isConfirmed) {
        this.global.activeRoute = 'planning';
      }
    });
  } else {
    Swal.fire({
      title: 'Pago rechazado ❌',
      text: 'Tu pago no fue procesado. Por favor, intenta nuevamente o usa otro método.',
      icon: 'error',
      showCancelButton: true,
      confirmButtonText: 'Ir a Suscripción',
      cancelButtonText: 'Cerrar',
    }).then(result => {
      if (result.isConfirmed) {
        this.global.activeRoute = 'planning';
      }
    });
  }
}

checkPaymentStatus(requestId: string, planId?: string) {
  console.log('📡 Consultando estado de pago con requestId:', requestId);

  this.paymentService.getPaymentStatus(requestId).subscribe({
    next: (status: any) => {
      this.paymentStatus = status.status?.status;
      console.log('📥 Resultado GetNet:', this.paymentStatus);

      if (this.paymentStatus === 'APPROVED' && planId) {
        const fechaInicio = new Date();
        const fechaInicioISO = fechaInicio.toISOString();

        this.realtimePlanes.planes$.pipe(take(1)).subscribe(async (plans) => {
          const selectedPlan = plans.find(p => p.id === planId);
          if (!selectedPlan) {
            this.handleError('❌ Plan no encontrado después del pago');
            return;
          }

          const duration = selectedPlan.duration || 1;

          // 1️⃣ Guardar localmente
          localStorage.setItem('subscriptionStart', fechaInicioISO);
          localStorage.setItem('subscriptionPlanId', planId);
          localStorage.setItem('subscriptionDuration', duration.toString());
          localStorage.removeItem('pendingPayment');

          // 2️⃣ Actualizar en PocketBase al profesional
          try {
            await this.realtimeProfesionales.updateProfesional(this.authService.getUserId(), {
              subscriptionStart: fechaInicioISO,
              subscriptionPlanId: planId,
              subscriptionDuration: duration,
              planId: planId // también puedes mantener el planId anterior si aplica
            });
          } catch (err) {
            console.error('❌ Error al actualizar al profesional en PocketBase:', err);
          }

          // 3️⃣ Guardar transacción
          try {
            await this.pb.collection('psychologistsTransactions').create({
              requestId,
              customer: this.authService.getUserId(),
              amount: selectedPlan.price,
              status: 'APPROVED',
              processUrl: '', // si tienes esta info
              plan: planId,
              getnet_request_id: requestId,
              approved_at: fechaInicioISO,
              transaction_data: JSON.stringify(selectedPlan)
            });
          } catch (err) {
            console.error('❌ Error al guardar transacción en PocketBase:', err);
          }

          // 4️⃣ Mostrar modal de éxito
          this.mostrarMensaje('payment-success', planId);

          // 5️⃣ Redirigir luego de éxito
          setTimeout(() => {
            this.global.setActivePlanId(planId);
            this.global.activeRoute = '/dashboard/planning';
          }, 3000);
        });

      } else if (this.paymentStatus === 'REJECTED') {
        this.mostrarMensaje('payment-failure');
      } else {
        console.warn('⚠️ Estado de pago desconocido:', this.paymentStatus);
      }
    },
    error: (err) => {
      console.error('❌ Error al consultar el estado de pago:', err);
      this.handleError(this.parseGetnetError(err));
    }
  });
}


getSubscriptionDate(type: 'start' | 'end'): string {
  const start = new Date(localStorage.getItem('subscriptionStart') || '');
  const months = parseInt(localStorage.getItem('subscriptionDuration') || '1', 10);
  const end = new Date(start);
  end.setMonth(end.getMonth() + months);
  const date = type === 'start' ? start : end;
  return date.toLocaleDateString();
}

  
public async validateServerTime(): Promise<boolean> {
  const serverTime = await this.getServerTime();
  const deviceTime = new Date();
  const diffMinutes = Math.abs((deviceTime.getTime() - serverTime.getTime()) / (1000 * 60));
  
  return diffMinutes <= 5;
}

public async getServerTime(): Promise<Date> {
  try {
    const response = await fetch(`${environment.getnetApiUrl}/server-time`, {
      method: 'HEAD'
    });
    return new Date(response.headers.get('Date') || new Date());
  } catch {
    return new Date(); // Fallback
  }
}

startSubscription(planId: string) {
  if (this.isProcessing) return;
  if (!this.validateServerTime()) {
    this.handleError('Sincroniza tu hora con internet');
    return;
  }
  this.isProcessing = true;
  this.paymentStatus = null;

  this.realtimePlanes.planes$.pipe(
    take(1) // Tomar solo la primera emisión
  ).subscribe(plans => {
    const selectedPlan = plans.find(p => p.id === planId);
    if (!selectedPlan) {
      this.handleError('Plan no encontrado');
      return;
    }

    // Validar RUT con formato chileno
    const rut = this.global.professionalInfo?.rut;
    if (!this.validateRUT(rut)) {
      this.handleError('El RUT no es válido. Formato esperado: 11.111.111-1 o 11111111-1');
      return;
    }

    // Crear objeto de pago
    const paymentRequest = {
      locale: 'es_CL',
      buyer: {
        name: this.global.professionalInfo?.name || 'Cliente',
        surname: this.global.professionalInfo?.lastName || 'Anónimo',
        email: this.global.professionalInfo?.email || 'cliente@example.com',
        document: this.cleanRUT(rut), // Enviar sin puntos
        documentType: 'CLRUT',
        mobile: this.formatPhoneNumber(this.global.professionalInfo?.phone)
      },
      payment: {
        reference: `PL${planId.slice(0, 8)}${Date.now().toString().slice(-6)}`,
        description: `Suscripción a ${selectedPlan.name}`,
        amount: {
          currency: 'CLP',
          total: selectedPlan.price
        }
      },
      expiration: new Date(Date.now() + 3600000).toISOString(),
      returnUrl: `${environment.returnUrl}?type=subscription&planId=${planId}`,
      cancelUrl: environment.cancelUrl,
      ipAddress: '127.0.0.1', // en desarrollo
      userAgent: navigator.userAgent
    };

    // Validar tiempo del servidor antes de enviar
    if (!this.validateServerTime()) {
      this.handleError('El reloj de tu dispositivo está desincronizado. Por favor verifica la hora y fecha.');
      return;
    }

    this.paymentService.createPaymentSession(paymentRequest).subscribe({
      next: (response: any) => {
        if (response.status?.status === 'OK') {
          // Guardar en localStorage mientras se redirige
          localStorage.setItem('pendingPayment', JSON.stringify({
            planId,
            requestId: response.requestId,
            timestamp: new Date().getTime()
          }));
          
          // Redirigir al checkout de GetNet
          window.location.href = response.processUrl;
        } else {
          this.handleError(response.status?.message || 'Error al crear sesión de pago');
        }
        this.loadUserPlanStatus();
      },
      error: (err) => {
        console.error('Error detallado:', err);
        this.handleError(this.parseGetnetError(err));
      },
      complete: () => {
        this.isProcessing = false;
      }
    });
  });
}

loadUserPlanStatus() {
  this.realtimeProfesionales.getProfesionalById(this.authService.getUserId()).subscribe({
    next: (profesional: any) => {
      this.global.setPreviewProfesional(profesional);
    },
    error: (err: any) => {
      console.error('Error al cargar info profesional:', err);
    }
  });
}
// Limpiar RUT (eliminar puntos y guión)
private cleanRUT(rut: string): string {
  return rut.replace(/\./g, '').replace(/-/g, '');
}

// Validación de RUT chileno mejorada
private validateRUT(rut: string): boolean {
  if (!rut) return false;
  
  // Patrones aceptados: 11.111.111-1 o 11111111-1
  const rutRegex = /^(\d{1,3}(?:\.\d{1,3}){2}-[\dkK])|(\d{7,8}-[\dkK])$/;
  return rutRegex.test(rut);
}

private getUserIP(): string {
  return '127.0.0.1'; // fija para desarrollo local
}


// Métodos auxiliares


private formatPhoneNumber(phone: string): string {
  if (!phone) return '+56912345678'; // default válido
  const digits = phone.replace(/\D/g, ''); // elimina todos los no numéricos
  return digits.startsWith('56') ? `+${digits}` : `+56${digits}`;
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
