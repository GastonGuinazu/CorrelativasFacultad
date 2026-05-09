import { effect, inject, Injectable } from '@angular/core';
import confetti from 'canvas-confetti';
import { ProgressStore } from '../state/progress.store';

/** Duración aproximada del confeti localizado (ticks ~ fps internos del paquete). */
const TICKS_LOCAL = 85;

const COLORES_CELEBRACION = ['#10b981', '#34d399', '#fbbf24', '#fde047'];

function originDesdeElemento(el: Element): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  const x = (r.left + r.width / 2) / window.innerWidth;
  const y = (r.top + r.height / 2) / window.innerHeight;
  return { x, y };
}

function burstDesdeAncla(selectorValor: string): void {
  const el = document.querySelector(
    `[data-celebracion-anchor="${selectorValor}"]`,
  );
  if (!el) return;
  const { x, y } = originDesdeElemento(el);
  void confetti({
    particleCount: 42,
    spread: 58,
    startVelocity: 32,
    ticks: TICKS_LOCAL,
    gravity: 1.05,
    scalar: 0.9,
    origin: { x, y },
    colors: COLORES_CELEBRACION,
    disableForReducedMotion: true,
  });
}

/** Dos chorros desde abajo hacia el centro, pocas partículas. */
function confetiTituloEsquinas(): void {
  void confetti({
    particleCount: 16,
    angle: 58,
    spread: 38,
    origin: { x: 0.04, y: 1 },
    startVelocity: 42,
    ticks: 95,
    gravity: 1,
    scalar: 0.85,
    colors: COLORES_CELEBRACION,
    disableForReducedMotion: true,
  });
  void confetti({
    particleCount: 16,
    angle: 122,
    spread: 38,
    origin: { x: 0.96, y: 1 },
    startVelocity: 42,
    ticks: 95,
    gravity: 1,
    scalar: 0.85,
    colors: COLORES_CELEBRACION,
    disableForReducedMotion: true,
  });
}

/**
 * Reacciona a la cola de celebraciones del store y dispara confetti sin bloquear UI.
 */
@Injectable({ providedIn: 'root' })
export class CelebracionConfettiService {
  private readonly store = inject(ProgressStore);

  constructor() {
    effect(() => {
      const eventos = this.store.eventosCelebracion();
      if (eventos.length === 0) return;

      queueMicrotask(() => {
        for (const ev of eventos) {
          switch (ev.kind) {
            case 'materia-aprobada':
              burstDesdeAncla(`materia-${ev.materiaId}`);
              break;
            case 'titulo-completo':
              burstDesdeAncla('progreso-titulo');
              confetiTituloEsquinas();
              break;
          }
        }
        this.store.limpiarColaCelebracion();
      });
    });
  }
}
