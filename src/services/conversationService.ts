import { supabase } from './supabase';

export interface LeadSession {
    id: string;
    phone: string;
    stage: string;
    name: string | null;
    metadata: any;
}

export const conversationService = {
    // Busca ou Cria um Lead para o Tenant/Telefone
    async getOrCreateLead(tenantId: string, phone: string, pushName: string): Promise<LeadSession> {
        const { data: existing } = await supabase
            .from('leads')
            .select('*')
            .eq('tenant_id', tenantId)
            .eq('phone', phone)
            .single();

        if (existing) {
            return existing;
        }

        // Criar novo
        const { data: newLead, error } = await supabase
            .from('leads')
            .insert({
                tenant_id: tenantId,
                phone: phone,
                name: pushName || 'Desconhecido',
                stage: 'start',
                metadata: {}
            })
            .select()
            .single();

        if (error) throw error;
        return newLead;
    },

    async updateLead(id: string, updates: Partial<LeadSession>) {
        await supabase.from('leads').update(updates).eq('id', id);
    }
};
