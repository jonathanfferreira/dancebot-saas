import { supabase } from './supabase';

interface CreateTenantDTO {
    name: string;
    slug: string;
    owner_email: string;
}

export const adminService = {
    async createTenant(data: CreateTenantDTO) {
        // 1. Create Tenant
        const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .insert({
                name: data.name,
                slug: data.slug,
                owner_email: data.owner_email,
            })
            .select()
            .single();

        if (tenantError) throw new Error(`Error creating tenant: ${tenantError.message}`);

        // 2. Create Default Bot Config
        const { error: configError } = await supabase
            .from('bot_configs')
            .insert({
                tenant_id: tenant.id,
                welcome_message: `Olá! Bem-vindo à ${data.name}. Como posso ajudar?`,
                schedule: {
                    segunda: [],
                    terca: [],
                    quarta: [],
                    quinta: [],
                    sexta: []
                }, // Default empty schedule
            });

        if (configError) throw new Error(`Error creating bot config: ${configError.message}`);

        return tenant;
    },

    async listTenants() {
        const { data, error } = await supabase.from('tenants').select('*');
        if (error) throw new Error(error.message);
        return data;
    }
};
