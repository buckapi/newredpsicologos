import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import PocketBase from 'pocketbase';
import Swal from 'sweetalert2';
import { GlobalService } from '../../../service/global.service';
import { RealtimeEspecialidadesService } from '../../../service/realtime-especialidades.service';
import { RealtimeTerapiaService } from '../../../service/realtime-terapia.service';
import { RealtimeTratamientosService } from '../../../service/realtime-tratamientos.service';
import { RealtimeCorrientesService } from '../../../service/realtime-corrientes.service';

const pb = new PocketBase('https://db.redpsicologos.cl:8090');





@Component({
  selector: 'app-settings',
  imports: [CommonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent {
  constructor(
    public global: GlobalService,
    public realtimeEspecialidades: RealtimeEspecialidadesService,
    public realtimeTerapia: RealtimeTerapiaService,
    public realtimeTratamientos: RealtimeTratamientosService,
    public realtimeCorrientes: RealtimeCorrientesService

  ) { }
  openSpecialtyPopup() {
    Swal.fire({
        title: 'Agregar Especialidad',
        input: 'text',
        inputLabel: 'Nombre de la especialidad',
        inputPlaceholder: 'Escribe el nombre aquí',
        showCancelButton: true,
        confirmButtonText: 'Agregar',
        cancelButtonText: 'Cancelar',
        preConfirm: (name) => {
            if (!name) {
                Swal.showValidationMessage('Por favor ingresa un nombre');
            }
            return { name: name };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            const data = {
                name: result.value.name,
                image: '', // Optional: Add image if needed
                level: ''  // Optional: Add level if needed
            };

            try {
                const record = await pb.collection('psychologistsSpecialties').create(data);
                Swal.fire('Éxito!', 'La especialidad ha sido agregada.', 'success');
            } catch (error) {
                Swal.fire('Error!', 'No se pudo agregar la especialidad.', 'error');
            }
        }
    });
}
openTreatmentPopup() {
  Swal.fire({
      title: 'Agregar Tratamiento',
      input: 'text',
      inputLabel: 'Nombre del tratamiento',
      inputPlaceholder: 'Escribe el nombre aquí',
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      preConfirm: (name) => {
          if (!name) {
              Swal.showValidationMessage('Por favor ingresa un nombre');
          }
          return { name: name };
      }
  }).then(async (result) => {
      if (result.isConfirmed) {
          const data = {
              name: result.value.name,
              image: '', // Optional: Add image if needed
              level: ''  // Optional: Add level if needed
          };

          try {
              const record = await pb.collection('psychologistsTreatments').create(data);
              Swal.fire('Éxito!', 'El tratamiento ha sido agregado.', 'success');
          } catch (error) {
              Swal.fire('Error!', 'No se pudo agregar el tratamiento.', 'error');
          }
      }
  });
}

openTherapyPopup() {
  Swal.fire({
      title: 'Agregar Terapia',
      input: 'text',
      inputLabel: 'Nombre de la terapia',
      inputPlaceholder: 'Escribe el nombre aquí',
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      preConfirm: (name) => {
          if (!name) {
              Swal.showValidationMessage('Por favor ingresa un nombre');
          }
          return { name: name };
      }
  }).then(async (result) => {
      if (result.isConfirmed) {
          const data = {
              name: result.value.name,
              image: '', // Optional: Add image if needed
              description: '', // Optional: Add description if needed
              status: '' // Optional: Add status if needed
          };

          try {
              const record = await pb.collection('psychologistsTerapy').create(data);
              Swal.fire('Éxito!', 'La terapia ha sido agregada.', 'success');
          } catch (error) {
              Swal.fire('Error!', 'No se pudo agregar la terapia.', 'error');
          }
      }
  });
}

openCorrientesPopup() {
    Swal.fire({
        title: 'Agregar Corriente',
        input: 'text',
        inputLabel: 'Nombre de la corriente',
        inputPlaceholder: 'Escribe el nombre aquí',
        showCancelButton: true,
        confirmButtonText: 'Agregar',
        cancelButtonText: 'Cancelar',
        preConfirm: (name) => {
            if (!name) {
                Swal.showValidationMessage('Por favor ingresa un nombre');
            }
            return { name: name };
        }
    }).then(async (result) => {
        if (result.isConfirmed) {
            const data = {
                name: result.value.name,
                image: '', // Optional: Add image if needed
                description: '', // Optional: Add description if needed
                status: '' // Optional: Add status if needed
            };
  
            try {
                const record = await pb.collection('psychologistsCorrientes').create(data);
                Swal.fire('Éxito!', 'La corriente ha sido agregada.', 'success');
            } catch (error) {
                Swal.fire('Error!', 'No se pudo agregar la corriente.', 'error');
            }
        }
    });
  }
  ngOnInit() {
  }
}
