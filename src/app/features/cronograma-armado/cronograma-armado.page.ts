import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideAngularModule,
  CalendarClock,
  GraduationCap,
  Info,
  X,
} from 'lucide-angular';
import { ProgressStore } from '../../core/state/progress.store';
import { CronogramaHorariosService } from '../../core/horarios/cronograma-horarios.service';
import { HorarioBloque, HorariosPayload } from '../../core/models/horarios-quinto.model';
import {
  CronogramaSeleccion,
  OfertaCursoHorario,
} from '../../core/models/cronograma-armado.model';
import { EvaluacionMateria, MateriaId } from '../../core/models/materia.model';
import {
  GRILLA_FIN_MIN,
  GRILLA_INICIO_MIN,
  haySolapeEntreSelecciones,
} from '../../core/rules/cronograma-overlap';
import { ofertasParaMateria } from '../../core/horarios/horarios-index';
import {
  formatHoraMinutosMedianoche,
  fusionarIntervalosHorarioPorDia,
  resumenHorarioBloques,
} from '../../core/utils/cronograma-resumen-horario';

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'] as const;

const COLORES_SELECCION = [
  'bg-emerald-600/90 border border-emerald-400/50',
  'bg-sky-600/90 border border-sky-400/50',
  'bg-violet-600/90 border border-violet-400/50',
  'bg-amber-600/90 border border-amber-400/50',
  'bg-rose-600/90 border border-rose-400/50',
  'bg-teal-600/90 border border-teal-400/50',
];

/** Vista previa al hover: semitransparente; si hay solape con selección → bordeaux */
const CLASE_PREVIEW_OK =
  'bg-cyan-500/35 border border-cyan-300/50 shadow-sm backdrop-blur-[1px]';
const CLASE_PREVIEW_SOLAPE =
  'bg-[#6b1c2a]/55 border border-rose-400/55 shadow-sm backdrop-blur-[1px]';

type FiltroCuatrimestre = '1er' | '2do';

@Component({
  selector: 'app-cronograma-armado-page',
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
            Armado semanal
          </span>
          <h1 class="text-2xl font-bold tracking-tight text-white drop-shadow sm:text-3xl">
            Cronograma de cursada
          </h1>
          <p class="mx-auto mt-2 max-w-2xl text-sm text-white/85">
            Elegí el cuatrimestre, luego materias y comisión. La grilla se mantiene visible al
            hacer scroll en pantallas anchas.
          </p>
        </div>
      </header>

      <main class="mx-auto max-w-7xl px-6 pt-8">
        @if (!payloads().length) {
          <p class="text-sm text-slate-400">Cargando horarios…</p>
        } @else {
          <div
            class="mb-6 flex flex-col gap-3 rounded-2xl border border-slate-700 bg-slate-900/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div class="flex gap-3">
              <span
                class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300"
              >
                <lucide-icon [name]="iconInfo" class="h-4 w-4"></lucide-icon>
              </span>
              <div class="min-w-0 text-sm text-slate-300">
                <p class="font-medium text-slate-100">Tu lista depende del planificador</p>
                <p class="mt-1 text-xs leading-snug text-slate-400">
                  Solo ves materias que el motor marca como disponibles según correlativas y tu estado
                  (pendiente, cursando, regular, aprobada). Si no coincide con tu situación real,
                  actualizá el progreso en el planificador.
                </p>
              </div>
            </div>
            <a
              routerLink="/"
              class="inline-flex shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
            >
              Ir al planificador
            </a>
          </div>

          <div
            class="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3"
          >
            <span class="text-xs font-medium text-slate-400">Cuatrimestre:</span>
            @for (f of filtrosCuatri; track f.id) {
              <button
                type="button"
                class="rounded-full px-3 py-1.5 text-xs font-medium transition"
                [class.bg-emerald-600]="cuatrimestreFiltro() === f.id"
                [class.text-white]="cuatrimestreFiltro() === f.id"
                [class.bg-slate-800]="cuatrimestreFiltro() !== f.id"
                [class.text-slate-300]="cuatrimestreFiltro() !== f.id"
                (click)="elegirCuatrimestre(f.id)"
              >
                {{ f.label }}
              </button>
            }
          </div>

          @if (avisoFiltro()) {
            <p class="mb-4 text-sm text-amber-200/95">{{ avisoFiltro() }}</p>
          }

          <div class="flex flex-col gap-8 lg:flex-row lg:items-start">
            <div class="lg:w-80 lg:shrink-0 space-y-4">
              <div class="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                <h2 class="text-sm font-semibold text-white">Materias disponibles</h2>
                <p class="mt-1 text-xs text-slate-500">
                  Materias pendientes con al menos una comisión en el cuatrimestre elegido (datos JSON).
                </p>
                @if (!disponiblesFiltrados().length) {
                  <p class="mt-3 text-sm text-slate-500">
                    No hay materias con ese cuatrimestre en los datos cargados.
                  </p>
                } @else {
                  <ul class="mt-3 space-y-1 text-sm">
                    @for (ev of disponiblesFiltrados(); track ev.materia.id) {
                      <li>
                        <button
                          type="button"
                          class="w-full rounded-lg px-2 py-1.5 text-left text-slate-200 transition hover:bg-slate-800"
                          [class.ring-2]="materiaExploradaId() === ev.materia.id"
                          [class.ring-emerald-500]="materiaExploradaId() === ev.materia.id"
                          (click)="explorarMateria(ev)"
                        >
                          <span class="font-medium text-white">{{ ev.materia.nombre }}</span>
                          <span class="block text-xs text-slate-500"
                            >Nivel {{ ev.materia.nivel }}</span
                          >
                        </button>
                      </li>
                    }
                  </ul>
                }
              </div>

              @if (materiaExplorada(); as ex) {
                <div class="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                  <div class="flex items-start justify-between gap-2">
                    <h3 class="text-sm font-semibold text-white">Comisiones</h3>
                    <button
                      type="button"
                      class="text-slate-500 hover:text-white"
                      (click)="cerrarExplorada()"
                      aria-label="Cerrar"
                    >
                      <lucide-icon [name]="iconX" class="h-4 w-4"></lucide-icon>
                    </button>
                  </div>
                  <p class="mt-1 text-xs text-slate-500">{{ ex.materia.nombre }}</p>
                  @if (!ofertasExploradasFiltradas().length) {
                    <p class="mt-2 text-sm text-amber-200/90">
                      @if (!ofertasExploradas().length) {
                        No hay datos de esta materia en los JSON de horarios.
                      } @else {
                        Sin horarios para este cuatrimestre en ninguna comisión.
                      }
                    </p>
                  } @else {
                    <ul class="mt-3 space-y-2 text-sm">
                      @for (o of ofertasExploradasFiltradas(); track trackOferta(o)) {
                        <li
                          class="rounded-lg border border-slate-700/80 bg-slate-800/50 px-3 py-2"
                        >
                          <div class="font-medium text-white">{{ o.curso }}</div>
                          <div class="text-xs text-slate-400">
                            {{ o.anioCursado }}.º año · sheet {{ o.sheetId }}
                          </div>
                          @if (resumenOferta(o); as res) {
                            <div class="mt-1.5 text-[11px] leading-snug text-emerald-200/95">
                              {{ res }}
                            </div>
                          }
                          @if (o.docentesResumen) {
                            <div class="mt-1 text-xs text-slate-300 whitespace-pre-line">
                              {{ o.docentesResumen }}
                            </div>
                          }
                          @if (!o.bloques.length) {
                            <p class="mt-1 text-xs text-amber-200/80">
                              Sin bloques horarios en JSON.
                            </p>
                          }
                          <button
                            type="button"
                            class="mt-2 w-full rounded-lg bg-emerald-600 px-2 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                            (click)="agregarSeleccion(ex, o)"
                            (mouseenter)="previewEntrar(o)"
                            (mouseleave)="previewSalir()"
                          >
                            Usar esta comisión
                          </button>
                        </li>
                      }
                    </ul>
                  }
                </div>
              }

              @if (selecciones().length) {
                <div class="rounded-2xl border border-slate-700 bg-slate-900 p-4">
                  <h3 class="text-sm font-semibold text-white">Tu selección</h3>
                  <ul class="mt-2 space-y-2 text-sm">
                    @for (sel of selecciones(); track sel.materiaId; let i = $index) {
                      <li
                        class="flex items-start justify-between gap-2 rounded-lg border border-slate-700/80 px-2 py-1.5"
                      >
                        <div>
                          <div class="font-medium text-slate-100">
                            {{ nombreMateria(sel.materiaId) }}
                          </div>
                          <div class="text-xs text-slate-400">{{ sel.oferta.curso }}</div>
                        </div>
                        <button
                          type="button"
                          class="shrink-0 text-slate-500 hover:text-rose-300"
                          (click)="quitarSeleccion(sel.materiaId)"
                          aria-label="Quitar"
                        >
                          <lucide-icon [name]="iconX" class="h-4 w-4"></lucide-icon>
                        </button>
                      </li>
                    }
                  </ul>
                </div>
              }
            </div>

            <div
              class="min-w-0 flex-1 space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-5.5rem)] lg:self-start lg:overflow-y-auto lg:pb-4 lg:pr-1"
            >
              @if (mensajeSolape()) {
                <div
                  class="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-sm text-rose-100"
                  role="alert"
                >
                  {{ mensajeSolape() }}
                </div>
              }

              <div class="overflow-x-auto rounded-2xl border border-slate-700 bg-slate-900 p-3">
                <div class="min-w-[720px] text-xs">
                  <div class="flex gap-1">
                    <div class="w-24 shrink-0"></div>
                    <div class="grid min-w-0 flex-1 grid-cols-5 gap-x-1 text-center">
                      @for (d of dias; track d) {
                        <div class="font-semibold text-slate-300 py-1">{{ d }}</div>
                      }
                    </div>
                  </div>
                  <div class="flex gap-1">
                    <div class="flex w-24 shrink-0 flex-col text-right text-slate-500">
                      @for (h of etiquetasHora(); track h) {
                        <div
                          class="flex items-center justify-end pr-1 text-xs leading-none"
                          [style.height.px]="ALTURA_FILA_GRILLA_PX"
                        >
                          {{ h }}
                        </div>
                      }
                    </div>
                    <div class="grid min-w-0 flex-1 grid-cols-5 gap-x-1">
                      @for (d of dias; track d) {
                        <div
                          class="relative box-border overflow-hidden rounded border border-slate-800/70 bg-slate-950/40"
                          [style.height.px]="alturaCuerpoGrillaPx()"
                        >
                          <div
                            class="pointer-events-none absolute inset-0 z-0 flex flex-col"
                            aria-hidden="true"
                          >
                            @for (h of etiquetasHora(); track h) {
                              <div
                                class="box-border shrink-0 border-b border-slate-800/80"
                                [style.height.px]="ALTURA_FILA_GRILLA_PX"
                              ></div>
                            }
                          </div>
                          <div class="relative z-[1] h-full w-full">
                            @for (bloque of bloquesEnColumnaDia(d); track trackBloque(bloque)) {
                              <div
                                class="absolute rounded px-0.5 py-0.5 text-[11px] leading-snug text-white shadow-sm overflow-hidden"
                                [class]="bloque.clase"
                                [class.pointer-events-none]="bloque.esPreview"
                                [class.opacity-95]="bloque.esPreview"
                                [class.opacity-100]="!bloque.esPreview"
                                [style.top.%]="bloque.top"
                                [style.height.%]="bloque.height"
                                [style.left.%]="bloque.leftPct"
                                [style.width.%]="bloque.widthPct"
                                [style.z-index]="bloque.zIndex"
                              >
                                {{ bloque.etiqueta }}
                              </div>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                </div>
                <p class="mt-2 text-xs text-slate-500">
                  Vista 8:00–23:05. Cada materia en un bloque continuo; solapes en la misma franja se reparten en columnas.
                </p>
              </div>
            </div>
          </div>
        }
      </main>
    </div>
  `,
})
export class CronogramaArmadoPage {
  readonly store = inject(ProgressStore);
  private readonly horariosSvc = inject(CronogramaHorariosService);

  readonly iconCap = GraduationCap;
  readonly iconClock = CalendarClock;
  readonly iconInfo = Info;
  readonly iconX = X;

  readonly payloads = signal<HorariosPayload[]>([]);
  readonly materiaExploradaId = signal<MateriaId | null>(null);
  readonly selecciones = signal<CronogramaSeleccion[]>([]);
  readonly mensajeSolape = signal<string | null>(null);
  readonly cuatrimestreFiltro = signal<FiltroCuatrimestre>('1er');
  readonly avisoFiltro = signal<string | null>(null);
  /** Comisión bajo el botón "Usar esta comisión" (solo vista previa en grilla). */
  readonly previewOfertaTrack = signal<string | null>(null);

  readonly dias = DIAS;

  readonly filtrosCuatri: { id: FiltroCuatrimestre; label: string }[] = [
    { id: '1er', label: '1.er cuatri' },
    { id: '2do', label: '2.do cuatri' },
  ];

  readonly disponiblesFiltrados = computed(() => {
    const base = this.store
      .evaluaciones()
      .filter((ev) => ev.disponibilidad === 'disponible' && ev.estado === 'pendiente');
    const f = this.cuatrimestreFiltro();
    const payloads = this.payloads();
    return base.filter((ev) => {
      const ofertas = ofertasParaMateria(payloads, ev.materia);
      return ofertas.some((o) => this.filtrarBloquesCon(o.bloques, f).length > 0);
    });
  });

  readonly ofertasExploradas = computed(() => {
    const ex = this.materiaExplorada();
    if (!ex) return [];
    return ofertasParaMateria(this.payloads(), ex.materia);
  });

  readonly ofertasExploradasFiltradas = computed(() => {
    const raw = this.ofertasExploradas();
    const f = this.cuatrimestreFiltro();
    return raw.filter((o) => this.filtrarBloquesCon(o.bloques, f).length > 0);
  });

  readonly materiaExplorada = computed(() => {
    const id = this.materiaExploradaId();
    if (id === null) return null;
    return this.store.evaluacionesPorId().get(id) ?? null;
  });

  readonly etiquetasHora = computed(() => {
    const out: string[] = [];
    for (let h = 8; h <= 23; h++) {
      out.push(`${h}:00`);
    }
    return out;
  });

  /** Misma altura que cada franja horaria dibujada en la columna día (timeline continuo). */
  readonly ALTURA_FILA_GRILLA_PX = 44;

  readonly alturaCuerpoGrillaPx = computed(
    () => this.etiquetasHora().length * this.ALTURA_FILA_GRILLA_PX,
  );

  constructor() {
    this.horariosSvc.cargarTodosLosPayloads().subscribe((p) => this.payloads.set(p));

    effect(() => {
      const id = this.materiaExploradaId();
      if (id === null) return;
      const ok = this.disponiblesFiltrados().some((e) => e.materia.id === id);
      if (!ok) this.materiaExploradaId.set(null);
    });
  }

  elegirCuatrimestre(f: FiltroCuatrimestre): void {
    if (this.cuatrimestreFiltro() === f) return;
    const prevCount = this.selecciones().length;
    this.cuatrimestreFiltro.set(f);
    this.mensajeSolape.set(null);
    this.avisoFiltro.set(null);
    this.previewOfertaTrack.set(null);

    this.selecciones.update((list) =>
      list.filter((s) => this.filtrarBloquesCon(s.oferta.bloques, f).length > 0),
    );
    const removed = prevCount - this.selecciones().length;
    if (removed > 0) {
      this.avisoFiltro.set(
        `Se quitaron ${removed} materia(s) de la grilla: sin horarios en el cuatrimestre elegido.`,
      );
    }
  }

  resumenOferta(o: OfertaCursoHorario): string {
    const bloques = this.filtrarBloques(o.bloques);
    if (!bloques.length) return '';
    return resumenHorarioBloques(bloques);
  }

  explorarMateria(ev: EvaluacionMateria): void {
    this.materiaExploradaId.set(ev.materia.id);
    this.mensajeSolape.set(null);
    this.previewOfertaTrack.set(null);
  }

  cerrarExplorada(): void {
    this.materiaExploradaId.set(null);
    this.previewOfertaTrack.set(null);
  }

  previewEntrar(o: OfertaCursoHorario): void {
    this.previewOfertaTrack.set(this.trackOferta(o));
  }

  previewSalir(): void {
    this.previewOfertaTrack.set(null);
  }

  nombreMateria(id: MateriaId): string {
    return this.store.evaluacionesPorId().get(id)?.materia.nombre ?? String(id);
  }

  trackOferta(o: OfertaCursoHorario): string {
    return `${o.anioCursado}-${o.sheetId}-${o.curso}`;
  }

  agregarSeleccion(ev: EvaluacionMateria, oferta: OfertaCursoHorario): void {
    const bloques = this.filtrarBloques(oferta.bloques);
    const otras = this.selecciones()
      .filter((s) => s.materiaId !== ev.materia.id)
      .map((s) => this.filtrarBloques(s.oferta.bloques));

    if (bloques.length) {
      const conflictos = haySolapeEntreSelecciones([...otras, bloques]);
      if (conflictos) {
        this.mensajeSolape.set(
          'Ese horario se cruza con otra materia ya elegida en la misma franja.',
        );
        return;
      }
    }
    this.mensajeSolape.set(null);
    this.selecciones.update((list) => {
      const rest = list.filter((s) => s.materiaId !== ev.materia.id);
      return [...rest, { materiaId: ev.materia.id, oferta }];
    });
  }

  quitarSeleccion(id: MateriaId): void {
    this.selecciones.update((list) => list.filter((s) => s.materiaId !== id));
    this.mensajeSolape.set(null);
  }

  filtrarBloques(bloques: readonly HorarioBloque[]): HorarioBloque[] {
    return this.filtrarBloquesCon(bloques, this.cuatrimestreFiltro());
  }

  filtrarBloquesCon(
    bloques: readonly HorarioBloque[],
    filtro: FiltroCuatrimestre,
  ): HorarioBloque[] {
    return bloques.filter((b) => this.pasaFiltroCuatri(b, filtro));
  }

  private pasaFiltroCuatri(b: HorarioBloque, filtro: FiltroCuatrimestre): boolean {
    const tag = b.cuatrimestreTag;
    if (tag) {
      if (filtro === '1er') return tag === '1er';
      if (filtro === '2do') return tag === '2do';
    }
    const c = (b.cuatrimestre ?? '').toLowerCase();
    if (filtro === '1er') {
      return (
        c.includes('1er') ||
        c.includes('primero') ||
        c.includes('1 ') ||
        /\b1\b/.test(c)
      );
    }
    return c.includes('2do') || c.includes('segundo') || c.includes('2 ');
  }

  /**
   * Bloques en columna de día: posición % sobre el rango 8:00–23:05; tramos fusionados por recreo;
   * carriles horizontales si hay solape entre materias. Vista previa (hover) encima, semitransparente.
   */
  bloquesEnColumnaDia(dia: string): BloqueRender[] {
    const spanTotal = GRILLA_FIN_MIN - GRILLA_INICIO_MIN;
    if (spanTotal <= 0) return [];

    interface RawSeg {
      top: number;
      height: number;
      clase: string;
      etiqueta: string;
      track: string;
      clipIniRel: number;
      clipFinRel: number;
    }

    const raw: RawSeg[] = [];
    this.selecciones().forEach((sel, idx) => {
      const color = COLORES_SELECCION[idx % COLORES_SELECCION.length];
      const nombre = this.nombreMateria(sel.materiaId);
      const delDia = this.filtrarBloques(sel.oferta.bloques).filter((b) => b.dia === dia);
      const merged = fusionarIntervalosHorarioPorDia(delDia);
      for (const { ini, fin } of merged) {
        const clipIni = Math.max(ini, GRILLA_INICIO_MIN);
        const clipFin = Math.min(fin, GRILLA_FIN_MIN);
        if (clipFin <= clipIni) continue;

        const clipIniRel = clipIni - GRILLA_INICIO_MIN;
        const clipFinRel = clipFin - GRILLA_INICIO_MIN;
        const top = (clipIniRel / spanTotal) * 100;
        const height = ((clipFin - clipIni) / spanTotal) * 100;

        raw.push({
          top,
          height: Math.max(height, 0.35),
          clase: color,
          etiqueta: `${nombre} (${formatHoraMinutosMedianoche(clipIni)}–${formatHoraMinutosMedianoche(clipFin)})`,
          track: `${sel.materiaId}-${dia}-${clipIni}-${clipFin}`,
          clipIniRel,
          clipFinRel,
        });
      }
    });

    let seleccionLayout: BloqueRender[];

    if (raw.length <= 1) {
      seleccionLayout = raw.map((r, i) => ({
        ...r,
        leftPct: 0.5,
        widthPct: 99,
        zIndex: 10 + i,
        esPreview: false,
      }));
    } else {
      const sorted = [...raw].sort(
        (a, b) => a.clipIniRel - b.clipIniRel || a.clipFinRel - b.clipFinRel,
      );
      const laneEnd: number[] = [];

      for (const seg of sorted) {
        let lane = -1;
        for (let i = 0; i < laneEnd.length; i++) {
          if (laneEnd[i] <= seg.clipIniRel + 0.01) {
            lane = i;
            laneEnd[i] = seg.clipFinRel;
            break;
          }
        }
        if (lane < 0) {
          lane = laneEnd.length;
          laneEnd.push(seg.clipFinRel);
        }
        (seg as RawSeg & { lane: number }).lane = lane;
      }

      const n = laneEnd.length;
      const gap = 0.8;
      const usable = 100 - gap * (n + 1);
      const w = usable / n;

      seleccionLayout = sorted.map((seg, i) => {
        const lane = (seg as RawSeg & { lane: number }).lane;
        const leftPct = gap + lane * (w + gap);
        return {
          top: seg.top,
          height: seg.height,
          clase: seg.clase,
          etiqueta: seg.etiqueta,
          track: `${seg.track}-L${lane}`,
          leftPct,
          widthPct: w,
          zIndex: 10 + i,
          esPreview: false,
        };
      });
    }

    const previewTrack = this.previewOfertaTrack();
    const ex = this.materiaExplorada();
    const previewOferta =
      previewTrack && ex
        ? this.ofertasExploradasFiltradas().find((o) => this.trackOferta(o) === previewTrack)
        : undefined;

    if (!previewOferta?.bloques?.length) {
      return seleccionLayout;
    }

    const nombrePrev = ex?.materia.nombre ?? 'Vista previa';
    const delDiaPrev = this.filtrarBloques(previewOferta.bloques).filter((b) => b.dia === dia);
    const mergedPrev = fusionarIntervalosHorarioPorDia(delDiaPrev);
    const previewBlocks: BloqueRender[] = [];

    mergedPrev.forEach(({ ini, fin }, j) => {
      const clipIni = Math.max(ini, GRILLA_INICIO_MIN);
      const clipFin = Math.min(fin, GRILLA_FIN_MIN);
      if (clipFin <= clipIni) return;

      const clipIniRel = clipIni - GRILLA_INICIO_MIN;
      const clipFinRel = clipFin - GRILLA_INICIO_MIN;
      const top = (clipIniRel / spanTotal) * 100;
      const height = ((clipFin - clipIni) / spanTotal) * 100;
      const conflicto = this.intervaloSolapaConSeleccion(dia, clipIni, clipFin);

      previewBlocks.push({
        top,
        height: Math.max(height, 0.35),
        clase: conflicto ? CLASE_PREVIEW_SOLAPE : CLASE_PREVIEW_OK,
        etiqueta: conflicto
          ? `${nombrePrev} · solapa (${formatHoraMinutosMedianoche(clipIni)}–${formatHoraMinutosMedianoche(clipFin)})`
          : `${nombrePrev} (${formatHoraMinutosMedianoche(clipIni)}–${formatHoraMinutosMedianoche(clipFin)})`,
        track: `preview-${previewTrack}-${dia}-${j}`,
        leftPct: 0.5,
        widthPct: 99,
        zIndex: 40 + j,
        esPreview: true,
      });
    });

    return [...seleccionLayout, ...previewBlocks];
  }

  /** Solape temporal con algún bloque ya elegido (otras materias), mismo día. */
  private intervaloSolapaConSeleccion(dia: string, iniMin: number, finMin: number): boolean {
    for (const sel of this.selecciones()) {
      const delDia = this.filtrarBloques(sel.oferta.bloques).filter((b) => b.dia === dia);
      const merged = fusionarIntervalosHorarioPorDia(delDia);
      for (const { ini, fin } of merged) {
        const a = Math.max(ini, GRILLA_INICIO_MIN);
        const b = Math.min(fin, GRILLA_FIN_MIN);
        if (b <= a) continue;
        if (a < finMin && iniMin < b) return true;
      }
    }
    return false;
  }

  trackBloque(b: BloqueRender): string {
    return b.track;
  }
}

interface BloqueRender {
  top: number;
  height: number;
  clase: string;
  etiqueta: string;
  track: string;
  leftPct: number;
  widthPct: number;
  zIndex: number;
  /** Hover sobre “Usar esta comisión”; semitransparente sobre la grilla */
  esPreview?: boolean;
}
