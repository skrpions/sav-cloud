// ========================================
// PLOT UTILITIES
// Funciones de utilidad para gestión de lotes de cultivo
// ========================================

import { PlotEntity, PlotStatus, PLOT_STATUS_OPTIONS } from '@/app/shared/models/plot.models';

// ========================================
// UTILITY FUNCTIONS
// ========================================

export function getPlotStatusConfig(status: PlotStatus) {
  return PLOT_STATUS_OPTIONS.find(option => option.value === status) || PLOT_STATUS_OPTIONS[0];
}

export function formatPlotArea(area?: number): string {
  if (!area || area === 0) return 'Sin especificar';
  
  if (area < 1) {
    // Convertir a metros cuadrados para áreas pequeñas
    const sqMeters = area * 10000;
    return `${sqMeters.toFixed(0)} m²`;
  }
  
  return `${area.toFixed(2)} ha`;
}

export function calculatePlotProductionCycle(plantingDate?: string, expectedHarvestDate?: string): {
  daysSincePlanting?: number;
  daysToHarvest?: number;
  cycleLength?: number;
} {
  if (!plantingDate) return {};
  
  const planted = new Date(plantingDate);
  const today = new Date();
  const daysSincePlanting = Math.floor((today.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
  
  if (!expectedHarvestDate) {
    return { daysSincePlanting };
  }
  
  const expectedHarvest = new Date(expectedHarvestDate);
  const daysToHarvest = Math.floor((expectedHarvest.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const cycleLength = Math.floor((expectedHarvest.getTime() - planted.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    daysSincePlanting,
    daysToHarvest,
    cycleLength
  };
}

export function getPlotHealthScore(plot: PlotEntity): {
  score: number;
  factors: string[];
} {
  let score = 100;
  const factors: string[] = [];
  
  // Verificar fechas
  if (plot.planting_date && plot.last_renovation_date) {
    const cycle = calculatePlotProductionCycle(plot.planting_date, plot.last_renovation_date);
    
    if (cycle.daysToHarvest && cycle.daysToHarvest < 0) {
      score -= 20;
      factors.push('Fecha de cosecha pasada');
    }
  }
  
  // Verificar estado del cultivo
  if (plot.status === 'renovation') {
    score -= 15;
    factors.push('En renovación');
  } else if (plot.status === 'resting') {
    score -= 10;
    factors.push('En descanso');
  } else if (plot.status === 'abandoned') {
    score -= 30;
    factors.push('Lote abandonado');
  }
  
  // Verificar pendiente excesiva
  if (plot.slope_percentage && plot.slope_percentage > 30) {
    score -= 10;
    factors.push('Pendiente elevada');
  }
  
  // Verificar área muy pequeña
  if (plot.area < 0.5) {
    score -= 5;
    factors.push('Área muy pequeña');
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    factors
  };
} 