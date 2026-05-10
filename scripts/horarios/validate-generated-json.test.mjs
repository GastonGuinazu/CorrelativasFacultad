import test from 'node:test';
import assert from 'node:assert/strict';
import { materiaMatchKey, validateCurso } from './validate-generated-json.mjs';

test('materiaMatchKey: obligatoria', () => {
  assert.equal(
    materiaMatchKey({ tipo: 'obligatoria', id: 31, nombreCanonico: 'IA' }),
    'ob:31'
  );
});

test('validateCurso: error si bloque con texto y sin match', () => {
  const issues = validateCurso(
    {
      curso: '1K1',
      sheetId: 1,
      bloques: [
        {
          materiaCrudo: 'XYZDESCONOCIDA',
          materiaMatch: null,
          dia: 'Lunes',
          horaInicio: '8:00',
          horaFin: '10:00',
          cuatrimestreTag: '1er'
        }
      ],
      resumenMateriaDocente: [],
      warnings: []
    },
    1
  );
  assert.ok(issues.some((i) => i.code === 'bloque.sin_match'));
});

test('validateCurso: warn si hay match en grilla pero no en resumen', () => {
  const issues = validateCurso(
    {
      curso: 'X',
      sheetId: 1,
      bloques: [
        {
          materiaCrudo: 'IA',
          materiaMatch: { tipo: 'obligatoria', id: 31, nombreCanonico: 'Inteligencia Artificial' },
          dia: 'Lunes',
          horaInicio: '8:00',
          horaFin: '10:00'
        }
      ],
      resumenMateriaDocente: [],
      warnings: []
    },
    5
  );
  assert.ok(issues.some((i) => i.code === 'grilla.sin_fila_resumen'));
});
