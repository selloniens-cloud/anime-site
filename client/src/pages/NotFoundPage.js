import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Container, Button } from '../styles/GlobalStyles';

const NotFoundContainer = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.theme.colors.background};
  padding: 20px;
`;

const Content = styled.div`
  text-align: center;
  max-width: 500px;
`;

const ErrorCode = styled.h1`
  font-size: 8rem;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  margin: 0;
  line-height: 1;
  
  @media (max-width: 768px) {
    font-size: 6rem;
  }
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin: 20px 0;
`;

const Description = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 1.1rem;
  margin-bottom: 40px;
  line-height: 1.6;
`;

const Actions = styled.div`
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
`;

const NotFoundPage = () => {
  return (
    <NotFoundContainer>
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Content>
            <ErrorCode>404</ErrorCode>
            <Title>Страница не найдена</Title>
            <Description>
              К сожалению, запрашиваемая страница не существует или была перемещена.
              Возможно, вы перешли по устаревшей ссылке или ввели неверный адрес.
            </Description>
            <Actions>
              <Button as={Link} to="/">
                На главную
              </Button>
              <Button as={Link} to="/catalog" variant="outline">
                Каталог аниме
              </Button>
            </Actions>
          </Content>
        </motion.div>
      </Container>
    </NotFoundContainer>
  );
};

export default NotFoundPage;
