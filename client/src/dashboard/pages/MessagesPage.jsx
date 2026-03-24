import { Paperclip, Phone, Search, SendHorizontal } from 'lucide-react';
import Card from '../components/Card.jsx';
import ChatMessage from '../components/ChatMessage.jsx';

function EmptyConversationState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8 text-center">
      <h3 className="text-[46px] font-bold text-[#1f2747]">Brickline Advisor</h3>
      <p className="mt-2 text-[20px] text-[#627093]">Available now</p>
      <p className="mt-4 max-w-4xl text-[20px] text-[#536083]">
        Ask about loan requirements, next steps, documents, timelines, or your application.
      </p>
      <Card className="mt-8 max-w-3xl p-8">
        <div className="mx-auto h-20 w-20 rounded-full bg-gradient-to-br from-[#a8b9d8] to-[#f2d6d2]" />
        <h4 className="mt-5 text-[32px] font-bold text-[#1f2747]">Brickline Advisor</h4>
        <p className="text-[18px] text-[#637194]">Available now</p>
        <p className="mt-4 text-[17px] leading-relaxed text-[#4f5b7d]">
          I am here to help with loan requests, required documents, next steps, and general
          questions about your application.
        </p>
        <button className="topbar-btn mt-6 !rounded-xl !px-10 !py-3">Start Conversation</button>
        <div className="mt-6 grid grid-cols-2 gap-3 text-left">
          {['What do I need to submit?', 'What’s my next step?', 'Help me start a loan request', 'Explain the process'].map((question) => (
            <button
              key={question}
              className="rounded-xl border border-[#dbe2f1] bg-white px-4 py-3 text-[16px] font-semibold text-[#32426a]"
            >
              {question}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function ActiveConversationState({ thread, chatMessages }) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-[#e7ebf4] px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#a8b9d8] to-[#f2d6d2]" />
          <div>
            <h4 className="text-[24px] font-bold text-[#222c51]">{thread.name}</h4>
            <p className="text-[16px] text-[#647295]">{thread.status}</p>
          </div>
        </div>
        <button className="rounded-lg p-2 text-[#6d7899] hover:bg-[#f2f5fb]">
          <Phone />
        </button>
      </div>
      <div className="h-[620px] overflow-y-auto px-6 py-6">
        {chatMessages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
      <div className="flex items-center gap-3 border-t border-[#e7ebf4] px-6 py-4">
        <Paperclip className="text-[#7782a4]" />
        <input
          className="h-12 flex-1 rounded-xl border border-[#dfe4f0] px-4 text-[16px] placeholder:text-[#8c95b3]"
          placeholder="Type a message..."
        />
        <button className="rounded-xl bg-[#2e54e9] p-3 text-white">
          <SendHorizontal />
        </button>
      </div>
    </>
  );
}

export default function MessagesPage({ threads, chatMessages }) {
  const activeThread = threads[0];

  return (
    <section>
      <div className="mb-4">
        <h1 className="section-title">Messages</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="overflow-hidden xl:col-span-3">
          <div className="border-b border-[#e7ebf4] p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7c87a9]" />
              <input
                className="h-11 w-full rounded-xl border border-[#dbe2ef] pl-10 pr-3 text-[15px] placeholder:text-[#9199b5]"
                placeholder="Search..."
              />
            </div>
          </div>
          <div className="bg-[#f4f7fd] p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-[#a8b9d8] to-[#f2d6d2]" />
              <div>
                <p className="text-[18px] font-semibold text-[#253056]">{activeThread.name}</p>
                <p className="text-[14px] text-[#6c7898]">{activeThread.status}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden xl:col-span-9">
          <ActiveConversationState thread={activeThread} chatMessages={chatMessages} />
        </Card>
      </div>
    </section>
  );
}
