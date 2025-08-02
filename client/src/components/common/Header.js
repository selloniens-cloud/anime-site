import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { Container, Button } from '../../styles/GlobalStyles';
import { CompactThemeToggle } from './ThemeToggle';

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: ${props => props.theme.colors.surface};
  backdrop-filter: blur(10px);
  border-bottom: 1px solid ${props => props.theme.colors.border};
  z-index: ${props => props.theme.zIndex.sticky};
  transition: all 0.3s ease;
`;

const HeaderContent = styled(Container)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 32px;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const NavLink = styled(Link)`
  color: ${props => props.theme.colors.text};
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s ease;
  position: relative;
  
  &:hover {
    color: ${props => props.theme.colors.primary};
  }
  
  &.active {
    color: ${props => props.theme.colors.primary};
    
    &::after {
      content: '';
      position: absolute;
      bottom: -8px;
      left: 0;
      right: 0;
      height: 2px;
      background: ${props => props.theme.colors.primary};
      border-radius: 1px;
    }
  }
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const UserMenu = styled.div`
  position: relative;
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.theme.colors.surfaceSecondary};
  }
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.theme.colors.gradientPrimary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 14px;
`;

const DropdownMenu = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: ${props => props.theme.colors.surface};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 8px;
  box-shadow: 0 8px 32px ${props => props.theme.colors.shadow};
  min-width: 200px;
  overflow: hidden;
`;

const DropdownItem = styled(Link)`
  display: block;
  padding: 12px 16px;
  color: ${props => props.theme.colors.text};
  text-decoration: none;
  transition: background-color 0.3s ease;
  
  &:hover {
    background: ${props => props.theme.colors.surfaceSecondary};
  }
`;

const DropdownDivider = styled.div`
  height: 1px;
  background: ${props => props.theme.colors.border};
  margin: 4px 0;
`;

const LogoutButton = styled.button`
  width: 100%;
  padding: 12px 16px;
  text-align: left;
  background: none;
  border: none;
  color: ${props => props.theme.colors.error};
  cursor: pointer;
  transition: background-color 0.3s ease;
  
  &:hover {
    background: ${props => props.theme.colors.surfaceSecondary};
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: none;
  border: none;
  cursor: pointer;
  
  @media (max-width: 768px) {
    display: flex;
  }
  
  span {
    width: 24px;
    height: 2px;
    background: ${props => props.theme.colors.text};
    transition: all 0.3s ease;
    transform-origin: center;
    
    &:nth-child(1) {
      transform: ${props => props.isOpen ? 'rotate(45deg) translate(6px, 6px)' : 'none'};
    }
    
    &:nth-child(2) {
      opacity: ${props => props.isOpen ? '0' : '1'};
    }
    
    &:nth-child(3) {
      transform: ${props => props.isOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'none'};
    }
  }
`;

const MobileMenu = styled(motion.div)`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: ${props => props.theme.colors.surface};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  padding: 20px;
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const MobileNavLink = styled(Link)`
  display: block;
  padding: 12px 0;
  color: ${props => props.theme.colors.text};
  text-decoration: none;
  font-weight: 500;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    color: ${props => props.theme.colors.primary};
  }
`;

const Header = () => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  const getInitials = (user) => {
    if (!user) return 'U';
    return user.username?.charAt(0).toUpperCase() || 'U';
  };

  const getAvatarUrl = (user) => {
    if (!user) return null;

    // Если есть загруженный аватар
    if (user.avatar && !user.avatar.includes('ui-avatars.com')) {
      return user.avatar.startsWith('http') ? user.avatar : `/uploads/avatars/${user.avatar}`;
    }

    // Генерируем аватар из первой буквы никнейма
    const firstLetter = user.username ? user.username.charAt(0).toUpperCase() : 'U';
    const colors = [
      'FF6B6B', '4ECDC4', '45B7D1', '96CEB4', 'FFEAA7',
      'DDA0DD', '98D8C8', 'F7DC6F', 'BB8FCE', '85C1E9',
    ];
    const colorIndex = user.username ? user.username.charCodeAt(0) % colors.length : 0;
    const backgroundColor = colors[colorIndex];

    return `https://ui-avatars.com/api/?name=${firstLetter}&background=${backgroundColor}&color=fff&size=200&bold=true`;
  };

  return (
    <HeaderContainer>
      <HeaderContent>
        <Logo to="/">
          🎌 AnimeHub
        </Logo>

        <Nav>
          <NavLink to="/">Главная</NavLink>
          <NavLink to="/catalog">Каталог</NavLink>
          <NavLink to="/popular">Популярное</NavLink>
          <NavLink to="/latest">Новинки</NavLink>
        </Nav>

        <UserSection>
          <CompactThemeToggle />
          {isAuthenticated ? (
            <UserMenu>
              <UserButton onClick={() => setShowUserMenu(!showUserMenu)}>
                <Avatar>
                  {getAvatarUrl(user) ? (
                    <img
                      src={getAvatarUrl(user)}
                      alt={user?.username || 'User'}
                      style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                    />
                  ) : (
                    getInitials(user)
                  )}
                </Avatar>
                <span>{user?.username || 'Пользователь'}</span>
              </UserButton>

              <AnimatePresence>
                {showUserMenu && (
                  <DropdownMenu
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DropdownItem to="/profile" onClick={() => setShowUserMenu(false)}>
                      Профиль
                    </DropdownItem>
                    <DropdownItem to="/watchlist" onClick={() => setShowUserMenu(false)}>
                      Мой список
                    </DropdownItem>
                    <DropdownItem to="/favorites" onClick={() => setShowUserMenu(false)}>
                      Избранное
                    </DropdownItem>
                    <DropdownItem to="/settings" onClick={() => setShowUserMenu(false)}>
                      Настройки
                    </DropdownItem>
                    {user?.role === 'admin' && (
                      <>
                        <DropdownDivider />
                        <DropdownItem to="/admin" onClick={() => setShowUserMenu(false)}>
                          Админ-панель
                        </DropdownItem>
                      </>
                    )}
                    <DropdownDivider />
                    <LogoutButton onClick={handleLogout}>
                      Выйти
                    </LogoutButton>
                  </DropdownMenu>
                )}
              </AnimatePresence>
            </UserMenu>
          ) : (
            <>
              <Button as={Link} to="/login" variant="outline" size="small">
                Войти
              </Button>
              <Button as={Link} to="/register" size="small">
                Регистрация
              </Button>
            </>
          )}

          <MobileMenuButton
            isOpen={showMobileMenu}
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            <span />
            <span />
            <span />
          </MobileMenuButton>
        </UserSection>
      </HeaderContent>

      <AnimatePresence>
        {showMobileMenu && (
          <MobileMenu
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <MobileNavLink to="/" onClick={() => setShowMobileMenu(false)}>
              Главная
            </MobileNavLink>
            <MobileNavLink to="/catalog" onClick={() => setShowMobileMenu(false)}>
              Каталог
            </MobileNavLink>
            <MobileNavLink to="/popular" onClick={() => setShowMobileMenu(false)}>
              Популярное
            </MobileNavLink>
            <MobileNavLink to="/latest" onClick={() => setShowMobileMenu(false)}>
              Новинки
            </MobileNavLink>
          </MobileMenu>
        )}
      </AnimatePresence>
    </HeaderContainer>
  );
};

export default Header;
