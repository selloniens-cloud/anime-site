import { useState } from 'react';
import styled from 'styled-components';
import { Container, Card, Button } from '../styles/GlobalStyles';

const AdminContainer = styled.div`
  min-height: 100vh;
  padding: 80px 0 40px;
  background: ${props => props.theme.colors.background};
`;

const AdminHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  margin-bottom: 16px;
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 1.1rem;
`;

const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  flex-wrap: wrap;
  gap: 8px;
`;

const Tab = styled.button`
  padding: 12px 24px;
  background: none;
  border: none;
  color: ${props => props.active ? props.theme.colors.primary : props.theme.colors.textSecondary};
  font-weight: ${props => props.active ? '600' : '400'};
  border-bottom: 2px solid ${props => props.active ? props.theme.colors.primary : 'transparent'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const TabContent = styled.div`
  min-height: 400px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
`;

const StatCard = styled(Card)`
  text-align: center;
  padding: 32px 24px;
`;

const StatNumber = styled.div`
  font-size: 3rem;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  margin-bottom: 8px;
`;

const StatLabel = styled.div`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 1.1rem;
`;

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderTabContent = () => {
    switch (activeTab) {
    case 'anime':
      return (
        <Card>
          <h3>Управление аниме</h3>
          <p>Добавление, редактирование и удаление аниме</p>
          <Button style={{ marginTop: '20px' }}>
              Добавить аниме
          </Button>
        </Card>
      );
    case 'users':
      return (
        <Card>
          <h3>Управление пользователями</h3>
          <p>Просмотр и управление пользователями</p>
        </Card>
      );
    case 'comments':
      return (
        <Card>
          <h3>Модерация комментариев</h3>
          <p>Управление комментариями пользователей</p>
        </Card>
      );
    case 'settings':
      return (
        <Card>
          <h3>Настройки системы</h3>
          <p>Общие настройки сайта</p>
        </Card>
      );
    default:
      return (
        <>
          <StatsGrid>
            <StatCard>
              <StatNumber>0</StatNumber>
              <StatLabel>Всего аниме</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>0</StatNumber>
              <StatLabel>Пользователей</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>0</StatNumber>
              <StatLabel>Комментариев</StatLabel>
            </StatCard>
            <StatCard>
              <StatNumber>0</StatNumber>
              <StatLabel>Просмотров</StatLabel>
            </StatCard>
          </StatsGrid>
          <Card>
            <h3>Панель администратора</h3>
            <p>Добро пожаловать в админ-панель! Здесь вы можете управлять всем контентом сайта.</p>
          </Card>
        </>
      );
    }
  };

  return (
    <AdminContainer>
      <Container>
        <AdminHeader>
          <Title>Админ-панель</Title>
          <Subtitle>Управление аниме-сайтом</Subtitle>
        </AdminHeader>

        <TabsContainer>
          <Tab
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          >
            Дашборд
          </Tab>
          <Tab
            active={activeTab === 'anime'}
            onClick={() => setActiveTab('anime')}
          >
            Аниме
          </Tab>
          <Tab
            active={activeTab === 'users'}
            onClick={() => setActiveTab('users')}
          >
            Пользователи
          </Tab>
          <Tab
            active={activeTab === 'comments'}
            onClick={() => setActiveTab('comments')}
          >
            Комментарии
          </Tab>
          <Tab
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          >
            Настройки
          </Tab>
        </TabsContainer>

        <TabContent>
          {renderTabContent()}
        </TabContent>
      </Container>
    </AdminContainer>
  );
};

export default AdminPage;
