import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import PocketBase from 'pocketbase';
import Swal from 'sweetalert2';
import { GlobalService } from '../../../service/global.service';
import { RealtimeEspecialidadesService } from '../../../service/realtime-especialidades.service';
import { RealtimeTerapiaService } from '../../../service/realtime-terapia.service';
import { RealtimeTratamientosService } from '../../../service/realtime-tratamientos.service';
import { RealtimeCorrientesService } from '../../../service/realtime-corrientes.service';
import { RealtimePlanesService } from '../../../service/realtime-planes.service';

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
    public realtimeCorrientes: RealtimeCorrientesService,
    public realtimePlanes: RealtimePlanesService

  ) { }
  ngOnInit() {
    this.getAllPlanes();
  }
  getAllPlanes() {
    this.realtimePlanes.getAllPlanes();
  }
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
  
  async deleteTreatment(id: string) {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas eliminar este tratamiento?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
  
    if (result.isConfirmed) {
      try {
        await pb.collection('psychologistsTreatments').delete(id);
        Swal.fire('Éxito!', 'El tratamiento ha sido eliminado.', 'success');
      } catch (error) {
        Swal.fire('Error!', 'No se pudo eliminar el tratamiento.', 'error');
      }
    }
  } 
  async deleteSpecialty(id: string) {
    const result = await Swal.fire({    
      title: '¿Estás seguro?',
      text: '¿Deseas eliminar esta especialidad?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
  
    if (result.isConfirmed) {
      try {
        await pb.collection('psychologistsSpecialties').delete(id);
        Swal.fire('Éxito!', 'La especialidad ha sido eliminada.', 'success');
      } catch (error) {
        Swal.fire('Error!', 'No se pudo eliminar la especialidad.', 'error');
      }
    }
  } 
  async deleteTherapy(id: string) {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas eliminar esta terapia?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
  
    if (result.isConfirmed) {
      try {
        await pb.collection('psychologistsTerapy').delete(id);
        Swal.fire('Éxito!', 'La terapia ha sido eliminada.', 'success');
      } catch (error) {
        Swal.fire('Error!', 'No se pudo eliminar la terapia.', 'error');
      }
    }
  }
  async deleteCorriente(id: string) {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas eliminar esta corriente?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
  
    if (result.isConfirmed) {
      try {
        await pb.collection('psychologistsCorrientes').delete(id);
        Swal.fire('Éxito!', 'La corriente ha sido eliminada.', 'success');
      } catch (error) {
        Swal.fire('Error!', 'No se pudo eliminar la corriente.', 'error');
      }
    }
  }
  openPlanPopup() {
    Swal.fire({
      title: 'Agregar Plan',
      html:
        '<input id="swal-input-name" class="swal2-input" placeholder="Nombre del plan">' +
        '<input id="swal-input-price" type="number" min="0" class="swal2-input" placeholder="Precio">' +
        '<textarea id="swal-input-description" class="swal2-textarea" placeholder="Descripción"></textarea>',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Agregar',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        const name = (document.getElementById('swal-input-name') as HTMLInputElement).value;
        const price = (document.getElementById('swal-input-price') as HTMLInputElement).value;
        const description = (document.getElementById('swal-input-description') as HTMLTextAreaElement).value;
  
        if (!name || !price) {
          Swal.showValidationMessage('Por favor ingresa nombre y precio');
          return;
        }
        return { name, price, description };
      }
    }).then(async (result) => {
      if (result.isConfirmed) {
        const data = {
          name: result.value.name,
          price: result.value.price,
          description: result.value.description
        };
  
        try {
          await pb.collection('psychologistsPlanes').create(data);
          Swal.fire('Éxito!', 'El plan ha sido agregado.', 'success');
        } catch (error) {
          Swal.fire('Error!', 'No se pudo agregar el plan.', 'error');
        }
      }
    });
  }
  async deletePlan(id: string) {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: '¿Deseas eliminar este plan?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });
  
    if (result.isConfirmed) {
      try {
        await pb.collection('psychologistsPlanes').delete(id);
        Swal.fire('Éxito!', 'El plan ha sido eliminado.', 'success');
      } catch (error) {
        Swal.fire('Error!', 'No se pudo eliminar el plan.', 'error');
      }
    }
  }
}
