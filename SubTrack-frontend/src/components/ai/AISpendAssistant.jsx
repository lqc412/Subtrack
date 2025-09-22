import { useMemo, useState } from 'react';
import { Bot, Sparkles, Send, Loader2, Target, Lightbulb } from 'lucide-react';
import { sendSpendAdvisorMessage } from '../../services/aiAssistant';

const ACTION_OPTIONS = [
  { id: 'remove', label: 'Remove unused services' },
  { id: 'downgrade', label: 'Downgrade expensive plans' },
  { id: 'add', label: 'Add high-value replacements' },
  { id: 'renegotiate', label: 'Find negotiation opportunities' }
];

export default function AISpendAssistant({ monthlyTotal = 0 }) {
  const [goal, setGoal] = useState('Reduce my monthly subscription spending');
  const [message, setMessage] = useState('Where should I start?');
  const [selectedActions, setSelectedActions] = useState(['remove', 'downgrade']);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hi! I\'m your LangGraph-powered spend advisor. Tell me what you\'d like to achieve this month and I\'ll help you plan actionable steps.',
      suggestions: [],
      confidence: null
    }
  ]);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [metadata, setMetadata] = useState(null);

  const toggleAction = (id) => {
    setSelectedActions(prev =>
      prev.includes(id)
        ? prev.filter(action => action !== id)
        : [...prev, id]
    );
  };

  const canSend = message.trim().length > 0 && !isSending;

  const formattedHistory = useMemo(
    () => messages.map(msg => ({ role: msg.role, content: msg.content })),
    [messages]
  );

  const fallbackMonthly = useMemo(() => {
    const parsed = typeof monthlyTotal === 'number' ? monthlyTotal : parseFloat(monthlyTotal);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [monthlyTotal]);

  const displayMonthly = metadata?.monthlyTotal ?? fallbackMonthly;
  const displayYearly = metadata?.yearlyTotal ?? Number((displayMonthly || 0) * 12);
  const selectedActionLabels = ACTION_OPTIONS.filter(option => selectedActions.includes(option.id)).map(option => option.label);

  const handleSend = async () => {
    if (!canSend) return;

    const userMessage = { role: 'user', content: message.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setMessage('');
    setIsSending(true);
    setError('');

    try {
      const response = await sendSpendAdvisorMessage({
        message: userMessage.content,
        goal,
        actions: selectedActions,
        history: formattedHistory.concat(userMessage),
        locale: navigator.language
      });

      setMetadata(response.metadata || null);

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.reply || 'I\'m still thinking about that... try asking again in a moment.',
          suggestions: response.suggestions || [],
          confidence: response.confidence || null,
          actions: response.actions || []
        }
      ]);
    } catch (err) {
      console.error('Spend advisor error:', err);
      setError(err.response?.data?.message || 'Failed to contact the AI assistant. Please try again later.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-base-100 shadow rounded-lg p-6 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <Bot size={22} />
          </div>
          <div>
            <h2 className="text-xl font-semibold">AI Spend Advisor</h2>
            <p className="text-sm text-base-content/60">
              Powered by LangGraph to analyse subscriptions and optimise your monthly spending.
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="badge badge-outline">
            Monthly: ${displayMonthly.toFixed(2)}
          </div>
          <div className="badge badge-outline">
            Yearly: ${displayYearly.toFixed(2)}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="form-control w-full">
          <span className="label-text font-medium flex items-center gap-2">
            <Target size={16} /> Monthly goal
          </span>
          <input
            type="text"
            className="input input-bordered"
            value={goal}
            onChange={e => setGoal(e.target.value)}
            placeholder="Set a focus for this month"
          />
        </label>
        <div>
          <span className="label-text font-medium flex items-center gap-2 mb-2">
            <Lightbulb size={16} /> Focus areas
          </span>
          <div className="flex flex-wrap gap-2">
            {ACTION_OPTIONS.map(option => (
              <button
                key={option.id}
                type="button"
                onClick={() => toggleAction(option.id)}
                className={`btn btn-sm ${selectedActions.includes(option.id) ? 'btn-primary' : 'btn-outline'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-base-200 rounded-lg p-4 h-72 overflow-y-auto space-y-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 text-sm shadow ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-content'
                  : 'bg-base-100 text-base-content'
              }`}
            >
              <p className="whitespace-pre-line">{msg.content}</p>
              {msg.confidence !== null && (
                <div className="mt-2 text-xs opacity-70">
                  Confidence: {(msg.confidence * 100).toFixed(0)}%
                </div>
              )}
              {msg.suggestions && msg.suggestions.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold flex items-center gap-1">
                    <Sparkles size={14} /> Suggestions
                  </p>
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    {msg.suggestions.map((suggestion, suggestionIndex) => (
                      <li key={suggestionIndex}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center text-sm text-base-content/60">
            Ask the assistant how to optimise your subscriptions this month.
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-3">
        <textarea
          className="textarea textarea-bordered w-full"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask for advice, e.g. ‘Help me cut $50 from my recurring spend.’"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-base-content/60">
            Selected focus: {selectedActionLabels.length > 0 ? selectedActionLabels.join(', ') : 'none'}
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSend}
            disabled={!canSend}
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Ask Advisor
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
