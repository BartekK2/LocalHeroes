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
  Tooltip,
  Chip // <--- Dodano import Chip
} from "@mui/material";
import axios from "axios"; // <--- Dodano import axios do pobierania punktów

// Ikonki
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from '@mui/icons-material/Home';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import MapIcon from '@mui/icons-material/Map';
import LoyaltyIcon from '@mui/icons-material/Loyalty'; // <--- Ikona do punktów

import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useContext, useEffect } from "react"; // <--- Dodano useEffect
import { AuthContext } from "../API/AuthContext";

const navLinks = [
  { label: "Strona główna", path: "/", icon: HomeIcon },
  { label: "Mapa", path: "/map", icon: MapIcon },
];

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorElUser, setAnchorElUser] = useState(null);
  const [points, setPoints] = useState(null); // <--- Stan na punkty

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  // --- NOWE: Pobieranie punktów ---
  useEffect(() => {
    const fetchPoints = async () => {
      // Sprawdzamy, czy użytkownik jest zalogowany i czy jest klientem
      // (zakładam, że w user.role masz typ konta, zgodnie z odpowiedzią z /login w server.js)
      if (user && user.role === 'klient') {
        try {
          const token = localStorage.getItem('token'); 
          if (!token) return;

          const response = await axios.get('http://localhost:5000/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (response.data && response.data.punkty_aktualne !== undefined) {
            setPoints(response.data.punkty_aktualne);
          }
        } catch (error) {
          console.error("Błąd pobierania punktów w navbarze:", error);
        }
      }
    };

    fetchPoints();
    
    // Opcjonalnie: Można dodać interwał lub nasłuchiwanie zdarzeń, 
    // aby punkty odświeżały się po zeskanowaniu paragonu bez odświeżania strony.
  }, [user, location.pathname]); // Odświeżamy przy zmianie strony (np. po wyjściu z paragonu)


  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = () => {
    handleCloseUserMenu();
    logout();
    setPoints(null); // Czyścimy punkty
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
          bgcolor: 'background.paper' // Zapewnia tło
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

          {/* RIGHT: Points / Login / Avatar Menu */}
          <Box sx={{ ml: "auto", display: 'flex', alignItems: 'center', gap: 2 }}>
            
            {/* --- WYŚWIETLANIE PUNKTÓW (TYLKO DLA KLIENTA) --- */}
            {user && user.role === 'klient' && points !== null && (
               <Chip
                 icon={<LoyaltyIcon sx={{ "&&": { color: "#b45309" } }} />} // Ciemniejszy złoty dla ikony
                 label={`${points} pkt`}
                 sx={{
                   fontWeight: 700,
                   background: 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%)', // Złoty gradient
                   color: '#78350f', // Ciemny brązowy tekst dla kontrastu
                   border: '1px solid rgba(251, 191, 36, 0.5)',
                   boxShadow: '0 2px 8px rgba(251, 191, 36, 0.4)',
                   height: 32,
                   '& .MuiChip-label': {
                     px: 1.5
                   },
                   display: { xs: 'none', sm: 'flex' } // Ukryj na bardzo małych ekranach w toolbarze
                 }}
               />
            )}

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
                    
                    {/* Punkty w menu mobilnym (jeśli schowane w toolbarze) */}
                    {user.role === 'klient' && points !== null && (
                       <Box sx={{ 
                         display: { xs: 'flex', sm: 'none' }, 
                         alignItems: 'center', 
                         mt: 1,
                         gap: 1,
                         color: '#b45309' 
                       }}>
                         <LoyaltyIcon fontSize="small" />
                         <Typography variant="body2" fontWeight={700}>
                           {points} pkt
                         </Typography>
                       </Box>
                    )}
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
          
          {/* PUNKTY W DRAWERZE (Widoczne od razu w menu mobilnym) */}
          {user && user.role === 'klient' && points !== null && (
            <Box sx={{ m: 2, p: 2, bgcolor: '#fffbeb', borderRadius: '12px', border: '1px solid #fcd34d' }}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 600 }}>
                Twój bilans
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <LoyaltyIcon sx={{ color: '#d97706' }} />
                <Typography variant="h5" fontWeight={700} color="#92400e">
                  {points}
                </Typography>
                <Typography variant="body2" color="#b45309" sx={{ mt: 0.5 }}>
                  pkt
                </Typography>
              </Box>
            </Box>
          )}

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
                  onClick={handleLogout}
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