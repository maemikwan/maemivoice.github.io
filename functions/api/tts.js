// functions/api/tts.js
export async function onRequest(context) {
  // 1. 只处理 POST 请求
  if (context.request.method !== 'POST') {
    return new Response(JSON.stringify({
      error: '只支持 POST 请求'
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 2. 解析请求体
    const { text, voice_id } = await context.request.json();

    // 3. 从环境变量读取密钥
    const API_KEY = context.env.MINIMAX_API_KEY;
    const GROUP_ID = context.env.MINIMAX_GROUP_ID;

    // 4. 【强制校验】必须同时存在 API_KEY 和 GROUP_ID
    if (!API_KEY || !GROUP_ID) {
      return new Response(JSON.stringify({
        error: '❌ 服务器缺少必要的环境变量配置',
        details: {
          MINIMAX_API_KEY: API_KEY ? '✅ 已配置' : '❌ 未配置或为空',
          MINIMAX_GROUP_ID: GROUP_ID ? '✅ 已配置' : '❌ 未配置或为空'
        },
        hint: '请在 Cloudflare Pages 项目设置 → 环境变量 中添加 MINIMAX_API_KEY 和 MINIMAX_GROUP_ID'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 5. 【校验】文本不能为空
    if (!text || text.trim().length === 0) {
      return new Response(JSON.stringify({
        error: '❌ 请提供要合成的文本'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 6. 【校验】文本不能超过 1000 字符（MiniMax 限制）
    if (text.length > 1000) {
      return new Response(JSON.stringify({
        error: '❌ 文本过长，请控制在 1000 字符以内',
        currentLength: text.length
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 7. 调用 MiniMax API
const response = await fetch('https://api.minimax.io/v1/t2a_v2', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'speech-2.8-turbo',
    text: text,
    group_id: GROUP_ID,        // ← 关键！这一行必须有
    voice_setting: {
      voice_id: voice_id || 'female-sweet',
      speed: 1.0,
      vol: 1.0,
      pitch: 0
    },
    audio_setting: {
      format: 'mp3',
      sample_rate: 32000,
      bitrate: 128000
    }
  })
})
    
    // 8. 处理 MiniMax API 的错误响应
    if (!response.ok) {
      const errorText = await response.text();
      let errorJson = null;
      try {
        errorJson = JSON.parse(errorText);
      } catch (_) {}

      return new Response(JSON.stringify({
        error: '❌ MiniMax API 请求失败',
        status: response.status,
        details: errorJson || errorText,
        hint: '请检查 API Key 是否有效，以及账户余额是否充足'
      }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 9. 获取音频数据
    const audioData = await response.arrayBuffer();

    // 10. 返回音频文件
    return new Response(audioData, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'audio/mpeg',
        'Content-Disposition': 'attachment; filename="tts.mp3"'
      }
    });

  } catch (error) {
    // 11. 捕获并返回详细错误
    return new Response(JSON.stringify({
      error: '❌ 代理服务内部错误',
      message: error.message,
      stack: error.stack || '无堆栈信息'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
