/**
 * Test script for all 4 LLM APIs.
 * Run with: npx tsx scripts/test-apis.ts
 *
 * Make sure .env.local exists with your API keys.
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

const PROMPT = 'Say hello in one sentence.';

async function testTaalas() {
  console.log('\n=== TAALAS HC1 ===');
  const key = process.env.TAALAS_API_KEY;
  if (!key) { console.log('SKIP: TAALAS_API_KEY not set'); return; }

  const endpoints = [
    '/v1/chat/completions',
    '/v1/completions',
    '/chat/completions',
  ];

  for (const path of endpoints) {
    const url = `https://api.taalas.com${path}`;
    console.log(`\nTrying: ${url}`);
    const start = performance.now();

    try {
      const body = path.includes('chat')
        ? { model: 'llama-3.1-8b', messages: [{ role: 'user', content: PROMPT }], stream: false }
        : { model: 'llama-3.1-8b', prompt: PROMPT, stream: false };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify(body),
      });

      const elapsed = performance.now() - start;
      console.log(`Status: ${res.status}`);
      console.log(`Content-Type: ${res.headers.get('content-type')}`);

      if (res.ok) {
        const data = await res.json();
        console.log(`Response:`, JSON.stringify(data, null, 2).slice(0, 500));
        console.log(`Time: ${elapsed.toFixed(0)}ms`);
        console.log('SUCCESS');
        return;
      } else {
        const text = await res.text();
        console.log(`Error: ${text.slice(0, 200)}`);
      }
    } catch (err) {
      console.log(`Error: ${err}`);
    }
  }
  console.log('All Taalas endpoints failed.');
}

async function testOpenAI() {
  console.log('\n=== OPENAI ===');
  const key = process.env.OPENAI_API_KEY;
  if (!key) { console.log('SKIP: OPENAI_API_KEY not set'); return; }

  const start = performance.now();
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: PROMPT }],
        stream: false,
      }),
    });

    const elapsed = performance.now() - start;
    console.log(`Status: ${res.status}`);

    if (res.ok) {
      const data = await res.json();
      console.log(`Model: ${data.model}`);
      console.log(`Content: ${data.choices?.[0]?.message?.content}`);
      console.log(`Usage:`, data.usage);
      console.log(`Time: ${elapsed.toFixed(0)}ms`);
      console.log('SUCCESS');
    } else {
      console.log(`Error: ${await res.text()}`);
    }
  } catch (err) {
    console.log(`Error: ${err}`);
  }
}

async function testAnthropic() {
  console.log('\n=== ANTHROPIC ===');
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) { console.log('SKIP: ANTHROPIC_API_KEY not set'); return; }

  const start = performance.now();
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        messages: [{ role: 'user', content: PROMPT }],
        max_tokens: 256,
      }),
    });

    const elapsed = performance.now() - start;
    console.log(`Status: ${res.status}`);

    if (res.ok) {
      const data = await res.json();
      console.log(`Model: ${data.model}`);
      console.log(`Content: ${data.content?.[0]?.text}`);
      console.log(`Usage:`, data.usage);
      console.log(`Time: ${elapsed.toFixed(0)}ms`);
      console.log('SUCCESS');
    } else {
      console.log(`Error: ${await res.text()}`);
    }
  } catch (err) {
    console.log(`Error: ${err}`);
  }
}

async function testGoogle() {
  console.log('\n=== GOOGLE GEMINI ===');
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) { console.log('SKIP: GOOGLE_AI_API_KEY not set'); return; }

  const start = performance.now();
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: PROMPT }] }],
      }),
    });

    const elapsed = performance.now() - start;
    console.log(`Status: ${res.status}`);

    if (res.ok) {
      const data = await res.json();
      console.log(`Content: ${data.candidates?.[0]?.content?.parts?.[0]?.text}`);
      console.log(`Usage:`, data.usageMetadata);
      console.log(`Time: ${elapsed.toFixed(0)}ms`);
      console.log('SUCCESS');
    } else {
      console.log(`Error: ${await res.text()}`);
    }
  } catch (err) {
    console.log(`Error: ${err}`);
  }
}

async function main() {
  console.log('Speed Arena — API Test Script');
  console.log('=============================');
  console.log(`Prompt: "${PROMPT}"`);

  await Promise.all([testTaalas(), testOpenAI(), testAnthropic(), testGoogle()]);

  console.log('\n=============================');
  console.log('All tests complete.');
}

main();
