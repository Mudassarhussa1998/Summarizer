import React, { useState } from "react";
import { registerUser } from "../api/auth";

// Styled components using CSS-in-JS
const FormContainer = ({ children, onSubmit }: { children: React.ReactNode; onSubmit: (e: React.FormEvent) => void }) => (
  <form onSubmit={onSubmit} style={formStyles}>
    {children}
  </form>
);

const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input {...props} style={inputStyles} />
);

const StyledButton = ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button {...props} style={buttonStyles}>
    {children}
  </button>
);

// CSS styles as objects
const formStyles: React.CSSProperties = {
  maxWidth: '400px',
  margin: '2rem auto',
  padding: '2rem',
  background: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  fontFamily: 'Arial, sans-serif',
};

const inputStyles: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  marginBottom: '1rem',
  border: '2px solid #e1e5e9',
  borderRadius: '6px',
  fontSize: '16px',
  boxSizing: 'border-box',
  transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
};

const buttonStyles: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontSize: '16px',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'background-color 0.3s ease, transform 0.2s ease',
};

// Enhanced component with form validation states
interface FormData {
  name: string;
  email: string;
  password: string;
  photo: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  photo?: string;
}

const RegisterForm: React.FC = () => {
  const [form, setForm] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    photo: ""
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors({ ...errors, [name]: undefined });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!form.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = "Email is invalid";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    } else if (form.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
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
      const result = await registerUser(form);
      console.log("Success:", result);
      alert("Registered successfully!");
      // Reset form
      setForm({ name: "", email: "", password: "", photo: "" });
    } catch (error: any) {
      console.error("Error:", error.response?.data || error.message);
      alert("Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getInputStyle = (fieldName: keyof FormErrors): React.CSSProperties => ({
    ...inputStyles,
    borderColor: errors[fieldName] ? '#dc3545' : '#e1e5e9',
    boxShadow: errors[fieldName] ? '0 0 0 3px rgba(220, 53, 69, 0.1)' : undefined,
  });

  const getButtonStyle = (): React.CSSProperties => ({
    ...buttonStyles,
    backgroundColor: isLoading ? '#6c757d' : '#007bff',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.7 : 1,
  });

  return (
    <div>
      <FormContainer onSubmit={handleSubmit}>
        <div>
          <input
            name="name"
            type="text"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            style={getInputStyle('name')}
            disabled={isLoading}
          />
          {errors.name && <div style={errorMessageStyle}>{errors.name}</div>}
        </div>

        <div>
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            style={getInputStyle('email')}
            disabled={isLoading}
          />
          {errors.email && <div style={errorMessageStyle}>{errors.email}</div>}
        </div>

        <div>
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            style={getInputStyle('password')}
            disabled={isLoading}
          />
          {errors.password && <div style={errorMessageStyle}>{errors.password}</div>}
        </div>

        <div>
          <input
            name="photo"
            type="url"
            placeholder="Photo URL (optional)"
            value={form.photo}
            onChange={handleChange}
            style={getInputStyle('photo')}
            disabled={isLoading}
          />
          {errors.photo && <div style={errorMessageStyle}>{errors.photo}</div>}
        </div>

        <button
          type="submit"
          style={getButtonStyle()}
          disabled={isLoading}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </FormContainer>
    </div>
  );
};

const errorMessageStyle: React.CSSProperties = {
  color: '#dc3545',
  fontSize: '14px',
  marginTop: '-0.5rem',
  marginBottom: '1rem',
  paddingLeft: '4px',
};

export default RegisterForm;