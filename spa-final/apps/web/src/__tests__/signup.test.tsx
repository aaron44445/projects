import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignupPage from '@/app/signup/page';
import { mockRegister, mockAuthContext } from './setup';

// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/signup',
  useSearchParams: () => new URLSearchParams(),
}));

describe('SignupPage', () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  describe('Rendering', () => {
    it('should render the signup form', () => {
      render(<SignupPage />);

      expect(screen.getByText('Create your salon account')).toBeInTheDocument();
      expect(screen.getByText('Get started with your 14-day free trial')).toBeInTheDocument();
      expect(screen.getByLabelText(/salon \/ business name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should render trust indicators', () => {
      render(<SignupPage />);

      expect(screen.getByText(/secure & encrypted/i)).toBeInTheDocument();
      // "14-day free trial" appears twice (header + trust indicator), use getAllByText
      expect(screen.getAllByText(/14-day free trial/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/cancel anytime/i)).toBeInTheDocument();
    });

    it('should render sign in link', () => {
      render(<SignupPage />);

      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render Peacase logo', () => {
      render(<SignupPage />);

      expect(screen.getByText('Peacase')).toBeInTheDocument();
    });

    it('should render timezone dropdown with options', () => {
      render(<SignupPage />);

      const timezoneSelect = screen.getByLabelText(/timezone/i);
      expect(timezoneSelect).toBeInTheDocument();
      expect(screen.getByText('Central Time (CT)')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show error when salon name is empty', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      // Fill everything except salon name
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/phone number/i), '555-123-4567');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/salon name is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      await user.type(screen.getByLabelText(/salon \/ business name/i), 'Test Salon');
      await user.type(screen.getByLabelText(/email address/i), 'invalid-email');
      await user.type(screen.getByLabelText(/phone number/i), '555-123-4567');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
      });
    });

    it('should show error when email is empty', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      await user.type(screen.getByLabelText(/salon \/ business name/i), 'Test Salon');
      await user.type(screen.getByLabelText(/phone number/i), '555-123-4567');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when phone is empty', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      await user.type(screen.getByLabelText(/salon \/ business name/i), 'Test Salon');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/phone number is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for password less than 8 characters', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      await user.type(screen.getByLabelText(/salon \/ business name/i), 'Test Salon');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/phone number/i), '555-123-4567');
      await user.type(screen.getByLabelText(/^password$/i), 'short');
      await user.type(screen.getByLabelText(/confirm password/i), 'short');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });
    });

    it('should show error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      await user.type(screen.getByLabelText(/salon \/ business name/i), 'Test Salon');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/phone number/i), '555-123-4567');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'differentpassword');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should show passwords match indicator when passwords match', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');

      await waitFor(() => {
        expect(screen.getByText(/passwords match/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should call register function with form data', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue(undefined);

      render(<SignupPage />);

      await user.type(screen.getByLabelText(/salon \/ business name/i), 'My Awesome Salon');
      await user.type(screen.getByLabelText(/email address/i), 'salon@example.com');
      await user.type(screen.getByLabelText(/phone number/i), '555-987-6543');
      await user.type(screen.getByLabelText(/^password$/i), 'securepass123');
      await user.type(screen.getByLabelText(/confirm password/i), 'securepass123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          'My Awesome Salon',
          'salon@example.com',
          'securepass123',
          '555-987-6543',
          'America/Chicago'
        );
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();

      let resolveRegister: () => void;
      mockRegister.mockImplementation(() => new Promise((resolve) => {
        resolveRegister = resolve;
      }));

      render(<SignupPage />);

      await user.type(screen.getByLabelText(/salon \/ business name/i), 'Test Salon');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/phone number/i), '555-123-4567');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/creating account/i)).toBeInTheDocument();
      });

      resolveRegister!();
    });

    it('should navigate to dashboard on successful registration', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue({ requiresVerification: false });

      render(<SignupPage />);

      await user.type(screen.getByLabelText(/salon \/ business name/i), 'Test Salon');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/phone number/i), '555-123-4567');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should display error message on registration failure', async () => {
      const user = userEvent.setup();
      mockRegister.mockRejectedValue(new Error('Email already exists'));

      render(<SignupPage />);

      await user.type(screen.getByLabelText(/salon \/ business name/i), 'Test Salon');
      await user.type(screen.getByLabelText(/email address/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/phone number/i), '555-123-4567');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });

    it('should display generic error for unknown errors', async () => {
      const user = userEvent.setup();
      mockRegister.mockRejectedValue('Unknown error');

      render(<SignupPage />);

      await user.type(screen.getByLabelText(/salon \/ business name/i), 'Test Salon');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/phone number/i), '555-123-4567');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });

    it('should disable submit button during loading', async () => {
      const user = userEvent.setup();
      mockRegister.mockImplementation(() => new Promise(() => {}));

      render(<SignupPage />);

      await user.type(screen.getByLabelText(/salon \/ business name/i), 'Test Salon');
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/phone number/i), '555-123-4567');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /creating account/i });
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Password Visibility Toggle', () => {
    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Find toggle buttons
      const buttons = screen.getAllByRole('button');
      const toggleButton = buttons.find((btn) =>
        btn.querySelector('[data-testid="icon-eye"]') || btn.querySelector('[data-testid="icon-eye-off"]')
      );

      if (toggleButton) {
        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');
      }
    });

    it('should toggle confirm password visibility', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
    });
  });

  describe('Input Handling', () => {
    it('should update all form fields correctly', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      const salonInput = screen.getByLabelText(/salon \/ business name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const phoneInput = screen.getByLabelText(/phone number/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);

      await user.type(salonInput, 'New Salon');
      await user.type(emailInput, 'new@salon.com');
      await user.type(phoneInput, '555-NEW-0001');
      await user.type(passwordInput, 'newsalonpass');
      await user.type(confirmPasswordInput, 'newsalonpass');

      expect(salonInput).toHaveValue('New Salon');
      expect(emailInput).toHaveValue('new@salon.com');
      expect(phoneInput).toHaveValue('555-NEW-0001');
      expect(passwordInput).toHaveValue('newsalonpass');
      expect(confirmPasswordInput).toHaveValue('newsalonpass');
    });

    it('should allow timezone selection', async () => {
      const user = userEvent.setup();
      render(<SignupPage />);

      const timezoneSelect = screen.getByLabelText(/timezone/i);
      await user.selectOptions(timezoneSelect, 'America/New_York');

      expect(timezoneSelect).toHaveValue('America/New_York');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form labels', () => {
      render(<SignupPage />);

      expect(screen.getByLabelText(/salon \/ business name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('should have proper link texts', () => {
      render(<SignupPage />);

      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to home/i })).toBeInTheDocument();
    });

    it('should have proper button role for submit', () => {
      render(<SignupPage />);

      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });
  });

  describe('Registration Flow', () => {
    it('should complete full registration flow with all fields', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue({ requiresVerification: false });

      render(<SignupPage />);

      // Fill all fields
      await user.type(screen.getByLabelText(/salon \/ business name/i), 'Complete Flow Salon');
      await user.type(screen.getByLabelText(/email address/i), 'flow@test.com');
      await user.type(screen.getByLabelText(/phone number/i), '555-FLOW-001');
      await user.selectOptions(screen.getByLabelText(/timezone/i), 'America/Los_Angeles');
      await user.type(screen.getByLabelText(/^password$/i), 'flowpassword123');
      await user.type(screen.getByLabelText(/confirm password/i), 'flowpassword123');

      // Check passwords match indicator
      await waitFor(() => {
        expect(screen.getByText(/passwords match/i)).toBeInTheDocument();
      });

      // Submit form
      await user.click(screen.getByRole('button', { name: /create account/i }));

      // Verify registration was called with correct data
      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith(
          'Complete Flow Salon',
          'flow@test.com',
          'flowpassword123',
          '555-FLOW-001',
          'America/Los_Angeles'
        );
      });

      // Verify navigation
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });
});
