import { useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { Container, Card, Button } from '../styles/GlobalStyles';

const ProfileContainer = styled.div`
  min-height: 100vh;
  padding: 80px 0 40px;
  background: ${props => props.theme.colors.background};
`;

const ProfileHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const Avatar = styled.div`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${props => props.theme.colors.gradientPrimary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 3rem;
  font-weight: 700;
  margin: 0 auto 20px;
`;

const UserName = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: 8px;
`;

const UserEmail = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 1.1rem;
`;

const TabsContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
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

const ProfilePage = ({ tab = 'profile' }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(tab);

  const getInitials = (user) => {
    if (!user) return 'U';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || user.username?.charAt(0).toUpperCase() || 'U';
  };

  const renderTabContent = () => {
    switch (activeTab) {
    case 'watchlist':
      return (
        <Card>
          <h3>Мой список</h3>
          <p>Список просмотра в разработке</p>
        </Card>
      );
    case 'favorites':
      return (
        <Card>
          <h3>Избранное</h3>
          <p>Избранные аниме в разработке</p>
        </Card>
      );
    case 'settings':
      return (
        <Card>
          <h3>Настройки</h3>
          <p>Настройки профиля в разработке</p>
        </Card>
      );
    default:
      return (
        <Card>
          <h3>Информация о профиле</h3>
          <p><strong>Имя:</strong> {user?.firstName} {user?.lastName}</p>
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Имя пользователя:</strong> {user?.username}</p>
          <p><strong>Роль:</strong> {user?.role}</p>
        </Card>
      );
    }
  };

  return (
    <ProfileContainer>
      <Container>
        <ProfileHeader>
          <Avatar>{getInitials(user)}</Avatar>
          <UserName>{user?.firstName} {user?.lastName}</UserName>
          <UserEmail>{user?.email}</UserEmail>
        </ProfileHeader>

        <TabsContainer>
          <Tab
            active={activeTab === 'profile'}
            onClick={() => setActiveTab('profile')}
          >
            Профиль
          </Tab>
          <Tab
            active={activeTab === 'watchlist'}
            onClick={() => setActiveTab('watchlist')}
          >
            Мой список
          </Tab>
          <Tab
            active={activeTab === 'favorites'}
            onClick={() => setActiveTab('favorites')}
          >
            Избранное
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
    </ProfileContainer>
  );
};

export default ProfilePage;
