import { Component } from '@angular/core';
import { GlobalService } from '../../../service/global.service';
import { AuthPocketbaseService } from '../../../service/auth-pocketbase.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { RealtimeProfessionalsService } from '../../../service/realtime-professionals';
import { RealtimeRatingsService } from '../../../service/realtime-ratings.service';
import { PsychologistRatingService } from '../../../service/psychologistRatingService.service';
import PocketBase from 'pocketbase';
@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reviews.component.html',
  styleUrl: './reviews.component.css'
})
export class ReviewsComponent {
  pb: PocketBase;
  isProfessional: boolean = false;
  isAdmin: boolean = false;
  ratings: any[] = [];
  professionals: any[] = [];
  professionalMap: { [key: string]: string } = {};
  filteredRatings: any[] = [];
  constructor(
    public global: GlobalService,
    public authService: AuthPocketbaseService,
    public realtimeProfesionales: RealtimeProfessionalsService,
    public realtimeRatings: RealtimeRatingsService,
    public ratingService: PsychologistRatingService)
  {
    this.global.professionalInfo = this.global.professionalInfo || {};
    this.pb = new PocketBase('https://db.redpsicologos.cl:8090');
    // Suscribirse a los profesionales para obtener sus nombres
    this.realtimeProfesionales.profesionales$.subscribe(profesionales => {
      this.professionals = profesionales;
    });
    // Suscribirse a las calificaciones
    this.realtimeRatings.ratings$.subscribe(ratings => {
      this.ratings = ratings;
      this.updateFilteredRatings();
    });
   }

   ngOnInit(): void {
    this.isProfessional = this.authService.getType() === 'professional';
    this.isAdmin = this.authService.getType() === 'admin';
    
    // Actualizar la lista de calificaciones
    this.realtimeRatings.updateRatingsList();
  }
  getProfessionalNameById(id: string): string {
    const professional = this.professionals.find(p => p.id === id);
    return professional ? professional.name : 'Profesional no encontrado';
  }
  /* getProfessionalNameById(id: string): string {
    const professional = this.professionals.find(p => p.id === id);
    return professional ? `${professional.name} ${professional.lastName}` : 'Usuario Anónimo';
  } */
  getStatusText(rating: any): string {
    if (!rating.status) return 'Pendiente';
    return rating.status.charAt(0).toUpperCase() + rating.status.slice(1);
  }
  getStarArray(count: number): number[] {
    return Array(count).fill(0).map((x, i) => i);
  }
  hasSelectedItems(obj: any): boolean {
    if (!obj) return false;
    return Object.values(obj).some(val => val === true);
  }
   // Método para normalizar el score
   getNormalizedScore(score: number): number {
    if (!score) return 0;
    return Math.min(Math.max(0, score), 5); // Limitar entre 0 y 5
  }


  // Método para obtener el número de estrellas completas
  getFilledStars(score: number): number {
    return Math.floor(this.getNormalizedScore(score));
  }

  // Método para obtener el número de estrellas vacías
  getEmptyStars(score: number): number {
    return 5 - this.getFilledStars(score);
  }
  
  getSelectedItems(obj: any): string[] {
    if (!obj) return [];
    return Object.keys(obj).filter(key => obj[key]);
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
  async approveReview(rating: any) {
    try {
      await this.ratingService.updateReviewStatus(rating.id, 'approved');
    } catch (error) {
      console.error('Error approving review:', error);
    }
  }

  async rejectReview(rating: any) {
    try {
      await this.ratingService.updateReviewStatus(rating.id, 'rejected');
    } catch (error) {
      console.error('Error rejecting review:', error);
    }
  }

  async deleteRating(id: string) {
    try {
        const result = await Swal.fire({
            title: '¿Estás seguro?',
            text: "No podrás revertir esta acción. ¿Deseas eliminar esta reseña?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'No, cancelar'
        });

        if (result.isConfirmed) {
            await this.pb.collection('psychologistsRatings').delete(id);
            this.realtimeRatings.updateRatingsList();
            
            Swal.fire(
                'Eliminado!',
                'La reseña ha sido eliminada con éxito.',
                'success'
            );
        }
    } catch (error) {
        console.error('Error deleting rating:', error);
        Swal.fire(
            'Error',
            'Ha ocurrido un error al eliminar la reseña. Por favor, intenta nuevamente.',
            'error'
        );
    }
}
getStars(rating: number): number[] {
  return Array(rating).fill(0);
}
updateFilteredRatings() {
  if (this.global.professionalInfo?.id) {
    this.filteredRatings = this.ratings.filter(rating => 
      rating.idSpecialist === this.global.professionalInfo.id
    );
  }
}
}
