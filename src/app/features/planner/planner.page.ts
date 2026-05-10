import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  LucideAngularModule,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Headphones,
  BookOpen,
} from 'lucide-angular';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ProgressStore } from '../../core/state/progress.store';
import { StatsSidebarComponent } from '../../shared/components/stats-sidebar/stats-sidebar.component';
import { SubjectCardComponent } from '../../shared/components/subject-card/subject-card.component';
import { DetailPanelComponent } from '../../shared/components/detail-panel/detail-panel.component';
import { AvailableSubjectsPanelComponent } from '../../shared/components/available-subjects-panel/available-subjects-panel.component';
import { ModalDetailsComponent } from '../../shared/components/modal-details/modal-details.component';
import { ModalHowItWorksComponent } from '../../shared/components/modal-how-it-works/modal-how-it-works.component';
import { EstadoUsuario, MateriaId } from '../../core/models/materia.model';

@Component({
  selector: 'app-planner-page',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
    StatsSidebarComponent,
    SubjectCardComponent,
    DetailPanelComponent,
    AvailableSubjectsPanelComponent,
    ModalDetailsComponent,
    ModalHowItWorksComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-950 pb-12">
      <header
        class="relative isolate min-h-[300px] overflow-hidden bg-slate-900 sm:min-h-[340px]"
      >
        <div
          class="pointer-events-none absolute inset-0 z-0 min-h-[300px] w-full bg-slate-900 bg-cover bg-center bg-no-repeat sm:min-h-[340px]"
          [style.background-image]="portadaHeroBackground"
          role="presentation"
        ></div>
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

          <div class="flex items-center gap-1 rounded-full bg-white/5 p-1 ring-1 ring-white/10">
            <button
              type="button"
              class="rounded-full px-3 py-1.5 text-xs font-medium text-white/90 hover:text-white"
              (click)="store.setNivelActivo(1); scrollToGrid()"
            >
              Planificador
            </button>
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

        <div
          class="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-6 pb-10 pt-6 text-center"
        >
          <span
            class="mb-4 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white/90"
          >
            Planificador de Carrera
          </span>
          <h1
            class="text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.75)] sm:text-5xl"
          >
            Ingeniería en Sistemas
          </h1>
          <p
            class="mt-1 text-base font-medium text-emerald-300 drop-shadow-[0_1px_8px_rgba(0,0,0,0.6)]"
          >
            UTN FRC
          </p>
          <p
            class="mt-4 max-w-2xl text-sm leading-relaxed text-white/95 drop-shadow-[0_1px_6px_rgba(0,0,0,0.65)] sm:text-base"
          >
            Organizá tu carrera de forma inteligente. Marcá el estado de cada
            materia y descubrí automáticamente cuáles podés cursar según los
            prerrequisitos. Planificá tu camino hacia el título de manera eficiente.
          </p>
        </div>
      </header>

      <main
        class="relative z-10 mx-auto -mt-6 flex max-w-7xl flex-col gap-6 px-6"
      >
        <app-available-subjects-panel />

        <section #grid class="grid grid-cols-12 gap-6">
          <div class="col-span-12 lg:col-span-3">
            <app-stats-sidebar
              (abrirComoFunciona)="abrirComoFunciona()"
              (reiniciar)="reiniciar()"
            />
          </div>

          <div class="col-span-12 lg:col-span-6">
            <div
              class="flex flex-col gap-4 rounded-2xl border border-slate-700 bg-slate-900/90 p-5 shadow-sm"
            >
              <header
                class="flex flex-col gap-4 border-b border-slate-700 pb-4 lg:flex-row lg:items-center lg:justify-between lg:gap-3"
              >
                <div class="flex min-w-0 flex-1 flex-wrap items-center gap-3">
                  <div class="flex items-center gap-2">
                    <span
                      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300"
                    >
                      <lucide-icon [name]="iconBook" class="h-5 w-5"></lucide-icon>
                    </span>
                    <div class="flex flex-col leading-tight">
                      <h2 class="text-base font-semibold text-slate-100">
                        Nivel {{ store.nivelActivo() }}
                      </h2>
                      <span class="text-xs text-slate-400">
                        {{ store.evaluacionesNivelActivo().length }} materias
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    class="rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/25"
                    (click)="marcarNivelTodoAprobado(store.nivelActivo())"
                  >
                    Marcar todo el nivel aprobado
                  </button>
                </div>

                <nav
                  class="flex shrink-0 flex-wrap items-center gap-1"
                  aria-label="Cambiar nivel"
                >
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-600 text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
                    [disabled]="!puedeRetroceder()"
                    (click)="retroceder()"
                    aria-label="Nivel anterior"
                  >
                    <lucide-icon [name]="iconLeft" class="h-4 w-4"></lucide-icon>
                  </button>
                  @for (n of store.nivelesDisponibles(); track n) {
                    <button
                      type="button"
                      class="h-8 w-8 rounded-full text-sm font-medium transition"
                      [class]="
                        store.nivelActivo() === n
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-400 hover:bg-slate-800'
                      "
                      (click)="store.setNivelActivo(n); scrollToGrid()"
                    >
                      {{ n }}
                    </button>
                  }
                  <button
                    type="button"
                    class="flex h-8 w-8 items-center justify-center rounded-full border border-slate-600 text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
                    [disabled]="!puedeAvanzar()"
                    (click)="avanzar()"
                    aria-label="Nivel siguiente"
                  >
                    <lucide-icon [name]="iconRight" class="h-4 w-4"></lucide-icon>
                  </button>
                </nav>
              </header>

              @if (store.cargando()) {
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  @for (i of skeletons; track i) {
                    <div
                      class="h-36 animate-pulse rounded-2xl bg-slate-800"
                      aria-hidden="true"
                    ></div>
                  }
                </div>
              } @else if (store.errorCarga()) {
                <p class="text-sm text-rose-300">
                  No se pudo cargar el plan de estudios. Verificá que
                  <code class="rounded bg-slate-800 px-1 text-slate-200">materias.json</code> esté en la carpeta
                  <code class="rounded bg-slate-800 px-1 text-slate-200">public/</code>.
                </p>
              } @else if (store.evaluacionesNivelActivo().length === 0) {
                <p class="text-sm text-slate-400">
                  No hay materias para mostrar con los filtros actuales.
                </p>
              } @else {
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  @for (
                    ev of store.evaluacionesNivelActivo();
                    track ev.materia.id
                  ) {
                    <app-subject-card
                      [evaluacion]="ev"
                      [seleccionada]="ev.materia.id === store.materiaSeleccionadaId()"
                      (seleccionar)="seleccionar(ev.materia.id)"
                      (cambiarEstado)="cambiarEstado(ev.materia.id, $event)"
                    />
                  }
                </div>
              }

              <nav
                class="mt-4 flex flex-wrap items-center justify-center gap-1 border-t border-dashed border-slate-700 pt-4"
                aria-label="Navegar entre niveles"
              >
                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-full border border-slate-600 text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
                  [disabled]="!puedeRetroceder()"
                  (click)="retroceder()"
                  aria-label="Nivel anterior"
                >
                  <lucide-icon [name]="iconLeft" class="h-4 w-4"></lucide-icon>
                </button>
                @for (n of store.nivelesDisponibles(); track n) {
                  <button
                    type="button"
                    class="h-9 w-9 rounded-full text-sm font-medium transition"
                    [class]="
                      store.nivelActivo() === n
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800'
                    "
                    (click)="store.setNivelActivo(n); scrollToGrid()"
                  >
                    {{ n }}
                  </button>
                }
                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-full border border-slate-600 text-slate-300 transition hover:bg-slate-800 disabled:opacity-40"
                  [disabled]="!puedeAvanzar()"
                  (click)="avanzar()"
                  aria-label="Nivel siguiente"
                >
                  <lucide-icon [name]="iconRight" class="h-4 w-4"></lucide-icon>
                </button>
              </nav>
            </div>
          </div>

          <div class="col-span-12 lg:col-span-3">
            <app-detail-panel
              [evaluacion]="store.materiaSeleccionada()"
              [nombrePorId]="nombrePorId()"
              (verOpiniones)="abrirModalDetalles()"
            />
          </div>
        </section>
      </main>

      <button
        type="button"
        class="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700"
      >
        <lucide-icon [name]="iconHeadphones" class="h-4 w-4"></lucide-icon>
        Talk with Us
      </button>

      <app-modal-details
        [open]="modalDetallesAbierto()"
        [evaluacion]="store.materiaSeleccionada()"
        (cerrar)="modalDetallesAbierto.set(false)"
      />
      <app-modal-how-it-works
        [open]="modalComoFuncionaAbierto()"
        (cerrar)="modalComoFuncionaAbierto.set(false)"
      />
    </div>
  `,
})
export class PlannerPage {
  readonly store = inject(ProgressStore);

  /**
   * Portada servida desde `./img/portada1.jpg` (ruta pública `/img/portada1.jpg`).
   * Con CSS background no se muestra el ícono de imagen rota si el archivo falta.
   */
  readonly portadaHeroBackground = "url('/img/portada1.jpg')";

  readonly modalDetallesAbierto = signal(false);
  readonly modalComoFuncionaAbierto = signal(false);

  readonly skeletons = Array.from({ length: 6 });

  readonly iconCap = GraduationCap;
  readonly iconLeft = ChevronLeft;
  readonly iconRight = ChevronRight;
  readonly iconHeadphones = Headphones;
  readonly iconBook = BookOpen;

  readonly nombrePorId = computed(() => {
    const map = new Map<number, string>();
    for (const m of this.store.materias()) {
      if (typeof m.id === 'number') map.set(m.id, m.nombre);
    }
    return map;
  });

  readonly puedeAvanzar = computed(() => {
    const niveles = this.store.nivelesDisponibles();
    const idx = niveles.indexOf(this.store.nivelActivo());
    return idx >= 0 && idx < niveles.length - 1;
  });

  readonly puedeRetroceder = computed(() => {
    const niveles = this.store.nivelesDisponibles();
    return niveles.indexOf(this.store.nivelActivo()) > 0;
  });

  seleccionar(id: MateriaId): void {
    this.store.seleccionarMateria(id);
  }

  cambiarEstado(id: MateriaId, estado: EstadoUsuario): void {
    this.store.setEstado(id, estado);
  }

  abrirModalDetalles(): void {
    if (this.store.materiaSeleccionada()) {
      this.modalDetallesAbierto.set(true);
    }
  }

  abrirComoFunciona(): void {
    this.modalComoFuncionaAbierto.set(true);
  }

  reiniciar(): void {
    if (
      typeof window !== 'undefined' &&
      window.confirm('¿Seguro que querés reiniciar todo tu progreso?')
    ) {
      this.store.reiniciarProgreso();
    }
  }

  marcarNivelTodoAprobado(nivel: number): void {
    if (typeof window === 'undefined') return;
    const ok = window.confirm(
      `¿Marcar todas las materias del nivel ${nivel} como aprobadas? Podés corregir el estado materia por materia después.`,
    );
    if (!ok) return;
    this.store.marcarNivelTodoAprobado(nivel);
  }

  avanzar(): void {
    const niveles = this.store.nivelesDisponibles();
    const idx = niveles.indexOf(this.store.nivelActivo());
    if (idx >= 0 && idx < niveles.length - 1) {
      this.store.setNivelActivo(niveles[idx + 1]);
      this.scrollToGrid();
    }
  }

  retroceder(): void {
    const niveles = this.store.nivelesDisponibles();
    const idx = niveles.indexOf(this.store.nivelActivo());
    if (idx > 0) {
      this.store.setNivelActivo(niveles[idx - 1]);
      this.scrollToGrid();
    }
  }

  scrollToGrid(): void {
    if (typeof document === 'undefined') return;
    const el = document.querySelector('section.grid');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
