import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../../shared/utils/logger.js';

export interface ObjectionUsage {
    objectionId: string;
    wasSuccessful: boolean;
}

export interface SuccessMetric {
    objection_id: string;
    script_id: string;
    success_count: number;
    total_usage: number;
    success_rate: number;
}

/**
 * Service to track and analyze objection success rates
 * This creates a competitive moat by learning which responses work best
 */
export class ObjectionSuccessTracker {
    constructor(private supabase: SupabaseClient) { }

    /**
     * Updates success metrics for all objections detected in a call
     * Called after PostCallAnalyzer generates the summary
     */
    async trackCallResult(
        scriptId: string,
        objectionIds: string[],
        wasConverted: boolean
    ): Promise<void> {
        if (!objectionIds || objectionIds.length === 0) {
            logger.info('No objections to track');
            return;
        }

        logger.info(`Tracking ${objectionIds.length} objections for script ${scriptId}, converted: ${wasConverted}`);

        // Update each objection's metrics
        for (const objectionId of objectionIds) {
            try {
                await this.updateMetric(scriptId, objectionId, wasConverted);
            } catch (error) {
                logger.error({ err: error }, `Failed to update metric for objection ${objectionId}`);
                // Continue with other objections even if one fails
            }
        }
    }

    /**
     * Upsert a single objection metric
     */
    private async updateMetric(
        scriptId: string,
        objectionId: string,
        wasSuccessful: boolean
    ): Promise<void> {
        // First, try to get existing metric
        const { data: existing, error: fetchError } = await this.supabase
            .from('objection_success_metrics')
            .select('*')
            .eq('objection_id', objectionId)
            .eq('script_id', scriptId)
            .maybeSingle();

        if (fetchError) {
            logger.error({ err: fetchError }, 'Error fetching existing metric');
            throw fetchError;
        }

        const newSuccessCount = (existing?.success_count || 0) + (wasSuccessful ? 1 : 0);
        const newTotalUsage = (existing?.total_usage || 0) + 1;

        // Upsert the metric
        const { error: upsertError } = await this.supabase
            .from('objection_success_metrics')
            .upsert({
                objection_id: objectionId,
                script_id: scriptId,
                success_count: newSuccessCount,
                total_usage: newTotalUsage,
                last_updated_at: new Date().toISOString()
            }, {
                onConflict: 'objection_id,script_id'
            });

        if (upsertError) {
            logger.error({ err: upsertError }, 'Error upserting metric');
            throw upsertError;
        }

        const successRate = newTotalUsage > 0 ? (newSuccessCount / newTotalUsage * 100).toFixed(1) : '0.0';
        logger.info(`Updated objection ${objectionId}: ${newSuccessCount}/${newTotalUsage} (${successRate}%)`);
    }

    /**
     * Get success rate for a specific objection
     * Returns 0 if no data available
     */
    async getSuccessRate(objectionId: string, scriptId: string): Promise<number> {
        const { data, error } = await this.supabase
            .from('objection_success_metrics')
            .select('success_count, total_usage')
            .eq('objection_id', objectionId)
            .eq('script_id', scriptId)
            .maybeSingle();

        if (error || !data || data.total_usage === 0) {
            return 0;
        }

        return data.success_count / data.total_usage;
    }

    /**
     * Get success rates for multiple objections
     * Returns a map of objectionId -> successRate
     */
    async getSuccessRates(objectionIds: string[], scriptId: string): Promise<Map<string, number>> {
        const { data, error } = await this.supabase
            .from('objection_success_metrics')
            .select('objection_id, success_count, total_usage')
            .eq('script_id', scriptId)
            .in('objection_id', objectionIds);

        const ratesMap = new Map<string, number>();

        if (error || !data) {
            logger.error({ err: error }, 'Error fetching success rates');
            return ratesMap;
        }

        for (const metric of data) {
            const rate = metric.total_usage > 0
                ? metric.success_count / metric.total_usage
                : 0;
            ratesMap.set(metric.objection_id, rate);
        }

        return ratesMap;
    }

    /**
     * Get all metrics for a script, sorted by success rate
     * Useful for analytics and debugging
     */
    async getScriptMetrics(scriptId: string): Promise<SuccessMetric[]> {
        const { data, error } = await this.supabase
            .from('objection_success_metrics')
            .select('*')
            .eq('script_id', scriptId)
            .order('success_count', { ascending: false });

        if (error || !data) {
            logger.error({ err: error }, 'Error fetching script metrics');
            return [];
        }

        return data.map(m => ({
            objection_id: m.objection_id,
            script_id: m.script_id,
            success_count: m.success_count,
            total_usage: m.total_usage,
            success_rate: m.total_usage > 0 ? m.success_count / m.total_usage : 0
        }));
    }
}
