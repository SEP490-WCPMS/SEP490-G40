import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = ({ behavior = 'auto' }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior });
    } catch (e) {
      // fallback for older browsers
      window.scrollTo(0, 0);
    }
  }, [pathname, behavior]);

  return null;
};

export default ScrollToTop;
