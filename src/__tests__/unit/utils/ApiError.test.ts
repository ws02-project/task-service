import createApiError from '../../../utils/ApiError';

describe('ApiError', () => {
  describe('createApiError', () => {
    it('should create an error with statusCode and message', () => {
      const error = createApiError(404, 'Not found');

      expect(error).toBeInstanceOf(Error);
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Not found');
      expect(error.isOperational).toBe(true);
    });

    it('should set isOperational to true by default', () => {
      const error = createApiError(500, 'Server error');

      expect(error.isOperational).toBe(true);
    });

    it('should allow setting isOperational to false', () => {
      const error = createApiError(500, 'Server error', false);

      expect(error.isOperational).toBe(false);
    });

    it('should use provided stack trace', () => {
      const customStack = 'Custom stack trace';
      const error = createApiError(400, 'Bad request', true, customStack);

      expect(error.stack).toBe(customStack);
    });

    it('should capture stack trace when not provided', () => {
      const error = createApiError(400, 'Bad request');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('ApiError.test.ts');
    });

    it('should create error for various HTTP status codes', () => {
      const testCases = [
        { statusCode: 400, message: 'Bad Request' },
        { statusCode: 401, message: 'Unauthorized' },
        { statusCode: 403, message: 'Forbidden' },
        { statusCode: 404, message: 'Not Found' },
        { statusCode: 409, message: 'Conflict' },
        { statusCode: 500, message: 'Internal Server Error' },
      ];

      testCases.forEach(({ statusCode, message }) => {
        const error = createApiError(statusCode, message);
        expect(error.statusCode).toBe(statusCode);
        expect(error.message).toBe(message);
      });
    });
  });
});
