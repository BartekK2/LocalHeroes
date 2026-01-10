import { Button, Typography, Box, Chip } from "@mui/material";
import './Home.css';
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../API/AuthContext";
import AnimatedHeroSvg from "../../components/AnimatedSvg";
import MapIcon from '@mui/icons-material/Map';
import StarIcon from '@mui/icons-material/Star';
import GroupsIcon from '@mui/icons-material/Groups';
import StorefrontIcon from '@mui/icons-material/Storefront';

function Home() {
  const { user } = useContext(AuthContext);

  return (
    <div className="home-container">
      {/* Background decorative elements */}
      <div className="home-bg-decoration">
        <div className="bg-blob bg-blob-1"></div>
        <div className="bg-blob bg-blob-2"></div>
        <div className="bg-blob bg-blob-3"></div>
      </div>

      <div className="home-content">
        <div className="home-left">
          {/* Badge */}
          <Chip
            icon={<StarIcon />}
            label="Odkryj lokalne biznesy"
            color="primary"
            variant="outlined"
            className="home-badge animate-fade-in-up"
            sx={{ mb: 2, fontWeight: 600 }}
          />

          {/* Main heading with gradient */}
          <Typography variant="h2" component="h1" className="home-title animate-fade-in-up delay-100">
            Witaj{user && ' z powrotem'} w{' '}
            <span className="gradient-text">LocalHeroes</span>
          </Typography>

          <Typography variant="h6" className="home-subtitle animate-fade-in-up delay-200">
            {user ?
              'Przejdź do mapy i odkryj niesamowite lokalne biznesy w Twojej okolicy. Zbieraj punkty i korzystaj z ekskluzywnych promocji!'
              :
              'Dołącz do naszej społeczności i wspieraj lokalne firmy. Zaloguj się, aby rozpocząć przygodę z lokalnymi bohaterami!'
            }
          </Typography>

          {/* Feature pills */}
          <Box className="home-features animate-fade-in-up delay-300">
            <Box className="feature-pill">
              <MapIcon className="feature-icon" />
              <span>Interaktywna mapa</span>
            </Box>
            <Box className="feature-pill">
              <StorefrontIcon className="feature-icon" />
              <span>Lokalne sklepy</span>
            </Box>
            <Box className="feature-pill">
              <GroupsIcon className="feature-icon" />
              <span>Społeczność</span>
            </Box>
          </Box>

          {/* CTA Buttons */}
          {user ?
            <div className="home-buttons animate-fade-in-up delay-400">
              <Button
                variant="contained"
                color="primary"
                size="large"
                component={Link}
                to="/map"
                startIcon={<MapIcon />}
                className="home-btn-primary"
              >
                Odkryj mapę
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                size="large"
                component={Link}
                to="/settings"
              >
                Mój profil
              </Button>
            </div>
            :
            <div className="home-buttons animate-fade-in-up delay-400">
              <Button
                variant="contained"
                color="primary"
                size="large"
                component={Link}
                to="/login?action=login"
                className="home-btn-primary"
              >
                Zaloguj się
              </Button>
              <Button
                color="secondary"
                variant="outlined"
                size="large"
                component={Link}
                to="/login?action=registration"
              >
                Zarejestruj się
              </Button>
            </div>
          }

          {/* Stats section */}
          <Box className="home-stats animate-fade-in-up delay-500">
            <Box className="stat-item">
              <Typography variant="h4" className="stat-number gradient-text">150+</Typography>
              <Typography variant="body2" color="text.secondary">Lokalnych biznesów</Typography>
            </Box>
            <Box className="stat-divider"></Box>
            <Box className="stat-item">
              <Typography variant="h4" className="stat-number gradient-text">2k+</Typography>
              <Typography variant="body2" color="text.secondary">Aktywnych użytkowników</Typography>
            </Box>
            <Box className="stat-divider"></Box>
            <Box className="stat-item">
              <Typography variant="h4" className="stat-number gradient-text">500+</Typography>
              <Typography variant="body2" color="text.secondary">Promocji</Typography>
            </Box>
          </Box>
        </div>

        <div className="home-right animate-fade-in delay-300">
          <div className="hero-svg-wrapper">
            <AnimatedHeroSvg className="home-hero-svg" width={480} height={480} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
