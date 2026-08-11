import { supabase } from '@/api/supabaseClient';

/**
 * Create a new build record in Supabase
 */
export async function createBuildRecord(buildData) {
    if (!supabase) {
        console.warn('Supabase not configured, skipping build record');
        return { id: buildData.build_id || 'local', ...buildData };
    }

    const { data, error } = await supabase
        .from('builds')
        .insert([{
            id: buildData.build_id,
            user_email: buildData.user_email,
            website_url: buildData.website_url,
            status: buildData.build_status || 'processing',
            r2_file_path: buildData.r2_file_path,
            app_name: buildData.app_name,
            package_name: buildData.package_name,
            version: buildData.version,
            build_duration: buildData.build_duration,
            build_logs: buildData.build_logs,
            created_at: buildData.build_date || new Date().toISOString(),
        }])
        .select()
        .single();

    if (error) {
        console.error('Failed to create build record:', error);
        throw new Error(`Database error: ${error.message}`);
    }

    return data;
}

/**
 * Update build status in Supabase
 */
export async function updateBuildStatus(buildId, status, updates = {}) {
    if (!supabase) {
        console.warn('Supabase not configured, skipping build update');
        return { id: buildId, status, ...updates };
    }

    const { data, error } = await supabase
        .from('builds')
        .update({
            status,
            updated_at: new Date().toISOString(),
            ...updates
        })
        .eq('id', buildId)
        .select()
        .single();

    if (error) {
        console.error('Failed to update build status:', error);
        throw new Error(`Database error: ${error.message}`);
    }

    return data;
}

/**
 * Get builds for a user by email
 */
export async function getBuildsByUser(userEmail, limit = 50) {
    if (!supabase) {
        console.warn('Supabase not configured');
        return [];
    }

    const { data, error } = await supabase
        .from('builds')
        .select('*')
        .eq('user_email', userEmail)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Failed to get builds:', error);
        throw new Error(`Database error: ${error.message}`);
    }

    return data || [];
}

/**
 * Get a single build by ID
 */
export async function getBuild(buildId) {
    if (!supabase) {
        console.warn('Supabase not configured');
        return null;
    }

    const { data, error } = await supabase
        .from('builds')
        .select('*')
        .eq('id', buildId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        console.error('Failed to get build:', error);
        throw new Error(`Database error: ${error.message}`);
    }

    return data;
}

/**
 * Delete a build record
 */
export async function deleteBuild(buildId) {
    if (!supabase) {
        console.warn('Supabase not configured');
        return false;
    }

    const { error } = await supabase
        .from('builds')
        .delete()
        .eq('id', buildId);

    if (error) {
        console.error('Failed to delete build:', error);
        throw new Error(`Database error: ${error.message}`);
    }

    return true;
}