import { adminService } from '../services/adminService';
import { supabase } from '../services/supabase';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

async function runSimulation() {
    console.log('🚀 Starting Local Simulation...');

    // 1. Create a Test Tenant
    const slug = `teste-${uuidv4().slice(0, 8)}`;
    console.log(`\n1. Creating Tenant with slug: ${slug}...`);

    try {
        const tenant = await adminService.createTenant({
            name: 'Escola de Dança Teste',
            slug: slug,
            owner_email: 'teste@exemplo.com'
        });
        console.log('✅ Tenant created:', tenant.id);

        // 2. Create a Mock Instance in DB (since we are bypassing Evolution API creation for now)
        const instanceName = `instance-${slug}`;
        await supabase.from('instances').insert({
            tenant_id: tenant.id,
            evolution_instance_id: instanceName,
            status: 'connected'
        });
        console.log('✅ Mock Instance created:', instanceName);

        // 3. Update Bot Config with some dummy data to test response
        await supabase.from('bot_configs').update({
            prices_url: 'https://link-do-pdf-de-precos.com',
            schedule: { "segunda": ["19:00 - Forró"] }
        }).eq('tenant_id', tenant.id);
        console.log('✅ Bot Config updated with prices and schedule.');

        // 4. Simulate Incoming Webhook
        console.log('\n2. Simulating Webhook: "Qual o preço?"...');

        // We need the server running on port 3000
        try {
            const payload = {
                instance: instanceName,
                data: {
                    key: {
                        remoteJid: '5511999999999@s.whatsapp.net',
                        fromMe: false,
                        id: 'MSG-ID-123'
                    },
                    pushName: 'Aluno Teste',
                    message: {
                        conversation: 'Olá, qual o preço da aula?'
                    },
                    messageType: 'conversation'
                },
                sender: '5511999999999@s.whatsapp.net'
            };

            const response = await axios.post('http://127.0.0.1:3000/webhook/evolution', payload);
            console.log('✅ Webhook Response Status:', response.status);
            console.log('✅ Webhook Response Data:', response.data);

            console.log('\n⚠️  CHECK SERVER LOGS TO SEE THE BOT REPLY! ⚠️');

        } catch (err: any) {
            console.error('❌ Error calling webhook:', err.message);
            if (err.code === 'ECONNREFUSED') {
                console.error('   -> Is the server running? (npm run dev)');
            }
        }

    } catch (error: any) {
        console.error('❌ Simulation Error:', error.message);
    }
}

runSimulation();
