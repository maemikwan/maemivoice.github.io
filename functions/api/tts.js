// functions/api/tts.js
export async function onRequest(context) {
  // 只处理 POST 请求
  if (context.request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // 从请求中获取文本和音色
    const { text, voice_id } = await context.request.json();

    // 从环境变量读取密钥
    const API_KEY = context.env.MINIMAX_API_KEY;
    const GROUP_ID = context.env.MINIMAX_GROUP_ID;

    if (!API_KEY || !GROUP_ID) {
      return new Response('服务器缺少 API 密钥配置', { status: 500 });
    }

    // 调用 MiniMax API
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

    // 把音频数据返回给前端
    const audioData = await response.arrayBuffer();
    return new Response(audioData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'audio/mpeg',
      },
    });

  } catch (error) {
    return new Response('代理服务出错：' + error.message, { status: 500 });
  }
}
