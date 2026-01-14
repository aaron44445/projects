import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/login/page';
import { mockLogin, mockAuthContext } from './setup';

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
  usePathname: () => '/login',
  useSearchParams: () => new URLSearchParams(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    mockPush.mockReset();
  });

  describe('Rendering', () => {
    it('should render the login form', () => {
      render(<LoginPage />);

      expect(screen.getByText('Welcome back')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your Peacase account')).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });

    it('should render social login buttons', () => {
      render(<LoginPage />);

      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('Apple')).toBeInTheDocument();
    });

    it('should render forgot password link', () => {
      render(<LoginPage />);

      expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    });

    it('should render signup link', () => {
      render(<LoginPage />);

      expect(screen.getByText(/do not have an account/i)).toBeInTheDocument();
      expect(screen.getByText(/start your free trial/i)).toBeInTheDocument();
    });

    it('should render Peacase logo', () => {
      render(<LoginPage />);

      expect(screen.getByText('Peacase')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should require email field', async () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('required');
    });

    it('should require password field', async () => {
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('required');
    });

    it('should have email type on email input', () => {
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      expect(emailInput).toHaveAttribute('type', 'email');
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute('type', 'password');

      // Find and click the toggle button
      const toggleButtons = screen.getAllByRole('button');
      const toggleButton = toggleButtons.find(
        (btn) => btn.querySelector('[data-testid="icon-eye"]') || btn.querySelector('[data-testid="icon-eye-off"]')
      );

      if (toggleButton) {
        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'text');

        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute('type', 'password');
      }
    });
  });

  describe('Form Submission', () => {
    it('should call login function with form data', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(undefined);

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();

      // Create a promise that doesn't resolve immediately
      let resolveLogin: () => void;
      mockLogin.mockImplementation(() => new Promise((resolve) => {
        resolveLogin = resolve;
      }));

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Check for loading state
      await waitFor(() => {
        expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      });

      // Resolve the login promise
      resolveLogin!();
    });

    it('should navigate to dashboard on successful login', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue(undefined);

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });

    it('should display error message on login failure', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValue(new Error('Invalid email or password'));

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });

    it('should display generic error for unknown errors', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValue('Some unknown error');

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });
    });

    it('should disable submit button during loading', async () => {
      const user = userEvent.setup();

      mockLogin.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<LoginPage />);

      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /signing in/i });
        expect(submitButton).toBeDisabled();
      });
    });
  });

  describe('Input Handling', () => {
    it('should update email state on input', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const emailInput = screen.getByLabelText(/email address/i);
      await user.type(emailInput, 'newemail@test.com');

      expect(emailInput).toHaveValue('newemail@test.com');
    });

    it('should update password state on input', async () => {
      const user = userEvent.setup();
      render(<LoginPage />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'newpassword123');

      expect(passwordInput).toHaveValue('newpassword123');
    });

    it('should clear error on new submission attempt', async () => {
      const user = userEvent.setup();
      mockLogin.mockRejectedValueOnce(new Error('First error'));
      mockLogin.mockResolvedValueOnce(undefined);

      render(<LoginPage />);

      // First attempt - should fail
      await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        expect(screen.getByText(/first error/i)).toBeInTheDocument();
      });

      // Second attempt - modify password
      await user.clear(screen.getByLabelText(/password/i));
      await user.type(screen.getByLabelText(/password/i), 'correctpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Error should be cleared during second attempt
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible form labels', () => {
      render(<LoginPage />);

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should have proper link texts', () => {
      render(<LoginPage />);

      expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /start your free trial/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to home/i })).toBeInTheDocument();
    });

    it('should have proper button role for submit', () => {
      render(<LoginPage />);

      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });
});
