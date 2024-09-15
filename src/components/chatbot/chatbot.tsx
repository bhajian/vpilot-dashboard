import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress } from '@mui/material';
import { fetchOpenAIResponse } from '../../utils/openai';

const Chatbot = () => {
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<{ user: string; bot: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message to chat history
    setMessages((prevMessages) => [...prevMessages, { user: input, bot: '' }]);
    setInput('');
    setLoading(true);

    try {
      const responseStream = await fetchOpenAIResponse(input);

      if (!responseStream) {
        console.error('Response stream is empty');
        return;
      }

      const reader = responseStream.getReader();
      let currentBotMessage = '';

      // Read from the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Decode the chunk of data
        const chunk = new TextDecoder().decode(value);

        // Process each line (multiple `data: { ... }` chunks could be in one chunk)
        const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

        for (const line of lines) {
          const jsonStr = line.replace(/^data: /, '').trim();

          // End of stream
          if (jsonStr === '[DONE]') {
            setLoading(false);
            return;
          }

          // Parse the JSON response
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices[0]?.delta?.content || '';

            if (content) {
              currentBotMessage += content;

              // Update the message in the UI as the bot response streams in
              setMessages((prevMessages) => {
                const updatedMessages = [...prevMessages];
                updatedMessages[updatedMessages.length - 1].bot = currentBotMessage;
                return updatedMessages;
              });
            }
          } catch (err) {
            console.error('Failed to parse JSON:', err);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching the response:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      height="100vh"
      bgcolor="#f7f7f8"
    >
      {/* Header */}
      <Box
        component="header"
        p={2}
        bgcolor="white"
        borderBottom="1px solid #e0e0e0"
      >
        <Typography variant="h5" align="center">
          ChatGPT-like Bot
        </Typography>
      </Box>

      {/* Chat area */}
      <Box
        component={Paper}
        elevation={3}
        sx={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#fff',
        }}
      >
        {messages.map((msg, index) => (
          <Box key={index} mb={2}>
            {/* User message */}
            <Box
              display="flex"
              justifyContent="flex-end"
              mb={1}
            >
              <Paper
                sx={{
                  padding: '10px 14px',
                  bgcolor: '#007aff',
                  color: 'white',
                  borderRadius: '18px 18px 0px 18px',
                  maxWidth: '75%',
                  wordBreak: 'break-word',
                }}
              >
                <Typography variant="body1">{msg.user}</Typography>
              </Paper>
            </Box>

            {/* Bot message */}
            <Box
              display="flex"
              justifyContent="flex-start"
              mb={1}
            >
              <Paper
                sx={{
                  padding: '10px 14px',
                  bgcolor: '#f1f1f1',
                  borderRadius: '18px 18px 18px 0px',
                  maxWidth: '75%',
                  wordBreak: 'break-word',
                }}
              >
                <Typography variant="body1">{msg.bot}</Typography>
              </Paper>
            </Box>
          </Box>
        ))}
        <div ref={messageEndRef} />
      </Box>

      {/* Input area */}
      <Box
        component="footer"
        p={2}
        bgcolor="white"
        borderTop="1px solid #e0e0e0"
        display="flex"
      >
        <TextField
          fullWidth
          variant="outlined"
          label="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSendMessage}
          disabled={loading}
          sx={{ ml: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Send'}
        </Button>
      </Box>
    </Box>
  );
};

export default Chatbot;
