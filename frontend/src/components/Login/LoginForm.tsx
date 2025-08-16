import React, { useState } from 'react';
import { useAuth } from '../../contexts';
import { useNavigate } from 'react-router-dom';
import { loginuser } from '../../api/loginuser';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
}

const LoginForm: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginFormData>({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/users');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Clear error when user starts typing
    if (errors[name as keyof LoginErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: LoginErrors = {};

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Call actual API
      const result = await loginuser(form.email, form.password);
      
      // Check if login was successful and we have user data
      if (result.user) {
        // Create token if not provided by API
        const token = result.token || 'jwt-token-' + Date.now();
        
        login(result.user, token);
        alert('Logged in successfully!');
        navigate('/users');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Login failed. Please try again.';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };



  return (
    <div className="auth-page-container">
      <div className="auth-left-section">
        <div className="auth-design">
          <h1 className="auth-brand-title">Welcome Back</h1>
          <p className="auth-brand-subtitle">Sign in to continue to your account</p>
          <div className="auth-decorative-elements">
            <div className="auth-circle auth-circle-1"></div>
            <div className="auth-circle auth-circle-2"></div>
            <div className="auth-circle auth-circle-3"></div>
          </div>
        </div>
      </div>
      <div className="auth-right-section">
        <form onSubmit={handleSubmit} className="auth-form">
          <h2 className="form-title">Login</h2>
        
        <div>
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="form-input"
            disabled={isLoading}
          />
          {errors.email && <div className="form-error">{errors.email}</div>}
        </div>

        <div>
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="form-input"
            disabled={isLoading}
          />
          {errors.password && <div className="form-error">{errors.password}</div>}
        </div>

        <button
          type="submit"
          className="form-button"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>

        <div className="form-link">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/signup')}
            disabled={isLoading}
          >
            Sign up here
          </button>
        </div>
        </form>
      </div>
    </div>
  );
};



export default LoginForm;