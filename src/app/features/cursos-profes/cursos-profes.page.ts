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
  buildWeeklyGrid,
  particionarBloquesPorCuatrimestre,
} from '../../core/horarios/cursos-profes-layout';
import { etiquetaMatch } from '../../core/utils/materia-match-label';

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
          <p class="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-white/85">
            Acá ves los horarios y docentes que publica el CET por año y por
            comisión. Elegí el año arriba y la pestaña de tu curso.
            El enlace al Google Sheet te lleva al documento oficial por si querés contrastar con la fuente.
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

            @if (vistaCursoHorarios(); as v) {
              <section class="mt-6" [attr.aria-label]="'Curso ' + v.nombreCurso">
                @if (v.warnings.length) {
                  <div
                    class="mb-6 rounded-xl border border-amber-500/35 bg-amber-950/30 px-3 py-2 text-xs text-amber-100"
                  >
                    @for (w of v.warnings; track w) {
                      <p>{{ w }}</p>
                    }
                  </div>
                }

                <div
                  class="flex flex-col gap-8 lg:flex-row lg:items-stretch lg:gap-6 xl:gap-8"
                >
                  <!-- Columna principal: solo grillas por cuatrimestre -->
                  <div class="min-w-0 flex-1 space-y-10">
                <!-- 1.er cuatrimestre -->
                <section class="space-y-4" aria-labelledby="titulo-cuat-1">
                  <h2 id="titulo-cuat-1" class="text-lg font-semibold text-white">
                    1.er cuatrimestre
                  </h2>

                  <div>
                    <h3 class="text-sm font-medium text-slate-300">Grilla horaria</h3>
                    @if (v.grid1er.filas.length === 0) {
                      <p class="mt-2 text-sm text-slate-500">
                        Sin bloques horarios en el JSON para este período.
                      </p>
                    } @else {
                      <div
                        class="mt-2 overflow-x-auto rounded-xl border border-slate-700/90"
                      >
                        <table
                          class="min-w-[480px] w-full divide-y divide-slate-700 text-left text-[10px] leading-tight sm:text-[11px]"
                        >
                          <thead class="bg-slate-800/80">
                            <tr>
                              <th
                                class="whitespace-nowrap px-1.5 py-1.5 font-medium text-slate-400 sm:px-2"
                                scope="col"
                              >
                                Horario
                              </th>
                              @for (dia of v.grid1er.dias; track dia) {
                                <th
                                  class="min-w-[6.25rem] px-1.5 py-1.5 font-medium text-slate-400 sm:px-2"
                                  scope="col"
                                >
                                  {{ dia }}
                                </th>
                              }
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-700/80">
                            @for (fila of v.grid1er.filas; track fila.etiquetaHorario) {
                              <tr class="bg-slate-900/50">
                                <th
                                  class="whitespace-nowrap px-1.5 py-1.5 align-top font-medium text-slate-300 sm:px-2"
                                  scope="row"
                                >
                                  {{ fila.etiquetaHorario }}
                                </th>
                                @for (dia of v.grid1er.dias; track dia) {
                                  <td class="align-top px-1.5 py-1.5 text-slate-300 sm:px-2">
                                    @for (b of fila.celdas[dia]; track $index) {
                                      <div class="border-b border-slate-700/50 py-0.5 last:border-0 last:pb-0">
                                        <span class="font-medium text-slate-100">{{
                                          etiquetaMatchFn(b.materiaMatch, b.materiaCrudo)
                                        }}</span>
                                      </div>
                                    }
                                  </td>
                                }
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    }
                  </div>
                </section>

                <!-- 2.do cuatrimestre -->
                <section class="space-y-4" aria-labelledby="titulo-cuat-2">
                  <h2 id="titulo-cuat-2" class="text-lg font-semibold text-white">
                    2.do cuatrimestre
                  </h2>

                  <div>
                    <h3 class="text-sm font-medium text-slate-300">Grilla horaria</h3>
                    @if (v.grid2do.filas.length === 0) {
                      <p class="mt-2 text-sm text-slate-500">
                        Sin bloques horarios en el JSON para este período.
                      </p>
                    } @else {
                      <div
                        class="mt-2 overflow-x-auto rounded-xl border border-slate-700/90"
                      >
                        <table
                          class="min-w-[480px] w-full divide-y divide-slate-700 text-left text-[10px] leading-tight sm:text-[11px]"
                        >
                          <thead class="bg-slate-800/80">
                            <tr>
                              <th
                                class="whitespace-nowrap px-1.5 py-1.5 font-medium text-slate-400 sm:px-2"
                                scope="col"
                              >
                                Horario
                              </th>
                              @for (dia of v.grid2do.dias; track dia) {
                                <th
                                  class="min-w-[6.25rem] px-1.5 py-1.5 font-medium text-slate-400 sm:px-2"
                                  scope="col"
                                >
                                  {{ dia }}
                                </th>
                              }
                            </tr>
                          </thead>
                          <tbody class="divide-y divide-slate-700/80">
                            @for (fila of v.grid2do.filas; track fila.etiquetaHorario) {
                              <tr class="bg-slate-900/50">
                                <th
                                  class="whitespace-nowrap px-1.5 py-1.5 align-top font-medium text-slate-300 sm:px-2"
                                  scope="row"
                                >
                                  {{ fila.etiquetaHorario }}
                                </th>
                                @for (dia of v.grid2do.dias; track dia) {
                                  <td class="align-top px-1.5 py-1.5 text-slate-300 sm:px-2">
                                    @for (b of fila.celdas[dia]; track $index) {
                                      <div class="border-b border-slate-700/50 py-0.5 last:border-0 last:pb-0">
                                        <span class="font-medium text-slate-100">{{
                                          etiquetaMatchFn(b.materiaMatch, b.materiaCrudo)
                                        }}</span>
                                      </div>
                                    }
                                  </td>
                                }
                              </tr>
                            }
                          </tbody>
                        </table>
                      </div>
                    }
                  </div>
                </section>

                @if (v.tieneSinTag) {
                  <section class="space-y-4 rounded-xl border border-amber-500/25 bg-amber-950/15 p-4" aria-labelledby="titulo-sin-cuat">
                    <h2 id="titulo-sin-cuat" class="text-base font-semibold text-amber-100">
                      Bloques sin cuatrimestre en el JSON
                    </h2>
                    <p class="text-xs text-amber-100/90">
                      Estos horarios no tienen etiqueta 1.er / 2.do en los datos extraídos.
                      Revisá la planilla o el script ETL si deberían estar clasificados.
                    </p>
                    <div class="overflow-x-auto rounded-xl border border-slate-700/90">
                      <table
                        class="min-w-[480px] w-full divide-y divide-slate-700 text-left text-[10px] leading-tight sm:text-[11px]"
                      >
                        <thead class="bg-slate-800/80">
                          <tr>
                            <th class="whitespace-nowrap px-1.5 py-1.5 font-medium text-slate-400 sm:px-2" scope="col">
                              Horario
                            </th>
                            @for (dia of v.gridSinTag.dias; track dia) {
                              <th class="min-w-[6.25rem] px-1.5 py-1.5 font-medium text-slate-400 sm:px-2" scope="col">
                                {{ dia }}
                              </th>
                            }
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-700/80">
                          @for (fila of v.gridSinTag.filas; track fila.etiquetaHorario) {
                            <tr class="bg-slate-900/50">
                              <th class="whitespace-nowrap px-1.5 py-1.5 align-top font-medium text-slate-300 sm:px-2" scope="row">
                                {{ fila.etiquetaHorario }}
                              </th>
                              @for (dia of v.gridSinTag.dias; track dia) {
                                <td class="align-top px-1.5 py-1.5 text-slate-300 sm:px-2">
                                  @for (b of fila.celdas[dia]; track $index) {
                                    <span class="font-medium text-slate-100">{{
                                      etiquetaMatchFn(b.materiaMatch, b.materiaCrudo)
                                    }}</span>
                                  }
                                </td>
                              }
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </section>
                }
                  </div>

                  <!-- Panel lateral: misma altura que la columna principal para que sticky funcione al bajar al 2.do cuatrimestre -->
                  <aside
                    class="flex w-full shrink-0 flex-col lg:w-[min(100%,15.5rem)] xl:w-[17rem]"
                    aria-label="Materias y docentes del curso"
                  >
                    <div
                      class="flex min-h-0 flex-1 flex-col lg:min-h-full"
                    >
                      <div
                        class="rounded-xl border border-slate-700/90 bg-slate-900/95 shadow-lg shadow-black/20 ring-1 ring-white/5 lg:sticky lg:top-4 lg:z-[5] lg:max-h-[min(85vh,calc(100dvh-3rem))] lg:overflow-y-auto"
                      >
                      <div
                        class="sticky top-0 z-[1] border-b border-slate-700/80 bg-slate-900/98 px-2 py-1.5 backdrop-blur-sm lg:static lg:bg-transparent lg:backdrop-blur-none"
                      >
                        <p class="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                          Materias y docentes
                        </p>
                        <p class="mt-0.5 text-[8px] leading-tight text-slate-500">
                          Misma tabla para ambos cuatrimestres.
                        </p>
                      </div>
                      @if (v.resumenCompleto.length === 0) {
                        <p class="px-2 py-3 text-[10px] text-slate-500">
                          Sin filas de resumen en el JSON para este curso.
                        </p>
                      } @else {
                        <div class="px-0.5 pb-1.5">
                          <table
                            class="table-fixed w-full divide-y divide-slate-700/90 text-left text-[9px] leading-tight sm:text-[10px]"
                          >
                            <colgroup>
                              <col class="w-[40%]" />
                              <col class="w-[60%]" />
                            </colgroup>
                            <thead class="bg-slate-800/60">
                              <tr>
                                <th
                                  class="px-1 py-1 font-medium text-slate-400"
                                  scope="col"
                                >
                                  Materia
                                </th>
                                <th
                                  class="px-1 py-1 font-medium text-slate-400"
                                  scope="col"
                                >
                                  Docentes
                                </th>
                              </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-700/70">
                              @for (fila of v.resumenCompleto; track $index) {
                                <tr class="bg-slate-900/40 hover:bg-slate-800/50">
                                  <td class="min-w-0 align-middle px-1 py-1 text-slate-200">
                                    <div
                                      class="line-clamp-2 break-words font-medium leading-tight text-slate-100"
                                      [title]="
                                        etiquetaMatchFn(fila.materiaMatch, fila.materiaCrudo)
                                      "
                                    >
                                      {{
                                        etiquetaMatchFn(fila.materiaMatch, fila.materiaCrudo)
                                      }}
                                    </div>
                                  </td>
                                  <td class="min-w-0 align-middle px-1 py-1 text-slate-400">
                                    <div class="flex flex-col gap-px">
                                      @for (
                                        nombre of docentesPorLinea(fila.docentesCrudo);
                                        track $index
                                      ) {
                                        <div class="whitespace-nowrap leading-tight">
                                          {{ nombre }}
                                        </div>
                                      }
                                    </div>
                                  </td>
                                </tr>
                              }
                            </tbody>
                          </table>
                        </div>
                      }
                      </div>
                    </div>
                  </aside>
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

  readonly vistaCursoHorarios = computed(() => {
    const p = this.payload();
    if (!p?.cursos?.length) return null;
    const i = Math.min(this.cursoIdx(), p.cursos.length - 1);
    const c = p.cursos[i];
    const part = particionarBloquesPorCuatrimestre(c.bloques);
    return {
      nombreCurso: c.curso,
      warnings: c.warnings ?? [],
      grid1er: buildWeeklyGrid(part.primer),
      grid2do: buildWeeklyGrid(part.segundo),
      gridSinTag: buildWeeklyGrid(part.sinCuatrimestre),
      tieneSinTag: part.sinCuatrimestre.length > 0,
      resumenCompleto: c.resumenMateriaDocente ?? [],
    };
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

  /**
   * Lista de docentes: uno por renglón visual; cada ítem sin partir en dos renglones (`whitespace-nowrap` en template).
   * Separa por saltos de línea del sheet, punto medio (·), `;` o barra con espacios.
   */
  docentesPorLinea(raw: string | null): string[] {
    if (!raw?.trim()) return ['—'];
    let s = raw.replace(/\r\n/g, '\n').trim();
    s = s.replace(/\s*·\s*/g, '\n');
    s = s.replace(/\s*;\s*/g, '\n');
    s = s.replace(/\s+\/\s+/g, '\n');
    const parts = s
      .split(/\n/)
      .map((x) => x.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    return parts.length ? parts : ['—'];
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
