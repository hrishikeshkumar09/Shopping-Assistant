from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from typing import Optional, Dict, Any
from pydantic import BaseModel
from assistant import get_assistant_response  # Import your function

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None


@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    reply, products, context = get_assistant_response(req.message, req.context)
    return {"reply": reply, "products": products, "context": context}