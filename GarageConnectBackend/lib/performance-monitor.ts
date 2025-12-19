/**
 * Performance Monitor - Système de monitoring des temps de réponse
 * Objectif : Maintenir un temps de réponse < 2 secondes
 */

export interface TimingMetrics {
  label: string;
  duration: number;
  timestamp: number;
}

export interface PerformanceReport {
  totalDuration: number;
  breakdown: {
    database?: number;
    ai?: number;
    messaging?: number;
    other?: number;
  };
  metrics: TimingMetrics[];
}

export class PerformanceMonitor {
  private timings: Map<string, number> = new Map();
  private metrics: TimingMetrics[] = [];
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Démarrer un timer
   */
  startTimer(label: string): void {
    this.timings.set(label, Date.now());
  }

  /**
   * Terminer un timer et enregistrer la métrique
   */
  endTimer(label: string): number {
    const start = this.timings.get(label);
    if (!start) {
      console.warn(`⚠️ Timer "${label}" not started`);
      return 0;
    }

    const duration = Date.now() - start;
    this.timings.delete(label);

    // Enregistrer la métrique
    this.metrics.push({
      label,
      duration,
      timestamp: Date.now(),
    });

    // Log coloré selon performance
    const emoji = duration < 100 ? '⚡' : duration < 500 ? '✅' : duration < 1000 ? '⏱️' : '🐌';
    console.log(`${emoji} ${label}: ${duration}ms`);

    return duration;
  }

  /**
   * Obtenir le rapport de performance complet
   */
  getReport(): PerformanceReport {
    const totalDuration = Date.now() - this.startTime;

    // Catégoriser les métriques
    const breakdown = {
      database: 0,
      ai: 0,
      messaging: 0,
      other: 0,
    };

    this.metrics.forEach(metric => {
      if (metric.label.includes('db_') || metric.label.includes('database')) {
        breakdown.database += metric.duration;
      } else if (metric.label.includes('ai_') || metric.label.includes('gpt')) {
        breakdown.ai += metric.duration;
      } else if (metric.label.includes('send') || metric.label.includes('whatsapp')) {
        breakdown.messaging += metric.duration;
      } else {
        breakdown.other += metric.duration;
      }
    });

    return {
      totalDuration,
      breakdown,
      metrics: this.metrics,
    };
  }

  /**
   * Afficher un résumé formaté
   */
  logSummary(): void {
    const report = this.getReport();
    const { totalDuration, breakdown } = report;

    console.log('\n📊 ═══════════════════════════════════════');
    console.log('   PERFORMANCE SUMMARY');
    console.log('═══════════════════════════════════════');

    // Total avec évaluation
    const emoji = totalDuration < 2000 ? '🎯' : totalDuration < 3000 ? '⚠️' : '🚨';
    console.log(`\n${emoji} TOTAL: ${totalDuration}ms ${totalDuration < 2000 ? '(Excellent!)' : totalDuration < 3000 ? '(Acceptable)' : '(À optimiser!)'}`);

    // Breakdown
    console.log('\n📋 Breakdown:');
    console.log(`   🗄️  Database:  ${breakdown.database}ms (${((breakdown.database / totalDuration) * 100).toFixed(1)}%)`);
    console.log(`   🤖 AI/GPT-4:   ${breakdown.ai}ms (${((breakdown.ai / totalDuration) * 100).toFixed(1)}%)`);
    console.log(`   📱 Messaging:  ${breakdown.messaging}ms (${((breakdown.messaging / totalDuration) * 100).toFixed(1)}%)`);
    console.log(`   ⚙️  Other:      ${breakdown.other}ms (${((breakdown.other / totalDuration) * 100).toFixed(1)}%)`);

    // Top lenteurs
    const sortedMetrics = [...this.metrics].sort((a, b) => b.duration - a.duration);
    if (sortedMetrics.length > 0) {
      console.log('\n🐌 Top 3 Slowest:');
      sortedMetrics.slice(0, 3).forEach((metric, i) => {
        console.log(`   ${i + 1}. ${metric.label}: ${metric.duration}ms`);
      });
    }

    console.log('═══════════════════════════════════════\n');
  }

  /**
   * Réinitialiser le monitor
   */
  reset(): void {
    this.timings.clear();
    this.metrics = [];
    this.startTime = Date.now();
  }
}

// ============================================
// STATISTIQUES GLOBALES
// ============================================

interface GlobalStats {
  totalRequests: number;
  averageResponseTime: number;
  totalDuration: number;
  slowestRequest: number;
  fastestRequest: number;
}

class GlobalPerformanceTracker {
  private stats: GlobalStats = {
    totalRequests: 0,
    averageResponseTime: 0,
    totalDuration: 0,
    slowestRequest: 0,
    fastestRequest: Infinity,
  };

  private requestTimings: number[] = [];
  private maxHistorySize = 1000; // Garder les 1000 dernières requêtes

  /**
   * Enregistrer une requête
   */
  recordRequest(duration: number): void {
    this.stats.totalRequests++;
    this.stats.totalDuration += duration;
    this.stats.averageResponseTime = this.stats.totalDuration / this.stats.totalRequests;

    if (duration > this.stats.slowestRequest) {
      this.stats.slowestRequest = duration;
    }

    if (duration < this.stats.fastestRequest) {
      this.stats.fastestRequest = duration;
    }

    // Historique
    this.requestTimings.push(duration);
    if (this.requestTimings.length > this.maxHistorySize) {
      this.requestTimings.shift();
    }
  }

  /**
   * Obtenir les statistiques
   */
  getStats(): GlobalStats {
    return { ...this.stats };
  }

  /**
   * Obtenir le percentile 95 (95% des requêtes sont plus rapides)
   */
  getPercentile95(): number {
    if (this.requestTimings.length === 0) return 0;

    const sorted = [...this.requestTimings].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index];
  }

  /**
   * Obtenir le percentile 99
   */
  getPercentile99(): number {
    if (this.requestTimings.length === 0) return 0;

    const sorted = [...this.requestTimings].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.99);
    return sorted[index];
  }

  /**
   * Afficher les statistiques globales
   */
  logGlobalStats(): void {
    const stats = this.getStats();
    const p95 = this.getPercentile95();
    const p99 = this.getPercentile99();

    console.log('\n📊 ═══════════════════════════════════════');
    console.log('   GLOBAL PERFORMANCE STATISTICS');
    console.log('═══════════════════════════════════════');
    console.log(`\n📈 Total Requests: ${stats.totalRequests}`);
    console.log(`⏱️  Average Response: ${stats.averageResponseTime.toFixed(0)}ms`);
    console.log(`🚀 Fastest: ${stats.fastestRequest}ms`);
    console.log(`🐌 Slowest: ${stats.slowestRequest}ms`);
    console.log(`\n📊 Percentiles:`);
    console.log(`   P95: ${p95.toFixed(0)}ms (95% des requêtes)`);
    console.log(`   P99: ${p99.toFixed(0)}ms (99% des requêtes)`);

    // Évaluation
    const avgEmoji = stats.averageResponseTime < 2000 ? '🎯' : stats.averageResponseTime < 3000 ? '⚠️' : '🚨';
    console.log(`\n${avgEmoji} Performance Moyenne: ${stats.averageResponseTime < 2000 ? 'Excellent' : stats.averageResponseTime < 3000 ? 'Acceptable' : 'À optimiser'}`);
    console.log('═══════════════════════════════════════\n');
  }

  /**
   * Réinitialiser les statistiques
   */
  reset(): void {
    this.stats = {
      totalRequests: 0,
      averageResponseTime: 0,
      totalDuration: 0,
      slowestRequest: 0,
      fastestRequest: Infinity,
    };
    this.requestTimings = [];
  }
}

// Instance globale
export const globalPerformanceTracker = new GlobalPerformanceTracker();

// ============================================
// ALERTES PERFORMANCE
// ============================================

export interface PerformanceAlert {
  type: 'slow_response' | 'high_db_time' | 'high_ai_time';
  message: string;
  duration: number;
  threshold: number;
}

/**
 * Vérifier et créer des alertes si nécessaire
 */
export function checkPerformanceAlerts(report: PerformanceReport): PerformanceAlert[] {
  const alerts: PerformanceAlert[] = [];

  // Alerte temps total
  if (report.totalDuration > 3000) {
    alerts.push({
      type: 'slow_response',
      message: 'Temps de réponse total trop élevé',
      duration: report.totalDuration,
      threshold: 3000,
    });
  }

  // Alerte DB
  if (report.breakdown.database && report.breakdown.database > 1000) {
    alerts.push({
      type: 'high_db_time',
      message: 'Temps de requête base de données élevé',
      duration: report.breakdown.database,
      threshold: 1000,
    });
  }

  // Alerte AI
  if (report.breakdown.ai && report.breakdown.ai > 2000) {
    alerts.push({
      type: 'high_ai_time',
      message: 'Temps de traitement IA élevé',
      duration: report.breakdown.ai,
      threshold: 2000,
    });
  }

  return alerts;
}

/**
 * Logger les alertes
 */
export function logPerformanceAlerts(alerts: PerformanceAlert[]): void {
  if (alerts.length === 0) return;

  console.log('\n🚨 ═══════════════════════════════════════');
  console.log('   PERFORMANCE ALERTS');
  console.log('═══════════════════════════════════════');

  alerts.forEach(alert => {
    console.log(`\n⚠️  ${alert.type.toUpperCase()}`);
    console.log(`   ${alert.message}`);
    console.log(`   Duration: ${alert.duration}ms (threshold: ${alert.threshold}ms)`);
    console.log(`   Dépassement: +${((alert.duration - alert.threshold) / alert.threshold * 100).toFixed(1)}%`);
  });

  console.log('═══════════════════════════════════════\n');
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Mesurer le temps d'exécution d'une fonction async
 */
export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  const result = await fn();
  const duration = Date.now() - start;

  const emoji = duration < 100 ? '⚡' : duration < 500 ? '✅' : duration < 1000 ? '⏱️' : '🐌';
  console.log(`${emoji} ${label}: ${duration}ms`);

  return { result, duration };
}

/**
 * Mesurer le temps d'exécution d'une fonction sync
 */
export function measureSync<T>(
  label: string,
  fn: () => T
): { result: T; duration: number } {
  const start = Date.now();
  const result = fn();
  const duration = Date.now() - start;

  const emoji = duration < 10 ? '⚡' : duration < 50 ? '✅' : '⏱️';
  console.log(`${emoji} ${label}: ${duration}ms`);

  return { result, duration };
}

/**
 * Wrapper pour automatiquement monitorer une fonction
 */
export function withMonitoring<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  label?: string
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const fnName = label || fn.name || 'anonymous';
    const start = Date.now();
    
    try {
      const result = await fn(...args);
      const duration = Date.now() - start;
      
      const emoji = duration < 100 ? '⚡' : duration < 500 ? '✅' : duration < 1000 ? '⏱️' : '🐌';
      console.log(`${emoji} ${fnName}: ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      console.log(`❌ ${fnName}: ${duration}ms (ERROR)`);
      throw error;
    }
  }) as T;
}

// ============================================
// EXPORT DEFAULT
// ============================================

export default PerformanceMonitor;
