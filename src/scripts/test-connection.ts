import axios from 'axios';

async function check() {
    try {
        console.log('Testing /ping...');
        const res = await axios.get('http://127.0.0.1:3000/ping');
        console.log('✅ /ping status:', res.status, res.data);
    } catch (e: any) {
        console.log('❌ /ping failed:', e.message);
    }

    try {
        console.log('Testing /webhook/evolution (404 check)...');
        // Sending GET instead of POST should be 404 or 405 Method Not Allowed, but let's see connectivity
        const res = await axios.post('http://127.0.0.1:3000/webhook/evolution', {});
        console.log('✅ /webhook status:', res.status);
    } catch (e: any) {
        console.log('❌ /webhook failed:', e.message, e.response?.status);
    }
}

check();
