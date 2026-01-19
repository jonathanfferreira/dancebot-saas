import axios from 'axios';

async function simulateConversation() {
    const instanceName = 'instance-teste-ae74640d'; // Usando o mesmo que já criamos antes
    const userPhone = '5511988887777@s.whatsapp.net'; // Novo usuário para testar fluxo do zero

    const sendMessage = async (msg: string) => {
        try {
            console.log(`\n🧔 User: "${msg}"`);
            await axios.post('http://127.0.0.1:3000/webhook/evolution', {
                instance: instanceName,
                data: {
                    key: { remoteJid: userPhone, fromMe: false, id: 'MSG-' + Math.random() },
                    pushName: 'Maria Teste',
                    message: { conversation: msg },
                    messageType: 'conversation'
                },
                sender: userPhone
            });
            // Espera um pouco pra dar tempo do log aparecer
            await new Promise(r => setTimeout(r, 1000));
        } catch (e: any) {
            console.error('Error sending:', e.message);
        }
    };

    console.log('🚀 Iniciando Simulação de Conversa de Matrícula...');

    // 1. Oi Inicial (Deve gatilhar Boas Vindas)
    await sendMessage('Oi, gostaria de saber sobre aulas');

    // 2. Responder Nome
    await sendMessage('Maria');

    // 3. Responder Para Quem
    await sendMessage('Para minha filha');

    // 4. Responder Idade
    await sendMessage('7 anos');

    // 5. Pedir Grade
    await sendMessage('1'); // Opção 1: Grade
}

simulateConversation();
