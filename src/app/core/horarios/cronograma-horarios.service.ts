import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { HorariosPayload } from '../models/horarios-quinto.model';
import { MateriaCatalogo } from '../models/materia.model';
import { OfertaCursoHorario } from '../models/cronograma-armado.model';
import { ofertasParaMateria } from './horarios-index';

const HORARIOS_URLS = [
  '/data/horarios-primero.generated.json',
  '/data/horarios-segundo.generated.json',
  '/data/horarios-tercero.generated.json',
  '/data/horarios-cuarto.generated.json',
  '/data/horarios-quinto.generated.json',
] as const;

@Injectable({ providedIn: 'root' })
export class CronogramaHorariosService {
  private readonly http = inject(HttpClient);

  /** Payloads de todos los años (los que fallen quedan fuera del índice). */
  cargarTodosLosPayloads(): Observable<HorariosPayload[]> {
    return forkJoin(
      HORARIOS_URLS.map((url) =>
        this.http.get<HorariosPayload>(url).pipe(
          catchError(() => of(null)),
          map((x): HorariosPayload | null => x),
        ),
      ),
    ).pipe(
      map((arr) =>
        arr.filter((x): x is HorariosPayload => x !== null && !!x.cursos),
      ),
    );
  }

  ofertasParaMateria(
    payloads: readonly HorariosPayload[],
    m: MateriaCatalogo,
  ): OfertaCursoHorario[] {
    return ofertasParaMateria(payloads, m);
  }
}
