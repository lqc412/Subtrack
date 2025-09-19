/**
 * LangGraph AI integration helper.
 * This service wraps calls to external LangGraph agents used for
 * email subscription detection and the spending coach chatbot.
 */
class LangGraphAgentService {
  constructor() {
    this.baseUrl = process.env.LANGGRAPH_API_URL || '';
    this.apiKey = process.env.LANGGRAPH_API_KEY || '';
    this.emailAgentId = process.env.LANGGRAPH_EMAIL_AGENT_ID || '';
    this.chatAgentId = process.env.LANGGRAPH_CHAT_AGENT_ID || '';
    this.defaultTimeoutMs = Number(process.env.LANGGRAPH_TIMEOUT_MS || 15000);
  }

  /**
   * Whether the LangGraph service has been configured.
   */
  isEnabled() {
    return Boolean(this.baseUrl && this.apiKey);
  }

  /**
   * Whether an agent dedicated to email analysis is available.
   */
  hasEmailAgent() {
    return this.isEnabled() && Boolean(this.emailAgentId);
  }

  /**
   * Whether the spending coach chatbot agent is configured.
   */
  hasChatAgent() {
    return this.isEnabled() && Boolean(this.chatAgentId);
  }

  /**
   * Perform a request to a LangGraph agent and return the JSON payload.
   *
   * The service expects a LangSmith-compatible LangGraph deployment
   * that exposes an `/agents/{id}/invoke` endpoint.
   */
  async callAgent(agentId, input, { signal } = {}) {
    if (!this.isEnabled()) {
      console.warn('LangGraph agent requested but service is not configured');
      return null;
    }

    if (!agentId) {
      console.warn('LangGraph agent requested without providing an agent ID');
      return null;
    }

    const controller = signal ? null : new AbortController();
    const timeoutMs = this.defaultTimeoutMs;

    if (!signal) {
      const timeout = setTimeout(() => {
        controller.abort();
      }, timeoutMs);

      try {
        const response = await fetch(`${this.baseUrl}/agents/${agentId}/invoke`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({ input }),
          signal: controller.signal
        });

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`LangGraph agent error (${response.status}):`, errorBody);
          return null;
        }

        return await response.json();
      } catch (error) {
        if (error.name === 'AbortError') {
          console.error('LangGraph agent request timed out');
        } else {
          console.error('LangGraph agent request failed:', error);
        }
        return null;
      } finally {
        clearTimeout(timeout);
      }
    }

    // If a signal was provided (e.g., upstream timeout control)
    try {
      const response = await fetch(`${this.baseUrl}/agents/${agentId}/invoke`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ input }),
        signal
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error(`LangGraph agent error (${response.status}):`, errorBody);
        return null;
      }

      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        console.error('LangGraph agent request aborted by caller');
      } else {
        console.error('LangGraph agent request failed:', error);
      }
      return null;
    }
  }

  /**
   * Normalise LangGraph output. Some deployments return `{ output: ... }`
   * while others embed the result in `state.values`.
   */
  normalizeAgentPayload(payload) {
    if (!payload) return null;

    if (payload.output) {
      return payload.output;
    }

    if (payload.result) {
      return payload.result;
    }

    if (payload.state && typeof payload.state === 'object') {
      // LangGraph streaming responses tend to surface the final output under `values`
      const { state } = payload;
      if (Array.isArray(state.values)) {
        return state.values[state.values.length - 1];
      }
    }

    return payload;
  }

  /**
   * Analyse an email to determine if it contains subscription information.
   */
  async analyzeEmailForSubscription(emailSummary) {
    if (!this.hasEmailAgent()) {
      return null;
    }

    const payload = {
      type: 'subscription_email_analysis',
      email: {
        id: emailSummary.id,
        subject: emailSummary.subject,
        from: emailSummary.from,
        to: emailSummary.to,
        snippet: emailSummary.snippet,
        body: emailSummary.body,
        received_at: emailSummary.received_at
      },
      metadata: {
        userId: emailSummary.userId,
        provider: emailSummary.provider
      }
    };

    const response = await this.callAgent(this.emailAgentId, payload);
    const result = this.normalizeAgentPayload(response);

    if (!result) {
      return null;
    }

    const normalized = {
      matched: Boolean(result.subscription_detected ?? result.matched ?? result.is_subscription),
      confidence: typeof result.confidence === 'number' ? result.confidence : null,
      data: {
        service: result.service || result.company || result.subscription?.service || '',
        amount: result.amount ?? result.subscription?.amount ?? null,
        currency: result.currency ?? result.subscription?.currency ?? null,
        cycle: result.billing_cycle ?? result.cycle ?? result.subscription?.billing_cycle ?? null,
        date: result.next_billing_date ?? result.date ?? result.subscription?.next_billing_date ?? null,
        reasoning: result.reasoning || result.analysis || result.explanation || '',
        suggestions: result.suggestions || [],
        email_id: emailSummary.id,
        provider: emailSummary.provider
      }
    };

    return normalized;
  }

  /**
   * Converse with the spending coach chatbot.
   */
  async chatWithSpendCoach(input) {
    if (!this.hasChatAgent()) {
      return null;
    }

    const payload = {
      type: 'spend_coach_chat',
      user: {
        id: input.userId,
        goal: input.goal,
        locale: input.locale || 'en-US'
      },
      message: input.message,
      conversation: input.history || [],
      context: {
        monthly_total: input.monthlyTotal,
        yearly_total: input.yearlyTotal,
        subscriptions: input.subscriptions,
        requested_actions: input.actions || []
      }
    };

    const response = await this.callAgent(this.chatAgentId, payload);
    const result = this.normalizeAgentPayload(response);

    if (!result) {
      return null;
    }

    return {
      message: result.reply || result.message || '',
      suggestions: result.suggestions || [],
      actions: result.actions || [],
      confidence: typeof result.confidence === 'number' ? result.confidence : null,
      raw: result
    };
  }
}

const langGraphAgentService = new LangGraphAgentService();
export default langGraphAgentService;
export { LangGraphAgentService };
