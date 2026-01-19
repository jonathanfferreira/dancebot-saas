import { supabase } from './supabase';
import { EvolutionMessage } from '../types/evolution';
import { conversationService } from './conversationService';

// Fluxo de Matrícula (State Machine Simplificada)
const processEnrollmentFlow = async (lead: any, message: string, config: any) => {
    const msg = message.trim();
    let response = '';
    let nextStage = lead.stage;
    let nextMetadata = { ...lead.metadata };

    // 1. Início / Boas Vindas
    if (lead.stage === 'start' || lead.stage === 'new') {
        response = `Olá! Bem-vindo à *${config.welcome_message_school_name || 'Nossa Escola'}*! 🩰\n\nEu sou o atendente virtual. Para começarmos, qual é o **seu nome**?`;
        nextStage = 'asking_name';
    }

    // 2. Captura Nome
    else if (lead.stage === 'asking_name') {
        nextMetadata.name = msg;
        response = `Prazer, ${msg}! \n\nVocê está buscando aulas para **você mesmo** ou para **outra pessoa** (filho/filha)?`;
        nextStage = 'asking_for_who';
    }

    // 3. Captura Para Quem
    else if (lead.stage === 'asking_for_who') {
        nextMetadata.for_who = msg;
        response = `Entendi! E qual a **idade** do aluno(a)? \n(Isso é importante para indicarmos a turma certa na grade)`;
        nextStage = 'asking_age';
    }

    // 4. Captura Idade -> Mostra Menu Principal
    else if (lead.stage === 'asking_age') {
        nextMetadata.age = msg;
        response = `Perfeito! Confirmei aqui: ${nextMetadata.name}, buscando aula para ${nextMetadata.for_who} (${msg}).\n\nComo posso ajudar agora?\n\n1. Ver Grade de Horários\n2. Ver Preços / Planos\n3. Falar com Humano`;
        nextStage = 'menu_principal';
    }

    // 5. Menu Principal
    else if (lead.stage === 'menu_principal') {
        if (msg.includes('1') || msg.toLowerCase().includes('grade') || msg.toLowerCase().includes('horario')) {
            response = `📅 *Nossa Grade de Horários:*\n\n${JSON.stringify(config.schedule, null, 2)}`;
        } else if (msg.includes('2') || msg.toLowerCase().includes('preço') || msg.toLowerCase().includes('valor')) {
            response = `💰 *Nossos Planos:*\n\nConfira a tabela completa aqui: ${config.prices_url || 'Peça na recepção'}\n\nQuer agendar uma aula experimental? Digite *Sim*!`;
        } else if (msg.includes('3') || msg.toLowerCase().includes('humano')) {
            response = `Tudo bem! Estou chamando um atendente humano para te ajudar. Aguarde um instante...`;
            nextStage = 'human_handoff';
        } else if (msg.toLowerCase() === 'sim') {
            response = `Ótimo! Vou pedir para a secretária entrar em contato para agendar.`;
            nextStage = 'human_handoff'; // Simplificação para MVP
        } else {
            response = `Desculpe, não entendi. Escolha uma opção:\n1. Grade\n2. Preços\n3. Falar com Humano`;
        }
    }

    // Fallback / Reset
    else {
        response = `Olá novamente! Como posso ajudar?\n1. Grade\n2. Preços`;
        nextStage = 'menu_principal';
    }

    return { response, nextStage, nextMetadata };
};

export const botEngine = {
    async processWebhook(payload: EvolutionMessage) {
        const instanceName = payload.instance;

        // Ignorar mensagens enviadas pelo próprio bot
        if (payload.data.key.fromMe) return;

        // 1. Buscar Tenant
        const { data: instance } = await supabase
            .from('instances')
            .select('tenant_id, tenants(id, bot_configs(*))')
            .eq('evolution_instance_id', instanceName)
            .single();

        if (!instance || !instance.tenants) {
            console.warn(`Instance ${instanceName} not found or not linked to tenant`);
            return;
        }

        const tenant = instance.tenants as any;
        const config = tenant.bot_configs;
        const userPhone = payload.data.key.remoteJid;
        const userMessage = payload.data.message.conversation || payload.data.message.extendedTextMessage?.text || '';
        const pushName = payload.data.pushName;

        console.log(`Processing message for tenant ${tenant.id} from ${userPhone}: ${userMessage}`);

        // 2. Buscar/Criar Lead (Estado da Conversa)
        try {
            const lead = await conversationService.getOrCreateLead(tenant.id, userPhone, pushName);

            // 3. Processar Lógica de Fluxo
            const result = await processEnrollmentFlow(lead, userMessage, config);

            // 4. Atualizar Estado do Lead (se mudou)
            if (result.nextStage !== lead.stage || JSON.stringify(result.nextMetadata) !== JSON.stringify(lead.metadata)) {
                await conversationService.updateLead(lead.id, {
                    stage: result.nextStage,
                    metadata: result.nextMetadata,
                    name: result.nextMetadata.name || lead.name // Atualiza nome se capturado
                });
            }

            // 5. Enviar Resposta
            console.log(`[BOT REPLIED to ${userPhone} (Stage: ${result.nextStage})]: ${result.response}`);
            // TODO: evolutionService.sendText(..., result.response)
        } catch (err: any) {
            console.error('Error in bot engine:', err.message);
        }
    }
};
