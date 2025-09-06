import { describe, it, expect, vi, beforeEach } from 'vitest'
import { FingerprintApiAdapter } from '../../../../src/adapters/api/fingerprint/api'
import { HttpClient } from '../../../../src/infrastructure/http/http-client.interface'
import {
  SendFingerprintPayload,
  SendFingerprintResponse,
} from '../../../../src/adapters/api/fingerprint/models'

describe('FingerprintApiAdapter', () => {
  let fingerprintApiAdapter: FingerprintApiAdapter
  let mockHttpClient: HttpClient

  const defaultBasePath = '/api/fingerprint'
  const defaultSendPath = '/'
  const customBasePath = '/custom/fingerprint'
  const customSendPath = '/send'

  beforeEach(() => {
    // Создаем мок для HttpClient
    mockHttpClient = {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      setBaseUrl: vi.fn(),
      setHeader: vi.fn(),
      setHeaders: vi.fn(),
      removeHeader: vi.fn(),
      deleteHeader: vi.fn(),
      setInterceptor: vi.fn(),
    }
  })

  describe('constructor', () => {
    it('should use default paths when not provided', () => {
      // Act
      fingerprintApiAdapter = new FingerprintApiAdapter(mockHttpClient)

      // Подготовка тестового запроса для проверки путей
      const payload: SendFingerprintPayload = {
        fpId: 'test-id',
        fpComponents: {} as any,
      }

      fingerprintApiAdapter.sendFingerprint(payload)

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `${defaultBasePath}${defaultSendPath}`,
        payload,
      )
    })

    it('should use custom paths when provided', () => {
      // Act
      fingerprintApiAdapter = new FingerprintApiAdapter(
        mockHttpClient,
        customBasePath,
        customSendPath,
      )

      // Подготовка тестового запроса для проверки путей
      const payload: SendFingerprintPayload = {
        fpId: 'test-id',
        fpComponents: {} as any,
      }

      fingerprintApiAdapter.sendFingerprint(payload)

      // Assert
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `${customBasePath}${customSendPath}`,
        payload,
      )
    })
  })

  describe('sendFingerprint', () => {
    it('should send fingerprint data and return response', async () => {
      // Arrange
      fingerprintApiAdapter = new FingerprintApiAdapter(mockHttpClient)

      const payload: SendFingerprintPayload = {
        fpId: 'test-fingerprint-id',
        fpComponents: {
          userAgent: { value: 'test-user-agent', duration: 0 },
          screenResolution: { value: [1920, 1080], duration: 0 },
        } as any,
      }

      const expectedResponse: SendFingerprintResponse = {
        id: 'session-id-123',
      }

      vi.mocked(mockHttpClient.post).mockResolvedValue(expectedResponse)

      // Act
      const result = await fingerprintApiAdapter.sendFingerprint(payload)

      // Assert
      expect(result).toEqual(expectedResponse)
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `${defaultBasePath}${defaultSendPath}`,
        payload,
      )
    })

    it('should throw error if API call fails', async () => {
      // Arrange
      fingerprintApiAdapter = new FingerprintApiAdapter(mockHttpClient)

      const payload: SendFingerprintPayload = {
        fpId: 'test-fingerprint-id',
        fpComponents: {} as any,
      }

      const errorMessage = 'API error'
      vi.mocked(mockHttpClient.post).mockRejectedValue(new Error(errorMessage))

      // Act & Assert
      await expect(fingerprintApiAdapter.sendFingerprint(payload)).rejects.toThrow(errorMessage)
      expect(mockHttpClient.post).toHaveBeenCalledWith(
        `${defaultBasePath}${defaultSendPath}`,
        payload,
      )
    })
  })

  describe('setSessionHeader', () => {
    it('should set X-Session header when sessionId is provided', () => {
      // Arrange
      fingerprintApiAdapter = new FingerprintApiAdapter(mockHttpClient)
      const sessionId = 'session-id-123'

      // Act
      fingerprintApiAdapter.setSessionHeader(sessionId)

      // Assert
      expect(mockHttpClient.setHeader).toHaveBeenCalledWith('X-Session', sessionId)
      expect(mockHttpClient.deleteHeader).not.toHaveBeenCalled()
    })

    it('should delete X-Session header when sessionId is null', () => {
      // Arrange
      fingerprintApiAdapter = new FingerprintApiAdapter(mockHttpClient)

      // Act
      fingerprintApiAdapter.setSessionHeader(null)

      // Assert
      expect(mockHttpClient.deleteHeader).toHaveBeenCalledWith('X-Session')
      expect(mockHttpClient.setHeader).not.toHaveBeenCalled()
    })
  })
})
