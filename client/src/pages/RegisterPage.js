import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { Container, Card, Button, Input, LoadingSpinner } from '../styles/GlobalStyles';

const RegisterContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.gradientSecondary};
  padding: 20px;
`;

const RegisterCard = styled(Card)`
  width: 100%;
  max-width: 450px;
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

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
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

const CheckboxGroup = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
`;

const Checkbox = styled.input`
  margin-top: 4px;
`;

const CheckboxLabel = styled.label`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.textSecondary};
  line-height: 1.4;
  
  a {
    color: ${props => props.theme.colors.primary};
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
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

const LoginLink = styled.p`
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

const RegisterPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const { confirmPassword, terms, ...userData } = data;
      const result = await registerUser(userData);

      if (result.success) {
        toast.success('Регистрация успешна! Добро пожаловать!');
        navigate('/');
      } else {
        toast.error(result.error || 'Ошибка регистрации');
      }
    } catch (error) {
      toast.error('Произошла ошибка. Попробуйте снова.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <RegisterContainer>
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <RegisterCard>
            <Title>Создать аккаунт</Title>
            <Subtitle>Присоединяйтесь к сообществу любителей аниме!</Subtitle>

            <Form onSubmit={handleSubmit(onSubmit)}>
              <FormRow>
                <FormGroup>
                  <Label htmlFor="firstName">Имя</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="Ваше имя"
                    {...register('firstName', {
                      required: 'Имя обязательно',
                      minLength: {
                        value: 2,
                        message: 'Имя должно содержать минимум 2 символа',
                      },
                    })}
                  />
                  {errors.firstName && (
                    <ErrorMessage>{errors.firstName.message}</ErrorMessage>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="lastName">Фамилия</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Ваша фамилия"
                    {...register('lastName', {
                      required: 'Фамилия обязательна',
                      minLength: {
                        value: 2,
                        message: 'Фамилия должна содержать минимум 2 символа',
                      },
                    })}
                  />
                  {errors.lastName && (
                    <ErrorMessage>{errors.lastName.message}</ErrorMessage>
                  )}
                </FormGroup>
              </FormRow>

              <FormGroup>
                <Label htmlFor="username">Имя пользователя</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Уникальное имя пользователя"
                  {...register('username', {
                    required: 'Имя пользователя обязательно',
                    minLength: {
                      value: 3,
                      message: 'Имя пользователя должно содержать минимум 3 символа',
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: 'Только буквы, цифры и подчеркивания',
                    },
                  })}
                />
                {errors.username && (
                  <ErrorMessage>{errors.username.message}</ErrorMessage>
                )}
              </FormGroup>

              <FormGroup>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Ваш email адрес"
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

              <FormRow>
                <FormGroup>
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Создайте пароль"
                    {...register('password', {
                      required: 'Пароль обязателен',
                      minLength: {
                        value: 6,
                        message: 'Пароль должен содержать минимум 6 символов',
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                        message: 'Пароль должен содержать строчные, заглавные буквы и цифры',
                      },
                    })}
                  />
                  {errors.password && (
                    <ErrorMessage>{errors.password.message}</ErrorMessage>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="confirmPassword">Подтвердите пароль</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Повторите пароль"
                    {...register('confirmPassword', {
                      required: 'Подтверждение пароля обязательно',
                      validate: (value) =>
                        value === password || 'Пароли не совпадают',
                    })}
                  />
                  {errors.confirmPassword && (
                    <ErrorMessage>{errors.confirmPassword.message}</ErrorMessage>
                  )}
                </FormGroup>
              </FormRow>

              <CheckboxGroup>
                <Checkbox
                  id="terms"
                  type="checkbox"
                  {...register('terms', {
                    required: 'Необходимо согласиться с условиями',
                  })}
                />
                <CheckboxLabel htmlFor="terms">
                  Я согласен с{' '}
                  <Link to="/terms">Условиями использования</Link> и{' '}
                  <Link to="/privacy">Политикой конфиденциальности</Link>
                </CheckboxLabel>
              </CheckboxGroup>
              {errors.terms && (
                <ErrorMessage>{errors.terms.message}</ErrorMessage>
              )}

              <Button type="submit" disabled={isLoading} fullWidth>
                {isLoading ? <LoadingSpinner size="20px" /> : 'Создать аккаунт'}
              </Button>
            </Form>

            <Divider>
              <span>или</span>
            </Divider>

            <LoginLink>
              Уже есть аккаунт?{' '}
              <Link to="/login">Войти</Link>
            </LoginLink>
          </RegisterCard>
        </motion.div>
      </Container>
    </RegisterContainer>
  );
};

export default RegisterPage;
