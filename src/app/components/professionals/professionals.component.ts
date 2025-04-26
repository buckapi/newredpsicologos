import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { combineLatest, map, Observable } from 'rxjs';
import { GlobalService } from '../../service/global.service';
import { RealtimeProfessionalsService, Profesionals } from '../../service/realtime-professionals';
import { RealtimeRegionesService, Regiones } from '../../service/realtime-regiones';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-professionals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './professionals.component.html',
  styleUrl: './professionals.component.css'
})
export class ProfessionalsComponent {
  view: 'list' | 'grid' = 'list';
  selectedRegionId: string = '';
  searchName: string = '';
  filteredProfesionales: Observable<Profesionals[]>;
  regiones: Regiones[] = [];
  professionals: Profesionals[] = [];
  showFilters: boolean = false;

  constructor(
    public global: GlobalService,
    public realtimeProfesionales: RealtimeProfessionalsService,
    public realtimeRegiones: RealtimeRegionesService
  ) {
    // Suscripción para obtener las regiones
    this.realtimeRegiones.regiones$.subscribe(regiones => {
      this.regiones = regiones;
    });

    // Suscripción para obtener los profesionales
    this.realtimeProfesionales.profesionales$.subscribe(profesionales => {
      this.professionals = profesionales;
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
      
      return nameMatch && regionMatch;
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
}