import api from './api';

/**
 * Send a message to the LangGraph-powered spending advisor.
 */
export const sendSpendAdvisorMessage = async ({ message, goal, actions, history, locale }) => {
  const response = await api.post('/subs/ai/chat', {
    message,
    goal,
    actions,
    history,
    locale
  });

  return response.data;
};
