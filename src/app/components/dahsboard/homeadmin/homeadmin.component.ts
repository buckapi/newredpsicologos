import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import PocketBase from 'pocketbase';
import { SettingsComponent } from '../settings/settings.component';
import { AuthPocketbaseService } from '../../../service/auth-pocketbase.service';
import { RealtimeProfessionalsService } from '../../../service/realtime-professionals';
import { GlobalService } from '../../../service/global.service';
import { RealtimeEspecialidadesService } from '../../../service/realtime-especialidades.service';
import { RealtimeTerapiaService } from '../../../service/realtime-terapia.service';
import { RealtimeTratamientosService } from '../../../service/realtime-tratamientos.service';
import { ReviewsComponent } from '../reviews/reviews.component';
import { PsychologistRatingService } from '../../../service/psychologistRatingService.service';
import { RealtimeRatingsService } from '../../../service/realtime-ratings.service';
import { EmailService } from '../../../service/email.service';
@Component({
  selector: 'app-homeadmin',
  standalone: true,
  imports: [CommonModule,
    SettingsComponent, ReviewsComponent
  ],
  templateUrl: './homeadmin.component.html',
  styleUrl: './homeadmin.component.css'
})
export class HomeadminComponent {
  activeTab: string = 'pending'; // Estado inicial
  cantidadProfesionales: number = 0;
  profesionals: any[] = [];
  specialists: any[] = [];
  selectedRequest: any = null;
  totalRatings: number = 0;

constructor(
  public auth:AuthPocketbaseService,
  public realtimeProfesionales: RealtimeProfessionalsService,
  public global: GlobalService,
  public realtimeEspecialidades: RealtimeEspecialidadesService,
  public realtimeTerapias: RealtimeTerapiaService,
  public realtimeTratamientos: RealtimeTratamientosService,
  public ratingService: PsychologistRatingService,
  public realtimeRatings: RealtimeRatingsService,
  public emailService: EmailService
){
  
}
showDetails(profesional: any) {
  Swal.fire({
      title: 'Detalles de la Solicitud',
      html: `
          <strong>Nombre:</strong> ${profesional.name}<br>
          <strong>Id:</strong> ${profesional.id}<br>
          <strong>UserId:</strong> ${profesional.userId}<br>
          <strong>Fecha de solicitud:</strong> ${this.formatDate(profesional.created) || profesional.created}<br>
          <strong>Hora:</strong> ${this.hoursDate(profesional.created) || profesional.created}<br>
      `,
      icon: 'info',
      showCancelButton: false,
      showConfirmButton: false,
      // confirmButtonText: 'Cerrar',
      // cancelButtonText: 'Aprobar',
      footer: `
          <button id="approveBtn" class="swal2-confirm swal2-styled" style="margin-right: 10px;">Aprobar</button>
          <button id="denyBtn" class="swal2-cancel swal2-styled">Denegar</button>
      `
  }).then((result) => {
      if (result.isConfirmed) {
          // Cerrar el modal
      }
  });

  // Agregar event listeners a los botones después de que se muestre el modal
  setTimeout(() => {
      const approveBtn = document.getElementById('approveBtn');
      const denyBtn = document.getElementById('denyBtn');

      if (approveBtn) {
          approveBtn.addEventListener('click', () => {
              this.updateProfesional(profesional.id, 'Aprobado'); // Llama a la función para aprobar
              Swal.close(); // Cierra el modal
          });
      }

      if (denyBtn) {
          denyBtn.addEventListener('click', () => {
              this.updateProfesional(profesional.id, 'Denegado'); // Llama a la función para denegar
              Swal.close(); // Cierra el modal
          });
      }
  }, 100);
}
setActiveTab(tab: string) {
  this.activeTab = tab;
}
filteredProfesionals() {
  return this.profesionals.filter(profesional => {
      if (this.activeTab === 'pending') {
          return profesional.status === 'pending';
      } else if (this.activeTab === 'approved') {
          return profesional.status === 'Aprobado';
      } else if (this.activeTab === 'denied') {
          return profesional.status === 'Denegado';
      }
      return true; // Por defecto, muestra todos si no hay estado activo
  });
}
 
async updateProfesional(id: string, status: string) {
    const data = {
        status: status // Actualiza el estado del profesional
    };
  
    try {
        const pb = new PocketBase('https://db.redpsicologos.cl:8090');
        const updatedProfesional = await pb.collection('psychologistsProfessionals').update(id, data);
        
        console.log('Status updated to:', status); // Debug log
        console.log('Professional data:', updatedProfesional); // Debug log
        
        // Send appropriate email based on status
        if (status === 'Aprobado' || status === 'Denegado') {
          console.log(`Sending ${status.toLowerCase()} email...`); // Debug log
          
          // Define email parameters
          const emailParams = {
            name: updatedProfesional['name'],
            email: updatedProfesional['email'],
            status: status,
            message: status === 'Aprobado' 
              ? 'Su solicitud ha sido aprobada exitosamente'
              : 'Lamentamos informarle que su solicitud no ha sido aprobada',
            date: new Date().toLocaleDateString('es-CL')
          };

          // Send email and await the response
          await this.emailService.sendStatusEmail(
            updatedProfesional['email'],
            updatedProfesional['name'],
            2, // Template ID - should be verified
            emailParams
          ).toPromise();
        }

        // Refresh the list
        await this.global.getProfesionals();
        
        Swal.fire('Éxito', `El estado ha sido actualizado a ${status}.`, 'success');
    } catch (error) {
        console.error('Error al actualizar el registro:', error);
        if (error instanceof Error) {
          Swal.fire('Error', error.message, 'error');
        } else {
          Swal.fire('Error', 'No se pudo actualizar el registro.', 'error');
        }
    }
}

  formatDate(date: string): string {
  const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      // hour: '2-digit',
      // minute: '2-digit',
      timeZone: 'America/Santiago', // Establecer la zona horaria de Santiago
      hour12: false // Cambiar a true si deseas formato de 12 horas
  };
  return new Intl.DateTimeFormat('es-CL', options).format(new Date(date));
}
hoursDate(date: string): string {
  const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Santiago',
      hour12: true // Cambiar a true para formato de 12 horas
  };

  return new Intl.DateTimeFormat('es-CL', options).format(new Date(date));
}
ngOnInit(): void {
  this.realtimeProfesionales.profesionales$.subscribe(data => {
    this.profesionals = data; // Almacena los datos en la propiedad
    this.global.setMenuOption('dashboard');
  });

  this.realtimeEspecialidades.especialidades$.subscribe(especialidades => {
    this.specialists = especialidades;
  });
  this.realtimeTerapias.terapia$.subscribe(terapias => {
    this.specialists = terapias;
  }); 
  this.realtimeTratamientos.tratamientos$.subscribe(tratamientos => {
    this.specialists = tratamientos;
  });
  // Suscribirse al Observable de ratings
  this.realtimeRatings.ratings$.subscribe(ratings => {
    this.totalRatings = ratings.length;
  });
  
}

async deleteEspecialidad(especialidad: any) {
  const confirm = await Swal.fire({
    title: '¿Eliminar especialidad?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar'
  });
}

async deleteProfesional(profesional: any) {
  const confirm = await Swal.fire({
    title: '¿Eliminar especialidad?',
    text: 'Esta acción no se puede deshacer.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#3085d6',
    confirmButtonText: 'Sí, eliminar'
  });
  if (confirm.isConfirmed) {
    const pb = new PocketBase('https://db.redpsicologos.cl:8090');
    await pb.collection('psychologistsProfessionals').delete(profesional.id);
    Swal.fire('Éxito', 'El especialista ha sido eliminado.', 'success');
  }
}
get totalActivos(): number {
  return this.profesionals ? this.profesionals.filter(p => p.status === 'Aprobado').length : 0;
}


}
