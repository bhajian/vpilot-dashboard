import axios from 'axios';
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

export const fetchOpenAIResponse = async (prompt: string) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo', // or another chat model
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: prompt },
      ],
      stream: true, // Enable streaming
    }),
  });

  // Return the response body stream
  return response.body;
};