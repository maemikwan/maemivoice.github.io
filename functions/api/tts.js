// functions/api/tts.js
export async function onRequest(context) {
  // 只处理 POST 请求
  if (context.request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { text, voice_id } = await context.request.json();

    const API_KEY = context.env.MINIMAX_API_KEY;
    const GROUP_ID = context.env.MINIMAX_GROUP_ID;

    if (!API_KEY || !GROUP_ID) {
      return new Response(JSON.stringify({
        error: '服务器缺少 MINIMAX_API_KEY 或 MINIMAX_GROUP_ID 环境变量配置'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const response = await fetch('https://api.minimax.io/v1/t2a_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'speech-2.8-turbo',
        text: text,
        voice_setting: {
          voice_id: voice_id || 'female-sweet'
        },
        audio_setting: {
          format: 'mp3'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({
        error: `MiniMax API 请求失败 (${response.status}): ${errorText}`
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const audioData = await response.arrayBuffer();
    return new Response(audioData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: '代理服务出错: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
