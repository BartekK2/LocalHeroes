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
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import StorefrontIcon from '@mui/icons-material/Storefront';
import SettingsIcon from '@mui/icons-material/Settings'; // Dodatkowa ikonka
import LogoutIcon from '@mui/icons-material/Logout'; // Ikonka wylogowania

import { Link, useNavigate } from "react-router-dom";
import { useState, useContext } from "react";
import { AuthContext } from "../API/AuthContext";

const navLinks = [
  { label: "Strona główna", path: "/", icon: HomeIcon },
  { label: "Mapa", path: "/map", icon: StorefrontIcon }, // Zmieniłem placeholder na mapę
];

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Stan dla menu użytkownika (prawy górny róg)
  const [anchorElUser, setAnchorElUser] = useState(null);

  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Otwieranie/zamykanie menu użytkownika
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

  return (
    <>
      <AppBar position="sticky" sx={{ height: "64px" }}>
        <Toolbar sx={{ position: "relative" }}>
          
          {/* LEWA STRONA: Hamburger + Logo */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ display: { xs: "inline-flex", md: "none" } }}
            >
              <MenuIcon />
            </IconButton>

            <StorefrontIcon />
            <Typography
              variant="h6"
              component={Link}
              to="/"
              sx={{ 
                display: { xs: "none", sm: "block" }, 
                textDecoration: "none", 
                color: "inherit", 
                fontWeight: 600 
              }}
            >
              LocalHeroes
            </Typography>
          </Box>

          {/* ŚRODEK: Linki (tylko desktop) */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              gap: 2,
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
                color="inherit"
              >
                {link.icon && <link.icon sx={{ mr: 1 }} />}
                {link.label}
              </Button>
            ))}
          </Box>

          {/* PRAWA STRONA: Logowanie / Avatar Menu */}
          <Box sx={{ ml: "auto" }}>
            {user ? (
              <Box sx={{ flexGrow: 0 }}>
                {/* Klikalny Avatar z Tooltipem */}
                <Tooltip title="Otwórz ustawienia">
                  <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: "secondary.main",
                        border: "2px solid white", // Ładniejszy border
                        width: 40, 
                        height: 40 
                      }}
                    >
                      {user.username ? user.username[0].toUpperCase() : "U"}
                    </Avatar>
                  </IconButton>
                </Tooltip>

                {/* Rozwijane Menu */}
                <Menu
                  sx={{ mt: '45px' }}
                  id="menu-appbar"
                  anchorEl={anchorElUser}
                  anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                  keepMounted
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  open={Boolean(anchorElUser)}
                  onClose={handleCloseUserMenu}
                >
                  {/* Pozycja: Ustawienia */}
                  <MenuItem component={Link} to="/settings" onClick={handleCloseUserMenu}>
                    <ListItemIcon>
                        <SettingsIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography textAlign="center">Ustawienia</Typography>
                  </MenuItem>

                  <Divider />

                  {/* Pozycja: Wyloguj */}
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                        <LogoutIcon fontSize="small" />
                    </ListItemIcon>
                    <Typography textAlign="center">Wyloguj</Typography>
                  </MenuItem>
                </Menu>
              </Box>
            ) : (
              // Przycisk Zaloguj (dla niezalogowanych)
              <Button 
                variant="outlined" 
                color="inherit" 
                component={Link} 
                to="/login"
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Zaloguj się
              </Button>
            )}
          </Box>

        </Toolbar>
      </AppBar>

      {/* Drawer (Menu boczne na mobilki) */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ "& .MuiDrawer-paper": { width: 250 } }}
      >
        <Box role="presentation" onClick={() => setDrawerOpen(false)}>
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
             <StorefrontIcon color="primary"/>
             <Typography variant="h6" fontWeight={600}>LocalHeroes</Typography>
          </Box>
          <Divider />
          <List>
            {navLinks.map((link) => (
              <ListItemButton key={link.label} component={Link} to={link.path}>
                {link.icon && (
                  <ListItemIcon>
                    <link.icon />
                  </ListItemIcon>
                )}
                <ListItemText primary={link.label} />
              </ListItemButton>
            ))}
            
            {/* Dodatkowe linki w Drawerze jeśli użytkownik jest zalogowany */}
            {user && (
                <>
                <Divider sx={{ my: 1 }} />
                <ListItemButton component={Link} to="/settings">
                    <ListItemIcon><SettingsIcon /></ListItemIcon>
                    <ListItemText primary="Ustawienia konta" />
                </ListItemButton>
                <ListItemButton onClick={logout}>
                    <ListItemIcon><LogoutIcon /></ListItemIcon>
                    <ListItemText primary="Wyloguj się" />
                </ListItemButton>
                </>
            )}
          </List>
        </Box>
      </Drawer>
    </>
  );
}