import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Button,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Avatar,
  Divider,
  ListItemIcon,
  Menu,
  MenuItem,
  Tooltip
} from "@mui/material";

// Ikonki
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from '@mui/icons-material/Home';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import MapIcon from '@mui/icons-material/Map';

import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useContext } from "react";
import { AuthContext } from "../API/AuthContext";

const navLinks = [
  { label: "Strona główna", path: "/", icon: HomeIcon },
  { label: "Mapa", path: "/map", icon: MapIcon },
];

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          height: "64px",
          borderBottom: '1px solid rgba(99, 102, 241, 0.08)',
        }}
      >
        <Toolbar sx={{ position: "relative", height: "100%" }}>

          {/* LEFT: Hamburger + Logo */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <IconButton
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{
                display: { xs: "inline-flex", md: "none" },
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                }
              }}
            >
              <MenuIcon />
            </IconButton>

            <Box
              component={Link}
              to="/"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                textDecoration: "none",
                transition: 'transform 0.2s ease',
                '&:hover': {
                  transform: 'scale(1.02)',
                }
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                }}
              >
                <StorefrontIcon sx={{ color: 'white', fontSize: 20 }} />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  display: { xs: "none", sm: "block" },
                  color: "text.primary",
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  background: 'linear-gradient(135deg, #1e293b 0%, #6366f1 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                LocalHeroes
              </Typography>
            </Box>
          </Box>

          {/* CENTER: Nav Links (desktop) */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              gap: 0.5,
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)"
            }}
          >
            {navLinks.map((link) => (
              <Button
                key={link.label}
                component={Link}
                to={link.path}
                sx={{
                  color: isActive(link.path) ? 'primary.main' : 'text.secondary',
                  fontWeight: isActive(link.path) ? 600 : 500,
                  px: 2,
                  py: 1,
                  borderRadius: '10px',
                  backgroundColor: isActive(link.path) ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    color: 'primary.main',
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                {link.icon && <link.icon sx={{ mr: 0.75, fontSize: 20 }} />}
                {link.label}
              </Button>
            ))}
          </Box>

          {/* RIGHT: Login / Avatar Menu */}
          <Box sx={{ ml: "auto" }}>
            {user ? (
              <Box sx={{ flexGrow: 0 }}>
                <Tooltip title="Menu użytkownika" arrow>
                  <IconButton
                    onClick={handleOpenUserMenu}
                    sx={{
                      p: 0.5,
                      transition: 'transform 0.2s ease',
                      '&:hover': {
                        transform: 'scale(1.05)',
                      }
                    }}
                  >
                    <Avatar
                      sx={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                        width: 40,
                        height: 40,
                        fontWeight: 700,
                        fontSize: '1rem',
                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                      }}
                    >
                      {user.username ? user.username[0].toUpperCase() : "U"}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                <Menu
                  sx={{ mt: '50px' }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                  keepMounted
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                  PaperProps={{
                    sx: {
                      minWidth: 200,
                    }
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5, mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Zalogowano jako
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {user.username}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 0.5 }} />

                  <MenuItem
                    component={Link}
                    to="/settings"
                    onClick={handleCloseUserMenu}
                  >
                    <ListItemIcon>
                      <SettingsIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </ListItemIcon>
                    <Typography>Ustawienia</Typography>
                  </MenuItem>

                  <MenuItem
                    onClick={handleLogout}
                    sx={{
                      color: 'error.main',
                      '&:hover': {
                        backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      }
                    }}
                  >
                    <ListItemIcon>
                      <LogoutIcon fontSize="small" sx={{ color: 'error.main' }} />
                    </ListItemIcon>
                    <Typography>Wyloguj</Typography>
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              <Button
                variant="contained"
                component={Link}
                to="/login"
                sx={{
                  px: 3,
                  py: 1,
                  fontWeight: 600,
                }}
              >
                Zaloguj się
              </Button>
            )}
          </Box>

        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
          }
        }}
      >
        <Box role="presentation" onClick={() => setDrawerOpen(false)}>
          <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              }}
            >
              <StorefrontIcon sx={{ color: 'white', fontSize: 22 }} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #1e293b 0%, #6366f1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              LocalHeroes
            </Typography>
          </Box>

          <Divider sx={{ borderColor: 'rgba(99, 102, 241, 0.1)' }} />

          <List sx={{ px: 1.5, py: 1 }}>
            {navLinks.map((link) => (
              <ListItemButton
                key={link.label}
                component={Link}
                to={link.path}
                selected={isActive(link.path)}
                sx={{
                  borderRadius: '12px',
                  mb: 0.5,
                  '&.Mui-selected': {
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  }
                }}
              >
                {link.icon && (
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <link.icon sx={{ color: isActive(link.path) ? 'primary.main' : 'text.secondary' }} />
                  </ListItemIcon>
                )}
                <ListItemText
                  primary={link.label}
                  primaryTypographyProps={{
                    fontWeight: isActive(link.path) ? 600 : 500,
                    color: isActive(link.path) ? 'primary.main' : 'text.primary',
                  }}
                />
              </ListItemButton>
            ))}

            {user && (
              <>
                <Divider sx={{ my: 1.5, borderColor: 'rgba(99, 102, 241, 0.1)' }} />

                <ListItemButton
                  component={Link}
                  to="/settings"
                  sx={{
                    borderRadius: '12px',
                    mb: 0.5,
                    '&:hover': {
                      backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <SettingsIcon sx={{ color: 'text.secondary' }} />
                  </ListItemIcon>
                  <ListItemText primary="Ustawienia konta" />
                </ListItemButton>

                <ListItemButton
                  onClick={logout}
                  sx={{
                    borderRadius: '12px',
                    color: 'error.main',
                    '&:hover': {
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <LogoutIcon sx={{ color: 'error.main' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Wyloguj się"
                    primaryTypographyProps={{ color: 'error.main' }}
                  />
                </ListItemButton>
              </>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}