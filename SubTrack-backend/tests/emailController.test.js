import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';

describe('emailController.handleCallback', () => {
  it('uses persisted user email when Gmail profile lookup fails', async () => {
    const tokens = { access_token: 'test-access', refresh_token: 'test-refresh', expires_in: 3600 };

    const pgModule = await import('pg');
    mock.method(pgModule.default.Client.prototype, 'connect', async () => {});
    const queryMock = mock.method(pgModule.default.Client.prototype, 'query', async () => ({
      rows: [{ id: 123, email: 'persisted@example.com' }]
    }));

    const emailServiceModule = await import('../src/services/emailServices.js');
    const gmailModule = await import('../src/utils/gmailAPI.js');

    const handleAuthCallbackMock = mock.method(emailServiceModule.default, 'handleAuthCallback', async () => tokens);
    const addEmailConnectionMock = mock.method(emailServiceModule.default, 'addEmailConnection', async (userId, connectionData) => ({
      id: 'connection-id',
      provider: connectionData.provider,
      email_address: connectionData.email_address
    }));

    mock.method(gmailModule.default.prototype, 'getUserProfile', async () => {
      throw new Error('gmail profile failure');
    });

    const { handleCallback } = await import('../src/controllers/emailController.js');

    const req = {
      body: { code: 'oauth-code', provider: 'gmail' },
      user: { id: 123, email: 'session@example.com' }
    };

    const res = {
      statusCode: null,
      jsonPayload: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.jsonPayload = payload;
      }
    };

    await handleCallback(req, res);

    assert.strictEqual(handleAuthCallbackMock.mock.calls.length, 1);
    assert.strictEqual(queryMock.mock.calls.length, 1);
    assert.strictEqual(addEmailConnectionMock.mock.calls.length, 1);

    const addCall = addEmailConnectionMock.mock.calls[0];
    assert.strictEqual(addCall.arguments[0], 123);
    assert.strictEqual(addCall.arguments[1].email_address, 'persisted@example.com');

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.jsonPayload.connection.email_address, 'persisted@example.com');

    mock.restoreAll();
  });
});
