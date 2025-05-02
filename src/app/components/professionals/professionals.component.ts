import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, map, Observable } from 'rxjs';
import { GlobalService } from '../../service/global.service';
import { RealtimeProfessionalsService, Profesionals } from '../../service/realtime-professionals';
import { RealtimeRegionesService, Regiones } from '../../service/realtime-regiones';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Corrientes, RealtimeCorrientesService } from '../../service/realtime-corrientes.service';
import { MatIconModule } from '@angular/material/icon';
import { RealtimeTratamientosService } from '../../service/realtime-tratamientos.service';
import { RealtimeEspecialidadesService } from '../../service/realtime-especialidades.service';
@Component({
  selector: 'app-professionals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './professionals.component.html',
  styleUrl: './professionals.component.css'
})
export class ProfessionalsComponent {
  /* view: 'list' | 'grid' = 'list';
  selectedRegionId: string = '';
  selectedCorrienteId: string = '';
  searchName: string = '';
  filteredProfesionales: Observable<Profesionals[]>;
  selectedTargets: any[] = [];
  selectedTratamientos: any[] = [];
  selectedEspecialidades: any[] = [];
  tratamientos: any[] = [];
  especialidades: any[] = [];
  regiones: Regiones[] = [];
  professionals: Profesionals[] = [];
  corrientes: Corrientes[] = [];
  showFilters: boolean = false;
  currentPage: number = 1;
  pageSize: number = 50; */
  view: 'list' | 'grid' = 'list';
  selectedRegionId: string = '';
  selectedCorrienteId: string = '';
  searchName: string = '';
  selectedTratamientos: string = '';
  selectedEspecialidades: string = '';
  searchTerm: string = '';
  tratamientos: any[] = [];
  especialidades: any[] = [];
  regiones: Regiones[] = [];
  professionals: Profesionals[] = [];
  corrientes: Corrientes[] = [];
  
  showFilters: boolean = false;
  currentPage: number = 1;
  pageSize: number = 50;
  
  filteredProfesionales$: Observable<Profesionals[]>;
  
  constructor(
    public global: GlobalService,
    public realtimeProfesionales: RealtimeProfessionalsService,
    public realtimeRegiones: RealtimeRegionesService,
    public realtimeCorrientes: RealtimeCorrientesService,
    public realtimeTratamientos: RealtimeTratamientosService,
    public realtimeEspecialidades: RealtimeEspecialidadesService
  ) {
   // Cargar datos iniciales
   this.realtimeRegiones.regiones$.subscribe(regiones => this.regiones = regiones);
   this.realtimeTratamientos.tratamientos$.subscribe(tratamientos => this.tratamientos = tratamientos);
   this.realtimeProfesionales.profesionales$.subscribe(profesionales => this.professionals = profesionales);
   this.realtimeCorrientes.corrientes$.subscribe(corrientes => this.corrientes = corrientes);
   this.realtimeEspecialidades.especialidades$.subscribe(especialidades => this.especialidades = especialidades);

   // Configurar filtrado combinado
   this.filteredProfesionales$ = combineLatest([
     this.realtimeProfesionales.profesionales$,
     this.realtimeRegiones.regiones$,
     this.realtimeTratamientos.tratamientos$,
     this.realtimeEspecialidades.especialidades$,
     this.realtimeCorrientes.corrientes$
   ]).pipe(
    map(([professionals, regiones, tratamientos, especialidades, corrientes]) => {
      return this.applyFilters(
        professionals, 
        this.selectedRegionId,
        this.selectedCorrienteId,
        this.searchTerm, // Usamos searchTerm en lugar de searchName
        this.selectedTratamientos,
        this.selectedEspecialidades,
        tratamientos,
        especialidades,
        corrientes
      );
    })
  );
 }
 public applyFilters(
  professionals: Profesionals[],
  regionId: string,
  corrienteId: string,
  searchTerm: string,
  tratamientoId: string,
  especialidadId: string,
  tratamientosList: any[],
  especialidadesList: any[],
  corrientesList: any[]
): Profesionals[] {
  return professionals.filter(professional => {
    // Filtro por término de búsqueda (busca en nombre, tratamiento, especialidad y corriente)
    const searchTermMatch = !searchTerm || 
      this.checkProfessionalMatchesSearchTerm(
        professional, 
        searchTerm, 
        tratamientosList, 
        especialidadesList, 
        corrientesList
      );


    // Filtro por región
    const regionMatch = !regionId || 
      (professional.regions && professional.regions.some((r: any) => r.id === regionId));
      
      const corrienteMatch = !corrienteId || 
        (professional.corriente && professional.corriente.some((c: any) => c.id === corrienteId));
      
      const tratamientoMatch = !tratamientoId || 
        (professional.typeTreatment && professional.typeTreatment.some((t: any) => t.id === tratamientoId));
      
      const especialidadMatch = !especialidadId || 
        (professional.typeEspeciality && professional.typeEspeciality.some((e: any) => e.id === especialidadId));
      
      return searchTermMatch && regionMatch && corrienteMatch && tratamientoMatch && especialidadMatch;
    });
  }
    // Método para verificar si el profesional coincide con el término de búsqueda
  private checkProfessionalMatchesSearchTerm(
    professional: Profesionals,
    searchTerm: string,
    tratamientosList: any[],
    especialidadesList: any[],
    corrientesList: any[]
  ): boolean {
    const term = searchTerm.toLowerCase();
    
    // Buscar en nombre
    if (professional.name?.toLowerCase().includes(term)) {
      return true;
    }
    
    // Buscar en tratamientos
    if (professional.typeTreatment) {
      const tratamientoNames = professional.typeTreatment
        .map(t => {
          const tratamiento = tratamientosList.find(tr => tr.id === t.id);
          return tratamiento?.name?.toLowerCase();
        })
        .filter(name => name?.includes(term));
      
      if (tratamientoNames.length > 0) return true;
    }
    
    // Buscar en especialidades
    if (professional.typeEspeciality) {
      const especialidadNames = professional.typeEspeciality
        .map(e => {
          const especialidad = especialidadesList.find(es => es.id === e.id);
          return especialidad?.name?.toLowerCase();
        })
        .filter(name => name?.includes(term));
      
      if (especialidadNames.length > 0) return true;
    }
    
    // Buscar en corrientes
    if (professional.corriente) {
      const corrienteNames = professional.corriente
        .map(c => {
          const corriente = corrientesList.find(co => co.id === c.id);
          return corriente?.name?.toLowerCase();
        })
        .filter(name => name?.includes(term));
      
      if (corrienteNames.length > 0) return true;
    }
    
    return false;
  }

  // Modificamos onNameChange para usar searchTerm
  onSearchTermChange(event: any): void {
    this.searchTerm = event.target.value;
    this.applyFilters(  
      this.professionals, 
      this.selectedRegionId, 
      this.selectedCorrienteId, 
      this.searchTerm, 
      this.selectedTratamientos, 
      this.selectedEspecialidades,
      this.tratamientos,
      this.especialidades,
      this.corrientes
    );
  }


// Métodos para manejar cambios en los filtros
onRegionChange(event: any): void {
  this.selectedRegionId = event.value;
  this.applyFilters(  this.professionals, this.selectedRegionId, this.selectedCorrienteId, this.searchName, this.selectedTratamientos, this.selectedEspecialidades, this.tratamientos, this.especialidades, this.corrientes   );
}

onNameChange(event: any): void {
  this.searchName = event.target.value;
  this.applyFilters(this.professionals, this.selectedRegionId, this.selectedCorrienteId, this.searchName, this.selectedTratamientos, this.selectedEspecialidades, this.tratamientos, this.especialidades, this.corrientes);
}

onCorrienteChange(event: any): void {
  this.selectedCorrienteId = event.value;
  this.applyFilters(this.professionals, this.selectedRegionId, this.selectedCorrienteId, this.searchName, this.selectedTratamientos, this.selectedEspecialidades, this.tratamientos, this.especialidades, this.corrientes);
}

onTratamientoChange(event: any): void {
  this.selectedTratamientos = event.value;
  this.applyFilters(this.professionals, this.selectedRegionId, this.selectedCorrienteId, this.searchName, this.selectedTratamientos, this.selectedEspecialidades, this.tratamientos, this.especialidades, this.corrientes);
}

onEspecialidadChange(event: any): void {
  this.selectedEspecialidades = event.value;
  this.applyFilters(this.professionals, this.selectedRegionId, this.selectedCorrienteId, this.searchName, this.selectedTratamientos, this.selectedEspecialidades, this.tratamientos, this.especialidades, this.corrientes);
}


toggleFilters(): void {
  this.showFilters = !this.showFilters;
}


  getFormattedTargets(targets: {
    'niños y niñas'?: boolean;
    adultos?: boolean;
    'jóvenes y adolecentes'?: boolean;
    'adultos mayores'?: boolean;
    todos?: boolean;
  }): string {
    const activeTargets = [];
    
    if (targets?.['niños y niñas']) activeTargets.push('Niños y niñas');
    if (targets?.adultos) activeTargets.push('Adultos');
    if (targets?.['jóvenes y adolecentes']) activeTargets.push('Jóvenes y adolescentes');
    if (targets?.['adultos mayores']) activeTargets.push('Adultos mayores');
    if (targets?.todos) activeTargets.push('Todos los públicos');
    
    return activeTargets.join(', ') || 'No especificado';
  }
  get totalPages(): number {
    return Math.ceil((this.filteredProfesionalesValue?.length || 0) / this.pageSize);
  }
  
  // Para acceder al valor del observable (si filteredProfesionales es un observable)
  get filteredProfesionalesValue() {
    let value: any[] = [];
    this.filteredProfesionales$?.subscribe(data => value = data).unsubscribe();
    return value;
  }
  
  get paginatedProfesionales(): any[] {
    const profesionales = this.filteredProfesionalesValue || [];
    const start = (this.currentPage - 1) * this.pageSize;
    return profesionales.slice(start, start + this.pageSize);
  }
  
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  get startResult(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }
  
  get endResult(): number {
    // Usa el array paginado para contar los resultados mostrados realmente
    return Math.min(this.currentPage * this.pageSize, this.filteredProfesionalesValue.length);
  }
  
  get totalResults(): number {
    return this.filteredProfesionalesValue.length;
  }
}