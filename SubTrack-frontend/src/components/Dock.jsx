import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Bot, Check, Loader2, Send, Sparkles, X } from 'lucide-react';
import { sendSpendAdvisorMessage } from '../services/aiAssistant';

const ACTION_OPTIONS = [
  { id: 'create', label: 'Create subscriptions' },
  { id: 'add', label: 'Add services' },
  { id: 'update', label: 'Update details' },
  { id: 'delete', label: 'Cancel subscriptions' }
];

const REQUIRED_FIELDS = ['company', 'billing_cycle', 'next_billing_date', 'amount', 'currency'];

const TYPE_ALIASES = {
  add: 'create',
  create: 'create',
  new: 'create',
  onboard: 'create',
  register: 'create',
  update: 'update',
  edit: 'update',
  modify: 'update',
  change: 'update',
  adjust: 'update',
  delete: 'delete',
  remove: 'delete',
  cancel: 'delete'
};

const isPresent = (value) => value !== undefined && value !== null && value !== '';

const toNumber = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalised = value.trim().toLowerCase();
    if (['true', 'yes', 'y', 'active', '1', 'enable', 'enabled'].includes(normalised)) return true;
    if (['false', 'no', 'n', 'inactive', '0', 'disable', 'disabled'].includes(normalised)) return false;
  }
  return null;
};

const toDateString = (value) => {
  if (!isPresent(value)) return null;
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  const asString = String(value).trim();
  if (!asString) return null;

  const timestamp = Date.parse(asString);
  if (!Number.isNaN(timestamp)) {
    return new Date(timestamp).toISOString().split('T')[0];
  }

  return asString;
};

const normaliseType = (type = '') => {
  const normalised = String(type).trim().toLowerCase();
  return TYPE_ALIASES[normalised] || normalised;
};

const extractActionId = (action) => {
  if (!action || typeof action !== 'object') return null;
  const candidates = [
    action.id,
    action.subscription_id,
    action.subscriptionId,
    action.target?.id,
    action.subscription?.id,
    action.data?.id,
    action.payload?.id,
    action.details?.id,
    action.changes?.id
  ];

  for (const candidate of candidates) {
    if (isPresent(candidate)) {
      return candidate;
    }
  }

  return null;
};

const getActionData = (action) => {
  if (!action || typeof action !== 'object') return null;
  return action.data ?? action.payload ?? action.subscription ?? action.details ?? action.changes ?? action.update ?? null;
};

const getActionSummary = (action) => {
  if (!action || typeof action !== 'object') return 'Requested change';
  return (
    action.summary ||
    action.title ||
    action.description ||
    action.message ||
    (action.type ? `${action.type} subscription` : 'Subscription change')
  );
};

const hasObjectContent = (value) => {
  if (!value || typeof value !== 'object') return false;
  return Object.keys(value).length > 0;
};

const normaliseSubscriptionPayload = (data = {}, fallback = {}) => {
  const output = {
    ...fallback
  };

  const assign = (target, keys, transform) => {
    for (const key of keys) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) continue;
      const candidate = data[key];
      if (!isPresent(candidate)) continue;
      output[target] = transform ? transform(candidate) : candidate;
      return;
    }
  };

  assign('company', ['company', 'service', 'provider', 'name']);
  assign('category', ['category', 'segment']);
  assign('billing_cycle', ['billing_cycle', 'billingCycle', 'cycle', 'interval'], (value) => String(value).toLowerCase());
  assign('next_billing_date', ['next_billing_date', 'nextBillingDate', 'billing_date', 'billingDate', 'date', 'starts'], toDateString);
  assign('amount', ['amount', 'price', 'cost', 'value'], (value) => toNumber(value));
  assign('currency', ['currency']);
  assign('notes', ['notes', 'note', 'description', 'details'], (value) => String(value));
  assign('is_active', ['is_active', 'isActive', 'active', 'status'], (value) => {
    const booleanValue = toBoolean(value);
    if (booleanValue === null) {
      return fallback?.is_active ?? true;
    }
    return booleanValue;
  });

  if (!Object.prototype.hasOwnProperty.call(output, 'is_active')) {
    output.is_active = fallback?.is_active ?? true;
  }

  if (output.amount !== undefined) {
    const numeric = toNumber(output.amount);
    output.amount = numeric !== null ? numeric : fallback?.amount ?? null;
  }

  if (output.next_billing_date) {
    output.next_billing_date = toDateString(output.next_billing_date);
  }

  if (output.billing_cycle) {
    output.billing_cycle = String(output.billing_cycle).toLowerCase();
  }

  delete output.id;
  delete output.user_id;
  delete output.userId;

  return output;
};

const INITIAL_MESSAGES = [
  {
    role: 'assistant',
    content:
      "Hi! I'm your AI assistant. Ask me to review your subscriptions or request changes. I'll suggest updates and you can approve them before anything changes.",
    suggestions: [
      'Help me reduce my monthly costs',
      'Suggest subscriptions I should cancel',
      'Add a new subscription for our design tool'
    ],
    actions: []
  }
];

export default function Dock({ onCreate, onUpdate, onDelete, subscriptions = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [goal, setGoal] = useState('Keep my subscription spend under control');
  const [selectedActions, setSelectedActions] = useState(['create', 'add', 'update', 'delete']);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [actionStatus, setActionStatus] = useState({});
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  const subscriptionMap = useMemo(() => {
    const map = new Map();
    subscriptions.forEach((sub) => {
      const id = sub?.id ?? sub?.subscription_id ?? sub?.subscriptionId;
      if (!isPresent(id)) return;
      map.set(String(id), {
        company: sub.company ?? sub.service ?? '',
        category: sub.category ?? '',
        billing_cycle: (sub.billing_cycle ?? sub.billingCycle ?? 'monthly').toLowerCase(),
        next_billing_date: sub.next_billing_date ?? sub.nextBillingDate ?? '',
        amount: toNumber(sub.amount) ?? 0,
        currency: sub.currency ?? 'USD',
        notes: sub.notes ?? '',
        is_active: sub.is_active ?? sub.isActive ?? true
      });
    });
    return map;
  }, [subscriptions]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  const toggleActionOption = (id) => {
    setSelectedActions((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const formattedHistory = useMemo(
    () =>
      messages
        .filter((msg) => msg.role === 'assistant' || msg.role === 'user')
        .map((msg) => ({ role: msg.role, content: msg.content })),
    [messages]
  );

  const canSend = message.trim().length > 0 && !isSending;

  const performAction = async (action) => {
    const type = normaliseType(action?.type || action?.name || action?.action || '');

    if (type === 'create') {
      if (typeof onCreate !== 'function') {
        throw new Error('Creating subscriptions is not supported in this view.');
      }

      const payload = normaliseSubscriptionPayload(getActionData(action) || {}, {
        is_active: true,
        billing_cycle: 'monthly',
        currency: 'USD'
      });

      const missing = REQUIRED_FIELDS.filter((field) => !isPresent(payload[field]));
      if (missing.length > 0) {
        throw new Error(`The assistant did not provide enough details. Missing: ${missing.join(', ')}.`);
      }

      await onCreate(payload);
      return `Created subscription: ${payload.company || 'new subscription'}.`;
    }

    if (type === 'update') {
      if (typeof onUpdate !== 'function') {
        throw new Error('Updating subscriptions is not supported in this view.');
      }

      const identifier = extractActionId(action);
      if (!isPresent(identifier)) {
        throw new Error('The assistant did not specify which subscription to update.');
      }

      const idKey = String(identifier);
      const existing = subscriptionMap.get(idKey);
      if (!existing) {
        throw new Error('The targeted subscription is not in the current list. Try refreshing your subscriptions first.');
      }

      const payload = normaliseSubscriptionPayload(getActionData(action) || {}, existing);
      const missing = REQUIRED_FIELDS.filter((field) => !isPresent(payload[field]));
      if (missing.length > 0) {
        throw new Error(`The assistant is missing details after merging. Missing: ${missing.join(', ')}.`);
      }

      const numericId = Number(identifier);
      const updateId = Number.isNaN(numericId) ? identifier : numericId;
      await onUpdate(updateId, payload);
      return `Updated subscription ${existing.company || identifier}.`;
    }

    if (type === 'delete') {
      if (typeof onDelete !== 'function') {
        throw new Error('Deleting subscriptions is not supported in this view.');
      }

      const identifier = extractActionId(action);
      if (!isPresent(identifier)) {
        throw new Error('The assistant did not specify which subscription to delete.');
      }

      const numericId = Number(identifier);
      const deleteId = Number.isNaN(numericId) ? identifier : numericId;
      await onDelete(deleteId);
      return `Deleted subscription ${identifier}.`;
    }

    if (!type) {
      throw new Error('The assistant returned an unknown action.');
    }

    throw new Error(`Unsupported action type "${action?.type || type}".`);
  };

  const handleConfirmAction = async (action, messageIndex, actionIndex) => {
    const key = `${messageIndex}-${actionIndex}`;
    if (actionStatus[key] === 'pending') return;

    setActionStatus((prev) => ({ ...prev, [key]: 'pending' }));
    try {
      const summary = await performAction(action);
      setActionStatus((prev) => ({ ...prev, [key]: 'success' }));
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: summary,
          suggestions: [],
          actions: []
        }
      ]);
    } catch (err) {
      console.error('Assistant action failed:', err);
      setActionStatus((prev) => ({ ...prev, [key]: 'error' }));
      setMessages((prev) => [
        ...prev,
        {
          role: 'system',
          content: `Unable to complete "${getActionSummary(action)}": ${err.message || 'Unexpected error.'}`,
          suggestions: [],
          actions: []
        }
      ]);
    }
  };

  const handleSend = async () => {
    if (!canSend) return;

    const trimmed = message.trim();
    const userMessage = { role: 'user', content: trimmed };

    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setIsSending(true);
    setError('');

    try {
      const response = await sendSpendAdvisorMessage({
        message: trimmed,
        goal,
        actions: selectedActions,
        history: formattedHistory.concat(userMessage),
        locale: navigator.language
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            response.reply ||
            "I'm still thinking about that... Try rephrasing your question in a different way.",
          suggestions: response.suggestions || [],
          actions: response.actions || [],
          confidence: response.confidence ?? null
        }
      ]);
    } catch (err) {
      console.error('Spend assistant error:', err);
      setError(err.response?.data?.message || 'Failed to contact the AI assistant. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggestion = (suggestion) => {
    setMessage(suggestion);
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) {
        handleSend();
      }
    }
  };

  const renderAction = (action, messageIndex, actionIndex) => {
    const key = `${messageIndex}-${actionIndex}`;
    const status = actionStatus[key] || 'idle';
    const type = normaliseType(action?.type || action?.name || action?.action || '');

    return (
      <div key={key} className="border border-base-300 rounded-lg p-3 bg-base-100 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-sm font-semibold capitalize">{type || 'Action'}</p>
            <p className="text-xs text-base-content/70">{getActionSummary(action)}</p>
          </div>
          <button
            type="button"
            className="btn btn-xs btn-primary"
            onClick={() => handleConfirmAction(action, messageIndex, actionIndex)}
            disabled={status === 'pending' || status === 'success'}
          >
            {status === 'pending' ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Working...</span>
              </>
            ) : status === 'success' ? (
              <>
                <Check className="w-3 h-3" />
                <span>Done</span>
              </>
            ) : (
              'Confirm'
            )}
          </button>
        </div>

        {status === 'error' && (
          <div className="flex items-center gap-2 text-xs text-error">
            <AlertCircle className="w-3 h-3" />
            <span>Action failed. Check the latest system note for details.</span>
          </div>
        )}

        {hasObjectContent(action) && (
          <details className="text-xs">
            <summary className="cursor-pointer text-base-content/60">View action details</summary>
            <pre className="mt-2 bg-base-200 rounded p-2 max-h-36 overflow-auto text-[10px] leading-relaxed">
              {JSON.stringify(action, null, 2)}
            </pre>
          </details>
        )}
      </div>
    );
  };

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-50">
      {isOpen && (
        <div className="w-[22rem] sm:w-96 max-w-[calc(100vw-3rem)] bg-base-100 border border-base-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-base-200 bg-base-100/80">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-full bg-primary/10 text-primary">
                <Bot className="w-5 h-5" />
              </span>
              <div>
                <p className="font-semibold text-sm">AI Subscription Assistant</p>
                <p className="text-xs text-base-content/60">Ask questions or request subscription changes.</p>
              </div>
            </div>
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="px-4 py-3 space-y-3 border-b border-base-200 bg-base-100/60">
            <div className="space-y-2">
              <label className="text-xs font-medium text-base-content/70" htmlFor="assistant-goal">Focus for the assistant</label>
              <input
                id="assistant-goal"
                type="text"
                className="input input-sm input-bordered w-full"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="Describe what you want to achieve"
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-base-content/70">Allow the assistant to</p>
              <div className="flex flex-wrap gap-2">
                {ACTION_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => toggleActionOption(option.id)}
                    className={`btn btn-xs ${selectedActions.includes(option.id) ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-base-100">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-full rounded-2xl px-4 py-3 text-sm shadow-sm border ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-content border-primary/80'
                      : msg.role === 'assistant'
                        ? 'bg-base-100 text-base-content border-base-200'
                        : 'bg-base-200/70 text-base-content border-base-300'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {msg.confidence !== undefined && msg.confidence !== null && (
                    <p className="mt-2 text-[10px] uppercase tracking-wide text-base-content/60">
                      Confidence: {(msg.confidence * 100).toFixed(0)}%
                    </p>
                  )}

                  {Array.isArray(msg.suggestions) && msg.suggestions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold flex items-center gap-1 text-base-content/70">
                        <Sparkles className="w-3 h-3" /> Try asking
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {msg.suggestions.map((suggestion, suggestionIndex) => (
                          <button
                            key={suggestionIndex}
                            type="button"
                            className="btn btn-xs btn-outline"
                            onClick={() => handleSuggestion(suggestion)}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {Array.isArray(msg.actions) && msg.actions.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold text-base-content/70">Recommended actions</p>
                      <div className="space-y-2">
                        {msg.actions.map((action, actionIndex) => renderAction(action, index, actionIndex))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="px-4 py-2 text-sm text-error bg-error/10 border-t border-error/20 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="px-4 py-3 border-t border-base-200 bg-base-100 space-y-2">
            <textarea
              ref={inputRef}
              className="textarea textarea-bordered w-full h-24"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Ask for insights or request a change. Press Enter to send."
            />
            <div className="flex items-center justify-between text-xs text-base-content/60">
              <span>Shift + Enter for a new line</span>
              <button
                type="button"
                className="btn btn-primary btn-sm"
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
                    Send
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        className="btn btn-circle btn-primary shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Bot className="w-6 h-6" />}
      </button>
    </div>
  );
}
