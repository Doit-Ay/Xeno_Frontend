import { NextResponse } from 'next/server';
import { handleLocalCommand } from '../../../../lib/chatCommands';
import { api } from '../../../../lib/api';

export async function POST(request) {
  try {
    const body = await request.json();
    const { message, conversationId, history } = body;

    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    // 1. Try local command handler first (saves AI credits & is faster)
    const localResult = await handleLocalCommand(message);
    if (localResult.handled) {
      return NextResponse.json({
        reply: localResult.content,
        action: localResult.action || null,
        source: 'local',
      });
    }

    // 2. Fall back to AI backend — pass conversationId and history for multi-turn context
    const aiResponse = await api.chat(message, conversationId);
    
    return NextResponse.json({
      reply: aiResponse.response,
      action: aiResponse.actions && aiResponse.actions.length > 0 ? aiResponse.actions[0] : null,
      conversationId: aiResponse.conversationId,
      model: aiResponse.model,
      source: 'ai',
    });

  } catch (error) {
    console.error('Copilot API Error:', error);
    return NextResponse.json(
      { reply: "Sorry, I encountered an error connecting to the copilot service. Please ensure the backend server is running.", error: error.message },
      { status: 500 }
    );
  }
}
