import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmpatibrygganCoach } from '../../components/communication/empatibryggan-coach';
import { useEmpatibryggan } from '../../hooks/use-empatibryggan';

// Mock the hook
vi.mock('../../hooks/use-empatibryggan');

describe('Empatibryggan Integration Tests', () => {
  let mockUseEmpatibryggan: Mock;
  let mockOnMessageChange: Mock;
  let mockOnSendMessage: Mock;

  const defaultHookReturn = {
    isAvailable: true,
    isEnabled: true,
    isAnalyzing: false,
    currentPrediction: null,
    currentSuggestions: [],
    error: null,
    checkAvailability: vi.fn(),
    analyzeMessage: vi.fn(),
    toggleEnabled: vi.fn(),
    clearAnalysis: vi.fn(),
    getInterventionStatus: vi.fn(),
    getAnalysisSummary: vi.fn(),
    needsReview: vi.fn().mockReturnValue(false),
    getUsageStats: vi.fn(),
    hasActivePrediction: false,
    hasSuggestions: false,
    requiresIntervention: false
  };

  beforeEach(() => {
    mockUseEmpatibryggan = vi.mocked(useEmpatibryggan);
    mockOnMessageChange = vi.fn();
    mockOnSendMessage = vi.fn();
    
    mockUseEmpatibryggan.mockReturnValue(defaultHookReturn);
  });

  describe('Basic functionality', () => {
    it('should render message input when Empatibryggan is disabled', () => {
      mockUseEmpatibryggan.mockReturnValue({
        ...defaultHookReturn,
        isEnabled: false
      });

      render(
        <EmpatibrygganCoach
          message=""
          senderId="user1"
          recipientId="user2"
          onMessageChange={mockOnMessageChange}
          onSendMessage={mockOnSendMessage}
          isEnabled={false}
        />
      );

      expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });

    it('should show Empatibryggan features when enabled', () => {
      render(
        <EmpatibrygganCoach
          message=""
          senderId="user1"
          recipientId="user2"
          onMessageChange={mockOnMessageChange}
          onSendMessage={mockOnSendMessage}
          isEnabled={true}
        />
      );

      expect(screen.getByPlaceholderText(/empatibryggan will help/i)).toBeInTheDocument();
      expect(screen.getByText(/privacy protected/i)).toBeInTheDocument();
    });

    it('should call onMessageChange when user types', async () => {
      const user = userEvent.setup();

      render(
        <EmpatibrygganCoach
          message=""
          senderId="user1"
          recipientId="user2"
          onMessageChange={mockOnMessageChange}
          onSendMessage={mockOnSendMessage}
          isEnabled={true}
        />
      );

      const textarea = screen.getByRole('textbox');
      await user.type(textarea, 'Hello world');

      expect(mockOnMessageChange).toHaveBeenCalledWith('Hello world');
    });
  });

  describe('Message analysis and suggestions', () => {
    it('should show analyzing status when message is being analyzed', () => {
      mockUseEmpatibryggan.mockReturnValue({
        ...defaultHookReturn,
        isAnalyzing: true
      });

      render(
        <EmpatibrygganCoach
          message="Test message"
          senderId="user1"
          recipientId="user2"
          onMessageChange={mockOnMessageChange}
          onSendMessage={mockOnSendMessage}
          isEnabled={true}
        />
      );

      expect(screen.getByText(/analyzing/i)).toBeInTheDocument();
    });

    it('should show positive status for good messages', () => {
      mockUseEmpatibryggan.mockReturnValue({
        ...defaultHookReturn,
        currentPrediction: {
          predicted_user_state: {
            fight: 0.1,
            flight: 0.1,
            fixes: 0.8,
            confidence: 0.9,
            timestamp: new Date()
          },
          predicted_delta: {
            asynchronous_delta: 0.2,
            synchronous_delta: 0.8,
            magnitude: 0.3,
            strategy: 'harmonize'
          },
          intervention_level: 'none',
          confidence: 0.9,
          timestamp: new Date()
        }
      });

      render(
        <EmpatibrygganCoach
          message="Could you please help me with this?"
          senderId="user1"
          recipientId="user2"
          onMessageChange={mockOnMessageChange}
          onSendMessage={mockOnSendMessage}
          isEnabled={true}
        />
      );

      expect(screen.getByText(/looks good/i)).toBeInTheDocument();
    });

    it('should show suggestions panel when intervention is needed', () => {
      const mockSuggestions = [
        {
          type: 'tone' as const,
          original_message: 'You need to fix this now!',
          suggested_message: 'Could you please help me fix this when you have a chance?',
          explanation: 'A gentler approach might be better received.',
          confidence: 0.8,
          reasoning: 'neutral_communication_guidance' as const
        }
      ];

      mockUseEmpatibryggan.mockReturnValue({
        ...defaultHookReturn,
        currentPrediction: {
          predicted_user_state: {
            fight: 0.7,
            flight: 0.2,
            fixes: 0.3,
            confidence: 0.6,
            timestamp: new Date()
          },
          predicted_delta: {
            asynchronous_delta: 0.6,
            synchronous_delta: 0.3,
            magnitude: 0.7,
            strategy: 'mirror'
          },
          intervention_level: 'high',
          confidence: 0.7,
          timestamp: new Date()
        },
        currentSuggestions: mockSuggestions,
        hasSuggestions: true,
        requiresIntervention: true
      });

      render(
        <EmpatibrygganCoach
          message="You need to fix this now!"
          senderId="user1"
          recipientId="user2"
          onMessageChange={mockOnMessageChange}
          onSendMessage={mockOnSendMessage}
          isEnabled={true}
        />
      );

      expect(screen.getByText(/communication suggestions/i)).toBeInTheDocument();
      expect(screen.getByText(/gentler approach/i)).toBeInTheDocument();
      expect(screen.getByText(/tone improvement/i)).toBeInTheDocument();
    });

    it('should allow user to accept suggestions', async () => {
      const user = userEvent.setup();
      const mockSuggestions = [
        {
          type: 'tone' as const,
          original_message: 'Fix this!',
          suggested_message: 'Could you please help me fix this?',
          explanation: 'A gentler approach might be better received.',
          confidence: 0.8,
          reasoning: 'neutral_communication_guidance' as const
        }
      ];

      mockUseEmpatibryggan.mockReturnValue({
        ...defaultHookReturn,
        currentSuggestions: mockSuggestions,
        hasSuggestions: true,
        requiresIntervention: true
      });

      render(
        <EmpatibrygganCoach
          message="Fix this!"
          senderId="user1"
          recipientId="user2"
          onMessageChange={mockOnMessageChange}
          onSendMessage={mockOnSendMessage}
          isEnabled={true}
        />
      );

      const acceptButton = screen.getByText(/use this version/i);
      await user.click(acceptButton);

      expect(mockOnMessageChange).toHaveBeenCalledWith('Could you please help me fix this?');
    });

    it('should allow user to ignore suggestions', async () => {
      const user = userEvent.setup();
      const mockSuggestions = [
        {
          type: 'tone' as const,
          original_message: 'Fix this!',
          suggested_message: 'Could you please help me fix this?',
          explanation: 'A gentler approach might be better received.',
          confidence: 0.8,
          reasoning: 'neutral_communication_guidance' as const
        }
      ];

      mockUseEmpatibryggan.mockReturnValue({
        ...defaultHookReturn,
        currentSuggestions: mockSuggestions,
        hasSuggestions: true,
        requiresIntervention: true
      });

      render(
        <EmpatibrygganCoach
          message="Fix this!"
          senderId="user1"
          recipientId="user2"
          onMessageChange={mockOnMessageChange}
          onSendMessage={mockOnSendMessage}
          isEnabled={true}
        />
      );

      const ignoreButton = screen.getByText(/ignore/i);
      await user.click(ignoreButton);

      // Suggestions panel should be hidden
      expect(screen.queryByText(/communication suggestions/i)).not.toBeInTheDocument();
    });
  });

  describe('Privacy and security', () => {
    it('should display privacy notice when enabled', () => {
      render(
        <EmpatibrygganCoach
          message=""
          senderId="user1"
          recipientId="user2"
          onMessageChange={mockOnMessageChange}
          onSendMessage={mockOnSendMessage}
          isEnabled={true}
        />
      );

      expect(screen.getByText(/privacy protected/i)).toBeInTheDocument();
      expect(screen.getByText(/without sharing personal details/i)).toBeInTheDocument();
    });

    it('should not expose psychological details in suggestions', () => {
      const mockSuggestions = [
        {
          type: 'empathy' as const,
          original_message: 'Do this task',
          suggested_message: 'I understand this is important. Could you help me with this task?',
          explanation: 'This approach might help the recipient feel more understood.',
          confidence: 0.7,
          reasoning: 'neutral_communication_guidance' as const
        }
      ];

      mockUseEmpatibryggan.mockReturnValue({
        ...defaultHookReturn,
        currentSuggestions: mockSuggestions,
        hasSuggestions: true
      });

      render(
        <EmpatibrygganCoach
          message="Do this task"
          senderId="user1"
          recipientId="user2"
          onMessageChange={mockOnMessageChange}
          onSendMessage={mockOnSendMessage}
          isEnabled={true}
        />
      );

      // Should not contain psychological details about recipient
      expect(screen.queryByText(/they feel/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/their personality/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/psychological/i)).not.toBeInTheDocument();
      
      // Should contain neutral guidance
      expect(screen.getByText(/might help the recipient feel more understood/i)).toBeInTheDocument();
    });

    it('should handle errors gracefully without exposing sensitive information', () => {
      mockUseEmpatibryggan.mockReturnValue({
        ...defaultHookReturn,
        error: 'Analysis failed'
      });

      render(
        <EmpatibrygganCoach
          message="Test message"
          senderId="user1"
          recipientId="user2"
          onMessageChange={mockOnMessageChange}
          onSendMessage={mockOnSendMessage}
          isEnabled={true}
        />
      );

      // Should still be functional even with errors
      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });
  });

  describe('User control and sender autonomy', () => {
    it('should allow sending original message even with suggestions', async () => {
      const user = userEvent.setup();
      const mockSuggestions = [
        {
          type: 'tone' as const,
          original_message: 'Fix this now!',
          suggested_message: 'Could you please fix this?',
          explanation: 'A gentler approach might be better received.',
          confidence: 0.8,
          reasoning: 'neutral_communication_guidance' as const
        }
      ];

      mockUseEmpatibryggan.mockReturnValue({
        ...defaultHookReturn,
        currentSuggestions: mockSuggestions,
        hasSuggestions: true,
        needsReview: vi.fn().mockReturnValue(true)
      });

      render(
        <EmpatibrygganCoach
          message="Fix this now!"
          senderId="user1"
          recipientId="user2"
          onMessageChange={mockOnMessageChange}
          onSendMessage={mockOnSendMessage}
          isEnabled={true}
        />
      );

      const sendOriginalButton = screen.getByText(/send original/i);
      await user.click(sendOriginalButton);

      expect(mockOnSendMessage).toHaveBeenCalledWith('Fix this now!');
    });

    it('should disable send button while analyzing', () => {
      mockUseEmpatibryggan.mockReturnValue({
        ...defaultHookReturn,
        isAnalyzing: true
      });

      render(
        <EmpatibrygganCoach
          message="Test message"
          senderId="user1"
          recipientId="user2"
          onMessageChange={mockOnMessageChange}
          onSendMessage={mockOnSendMessage}
          isEnabled={true}
        />
      );

      const sendButton = screen.getByRole('button', { name: /analyzing/i });
      expect(sendButton).toBeDisabled();
    });

    it('should show confidence levels for suggestions', () => {
      const mockSuggestions = [
        {
          type: 'clarity' as const,
          original_message: 'Maybe you could perhaps consider this',
          suggested_message: 'Could you please consider this?',
          explanation: 'This version might be clearer.',
          confidence: 0.85,
          reasoning: 'neutral_communication_guidance' as const
        }
      ];

      mockUseEmpatibryggan.mockReturnValue({
        ...defaultHookReturn,
        currentSuggestions: mockSuggestions,
        hasSuggestions: true
      });

      render(
        <EmpatibrygganCoach
          message="Maybe you could perhaps consider this"
          senderId="user1"
          recipientId="user2"
          onMessageChange={mockOnMessageChange}
          onSendMessage={mockOnSendMessage}
          isEnabled={true}
        />
      );

      expect(screen.getByText(/85% confidence/i)).toBeInTheDocument();
    });

    it('should allow copying suggestions for manual editing', async () => {
      const user = userEvent.setup();
      
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined)
        }
      });

      const mockSuggestions = [
        {
          type: 'empathy' as const,
          original_message: 'Do this',
          suggested_message: 'I understand this is important. Could you help with this?',
          explanation: 'This approach shows more understanding.',
          confidence: 0.7,
          reasoning: 'neutral_communication_guidance' as const
        }
      ];

      mockUseEmpatibryggan.mockReturnValue({
        ...defaultHookReturn,
        currentSuggestions: mockSuggestions,
        hasSuggestions: true
      });

      render(
        <EmpatibrygganCoach
          message="Do this"
          senderId="user1"
          recipientId="user2"
          onMessageChange={mockOnMessageChange}
          onSendMessage={mockOnSendMessage}
          isEnabled={true}
        />
      );

      const copyButton = screen.getByText(/copy to edit/i);
      await user.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'I understand this is important. Could you help with this?'
      );
    });
  });

  describe('Accessibility and usability', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <EmpatibrygganCoach
          message=""
          senderId="user1"
          recipientId="user2"
          onMessageChange={mockOnMessageChange}
          onSendMessage={mockOnSendMessage}
          isEnabled={true}
        />
      );

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
    });

    it('should show clear visual indicators for different intervention levels', () => {
      const highInterventionPrediction = {
        predicted_user_state: {
          fight: 0.8,
          flight: 0.2,
          fixes: 0.2,
          confidence: 0.6,
          timestamp: new Date()
        },
        predicted_delta: {
          asynchronous_delta: 0.8,
          synchronous_delta: 0.2,
          magnitude: 0.9,
          strategy: 'mirror' as const
        },
        intervention_level: 'high' as const,
        confidence: 0.8,
        timestamp: new Date()
      };

      mockUseEmpatibryggan.mockReturnValue({
        ...defaultHookReturn,
        currentPrediction: highInterventionPrediction,
        requiresIntervention: true
      });

      render(
        <EmpatibrygganCoach
          message="You're completely wrong!"
          senderId="user1"
          recipientId="user2"
          onMessageChange={mockOnMessageChange}
          onSendMessage={mockOnSendMessage}
          isEnabled={true}
        />
      );

      // Should show warning indicator
      expect(screen.getByText(/⚠️/)).toBeInTheDocument();
    });

    it('should provide helpful placeholder text', () => {
      render(
        <EmpatibrygganCoach
          message=""
          senderId="user1"
          recipientId="user2"
          onMessageChange={mockOnMessageChange}
          onSendMessage={mockOnSendMessage}
          isEnabled={true}
        />
      );

      expect(screen.getByPlaceholderText(/empatibryggan will help you communicate effectively/i)).toBeInTheDocument();
    });
  });
});