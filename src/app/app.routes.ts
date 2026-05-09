import { Routes } from '@angular/router';
import { PlannerPage } from './features/planner/planner.page';

export const routes: Routes = [
  {
    path: '',
    component: PlannerPage,
  },
  { path: '**', redirectTo: '' },
];
