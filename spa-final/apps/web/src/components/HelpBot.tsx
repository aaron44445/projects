'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Sparkles, ChevronDown } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const quickQuestions = [
  'How do I create a campaign?',
  'How do I add a new client?',
  'How do I set up online booking?',
  'How do I process payments?',
  'How do I view reports?',
  'How do I manage staff schedules?',
];

// Knowledge base for the help bot
const knowledgeBase: Record<string, string> = {
  // Marketing
  'campaign': `To create a marketing campaign:

1. Go to **Marketing** in the sidebar
2. Click **"New Campaign"** or choose a campaign type (Email, SMS, or Automation)
3. Fill in the campaign details:
   - Campaign name
   - Select your audience (all clients, new clients, inactive clients, etc.)
   - Write your message
   - Set send time (now or scheduled)
4. Click **"Send"** or **"Schedule"**

Pro tip: Use merge tags like {{first_name}} to personalize messages!`,

  'email': `To send an email campaign:

1. Go to **Marketing** > Click **"Email Campaign"**
2. Choose a template or start from scratch
3. Add your subject line and email content
4. Select recipients (you can filter by last visit, service type, etc.)
5. Preview your email, then send or schedule

Your emails will include an unsubscribe link automatically for compliance.`,

  'sms': `To send SMS messages:

1. Go to **Marketing** > Click **"SMS Campaign"**
2. Write your message (160 characters recommended)
3. Select recipients
4. Send immediately or schedule for later

Note: SMS costs are based on your plan. Each message costs approximately $0.01-0.02.`,

  'automation': `To set up automated campaigns:

1. Go to **Marketing** > Click **"Automation"**
2. Choose a trigger:
   - Welcome new clients
   - Birthday messages
   - Re-engage inactive clients
   - Post-appointment follow-up
   - Review requests
3. Set timing (e.g., send 1 day after trigger)
4. Create your message
5. Activate the automation

Automations run continuously until you pause them.`,

  // Clients
  'client': `To add a new client:

1. Go to **Clients** in the sidebar
2. Click **"Add Client"**
3. Enter their details:
   - Name and contact info
   - Notes (allergies, preferences, etc.)
4. Click **"Save"**

Clients are also added automatically when they book online or you create an appointment for them.`,

  // Booking
  'booking': `To set up online booking:

1. Go to **Settings** > **Online Booking**
2. Customize your booking page:
   - Add your logo and brand colors
   - Set booking rules (lead time, cancellation policy)
   - Choose which services are bookable online
3. Copy your booking link and share it:
   - Add to your website
   - Share on social media
   - Include in your email signature

Clients can book 24/7 and you'll get notifications!`,

  'online': `Your online booking page lets clients self-book appointments:

**Setup:**
1. Settings > Online Booking
2. Enable "Accept Online Bookings"
3. Set your booking lead time (how far in advance clients can book)
4. Set your cancellation policy

**Sharing:**
- Your booking link is: peacase.com/your-business-name
- Add it to your website, Instagram bio, or share directly with clients`,

  // Payments
  'payment': `To set up payment processing:

1. Go to **Settings** > **Payments**
2. Click **"Connect Stripe"** to link your Stripe account
3. Once connected, you can:
   - Accept card payments at checkout
   - Require deposits for online bookings
   - Enable tips
   - Send payment links

Funds are deposited to your bank account within 2 business days.`,

  // Reports
  'report': `To view your business reports:

1. Go to **Reports** in the sidebar
2. Select a date range (This Week, This Month, Custom)
3. View key metrics:
   - Revenue breakdown
   - Top services
   - Staff performance
   - Client retention

You can export reports to PDF or CSV for your accountant.`,

  // Staff
  'staff': `To manage staff schedules:

1. Go to **Staff** in the sidebar
2. Click on a team member
3. Set their:
   - Working hours
   - Days off
   - Services they provide
   - Commission rates

Staff can also download the Peacase app to view their schedules and check in clients.`,

  'schedule': `To manage schedules:

**Staff schedules:**
1. Go to Staff > Click a team member > Edit Schedule
2. Set their working days and hours
3. Block off time for breaks or meetings

**Your calendar:**
1. Go to Calendar
2. Click any time slot to create an appointment
3. Drag appointments to reschedule
4. Right-click to cancel or edit`,

  // Gift Cards
  'gift': `To sell gift cards:

1. Go to **Gift Cards** in the sidebar
2. Click **"Create Gift Card"**
3. Set the amount and (optional) recipient
4. Send via email or print

**Online sales:**
- Share your gift card store link with clients
- They can purchase and send gift cards to friends
- Gift cards are automatically tracked and can be redeemed at checkout`,

  // Packages
  'package': `To create service packages:

1. Go to **Packages** in the sidebar
2. Click **"Create Package"**
3. Set up the package:
   - Name and description
   - Services included
   - Price (with discount)
   - Validity period
4. Clients can purchase packages and redeem services over time`,

  'membership': `To create memberships:

1. Go to **Packages** > **Memberships** tab
2. Click **"Create Membership"**
3. Configure:
   - Monthly price
   - Included services per month
   - Member discounts
4. Members are billed automatically each month

Great for building recurring revenue!`,

  // Reviews
  'review': `To collect client reviews:

1. Reviews are requested automatically after appointments
2. Go to **Reviews** to see all feedback
3. Respond to reviews to show you care
4. Publish positive reviews to your booking page

You can customize when review requests are sent in Settings > Notifications.`,

  // General
  'help': `I'm here to help you with:

- **Marketing** - Create email/SMS campaigns
- **Booking** - Set up online booking
- **Payments** - Accept card payments
- **Clients** - Manage your client list
- **Staff** - Set schedules and permissions
- **Reports** - View business analytics

Just ask me a question like "How do I create a campaign?" and I'll guide you through it!`,

  'start': `Welcome to Peacase! Here's how to get started:

1. **Add your services** - Go to Services and add what you offer
2. **Add your team** - Go to Staff and add team members
3. **Set up booking** - Go to Settings > Online Booking
4. **Start accepting clients!**

Need help with anything specific? Just ask!`,
};

function findAnswer(question: string): string {
  const q = question.toLowerCase();

  // Check for keywords in the question
  for (const [keyword, answer] of Object.entries(knowledgeBase)) {
    if (q.includes(keyword)) {
      return answer;
    }
  }

  // Default response
  return `I can help you with:

- Creating marketing campaigns
- Setting up online booking
- Processing payments
- Managing clients and staff
- Viewing reports
- Gift cards and packages

Try asking something like:
- "How do I create a campaign?"
- "How do I set up online booking?"
- "How do I add a client?"`;
}

export function HelpBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your Peacase assistant. How can I help you today? Ask me anything about using the platform!",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate typing delay
    await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));

    const answer = findAnswer(input);

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: answer,
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsTyping(false);
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    setTimeout(() => {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: question,
      };
      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      setTimeout(() => {
        const answer = findAnswer(question);
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: answer,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsTyping(false);
      }, 500 + Math.random() * 500);
    }, 100);
    setInput('');
  };

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-br from-sage to-sage-dark text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center ${
          isOpen ? 'scale-0' : 'scale-100'
        }`}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-2xl shadow-2xl border border-charcoal/10 overflow-hidden transition-all duration-300 ${
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-sage to-sage-dark p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Peacase Assistant</h3>
              <p className="text-white/80 text-sm">Ask me anything</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="h-80 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-sage text-white rounded-br-md'
                    : 'bg-charcoal/5 text-charcoal rounded-bl-md'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-charcoal/5 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-charcoal/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-charcoal/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-charcoal/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length <= 2 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-charcoal/50 mb-2">Quick questions:</p>
            <div className="flex flex-wrap gap-2">
              {quickQuestions.slice(0, 3).map((q) => (
                <button
                  key={q}
                  onClick={() => handleQuickQuestion(q)}
                  className="px-3 py-1.5 bg-charcoal/5 hover:bg-charcoal/10 rounded-full text-xs text-charcoal transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-charcoal/10">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..."
              className="flex-1 px-4 py-3 bg-charcoal/5 rounded-xl border-0 outline-none focus:ring-2 focus:ring-sage/20 text-sm"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-3 bg-sage text-white rounded-xl hover:bg-sage-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
