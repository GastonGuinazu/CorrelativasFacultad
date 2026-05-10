import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, CalendarClock, GraduationCap } from 'lucide-angular';
import { HorariosPayload } from '../../core/models/horarios-quinto.model';
import {
  etiquetaMatch,
  textoCrudoVisible,
} from '../../core/utils/materia-match-label';

type AnioCursado = 1 | 2 | 3 | 4 | 5;

@Component({
  selector: 'app-cursos-profes-page',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-950 pb-12">
      <header class="relative isolate overflow-hidden bg-slate-900">
        <div
          class="absolute inset-0 z-[1] bg-gradient-to-br from-slate-950/55 via-slate-900/45 to-emerald-950/50"
          aria-hidden="true"
        ></div>
        <div
          class="absolute inset-0 z-[1] bg-[radial-gradient(circle_at_20%_20%,rgba(16,185,129,0.2),transparent_55%),radial-gradient(circle_at_80%_30%,rgba(20,184,166,0.14),transparent_50%)]"
          aria-hidden="true"
        ></div>

        <nav
          class="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-5"
        >
          <div class="flex items-center gap-3">
            <span
              class="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur"
            >
              <lucide-icon [name]="iconCap" class="h-5 w-5"></lucide-icon>
            </span>
            <div class="flex flex-col leading-tight">
              <span class="text-sm font-semibold text-white">
                Ingeniería en Sistemas
              </span>
              <span class="text-xs text-white/70">UTN FRC</span>
            </div>
          </div>

          <div
            class="flex flex-wrap items-center gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10"
          >
            <a
              routerLink="/"
              class="rounded-full px-3 py-1.5 text-xs font-medium text-white/90 hover:text-white"
            >
              Planificador
            </a>
            <a
              routerLink="/mapa"
              routerLinkActive="bg-emerald-600 text-white shadow-sm"
              class="rounded-full px-3 py-1.5 text-xs font-medium text-white/90 transition hover:text-white"
            >
              Mapa
            </a>
            <a
              routerLink="/cursos-profes"
              routerLinkActive="bg-emerald-600 text-white shadow-sm"
              class="rounded-full px-3 py-1.5 text-xs font-medium text-white/90 transition hover:text-white"
            >
              Cursos y Profes
            </a>
            <a
              routerLink="/cronograma"
              routerLinkActive="bg-emerald-600 text-white shadow-sm"
              class="rounded-full px-3 py-1.5 text-xs font-medium text-white/90 transition hover:text-white"
            >
              Cronograma
            </a>
          </div>
        </nav>

        <div class="relative z-10 mx-auto max-w-7xl px-6 pb-8 pt-2 text-center">
          <span
            class="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90"
          >
            <lucide-icon [name]="iconClock" class="h-3.5 w-3.5"></lucide-icon>
            Datos de la facultad (referencia)
          </span>
          <h1
            class="text-2xl font-bold tracking-tight text-white drop-shadow sm:text-3xl"
          >
            {{ tituloAnio() }}
          </h1>
          <p class="mx-auto mt-2 max-w-2xl text-sm text-white/85">
            Elegí el año cursado y el curso para ver materias, docentes y fragmentos
            de grilla. Podés abrir el Google Sheet oficial y comparar con lo
            sincronizado acá.
          </p>

          <div
            class="mx-auto mt-6 flex max-w-4xl flex-wrap items-center justify-center gap-2"
            role="group"
            aria-label="Año cursado"
          >
            <button
              type="button"
              [class]="
                anioSeleccionado() === 1
                  ? 'rounded-full px-4 py-2 text-xs font-semibold bg-emerald-600 text-white ring-2 ring-emerald-400/50 shadow-sm transition'
                  : 'rounded-full px-4 py-2 text-xs font-medium bg-white/10 text-white/90 ring-1 ring-white/15 transition hover:bg-white/15'
              "
              (click)="elegirAnio(1)"
            >
              1.º año
            </button>
            <button
              type="button"
              [class]="
                anioSeleccionado() === 2
                  ? 'rounded-full px-4 py-2 text-xs font-semibold bg-emerald-600 text-white ring-2 ring-emerald-400/50 shadow-sm transition'
                  : 'rounded-full px-4 py-2 text-xs font-medium bg-white/10 text-white/90 ring-1 ring-white/15 transition hover:bg-white/15'
              "
              (click)="elegirAnio(2)"
            >
              2.º año
            </button>
            <button
              type="button"
              [class]="
                anioSeleccionado() === 3
                  ? 'rounded-full px-4 py-2 text-xs font-semibold bg-emerald-600 text-white ring-2 ring-emerald-400/50 shadow-sm transition'
                  : 'rounded-full px-4 py-2 text-xs font-medium bg-white/10 text-white/90 ring-1 ring-white/15 transition hover:bg-white/15'
              "
              (click)="elegirAnio(3)"
            >
              3.º año
            </button>
            <button
              type="button"
              [class]="
                anioSeleccionado() === 4
                  ? 'rounded-full px-4 py-2 text-xs font-semibold bg-emerald-600 text-white ring-2 ring-emerald-400/50 shadow-sm transition'
                  : 'rounded-full px-4 py-2 text-xs font-medium bg-white/10 text-white/90 ring-1 ring-white/15 transition hover:bg-white/15'
              "
              (click)="elegirAnio(4)"
            >
              4.º año
            </button>
            <button
              type="button"
              [class]="
                anioSeleccionado() === 5
                  ? 'rounded-full px-4 py-2 text-xs font-semibold bg-emerald-600 text-white ring-2 ring-emerald-400/50 shadow-sm transition'
                  : 'rounded-full px-4 py-2 text-xs font-medium bg-white/10 text-white/90 ring-1 ring-white/15 transition hover:bg-white/15'
              "
              (click)="elegirAnio(5)"
            >
              5.º año
            </button>
          </div>
        </div>
      </header>

      <main class="relative z-10 mx-auto max-w-7xl px-6 -mt-4">
        @if (loadError()) {
          <div
            class="rounded-2xl border border-rose-500/40 bg-rose-950/40 px-4 py-3 text-sm text-rose-100"
            role="alert"
          >
            {{ loadError() }}
          </div>
        } @else if (!payload()) {
          <div
            class="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-8 text-center text-sm text-slate-400"
          >
            Cargando horarios…
          </div>
        } @else {
          <div
            class="rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-lg shadow-black/30"
          >
            <div
              class="flex flex-col gap-4 border-b border-slate-700/80 pb-5 sm:flex-row sm:items-start sm:justify-between"
            >
              <div>
                <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Fuente
                </p>
                <p class="mt-1 text-sm text-slate-200">
                  Actualizado:
                  <span class="font-medium text-white">{{
                    fechaLegible(payload()!.fuente.extraidoEn)
                  }}</span>
                  · {{ anioSeleccionado() }}.º año
                </p>
              </div>
              <a
                class="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                [href]="payload()!.fuente.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                Abrir Google Sheet oficial
              </a>
            </div>

            @if (payload()!.cursos.length === 0) {
              <p class="mt-5 text-sm text-slate-400">
                No hay cursos en el JSON para este año. Ejecutá
                @if (anioSeleccionado() === 1) {
                  <code class="rounded bg-slate-800 px-1.5 py-0.5 text-emerald-300"
                    >npm run horarios:fetch:primero</code
                  >
                } @else if (anioSeleccionado() === 2) {
                  <code class="rounded bg-slate-800 px-1.5 py-0.5 text-emerald-300"
                    >npm run horarios:fetch:segundo</code
                  >
                } @else if (anioSeleccionado() === 3) {
                  <code class="rounded bg-slate-800 px-1.5 py-0.5 text-emerald-300"
                    >npm run horarios:fetch:tercero</code
                  >
                } @else if (anioSeleccionado() === 4) {
                  <code class="rounded bg-slate-800 px-1.5 py-0.5 text-emerald-300"
                    >npm run horarios:fetch:cuarto</code
                  >
                } @else {
                  <code class="rounded bg-slate-800 px-1.5 py-0.5 text-emerald-300"
                    >npm run horarios:fetch</code
                  >
                }
                con tu API key.
              </p>
            }

            <div class="mt-5 flex flex-wrap gap-2">
              @for (c of payload()!.cursos; track c.curso; let i = $index) {
                <button
                  type="button"
                  [class]="
                    cursoIdx() === i
                      ? 'rounded-full px-3 py-1.5 text-xs font-medium bg-emerald-600 text-white ring-2 ring-emerald-400/50 transition'
                      : 'rounded-full px-3 py-1.5 text-xs font-medium bg-slate-800 text-slate-300 transition hover:bg-slate-700'
                  "
                  (click)="cursoIdx.set(i)"
                >
                  {{ c.curso }}
                </button>
              }
            </div>

            @if (cursoActivo(); as c) {
              <section class="mt-6 space-y-6" aria-labelledby="titulo-resumen">
                @if (c.warnings?.length) {
                  <div
                    class="rounded-xl border border-amber-500/35 bg-amber-950/30 px-3 py-2 text-xs text-amber-100"
                  >
                    @for (w of c.warnings; track w) {
                      <p>{{ w }}</p>
                    }
                  </div>
                }

                <div>
                  <h2
                    id="titulo-resumen"
                    class="text-base font-semibold text-white"
                  >
                    Materias y docentes (resumen)
                  </h2>

                  <div
                    class="mt-3 overflow-x-auto rounded-xl border border-slate-700/90"
                  >
                    <table class="min-w-full divide-y divide-slate-700 text-left text-sm">
                      <thead class="bg-slate-800/80">
                        <tr>
                          <th
                            class="px-3 py-2.5 font-medium text-slate-300"
                            scope="col"
                          >
                            En el plan
                          </th>
                          <th
                            class="px-3 py-2.5 font-medium text-slate-300"
                            scope="col"
                          >
                            Docentes
                          </th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-700/80">
                        @for (
                          fila of c.resumenMateriaDocente;
                          track $index
                        ) {
                          <tr class="bg-slate-900/50 hover:bg-slate-800/40">
                            <td class="align-top px-3 py-3 text-slate-200">
                              <div class="font-medium text-white">
                                {{ etiquetaMatchFn(fila.materiaMatch, fila.materiaCrudo) }}
                              </div>
                              @if (fila.materiaCrudo && textoCrudoVisibleFn(fila.materiaCrudo, fila.materiaMatch)) {
                                <div
                                  class="mt-1 whitespace-pre-line text-xs text-slate-500"
                                >
                                  {{ fila.materiaCrudo }}
                                </div>
                              }
                            </td>
                            <td
                              class="align-top whitespace-pre-line px-3 py-3 text-slate-300"
                            >
                              {{ fila.docentesCrudo ?? '—' }}
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 class="text-base font-semibold text-white">
                    Grilla semanal (fragmentos)
                  </h3>
                  @if (c.bloques.length === 0) {
                    <p class="mt-2 text-sm text-slate-500">
                      Aún no hay bloques por día en el JSON para este curso. La
                      tabla anterior sí suele traer el resumen Materia–Docente.
                      Si necesitás la grilla horaria completa, revisá el script de
                      extracción.
                    </p>
                  } @else {
                    <ul class="mt-3 space-y-2 text-sm text-slate-300">
                      @for (b of c.bloques; track $index) {
                        <li
                          class="rounded-lg border border-slate-700 bg-slate-800/40 px-3 py-2"
                        >
                          <span class="font-medium text-white">{{ b.dia }}</span>
                          {{ b.horaInicio }}–{{ b.horaFin }}
                          —
                          {{ etiquetaMatchFn(b.materiaMatch, b.materiaCrudo) }}
                        </li>
                      }
                    </ul>
                  }
                </div>
              </section>
            }
          </div>
        }
      </main>
    </div>
  `,
})
export class CursosProfesPage {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly etiquetaMatchFn = etiquetaMatch;
  readonly textoCrudoVisibleFn = textoCrudoVisible;

  readonly iconCap = GraduationCap;
  readonly iconClock = CalendarClock;

  readonly anioSeleccionado = signal<AnioCursado>(5);
  readonly payload = signal<HorariosPayload | null>(null);
  readonly loadError = signal<string | null>(null);
  readonly cursoIdx = signal(0);

  readonly tituloAnio = computed(() => {
    const a = this.anioSeleccionado();
    return `Horarios y docentes — ${a}.º año`;
  });

  readonly cursoActivo = computed(() => {
    const p = this.payload();
    if (!p?.cursos?.length) return null;
    const i = Math.min(this.cursoIdx(), p.cursos.length - 1);
    return p.cursos[i];
  });

  constructor() {
    const q = this.route.snapshot.queryParamMap.get('anio');
    if (q === '1') this.anioSeleccionado.set(1);
    else if (q === '2') this.anioSeleccionado.set(2);
    else if (q === '3') this.anioSeleccionado.set(3);
    else if (q === '4') this.anioSeleccionado.set(4);
    else if (q === '5') this.anioSeleccionado.set(5);
    this.recargarDatos();
  }

  elegirAnio(a: AnioCursado): void {
    if (this.anioSeleccionado() === a) return;
    this.anioSeleccionado.set(a);
    this.cursoIdx.set(0);
    this.payload.set(null);
    this.loadError.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { anio: String(a) },
      replaceUrl: true,
    });
    this.recargarDatos();
  }

  private recargarDatos(): void {
    const anio = this.anioSeleccionado();
    const path =
      anio === 1
        ? '/data/horarios-primero.generated.json'
        : anio === 2
          ? '/data/horarios-segundo.generated.json'
          : anio === 3
            ? '/data/horarios-tercero.generated.json'
            : anio === 4
              ? '/data/horarios-cuarto.generated.json'
              : '/data/horarios-quinto.generated.json';
    const hintFetch =
      anio === 1
        ? 'No se pudo cargar /data/horarios-primero.generated.json. Ejecutá npm run horarios:fetch:primero o verificá que el archivo exista en public/data.'
        : anio === 2
          ? 'No se pudo cargar /data/horarios-segundo.generated.json. Ejecutá npm run horarios:fetch:segundo o verificá que el archivo exista en public/data.'
          : anio === 3
            ? 'No se pudo cargar /data/horarios-tercero.generated.json. Ejecutá npm run horarios:fetch:tercero o verificá que el archivo exista en public/data.'
            : anio === 4
              ? 'No se pudo cargar /data/horarios-cuarto.generated.json. Ejecutá npm run horarios:fetch:cuarto o verificá que el archivo exista en public/data.'
              : 'No se pudo cargar /data/horarios-quinto.generated.json. Ejecutá npm run horarios:fetch o verificá que el archivo exista en public/data.';

    this.http.get<HorariosPayload>(path).subscribe({
      next: (data) => {
        this.payload.set(data);
        this.cursoIdx.set(0);
      },
      error: () => this.loadError.set(hintFetch),
    });
  }

  fechaLegible(iso: string | null): string {
    if (!iso) return 'Sin fecha';
    try {
      return new Date(iso).toLocaleString('es-AR', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  }
}
