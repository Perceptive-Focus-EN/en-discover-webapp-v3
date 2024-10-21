import React, { createContext, useState, useContext } from 'react';
import WebsiteService from '../lib/api_s/website';

// Types
interface Component {
  id: string;
  type: string;
  properties: Record<string, any>;
  children?: Component[];
}

interface Page {
  id: string;
  name: string;
  components: Component[];
}

interface Theme {
  primaryColor: string;
  secondaryColor: string;
  font: string;
}

interface WebsiteDevelopmentContextProps {
  pages: Page[];
  currentPageId: string;
  theme: Theme;
  addPage: (name: string) => void;
  deletePage: (id: string) => void;
  setCurrentPage: (id: string) => void;
  addComponent: (pageId: string, component: Component) => void;
  updateComponent: (pageId: string, componentId: string, updates: Partial<Component>) => void;
  deleteComponent: (pageId: string, componentId: string) => void;
  updateTheme: (updates: Partial<Theme>) => void;
  saveWebsite: () => Promise<void>;
}

const WebsiteDevelopmentContext = createContext<WebsiteDevelopmentContextProps | undefined>(undefined);

export const WebsiteDevelopmentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPageId, setCurrentPageId] = useState<string>('');
  const [theme, setTheme] = useState<Theme>({
    primaryColor: '#1976d2',
    secondaryColor: '#dc004e',
    font: 'Roboto',
  });

  const websiteService = new WebsiteService();

  const addPage = (name: string) => {
    const newPage: Page = { id: Date.now().toString(), name, components: [] };
    setPages([...pages, newPage]);
    if (pages.length === 0) {
      setCurrentPageId(newPage.id);
    }
  };

  const deletePage = (id: string) => {
    setPages(pages.filter(page => page.id !== id));
    if (currentPageId === id) {
      setCurrentPageId(pages[0]?.id || '');
    }
  };

  const setCurrentPage = (id: string) => {
    setCurrentPageId(id);
  };

  const addComponent = (pageId: string, component: Component) => {
    setPages(pages.map(page => 
      page.id === pageId 
        ? { ...page, components: [...page.components, component] }
        : page
    ));
  };

  const updateComponent = (pageId: string, componentId: string, updates: Partial<Component>) => {
    setPages(pages.map(page => 
      page.id === pageId 
        ? {
            ...page,
            components: page.components.map(comp => 
              comp.id === componentId ? { ...comp, ...updates } : comp
            )
          }
        : page
    ));
  };

  const deleteComponent = (pageId: string, componentId: string) => {
    setPages(pages.map(page => 
      page.id === pageId 
        ? { ...page, components: page.components.filter(comp => comp.id !== componentId) }
        : page
    ));
  };

  const updateTheme = (updates: Partial<Theme>) => {
    setTheme({ ...theme, ...updates });
  };

  const saveWebsite = async () => {
    try {
      await websiteService.updateWebsite('current-website-id', {
        layout: pages.map(page => ({
          ...page,
          type: 'page',
          properties: {}
        })),
        theme,
        content: {}, // You might want to add content management later
      });
      console.log('Website saved successfully');
    } catch (error) {
      console.error('Failed to save website:', error);
    }
  };

  return (
    <WebsiteDevelopmentContext.Provider
      value={{
        pages,
        currentPageId,
        theme,
        addPage,
        deletePage,
        setCurrentPage,
        addComponent,
        updateComponent,
        deleteComponent,
        updateTheme,
        saveWebsite,
      }}
    >
      {children}
    </WebsiteDevelopmentContext.Provider>
  );
};

export const useWebsiteDevelopment = () => {
  const context = useContext(WebsiteDevelopmentContext);
  if (context === undefined) {
    throw new Error('useWebsiteDevelopment must be used within a WebsiteDevelopmentProvider');
  }
  return context;
};