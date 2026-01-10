import { Button, Typography } from "@mui/material";
import { motion } from "framer-motion";
import './Home.css';
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../../API/AuthContext";
import { FloatingShapes } from "../../components/AnimatedSvg";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 80, damping: 12 }
  }
};

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 }
  },
  hover: {
    scale: 1.03,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  },
  tap: { scale: 0.97 }
};

const featureVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1 + 0.4,
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }),
  hover: {
    y: -4,
    boxShadow: "0 8px 25px rgba(99, 102, 241, 0.15)",
    transition: { type: "spring", stiffness: 300, damping: 15 }
  }
};

const illustrationVariants = {
  hidden: { opacity: 0, scale: 0.8, rotate: -5 },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 60,
      damping: 12,
      delay: 0.3
    }
  }
};

function Home() {
  const { user } = useContext(AuthContext);

  return (
    <div className="home-container">
      {/* Animowane tło SVG */}
      <FloatingShapes />

      <motion.div
        className="home-left"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants}>
          <Typography variant="h3" component="h1" className="home-title">
            Witaj {user && 'z powrotem'} na naszej stronie!
          </Typography>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Typography variant="h6" className="home-subtitle">
            {user
              ? 'Przejdź do lokalnych biznesów!'
              : 'Zaloguj się, aby rozpocząć, lub zarejestruj nowe konto'
            }
          </Typography>
        </motion.div>

        {user ? (
          <motion.div className="home-buttons" variants={itemVariants}>
            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Button
                variant="contained"
                color="primary"
                size="large"
                component={Link}
                to="/map"
                className="animated-button"
              >
                Odkryj mapę
              </Button>
            </motion.div>
            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Button
                variant="outlined"
                color="primary"
                size="large"
                component={Link}
                to="/settings"
                className="animated-button"
              >
                Mój profil
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div className="home-buttons" variants={itemVariants}>
            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Button
                variant="contained"
                color="secondary"
                sx={{ color: "white" }}
                size="large"
                component={Link}
                to="/login?action=login"
                className="animated-button"
              >
                Zaloguj się
              </Button>
            </motion.div>
            <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
              <Button
                color="secondary"
                variant="outlined"
                size="large"
                component={Link}
                to="/login?action=registration"
                className="animated-button"
              >
                Zarejestruj się
              </Button>
            </motion.div>
          </motion.div>
        )}

        {/* Animowane ikony funkcji */}
        <motion.div className="home-features" variants={containerVariants}>
          {[
            { icon: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z", text: "Lokalne biznesy" },
            { icon: "M20 6h-2.18c.11-.31.18-.65.18-1 0-1.66-1.34-3-3-3-1.05 0-1.96.54-2.5 1.35l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 11 8.76l1-1.36 1 1.36L15.38 12 17 10.83 14.92 8H20v6z", text: "Nagrody i kupony" },
            { icon: "M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z", text: "Opinie i oceny" }
          ].map((feature, i) => (
            <motion.div
              key={i}
              className="home-feature feature-animated"
              custom={i}
              variants={featureVariants}
              whileHover="hover"
            >
              <div className="home-feature-icon">
                <svg className="feature-icon-svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                  <path d={feature.icon} />
                </svg>
              </div>
              <span className="home-feature-text">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      <motion.div
        className="home-right"
        variants={illustrationVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Animowana ilustracja */}
        <div className="hero-illustration">
          <svg className="hero-svg" viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            {/* Tło */}
            <defs>
              <linearGradient id="heroGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#818cf8" stopOpacity="0.1" />
              </linearGradient>
              <linearGradient id="heroGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {/* Główne kółko */}
            <motion.circle
              cx="200" cy="200" r="150"
              fill="url(#heroGrad1)"
              className="hero-circle-bg"
              animate={{ r: [150, 155, 150] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Budynek 1 */}
            <motion.g
              className="hero-building"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <rect x="120" y="180" width="60" height="100" rx="4" fill="#6366f1" />
              <rect x="130" y="195" width="15" height="15" rx="2" fill="white" fillOpacity="0.3" />
              <rect x="155" y="195" width="15" height="15" rx="2" fill="white" fillOpacity="0.3" />
              <rect x="130" y="220" width="15" height="15" rx="2" fill="white" fillOpacity="0.3" />
              <rect x="155" y="220" width="15" height="15" rx="2" fill="white" fillOpacity="0.3" />
              <rect x="130" y="245" width="15" height="15" rx="2" fill="white" fillOpacity="0.3" />
              <rect x="155" y="245" width="15" height="15" rx="2" fill="white" fillOpacity="0.3" />
            </motion.g>

            {/* Budynek 2 */}
            <motion.g
              className="hero-building"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <rect x="190" y="150" width="70" height="130" rx="4" fill="#818cf8" />
              <rect x="200" y="165" width="18" height="18" rx="2" fill="white" fillOpacity="0.3" />
              <rect x="232" y="165" width="18" height="18" rx="2" fill="white" fillOpacity="0.3" />
              <rect x="200" y="195" width="18" height="18" rx="2" fill="white" fillOpacity="0.3" />
              <rect x="232" y="195" width="18" height="18" rx="2" fill="white" fillOpacity="0.3" />
              <rect x="200" y="225" width="18" height="18" rx="2" fill="white" fillOpacity="0.3" />
              <rect x="232" y="225" width="18" height="18" rx="2" fill="white" fillOpacity="0.3" />
              <rect x="200" y="255" width="18" height="18" rx="2" fill="white" fillOpacity="0.3" />
              <rect x="232" y="255" width="18" height="18" rx="2" fill="white" fillOpacity="0.3" />
            </motion.g>

            {/* Budynek 3 */}
            <motion.g
              className="hero-building"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.5 }}
            >
              <rect x="270" y="200" width="50" height="80" rx="4" fill="#a5b4fc" />
              <rect x="280" y="215" width="12" height="12" rx="2" fill="white" fillOpacity="0.3" />
              <rect x="298" y="215" width="12" height="12" rx="2" fill="white" fillOpacity="0.3" />
              <rect x="280" y="240" width="12" height="12" rx="2" fill="white" fillOpacity="0.3" />
              <rect x="298" y="240" width="12" height="12" rx="2" fill="white" fillOpacity="0.3" />
              <rect x="280" y="265" width="12" height="12" rx="2" fill="white" fillOpacity="0.3" />
              <rect x="298" y="265" width="12" height="12" rx="2" fill="white" fillOpacity="0.3" />
            </motion.g>

            {/* Marker lokalizacji */}
            <motion.g
              className="hero-marker"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ellipse cx="225" cy="130" rx="20" ry="8" fill="#6366f1" fillOpacity="0.2" />
              <path
                d="M225 80 c-15 0 -27 12 -27 27 c0 20 27 35 27 35 s27-15 27-35 c0-15 -12-27 -27-27 z"
                fill="url(#heroGrad2)"
              />
              <circle cx="225" cy="100" r="10" fill="white" />
            </motion.g>

            {/* Gwiazdki */}
            <motion.polygon
              points="100,100 103,108 112,108 105,113 108,122 100,117 92,122 95,113 88,108 97,108"
              fill="#f59e0b"
              fillOpacity="0.8"
              animate={{ opacity: [0.8, 0.4, 0.8], rotate: [0, 360] }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "100px 111px" }}
            />
            <motion.polygon
              points="320,80 322,86 329,86 324,90 326,97 320,93 314,97 316,90 311,86 318,86"
              fill="#f59e0b"
              fillOpacity="0.6"
              animate={{ opacity: [0.6, 0.3, 0.6], rotate: [0, -360] }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "320px 88px" }}
            />
          </svg>
        </div>
      </motion.div>
    </div>
  );
}

export default Home;
