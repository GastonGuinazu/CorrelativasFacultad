import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { LucideAngularModule, GraduationCap } from 'lucide-angular';

/**
 * Paleta "Camino al título": carril bg-slate-200/50;
 * 0–25 emerald-200, 26–50 emerald-400, 51–75 emerald-600, 76–99 emerald-800;
 * 100% amber-400 (hito).
 */
type BandaPaletaTitulo = 'inicio' | 'ritmo' | 'consolidacion' | 'recta';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="w-full transition-opacity duration-1000"
      [class.animate-pulse]="tituloCompleto()"
    >
      @if (label()) {
        <div class="flex items-center justify-between gap-2 text-xs mb-1.5">
          <span [class]="labelTituloClass()">{{ label() }}</span>
          <span [class]="pctSpanClass()" [class.progress-bar-pct-pop]="destacar()">
            @if (tituloCompleto()) {
              <lucide-icon
                [name]="iconGraduation"
                class="stats-sidebar-cap-celebrate h-3.5 w-3.5 shrink-0 text-amber-500"
                aria-hidden="true"
              ></lucide-icon>
            }
            {{ percent() }}%
          </span>
        </div>
      }
      <div
        [class]="trackTroughClass()"
        role="progressbar"
        [attr.aria-valuenow]="percent()"
        aria-valuemin="0"
        aria-valuemax="100"
        [class.animate-pulse]="tituloCompleto()"
      >
        <div
          class="h-full rounded-full transition-all duration-500 ease-out"
          [class]="trackClass()"
          [style.width.%]="percent()"
        ></div>
      </div>
    </div>
  `,
})
export class ProgressBarComponent {
  readonly value = input<number>(0);
  readonly max = input<number>(100);
  readonly label = input<string | null>(null);
  readonly variant = input<'emerald' | 'violet' | 'slate'>('emerald');
  /** Pulso de escala en el porcentaje (celebración de progreso). */
  readonly destacar = input<boolean>(false);
  /** Progreso al 100%: ámbar (hito), pulso/resplandor y birrete animado. */
  readonly tituloCompleto = input<boolean>(false);

  readonly iconGraduation = GraduationCap;

  readonly percent = computed(() => {
    const max = this.max() || 1;
    return Math.min(100, Math.max(0, Math.round((this.value() / max) * 100)));
  });

  /** Rango de la paleta para variante emerald y &lt; 100%. */
  readonly bandaPaletaTitulo = computed((): BandaPaletaTitulo | null => {
    if (this.variant() !== 'emerald' || this.tituloCompleto()) return null;
    const p = this.percent();
    if (p <= 25) return 'inicio';
    if (p <= 50) return 'ritmo';
    if (p <= 75) return 'consolidacion';
    return 'recta';
  });

  readonly labelTituloClass = computed(() => {
    if (this.tituloCompleto()) {
      return 'font-medium transition-colors duration-500 text-amber-200';
    }
    if (this.variant() === 'violet') {
      return 'font-medium transition-colors duration-500 text-violet-200';
    }
    if (this.variant() === 'slate') {
      return 'font-medium transition-colors duration-500 text-slate-300';
    }
    const band = this.bandaPaletaTitulo();
    switch (band) {
      case 'inicio':
        return 'font-medium transition-colors duration-500 text-emerald-300';
      case 'ritmo':
        return 'font-medium transition-colors duration-500 text-emerald-300';
      case 'consolidacion':
        return 'font-medium transition-colors duration-500 text-emerald-200';
      case 'recta':
        return 'font-medium transition-colors duration-500 text-emerald-200';
      default:
        return 'font-medium transition-colors duration-500 text-slate-300';
    }
  });

  readonly pctSpanClass = computed(() => {
    const base =
      'inline-flex items-center gap-1 font-semibold transition-all duration-500';
    if (this.tituloCompleto()) {
      return `${base} text-amber-100 progress-bar-titulo-completo-pct animate-pulse`;
    }
    if (this.variant() === 'violet') {
      return `${base} text-violet-100`;
    }
    if (this.variant() === 'slate') {
      return `${base} text-slate-300`;
    }
    const band = this.bandaPaletaTitulo();
    switch (band) {
      case 'inicio':
        return `${base} text-emerald-300`;
      case 'ritmo':
        return `${base} text-emerald-300`;
      case 'consolidacion':
        return `${base} text-emerald-200`;
      case 'recta':
        return `${base} text-emerald-100`;
      default:
        return `${base} text-emerald-300`;
    }
  });

  readonly trackTroughClass = computed(() => {
    const base =
      'h-2 w-full overflow-hidden rounded-full transition-colors duration-500';
    if (this.variant() === 'emerald') {
      return `${base} bg-slate-700/70`;
    }
    return `${base} bg-slate-700/80`;
  });

  readonly trackClass = computed(() => {
    if (this.tituloCompleto()) {
      return 'bg-amber-400 shadow-[0_0_14px_rgb(251_191_36_/_0.45)]';
    }
    if (this.variant() === 'emerald') {
      const band = this.bandaPaletaTitulo();
      switch (band) {
        case 'inicio':
          return 'bg-emerald-200';
        case 'ritmo':
          return 'bg-emerald-400';
        case 'consolidacion':
          return 'bg-emerald-600';
        case 'recta':
          return 'bg-emerald-800';
        default:
          return 'bg-emerald-800';
      }
    }
    switch (this.variant()) {
      case 'violet':
        return 'bg-gradient-to-r from-violet-600 to-fuchsia-600';
      case 'slate':
        return 'bg-slate-600';
      case 'emerald':
      default:
        return 'bg-gradient-to-r from-emerald-600 to-teal-600';
    }
  });
}
