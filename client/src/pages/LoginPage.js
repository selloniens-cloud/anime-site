import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Container, Card, Button, Input, LoadingSpinner } from '../styles/GlobalStyles';

const LoginContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.gradientPrimary};
  padding: 20px;
`;

const LoginCard = styled(Card)`
  width: 100%;
  max-width: 400px;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: ${props => props.theme.colors.text};
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 32px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  text-align: left;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: ${props => props.theme.colors.text};
`;

const ErrorMessage = styled.span`
  color: ${props => props.theme.colors.error};
  font-size: 0.875rem;
  margin-top: 4px;
  display: block;
`;

const ForgotPassword = styled(Link)`
  color: ${props => props.theme.colors.primary};
  font-size: 0.875rem;
  text-decoration: none;
  
  &:hover {
    text-decoration: underline;
  }
`;

const Divider = styled.div`
  margin: 24px 0;
  text-align: center;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: ${props => props.theme.colors.border};
  }
  
  span {
    background: ${props => props.theme.colors.surface};
    padding: 0 16px;
    color: ${props => props.theme.colors.textSecondary};
    font-size: 0.875rem;
  }
`;

const SignupLink = styled.p`
  margin-top: 24px;
  color: ${props => props.theme.colors.textSecondary};
  
  a {
    color: ${props => props.theme.colors.primary};
    font-weight: 500;
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const result = await login(data);

      if (result.success) {
        toast.success('Добро пожаловать!');
        navigate(from, { replace: true });
      } else {
        toast.error(result.error || 'Ошибка входа');
      }
    } catch (error) {
      toast.error('Произошла ошибка. Попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginContainer>
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <LoginCard>
            <Title>Вход в аккаунт</Title>
            <Subtitle>Добро пожаловать обратно!</Subtitle>

            <Form onSubmit={handleSubmit(onSubmit)}>
              <FormGroup>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Введите ваш email"
                  {...register('email', {
                    required: 'Email обязателен',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Некорректный email адрес',
                    },
                  })}
                />
                {errors.email && (
                  <ErrorMessage>{errors.email.message}</ErrorMessage>
                )}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Введите ваш пароль"
                  {...register('password', {
                    required: 'Пароль обязателен',
                    minLength: {
                      value: 6,
                      message: 'Пароль должен содержать минимум 6 символов',
                    },
                  })}
                />
                {errors.password && (
                  <ErrorMessage>{errors.password.message}</ErrorMessage>
                )}
              </FormGroup>

              <div style={{ textAlign: 'right' }}>
                <ForgotPassword to="/forgot-password">
                  Забыли пароль?
                </ForgotPassword>
              </div>

              <Button type="submit" disabled={isLoading} fullWidth>
                {isLoading ? <LoadingSpinner size="20px" /> : 'Войти'}
              </Button>
            </Form>

            <Divider>
              <span>или</span>
            </Divider>

            <SignupLink>
              Нет аккаунта?{' '}
              <Link to="/register">Зарегистрироваться</Link>
            </SignupLink>
          </LoginCard>
        </motion.div>
      </Container>
    </LoginContainer>
  );
};

export default LoginPage;
