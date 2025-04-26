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
@Component({
  selector: 'app-professionals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule, MatSelectModule, MatFormFieldModule],
  templateUrl: './professionals.component.html',
  styleUrl: './professionals.component.css'
})
export class ProfessionalsComponent {
  view: 'list' | 'grid' = 'list';
  selectedRegionId: string = '';
  selectedCorrienteId: string = '';
  searchName: string = '';
  filteredProfesionales: Observable<Profesionals[]>;
  regiones: Regiones[] = [];
  professionals: Profesionals[] = [];
  corrientes: Corrientes[] = [];
  showFilters: boolean = false;
  currentPage: number = 1;
  pageSize: number = 50;
  
  constructor(
    public global: GlobalService,
    public realtimeProfesionales: RealtimeProfessionalsService,
    public realtimeRegiones: RealtimeRegionesService,
    public realtimeCorrientes: RealtimeCorrientesService
  ) {
    // Suscripción para obtener las regiones
    this.realtimeRegiones.regiones$.subscribe(regiones => {
      this.regiones = regiones;
    });

    // Suscripción para obtener los profesionales
    this.realtimeProfesionales.profesionales$.subscribe(profesionales => {
      this.professionals = profesionales;
    });

    // Suscripción para obtener las corrientes
    this.realtimeCorrientes.corrientes$.subscribe(corrientes => {
      this.corrientes = corrientes;
    });

    // Configuración del filtrado combinado
    this.filteredProfesionales = combineLatest([
      this.realtimeProfesionales.profesionales$,
      this.realtimeRegiones.regiones$
    ]).pipe(
      map(([profesionales, regiones]) => {
        return this.applyFiltersToProfesionales(profesionales, regiones);
      })
    );
  }
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  private applyFiltersToProfesionales(professionals: Profesionals[], regiones: Regiones[]): Profesionals[] {
    return professionals.filter(professional => {
      // Filtro por nombre
      const nameMatch = !this.searchName || 
        professional.name.toLowerCase().includes(this.searchName.toLowerCase());
      
      // Filtro por región
      let regionMatch = true;
      if (this.selectedRegionId && regiones) {
        const region = regiones.find(r => r.id === this.selectedRegionId);
        regionMatch = !!region && !!professional.regions && 
          professional.regions.some((r: any) => r.id === region?.id);
      }
      
      // Filtro por corriente
      let corrienteMatch = true;
      if (this.selectedCorrienteId && this.corrientes) {
        const corriente = this.corrientes.find(c => c.id === this.selectedCorrienteId);
        corrienteMatch = !!corriente && !!professional.corriente && 
          professional.corriente.some((c: any) => c.id === corriente?.id);
      }
      
      return nameMatch && regionMatch && corrienteMatch;
    });
  }

  onRegionChange(event: any): void {
    this.selectedRegionId = event.target.value;
    this.applyFilters();
  }

  onNameChange(event: any): void {
    this.searchName = event.target.value;
    this.applyFilters();
  }

  onCorrienteChange(event: any): void {
    this.selectedCorrienteId = event.target.value;
    this.applyFilters();
  }

  applyFilters(): void {
    this.filteredProfesionales = combineLatest([
      this.realtimeProfesionales.profesionales$,
     
      this.realtimeRegiones.regiones$
    ]).pipe(
      map(([professionals, regiones]) => {
        return this.applyFiltersToProfesionales(professionals, regiones);
      })
    );
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
    this.filteredProfesionales?.subscribe(data => value = data).unsubscribe();
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