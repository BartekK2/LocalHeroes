/*
TODO:

poprawić wygląd prawej części tj ikonka uzytkownika
i wyglad przycisku do logoutu na najmniejszych urzadzeniach

*/

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
  ListItemIcon
} from "@mui/material";
// ikonki
// jakbyś chciał jakieś dodać albo zmienić to 
// stąd: https://mui.com/material-ui/material-icons/


import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from '@mui/icons-material/Home';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import StorefrontIcon from '@mui/icons-material/Storefront';

import { Link } from "react-router-dom";
import { useState,useContext } from "react";
import { AuthContext } from "../API/AuthContext";

const navLinks = [
  { label: "Strona główna", path: "/", icon: HomeIcon },
  { label: "Konto", path: "/konto", icon: AccountBoxIcon },
  { label: "Placeholder", path: "/placeholder", icon: StorefrontIcon }
];

export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);

  return (
    <>
      <AppBar position="sticky" sx={{height:"64px"}}>
        <Toolbar sx={{ position: "relative" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {/* Przycisk: widoczny tylko w wersji mobilnej */}
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
              sx={{ display: { xs: "none",sm: "block"}, textDecoration: "none", color: "inherit", fontWeight: 600 }}
            >
              LocalHeroes
            </Typography>
          </Box>

          {/* ŚRODEK: linki dla wersji desktopowej */}
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
                {link.icon&& <link.icon sx={{ mr: 1 }}/>}
                {link.label}
              </Button>
            ))}
          </Box>

          {/* PRAWA STRONA: użytkownik */}
          <Box sx={{ ml: "auto",  display:"flex", alignItems:"center"}}>
          {user?
          <>
            <Avatar sx={{ width: 32, height: 32,mr:1, bgcolor: "secondary.main" }} style={{border:"2px solid black"}}>{user&&user.username[0].toUpperCase()}</Avatar>
          <Button variant="contained" color="secondary" 
          style={{color:"white"}} onClick={logout}>Wyloguj się</Button>
          </>
          :
          <Button variant="contained" color="secondary" sx={{color: "white"}} component={Link} 
                to="/login">
            Zaloguj się
          </Button>
          }
          </Box>
        </Toolbar>
      </AppBar>
      {/* Menu dla mobilnej */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{ "& .MuiDrawer-paper": { width: 250 } }}
      >
        <Box role="presentation" onClick={() => setDrawerOpen(false)}>
          <Typography sx={{ m: 2, fontWeight: 600 }}>Navigation</Typography>
          <Divider />
          <List>
            {navLinks.map((link) => (
              <ListItemButton key={link.label} component={Link} to={link.path} >
                {link.icon && (
                  <ListItemIcon>
                    <link.icon />
                  </ListItemIcon>
                )}
                <ListItemText primary={link.label} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
}

