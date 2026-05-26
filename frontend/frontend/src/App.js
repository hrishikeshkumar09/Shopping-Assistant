import ReactMarkdown from 'react-markdown';
import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, CircularProgress, Card, CardContent, Grid, Avatar, Stack } from '@mui/material';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import PersonIcon from '@mui/icons-material/Person';

function ProductCard({ product }) {
  return (
    <Card sx={{ minWidth: 240, m: 1, background: '#f9f9f9', borderRadius: 3, boxShadow: 2 }} variant="outlined">
      <CardContent>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>{product.name}</Typography>
        <Typography variant="subtitle2" color="text.secondary">{product.brand} &bull; {product.subCategory}</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>{Array.isArray(product.features) ? product.features.join(', ') : product.features}</Typography>
        <Typography variant="body2" color="text.secondary">{product.use_case && Array.isArray(product.use_case) ? product.use_case.join(', ') : product.use_case}</Typography>
        <Typography variant="body1" sx={{ mt: 1, fontWeight: 700, color: 'primary.main' }}>${product.price}</Typography>
        {product.rating && <Typography variant="caption" color="text.secondary">Rating: {product.rating}</Typography>}
      </CardContent>
    </Card>
  );
}
function ChatBubble({ sender, text, products }) {
  return (
    <Box sx={{ display: 'flex', width: '100%', justifyContent: sender === 'user' ? 'flex-end' : 'flex-start', mb: 2 }}>
      <Stack direction="row" spacing={2} alignItems="flex-end">
        {sender !== 'user' && (
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <ShoppingBagIcon fontSize="large" />
          </Avatar>
        )}
        <Paper elevation={3} sx={{ p: 2.5, maxWidth: 600, borderRadius: 4, bgcolor: sender === 'user' ? 'primary.main' : '#fff', color: sender === 'user' ? '#fff' : '#222', boxShadow: 3, fontSize: '1.15rem' }}>
          <Typography variant="body1" component="div" sx={{ whiteSpace: 'pre-line', fontSize: '1 rem', '& p': { margin: 0 }, '& ul, & ol': { margin: 0, paddingLeft: '1.2em' }, lineHeight: 1.3 }}>
            {typeof text === 'string' ? <ReactMarkdown>{text}</ReactMarkdown> : text}
          </Typography>
          {products && products.length > 0 && (
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {products.map((p, i) => (
                <Grid item key={i} xs={12} sm={6} md={4}>
                  <ProductCard product={p} />
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
        {sender === 'user' && (
          <Avatar sx={{ bgcolor: '#1976d2', width: 48, height: 48 }}>
            <PersonIcon fontSize="large" />
          </Avatar>
        )}
      </Stack>
    </Box>
  );
}


function App({ isWidget }) {
  const [messages, setMessages] = useState([
    { sender: 'assistant', text: '👋 Welcome to Shopping Assistant!\n\nType your shopping needs below.\n\nExample instructions you can try:\n- I want to buy a phone\n- Show me budget laptops\n- Suggest something for a gift\n- I want a smartwatch for fitness\n- Show me something in red color\n- Give me any one\n\nI will recommend the best products for you!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState({});
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { sender: 'user', text: input };
    setMessages(msgs => [...msgs, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(process.env.REACT_APP_API_URL + '/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input, context })
      });
      const data = await res.json();
      setMessages(msgs => [...msgs, { sender: 'assistant', text: data.reply, products: data.products }]);
      setContext(data.context || {});
    } catch (e) {
      setMessages(msgs => [...msgs, { sender: 'assistant', text: 'Sorry, something went wrong.' }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <Box sx={{
    bgcolor: isWidget ? '#f8fafc' : 'linear-gradient(135deg, #e3f2fd 0%, #f0f2f5 100%)',
    minHeight: isWidget ? undefined : '100vh',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: isWidget ? '100%' : undefined,
    maxWidth: isWidget ? '100%' : 950,
    mx: isWidget ? undefined : 'auto',
    pt: isWidget ? 1 : 4,
    pb: 2,
    overflow: 'hidden',
  }}>
        {!isWidget && (
          <Paper elevation={4} sx={{ mb: 3, borderRadius: 3, p: 2, bgcolor: 'primary.main', color: '#fff', textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: 1 }}>
              <ShoppingBagIcon sx={{ mr: 1, fontSize: 36, verticalAlign: 'middle' }} /> Shopping Assistant
            </Typography>
          </Paper>
        )}
        <Box sx={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {messages.map((msg, idx) => (
            <ChatBubble key={idx} sender={msg.sender} text={msg.text} products={msg.products} />
          ))}
          {loading && <ChatBubble sender="assistant" text={<CircularProgress size={20} />} />}
          <div ref={chatEndRef} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', bgcolor: '#fff', borderRadius: 3, p: 2, boxShadow: 2, position: 'sticky', bottom: 0, mt: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            size="medium"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            sx={{ fontSize: '1.1rem' }}
          />
          <Button variant="contained" onClick={sendMessage} disabled={loading || !input.trim()} sx={{ minWidth: 120, fontWeight: 600, fontSize: '1.1rem', py: 1.2 }}>
            Send
          </Button>
        </Box>
    </Box>
  );
}

export default App;