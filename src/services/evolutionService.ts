import axios from 'axios';
import dotenv from 'dotenv';
import { supabase } from './supabase';

dotenv.config();

const EVOLUTION_URL = process.env.EVOLUTION_API_URL;
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY;

export const evolutionService = {
    // Cria uma nova instância na Evolution para o Tenant
    async createInstance(tenantName: string, tenantId: string) {
        const instanceName = `${tenantName.replace(/\s+/g, '-')}-${tenantId.slice(0, 8)}`;

        try {
            const response = await axios.post(
                `${EVOLUTION_URL}/instance/create`,
                {
                    instanceName: instanceName,
                    token: tenantId, // Usando ID do tenant como token de segurança
                    qrcode: true,
                },
                {
                    headers: {
                        'apikey': EVOLUTION_API_KEY,
                    },
                }
            );

            // Salva no banco
            await supabase.from('instances').insert({
                tenant_id: tenantId,
                evolution_instance_id: instanceName,
                evolution_instance_token: response.data.hash.apikey,
                status: 'created'
            });

            return response.data;
        } catch (error: any) {
            console.error('Error creating evolution instance:', error.response?.data || error.message);
            throw new Error('Failed to create WhatsApp instance');
        }
    },

    // Busca o QR Code de conexão
    async getQRCode(instanceName: string) {
        try {
            const response = await axios.get(
                `${EVOLUTION_URL}/instance/connect/${instanceName}`,
                {
                    headers: {
                        'apikey': EVOLUTION_API_KEY,
                    },
                }
            );
            return response.data; // Retorna base64 ou link
        } catch (error: any) {
            console.error('Error getting QR Code:', error.message);
            throw new Error('Failed to get QR Code');
        }
    }
};
