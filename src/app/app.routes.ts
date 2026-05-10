import { Routes } from '@angular/router';
import { CorrelatividadesMapPage } from './features/correlatividades-map/correlatividades-map.page';
import { PlannerPage } from './features/planner/planner.page';

export const routes: Routes = [
  {
    path: '',
    component: PlannerPage,
  },
  {
    path: 'mapa',
    component: CorrelatividadesMapPage,
  },
  {
    path: 'cursos-profes',
    loadComponent: () =>
      import('./features/cursos-profes/cursos-profes.page').then(
        (m) => m.CursosProfesPage,
      ),
  },
  {
    path: 'cronograma',
    loadComponent: () =>
      import('./features/cronograma-armado/cronograma-armado.page').then(
        (m) => m.CronogramaArmadoPage,
      ),
  },
  { path: 'horarios', redirectTo: 'cursos-profes', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
