#!/usr/bin/env node
/**
 * API Key Test Script for EventureAI Builder
 * Tests connectivity to each LLM provider
 */

import 'dotenv/config';
import { config } from 'dotenv';
config({ override: true });
import https from 'https';

const keys = {
  anthropic: process.env.ANTHROPIC_API_KEY,
  openai: process.env.OPENAI_API_KEY,
  google: process.env.GOOGLE_API_KEY,
  xai: process.env.XAI_API_KEY,
  cohere: process.env.COHERE_API_KEY,
};

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testAnthropic() {
  if (!keys.anthropic) return { success: false, error: 'No API key set' };

  try {
    const result = await makeRequest({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': keys.anthropic,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      }
    }, {
      model: 'claude-3-haiku-20240307',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "ok"' }]
    });

    if (result.status === 200 && result.body.content) {
      return { success: true, response: result.body.content[0]?.text };
    }
    return { success: false, error: `Status ${result.status}: ${JSON.stringify(result.body)}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function testOpenAI() {
  if (!keys.openai) return { success: false, error: 'No API key set' };

  try {
    const result = await makeRequest({
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keys.openai}`
      }
    }, {
      model: 'gpt-3.5-turbo',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "ok"' }]
    });

    if (result.status === 200 && result.body.choices) {
      return { success: true, response: result.body.choices[0]?.message?.content };
    }
    return { success: false, error: `Status ${result.status}: ${JSON.stringify(result.body)}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function testGoogle() {
  if (!keys.google) return { success: false, error: 'No API key set' };

  try {
    const result = await makeRequest({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-2.0-flash:generateContent?key=${keys.google}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      contents: [{ parts: [{ text: 'Say "ok"' }] }]
    });

    if (result.status === 200 && result.body.candidates) {
      return { success: true, response: result.body.candidates[0]?.content?.parts[0]?.text };
    }
    return { success: false, error: `Status ${result.status}: ${JSON.stringify(result.body)}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function testXAI() {
  if (!keys.xai) return { success: false, error: 'No API key set' };

  // First, try to list models
  try {
    const modelsResult = await makeRequest({
      hostname: 'api.x.ai',
      path: '/v1/models',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${keys.xai}`
      }
    });

    if (modelsResult.status === 200 && modelsResult.body.data) {
      const modelId = modelsResult.body.data[0]?.id;
      if (modelId) {
        const result = await makeRequest({
          hostname: 'api.x.ai',
          path: '/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${keys.xai}`
          }
        }, {
          model: modelId,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Say "ok"' }]
        });

        if (result.status === 200 && result.body.choices) {
          return { success: true, response: result.body.choices[0]?.message?.content };
        }
        return { success: false, error: `Status ${result.status}: ${JSON.stringify(result.body)}` };
      }
    }
  } catch (err) {
    // Fall through to try default models
  }

  // Fallback: try common model names
  const models = ['grok-beta', 'grok-2-latest', 'grok-2-1212', 'grok-vision-beta'];
  for (const model of models) {
    try {
      const result = await makeRequest({
        hostname: 'api.x.ai',
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keys.xai}`
        }
      }, {
        model: model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Say "ok"' }]
      });

      if (result.status === 200 && result.body.choices) {
        return { success: true, response: result.body.choices[0]?.message?.content };
      }
    } catch (err) {
      continue;
    }
  }

  return { success: false, error: 'No working model found' };
}

async function testCohere() {
  if (!keys.cohere) return { success: false, error: 'No API key set' };

  try {
    const result = await makeRequest({
      hostname: 'api.cohere.ai',
      path: '/v2/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${keys.cohere}`
      }
    }, {
      model: 'command-r7b-12-2024',
      max_tokens: 10,
      messages: [{ role: 'user', content: 'Say "ok"' }]
    });

    if (result.status === 200 && result.body.message?.content) {
      return { success: true, response: result.body.message?.content[0]?.text };
    }
    return { success: false, error: `Status ${result.status}: ${JSON.stringify(result.body)}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function main() {
  console.log('\n🔑 Testing API Keys for EventureAI Builder\n');
  console.log('='.repeat(50));

  const tests = [
    { name: 'Anthropic (Claude)', fn: testAnthropic },
    { name: 'OpenAI (GPT)', fn: testOpenAI },
    { name: 'Google (Gemini)', fn: testGoogle },
    { name: 'XAI (Grok)', fn: testXAI },
    { name: 'Cohere', fn: testCohere },
  ];

  for (const test of tests) {
    process.stdout.write(`Testing ${test.name}... `);
    const result = await test.fn();

    if (result.success) {
      console.log(`✅ OK`);
      console.log(`   Response: ${result.response?.trim()}`);
    } else {
      console.log(`❌ FAILED`);
      console.log(`   Error: ${result.error}`);
    }
  }

  console.log('\n' + '='.repeat(50) + '\n');
}

main().catch(console.error);
