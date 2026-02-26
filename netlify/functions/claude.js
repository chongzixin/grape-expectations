const Anthropic = require('@anthropic-ai/sdk');

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { messages, system, maxTokens, imageData } = JSON.parse(event.body);

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    let msgs = messages;
    if (imageData) {
      msgs = [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: imageData.mimeType, data: imageData.data } },
          { type: 'text', text: messages[messages.length - 1]?.content || '' },
        ],
      }];
    }

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens || 1800,
      system: system || '',
      messages: msgs,
    });

    const content = response.content?.map(c => c.text || '').join('') || '';

    return {
      statusCode: 200,
      body: JSON.stringify({ content }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
