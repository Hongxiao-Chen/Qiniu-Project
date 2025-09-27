import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const port = 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const audioDir = path.join(__dirname, 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use('/public/audio', express.static(audioDir));

// --- 角色Prompt ---
const characters = {
  'socrates': {
    name: '苏格拉底',
    description: '古希腊哲学家，擅长诘问与思辨。',
    image: '/socrates.jpg',
    systemPrompt: `你是哲学家苏格拉底。你的核心交流方式是“苏格拉底诘问法”。
        规则：
        1. 永远不要直接给出答案或陈述你的观点。
        2. 针对用户的每一个问题或论断，都用一个相关的、能够启发思考的问题来回应。
        3. 你的目标是帮助用户审视他们自己的信念和知识的局限性。
        4. 保持谦逊和好奇的语气，仿佛你也在与用户一同探索。
        例如：如果用户问“什么是正义？”，你不能直接定义，而应反问：“一个很有趣的问题。那么，你能否先告诉我，你认为什么样的行为是正义的？”`
  },
  'harry-potter': {
    name: '哈利·波特',
    description: '来自霍格沃茨的年轻巫师。',
    image: '/harry.jpg',
    systemPrompt: `你是哈利·波特。你善良、勇敢，但有时会有些冲动。
        技能 - 回忆叙事：
        当用户询问关于你在霍格沃茨的某段具体经历时（例如“第一次见到摄魂怪是什么感觉？”或“讲讲三强争霸赛的故事”），请触发此技能。
        规则：
        1. 使用第一人称“我”来讲述。
        2. 详细描述当时的环境、你的内心感受（如恐惧、激动）以及事件的关键情节。
        3. 你的叙述风格应符合一个十几岁少年的口吻，而非百科全书式的复述。
        4. 讲述完毕后，可以自然地询问用户对此的看法，将对话延续下去。`
  },
  'sherlock-holmes': {
    name: '夏洛克·福尔摩斯',
    description: '无与伦比的咨询侦探。',
    image: '/sherlock.jpg',
    systemPrompt: `你是夏洛克·福尔摩斯。你善于观察，逻辑缜密，言辞精准且略带一丝傲慢。
        技能 - 演绎推理：
        在与用户对话时，时刻留意他们透露的细节，例如他们的用词习惯、提到的地点、背景噪音或讨论的话题。
        规则：
        1. 至少收集到2-3个看似无关的细节。
        2. 在一个合适的时机，向用户展示你的推理过程。例如：“你刚才提到了‘项目’和‘截止日期’，并且我注意到你的语速很快，这表明你可能正面临着工作上的压力。结合你之前说你喜欢在晚上放松，我推断，你很可能是一位在科技或创意行业工作的专业人士，对吗？”
        3. 你的推理必须基于用户提供的信息，不能凭空捏造。
        4. 推理后要给用户一个确认的机会。`
  }
};


// --- API ---

// LLM API
const ZHIPU_API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY; // 需要在 .env 文件中设置

// 转换消息格式函数
function convertToZhipuMessages(history, systemPrompt) {
  const messages = [];
  
  // 添加系统消息
  if (systemPrompt) {
    messages.push({
      role: "system",
      content: systemPrompt
    });
  }
  
  // 转换历史消息
  history.forEach(msg => {
    if (msg.role === 'user' || msg.role === 'model') {
      messages.push({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.parts[0].text
      });
    }
  });
  
  return messages;
}

// --- API 路由 ---

app.get('/api/characters', (req, res) => {
  const characterList = Object.keys(characters).map(id => ({
    id,
    ...characters[id]
  }));
  res.json(characterList);
});

app.get('/api/characters/:id', (req, res) => {
    const character = characters[req.params.id];
    if (character) {
        res.json({ id: req.params.id, ...character });
    } else {
        res.status(404).send('Character not found');
    }
});

app.post('/api/chat', async (req, res) => {
  const { characterId, history } = req.body;
  
  if (!characterId || !history) {
    return res.status(400).json({ error: 'characterId and history are required' });
  }

  const character = characters[characterId];
  if (!character) {
    return res.status(404).json({ error: 'Character not found' });
  }

  if (!ZHIPU_API_KEY) {
    return res.status(500).json({ error: 'ZHIPU_API_KEY is not configured' });
  }

  try {
    // 转换消息格式为智谱 AI 的格式
    const messages = convertToZhipuMessages(history, character.systemPrompt);
    
    const payload = {
      "model": "glm-4-flash",
      "messages": messages,
      "temperature": 0.7,
      "max_tokens": 1024,
      "stream": false
    };

    const headers = {
      "Authorization": `Bearer ${ZHIPU_API_KEY}`,
      "Content-Type": "application/json"
    };

    const response = await fetch(ZHIPU_API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Zhipu AI API error:', errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      console.error('Zhipu AI API error:', data.error);
      throw new Error(data.error.message || 'API error');
    }

    const text = data.choices[0].message.content;
    
    res.json({ text });
  } catch (error) {
    console.error('Error with Zhipu AI API:', error);
    res.status(500).json({ 
      error: 'Failed to get response from AI',
      details: error.message 
    });
  }
});

// TTS API
app.post('/api/tts', async (req, res) => {
  const { 
    text, 
    voice = 'zh-CN-YunxiNeural',
    model = 'tts-1'
  } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const TTS_CONFIG = {
    apiUrl: process.env.TTS_API_URL,
    apiKey: process.env.TTS_API_KEY,
    cleanupDelay: 5 * 60 * 1000 // 5分钟清理延迟
  };

  try {
    const payload = {
      model: model,
      input: text,
      voice: voice
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TTS_CONFIG.apiKey}`
    };

    console.log(`Calling TTS API for text: ${text.substring(0, 50)}...`);

    const ttsResponse = await fetch(TTS_CONFIG.apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('TTS API error:', {
        status: ttsResponse.status,
        statusText: ttsResponse.statusText,
        error: errorText
      });
      throw new Error(`TTS API error: ${ttsResponse.status} - ${errorText}`);
    }

    // 检查响应内容类型
    const contentType = ttsResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('audio/')) {
      console.warn('Unexpected content type from TTS API:', contentType);
    }

    // 获取音频二进制数据
    const audioBuffer = await ttsResponse.arrayBuffer();
    
    if (audioBuffer.byteLength === 0) {
      throw new Error('TTS API returned empty audio data');
    }

    const filename = `${uuidv4()}.mp3`;
    const filepath = path.join(audioDir, filename);
    
    // 将音频数据写入文件
    await fs.promises.writeFile(filepath, Buffer.from(audioBuffer));
    
    const audioUrl = `http://localhost:${port}/public/audio/${filename}`;

    console.log(`TTS successful: ${filename} (${audioBuffer.byteLength} bytes)`);

    // 清理缓存
    setTimeout(() => {
      fs.unlink(filepath, (err) => {
        if (err) {
          console.error(`Error deleting audio file ${filepath}:`, err);
        } else {
          console.log(`Cleaned up audio file: ${filename}`);
        }
      });
    }, TTS_CONFIG.cleanupDelay);

    res.json({ 
      audioUrl
    });
  } catch (error) {
    console.error('Error with TTS API:', error);
    res.status(500).json({ 
      error: 'Failed to synthesize speech',
      details: error.message,
      suggestion: 'Check if your TTS service is running on localhost:5050'
    });
  }
});

app.listen(port, () => {
  console.log(`AIChat backend listening on port ${port}`);
});