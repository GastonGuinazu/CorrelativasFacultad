import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  output,
  signal,
} from '@angular/core';
import {
  LucideAngularModule,
  CircleCheck,
  Clock,
  Hourglass,
  HelpCircle,
  RefreshCw,
  Star,
  ChartBar,
} from 'lucide-angular';
import { ProgressStore } from '../../../core/state/progress.store';
import { FiltroMateriasCatalogo } from '../../../core/models/materia.model';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';

@Component({
  selector: 'app-stats-sidebar',
  standalone: true,
  imports: [LucideAngularModule, ProgressBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside
      class="flex flex-col gap-4 rounded-2xl border border-slate-300 bg-white p-5 shadow-sm"
    >
      <header class="flex items-center gap-2">
        <span
          class="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200 text-slate-700"
        >
          <lucide-icon [name]="iconChart" class="h-5 w-5"></lucide-icon>
        </span>
        <h2 class="text-lg font-semibold text-slate-900">Estadísticas</h2>
      </header>

      <div class="flex flex-col gap-1.5">
        <span class="text-xs font-medium text-slate-600">Ver materias</span>
        <div
          class="grid grid-cols-3 gap-1 rounded-xl bg-slate-200 p-1 text-[11px] font-medium leading-tight sm:text-xs"
          role="tablist"
        >
          @for (opt of filtroOpciones; track opt.id) {
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="store.filtroMaterias() === opt.id"
              class="rounded-lg px-1.5 py-2 transition sm:px-2"
              [class]="
                store.filtroMaterias() === opt.id
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              "
              (click)="store.setFiltroMaterias(opt.id)"
            >
              {{ opt.label }}
            </button>
          }
        </div>
      </div>

      <section
        class="rounded-2xl bg-gradient-to-br from-violet-100 via-fuchsia-100 to-pink-100 p-4 ring-1 ring-violet-200"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-violet-900"
            >Créditos Electivas</span
          >
          <span class="text-2xl font-bold text-violet-800">
            {{ stats().creditosElectivosAprobados }} /
            {{ stats().creditosElectivosRequeridos }}
          </span>
        </div>
        <div class="mt-3">
          <app-progress-bar
            variant="violet"
            [value]="stats().creditosElectivosAprobados"
            [max]="stats().creditosElectivosRequeridos"
          />
        </div>
        <p class="mt-2 text-xs text-violet-800">
          {{ creditosFaltantesLabel() }}
        </p>
      </section>

      <ul class="flex flex-col gap-1.5 text-sm">
        <li
          class="flex items-center justify-between rounded-xl border border-slate-300/60 bg-slate-100 px-3 py-2.5"
        >
          <span class="flex items-center gap-2 text-slate-800">
            <lucide-icon [name]="iconChart" class="h-4 w-4 text-slate-600"></lucide-icon>
            Total
          </span>
          <span class="font-semibold text-slate-900">{{ stats().total }}</span>
        </li>

        <li
          class="flex items-center justify-between rounded-xl bg-emerald-100 px-3 py-2.5 ring-1 ring-emerald-200"
        >
          <span class="flex items-center gap-2 text-emerald-900">
            <lucide-icon [name]="iconCheck" class="h-4 w-4 text-emerald-700"></lucide-icon>
            Aprobadas
          </span>
          <span class="font-semibold text-emerald-800">{{
            stats().counts.aprobada
          }}</span>
        </li>

        <li
          class="flex items-center justify-between rounded-xl bg-amber-100 px-3 py-2.5 ring-1 ring-amber-200"
        >
          <span class="flex items-center gap-2 text-amber-900">
            <lucide-icon [name]="iconStar" class="h-4 w-4 text-amber-700"></lucide-icon>
            Regulares
          </span>
          <span class="font-semibold text-amber-800">{{
            stats().counts.regular
          }}</span>
        </li>

        <li
          class="flex items-center justify-between rounded-xl bg-blue-100 px-3 py-2.5 ring-1 ring-blue-200"
        >
          <span class="flex items-center gap-2 text-blue-900">
            <lucide-icon [name]="iconClock" class="h-4 w-4 text-blue-700"></lucide-icon>
            Cursando
          </span>
          <span class="font-semibold text-blue-800">{{
            stats().counts.cursando
          }}</span>
        </li>

        <li
          class="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-2.5 ring-1 ring-slate-300"
        >
          <span class="flex items-center gap-2 text-slate-800">
            <lucide-icon [name]="iconHourglass" class="h-4 w-4 text-slate-600"></lucide-icon>
            Pendientes
          </span>
          <span class="font-semibold text-slate-800">{{
            stats().counts.pendiente
          }}</span>
        </li>
      </ul>

      <div
        class="relative pt-1 transition-opacity duration-[1500ms] ease-in-out"
        [class.rounded-xl]="esProgresoTituloCompleto()"
        [class.px-2]="esProgresoTituloCompleto()"
        [class.py-2]="esProgresoTituloCompleto()"
        [class.-mx-1]="esProgresoTituloCompleto()"
        [class.stats-sidebar-progreso-wrap--completo]="esProgresoTituloCompleto()"
        data-celebracion-anchor="progreso-titulo"
      >
        @if (emojiCelebracion()) {
          <span
            class="pointer-events-none absolute -top-1 right-2 select-none text-2xl celebracion-emoji-float"
            aria-hidden="true"
            >🎉</span
          >
        }
        <app-progress-bar
          label="Progreso al título"
          variant="emerald"
          [value]="stats().progresoTotal"
          [max]="100"
          [destacar]="destacarPct()"
          [tituloCompleto]="esProgresoTituloCompleto()"
        />
      </div>

      <div class="flex flex-col gap-2 pt-1">
        <button
          type="button"
          class="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
          (click)="abrirComoFunciona.emit()"
        >
          <lucide-icon [name]="iconHelp" class="h-4 w-4"></lucide-icon>
          ¿Cómo funciona?
        </button>
        <button
          type="button"
          class="flex items-center justify-center gap-2 rounded-xl border border-rose-300 bg-rose-100 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-200"
          (click)="reiniciar.emit()"
        >
          <lucide-icon [name]="iconReset" class="h-4 w-4"></lucide-icon>
          Reiniciar Progreso
        </button>
      </div>
    </aside>
  `,
})
export class StatsSidebarComponent {
  readonly store = inject(ProgressStore);

  readonly destacarPct = signal(false);
  readonly emojiCelebracion = signal(false);

  readonly filtroOpciones: { id: FiltroMateriasCatalogo; label: string }[] = [
    { id: 'todas', label: 'Todo' },
    { id: 'obligatorias', label: 'Solo obligatorias' },
    { id: 'electivas', label: 'Solo electivas' },
  ];

  readonly stats = computed(() => this.store.stats());

  /** Progreso global al título de Ingeniería (0–100); activa animación si es exactamente 100. */
  readonly totalProgress = computed(() => this.stats().progresoTotal);

  readonly esProgresoTituloCompleto = computed(
    () => this.totalProgress() === 100,
  );

  constructor() {
    effect(() => {
      const evs = this.store.eventosCelebracion();
      const tituloCompleto = evs.some((e) => e.kind === 'titulo-completo');
      if (!tituloCompleto) return;
      this.destacarPct.set(true);
      this.emojiCelebracion.set(true);
      window.setTimeout(() => this.destacarPct.set(false), 420);
      window.setTimeout(() => this.emojiCelebracion.set(false), 1050);
    });
  }

  readonly iconChart = ChartBar;
  readonly iconCheck = CircleCheck;
  readonly iconClock = Clock;
  readonly iconStar = Star;
  readonly iconHourglass = Hourglass;
  readonly iconHelp = HelpCircle;
  readonly iconReset = RefreshCw;

  readonly creditosFaltantesLabel = computed(() => {
    const s = this.stats();
    const faltan = Math.max(
      0,
      s.creditosElectivosRequeridos - s.creditosElectivosAprobados,
    );
    if (faltan === 0) return '¡Créditos electivos completos!';
    return `Te faltan ${faltan} créditos para completar`;
  });

  readonly abrirComoFunciona = output<void>();
  readonly reiniciar = output<void>();
}
