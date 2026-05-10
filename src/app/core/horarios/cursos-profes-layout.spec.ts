import {
  buildWeeklyGrid,
  inferCuatrimestreTagDesdeTexto,
  materiaMatchKey,
  partitionResumenPorCuatrimestre,
  particionarBloquesPorCuatrimestre,
} from './cursos-profes-layout';
import {
  HorarioBloque,
  ResumenMateriaDocenteFila,
} from '../models/horarios-quinto.model';

const bloqueBase = (
  partial: Partial<HorarioBloque> & Pick<HorarioBloque, 'dia' | 'horaInicio' | 'horaFin'>,
): HorarioBloque => ({
  cuatrimestre: null,
  materiaCrudo: '',
  materiaMatch: null,
  colorRgb: null,
  cuatrimestreTag: undefined,
  ...partial,
});

describe('cursos-profes-layout', () => {
  it('inferCuatrimestreTagDesdeTexto', () => {
    expect(inferCuatrimestreTagDesdeTexto('1er Cuatrimestre')).toBe('1er');
    expect(inferCuatrimestreTagDesdeTexto('2do Cuatrimestre')).toBe('2do');
    expect(inferCuatrimestreTagDesdeTexto(null)).toBeNull();
  });

  it('particionarBloquesPorCuatrimestre usa tag o texto', () => {
    const m = { tipo: 'obligatoria' as const, id: 6, nombreCanonico: 'AED' };
    const bloques: HorarioBloque[] = [
      bloqueBase({
        dia: 'Lunes',
        horaInicio: '8:00',
        horaFin: '10:00',
        cuatrimestreTag: '1er',
        materiaMatch: m,
      }),
      bloqueBase({
        dia: 'Martes',
        horaInicio: '8:00',
        horaFin: '10:00',
        cuatrimestre: '2do Cuatrimestre',
        materiaMatch: m,
      }),
      bloqueBase({
        dia: 'Miércoles',
        horaInicio: '8:00',
        horaFin: '10:00',
        cuatrimestreTag: undefined,
        cuatrimestre: null,
        materiaMatch: m,
      }),
    ];
    const p = particionarBloquesPorCuatrimestre(bloques);
    expect(p.primer.length).toBe(1);
    expect(p.segundo.length).toBe(1);
    expect(p.sinCuatrimestre.length).toBe(1);
  });

  it('buildWeeklyGrid ordena días y franjas', () => {
    const m = { tipo: 'obligatoria' as const, id: 1, nombreCanonico: 'X' };
    const bloques: HorarioBloque[] = [
      bloqueBase({
        dia: 'Miércoles',
        horaInicio: '10:00',
        horaFin: '11:00',
        materiaMatch: m,
        cuatrimestreTag: '1er',
      }),
      bloqueBase({
        dia: 'Lunes',
        horaInicio: '8:00',
        horaFin: '9:00',
        materiaMatch: m,
        cuatrimestreTag: '1er',
      }),
    ];
    const g = buildWeeklyGrid(bloques);
    expect(g.dias).toEqual(['Lunes', 'Miércoles']);
    expect(g.filas.length).toBe(2);
    expect(g.filas[0].horaInicio).toBe('8:00');
    expect(g.filas[0].celdas['Lunes'].length).toBe(1);
    expect(g.filas[0].celdas['Miércoles'].length).toBe(0);
  });

  it('partitionResumenPorCuatrimestre: solo 1er', () => {
    const match = { tipo: 'obligatoria' as const, id: 8, nombreCanonico: 'SPN' };
    const bloques: HorarioBloque[] = [
      bloqueBase({
        dia: 'Lunes',
        horaInicio: '8:00',
        horaFin: '10:00',
        materiaMatch: match,
        cuatrimestreTag: '1er',
      }),
    ];
    const resumen: ResumenMateriaDocenteFila[] = [
      {
        materiaCrudo: 'x',
        docentesCrudo: 'Prof',
        materiaMatch: match,
        colorRgbMateria: null,
        colorRgbDocentes: null,
      },
    ];
    const { primer, segundo } = partitionResumenPorCuatrimestre(resumen, bloques);
    expect(primer.length).toBe(1);
    expect(segundo.length).toBe(0);
  });

  it('partitionResumenPorCuatrimestre: sin bloques duplica', () => {
    const resumen: ResumenMateriaDocenteFila[] = [
      {
        materiaCrudo: 'x',
        docentesCrudo: 'y',
        materiaMatch: { tipo: 'obligatoria', id: 99, nombreCanonico: 'Z' },
        colorRgbMateria: null,
        colorRgbDocentes: null,
      },
    ];
    const { primer, segundo } = partitionResumenPorCuatrimestre(resumen, []);
    expect(primer.length).toBe(1);
    expect(segundo.length).toBe(1);
  });

  it('materiaMatchKey es estable', () => {
    const m: ResumenMateriaDocenteFila['materiaMatch'] = {
      tipo: 'obligatoria',
      id: 31,
      nombreCanonico: 'IA',
    };
    expect(materiaMatchKey(m)).toBe('ob:31');
  });
});
