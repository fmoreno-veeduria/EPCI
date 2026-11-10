import React, { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

interface RouterContextType {
  pathname: string;
  search: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextType>({
  pathname: window.location.pathname,
  search: window.location.search,
  navigate: () => {}
});

export function useRouter() {
  return useContext(RouterContext);
}

export function useNavigate() {
  const { navigate } = useContext(RouterContext);
  return navigate;
}

export function useLocation() {
  const { pathname, search } = useContext(RouterContext);
  return { pathname, search };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [loc, setLoc] = useState(() => ({
    pathname: window.location.pathname,
    search: window.location.search
  }));

  const navigate = useCallback((to: string) => {
    const url = new URL(to, window.location.origin);
    if (url.pathname !== window.location.pathname || url.search !== window.location.search) {
      window.history.pushState(null, '', to);
      setLoc({ pathname: url.pathname, search: url.search });
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    const onPop = () => {
      setLoc({
        pathname: window.location.pathname,
        search: window.location.search
      });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Intercept internal link clicks for smooth SPA transitions
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;
      const href = target.getAttribute('href');
      if (
        href &&
        (href.startsWith('/') || href.startsWith('./')) &&
        !target.getAttribute('download') &&
        target.getAttribute('target') !== '_blank'
      ) {
        e.preventDefault();
        navigate(href);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [navigate]);

  return (
    <RouterContext.Provider value={{ pathname: loc.pathname, search: loc.search, navigate }}>
      {children}
    </RouterContext.Provider>
  );
}
