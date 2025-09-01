import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ChroniclerService } from '../../services/chronicler-service';

describe('Personal Chronicler Workflow', () => {
  let chroniclerService: ChroniclerService;

  beforeEach(() => {
    const mockMemoryAssistant = {
      saveReflection: vi.fn(),
      storeEmotionalContext: vi.fn()
    } as any;

    const mockCognitiveAgent = {
      processInCortexMode: vi.fn()
    } as any;

    const mockResourceGovernor = {
      validateAction: vi.fn()
    } as any;

    chroniclerService = new ChroniclerService(
      mockMemoryAssistant,
      mockCognitiveAgent,
      mockResourceGovernor
    );
  });

  it('should create chronicler service', () => {
    expect(chroniclerService).toBeDefined();
  });
});