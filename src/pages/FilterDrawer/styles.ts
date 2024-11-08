// src/components/Resources/components/FilterDrawer/styles.ts
import { createTheme } from '@mui/material/styles';
const theme = createTheme();

export const FilterStyles = {
  drawer: {
    width: 320,
    maxWidth: '100%'
  },
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  header: {
    px: 2,
    py: 1.5,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeButton: {
    ml: 1
  },
  content: {
    flex: 1,
    overflowY: 'auto'
  },
  section: {
    p: 2
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 1,
    mt: 1
  },
  footer: {
    p: 2,
    display: 'flex',
    borderTop: 1,
    borderColor: 'divider'
  },
   activeFilters: {
    padding: theme.spacing(2),
    textAlign: 'center',

  },

} as const;