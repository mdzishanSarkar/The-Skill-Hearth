export const INBOX_ERRORS = {
  CONNECTION_NOT_FOUND: { status: 404, code: 'CONNECTION_NOT_FOUND', message: 'The conversation could not be found.' },
  CONNECTION_NOT_ACCEPTED: { status: 403, code: 'CONNECTION_NOT_ACCEPTED', message: 'You can only message in accepted connections.' },
  NOT_PARTICIPANT: { status: 403, code: 'NOT_PARTICIPANT', message: 'You are not part of this conversation.' },
  USER_BLOCKED: { status: 403, code: 'USER_BLOCKED', message: 'Unable to send message.' },
  CONTENT_TOO_LONG: { status: 422, code: 'CONTENT_TOO_LONG', message: 'Message must be 1,000 characters or fewer.' },
  MESSAGE_NOT_FOUND: { status: 404, code: 'MESSAGE_NOT_FOUND', message: 'Message not found.' },
  NOT_SENDER: { status: 403, code: 'NOT_SENDER', message: 'You can only delete your own messages.' },
  DELETE_WINDOW_EXPIRED: { status: 400, code: 'DELETE_WINDOW_EXPIRED', message: 'Messages can only be deleted within 5 minutes of sending.' },
  INVALID_EMOJI: { status: 422, code: 'INVALID_EMOJI', message: 'That reaction is not supported.' },
  INVALID_CURSOR: { status: 400, code: 'INVALID_CURSOR', message: 'Invalid pagination cursor.' },
  PREFERENCE_CONFLICT: { status: 409, code: 'PREFERENCE_CONFLICT', message: 'Preference already set.' },
  REPORT_ALREADY_EXISTS: { status: 409, code: 'REPORT_ALREADY_EXISTS', message: 'You have already reported this message.' },
  ALREADY_REPORTED: { status: 409, code: 'ALREADY_REPORTED', message: 'Already reported.' },
};

export type InboxErrorCode = keyof typeof INBOX_ERRORS;
