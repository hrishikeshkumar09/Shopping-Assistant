import React, { useState, useEffect } from 'react';
import { Box, Fab, Paper, IconButton, Fade } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import App from './App';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: null, y: null });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    setDragging(true);
    const widget = document.getElementById('chat-widget-draggable');
    const rect = widget.getBoundingClientRect();
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    setPosition({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  React.useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, offset]);

  return (
    <>
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1300, bgcolor: 'transparent', boxShadow: 'none' }}>
        <Fab color="primary" aria-label="chat" onClick={() => setOpen(true)}>
          <ChatIcon />
        </Fab>
      </Box>
      <Fade in={open} unmountOnExit>
        <Paper
          id="chat-widget-draggable"
          elevation={8}
          onDoubleClick={() => setOpen(false)}
          sx={{
            position: 'fixed',
            left: position.x !== null ? position.x : 'auto',
            top: position.y !== null ? position.y : 'auto',
            bottom: position.x === null ? 90 : 'auto',
            right: position.y === null ? 40 : 'auto',
            width: 420,
            height: 520,
            minWidth: 320,
            minHeight: 400,
            maxWidth: '90vw',
            maxHeight: '90vh',
            resize: 'both',
            overflow: 'auto',
            borderRadius: 3,
            zIndex: 1400,
            display: 'flex',
            flexDirection: 'column',
            boxShadow: 8,
            bgcolor: '#0a2342',
            userSelect: dragging ? 'none' : 'auto',
          }}
        >
          <Box
            className="chat-widget-header"
            sx={{ cursor: 'move', display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, bgcolor: '#0a2342' }}
            onMouseDown={handleMouseDown}
          >
            <Box sx={{ color: '#fff', fontWeight: 700, fontSize: 18, letterSpacing: 1 }}>
              Shopping Assistant
            </Box>
            <IconButton onClick={() => setOpen(false)} sx={{ color: '#fff' }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, overflow: 'auto', px: 1, bgcolor: '#f8fafc', fontFamily: 'Segoe UI, Arial, sans-serif', fontSize: '1.08rem' }}>
            <App isWidget />
          </Box>
        </Paper>
      </Fade>
    </>
  );
}
