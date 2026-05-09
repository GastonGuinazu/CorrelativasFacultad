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
  { path: '**', redirectTo: '' },
];
