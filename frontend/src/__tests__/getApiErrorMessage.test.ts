import { describe, it, expect } from 'vitest';
import { getApiErrorMessage } from '../utils/getApiErrorMessage';

const DEFAULT = 'Une erreur est survenue';

describe('getApiErrorMessage', () => {
  it('returns the default message for a non-object error', () => {
    expect(getApiErrorMessage('boom', DEFAULT)).toBe(DEFAULT);
    expect(getApiErrorMessage(null, DEFAULT)).toBe(DEFAULT);
    expect(getApiErrorMessage(undefined, DEFAULT)).toBe(DEFAULT);
  });

  it('returns the default message for an object without a response', () => {
    expect(getApiErrorMessage({}, DEFAULT)).toBe(DEFAULT);
    expect(getApiErrorMessage(new Error('plain error'), DEFAULT)).toBe(DEFAULT);
  });

  it('returns the fixed message for a 429 status regardless of the payload', () => {
    const err = { response: { status: 429, data: { message: 'ignored' } } };
    expect(getApiErrorMessage(err, DEFAULT)).toBe(
      'Trop de tentatives. Veuillez patienter une minute avant de réessayer.',
    );
  });

  it('returns a trimmed string message from the response data', () => {
    const err = { response: { status: 400, data: { message: '  Email déjà utilisé  ' } } };
    expect(getApiErrorMessage(err, DEFAULT)).toBe('Email déjà utilisé');
  });

  it('falls back to the default for a blank string message', () => {
    const err = { response: { status: 400, data: { message: '   ' } } };
    expect(getApiErrorMessage(err, DEFAULT)).toBe(DEFAULT);
  });

  it('returns the first message from an array of messages', () => {
    const err = { response: { status: 400, data: { message: ['Champ requis', 'Autre erreur'] } } };
    expect(getApiErrorMessage(err, DEFAULT)).toBe('Champ requis');
  });

  it('falls back to the default for an empty array of messages', () => {
    const err = { response: { status: 400, data: { message: [] } } };
    expect(getApiErrorMessage(err, DEFAULT)).toBe(DEFAULT);
  });

  it('stringifies a non-string first array element', () => {
    const err = { response: { status: 400, data: { message: [42] } } };
    expect(getApiErrorMessage(err, DEFAULT)).toBe('42');
  });

  it.each([
    ['an exception message', 'NullReferenceException occurred'],
    ['a too-many-requests message', 'Too many requests, slow down'],
    ['a bad-request message', 'Bad Request'],
    ['an internal-server-error message', 'Internal Server Error'],
    ['a raw status code message', 'Request failed with status code 500'],
    ['a generic request-failed message', 'Request failed'],
  ])('falls back to the default for %s', (_label, technicalMessage) => {
    const err = { response: { status: 400, data: { message: technicalMessage } } };
    expect(getApiErrorMessage(err, DEFAULT)).toBe(DEFAULT);
  });

  it('returns the default message when data has no message field', () => {
    const err = { response: { status: 500, data: {} } };
    expect(getApiErrorMessage(err, DEFAULT)).toBe(DEFAULT);
  });

  it('returns the default message when the response has no data', () => {
    const err = { response: { status: 500 } };
    expect(getApiErrorMessage(err, DEFAULT)).toBe(DEFAULT);
  });
});
