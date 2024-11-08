import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Box,
  useMediaQuery,
  useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { ChartType } from '../types';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

interface ChartWidget {
  type: ChartType;
  name: string;
  image: string;
  price: number;
  category: 'Basic' | 'Advanced' | 'Custom';
}

const chartWidgets: ChartWidget[] = [
  { type: 'line', name: 'Line Chart', image: '/Line Charts/Multiple Spline Chart.png', price: 0, category: 'Basic' },
  { type: 'bar', name: 'Bar Chart', image: '/Column Charts/Multiple Column Chart.png', price: 0, category: 'Basic' },
  { type: 'pie', name: 'Pie Chart', image: '/Donut Charts/Pie Chart.png', price: 0, category: 'Basic' },
  { type: 'bubble', name: 'Bubble Chart', image: '/Bubble Charts/Bubble Chart.png', price: 0, category: 'Basic' },
  { type: 'funnel', name: 'Funnel Chart', image: '/Area Charts/Funnel Chart.png', price: 0, category: 'Advanced' },
  { type: 'waterfall', name: 'Waterfall Chart', image: '/Waterfall Chart.png', price: 0, category: 'Advanced' },
  { type: 'radar', name: 'Radar Chart', image: '/Polar Charts/Polar Chart Octagon.png', price: 0, category: 'Custom' },
  { type: 'map', name: 'Map Chart', image: '/World Map Chart/Map Chart.png', price: 0, category: 'Custom' },
  { type: 'treemap', name: 'Treemap Chart', image: '/Treemap Charts/Treemap Chart.png', price: 0, category: 'Custom' },
  { type: 'scatter', name: 'Scatter Chart', image: '/Bubble Charts/Scatter Chart.png', price: 0, category: 'Custom' },
  { type: 'area', name: 'Area Chart', image: '/Area Charts/Area Chart.png', price: 0, category: 'Custom' },
  { type: 'composed', name: 'Composed Chart', image: '/Composed Charts/Composed Chart.png', price: 0, category: 'Custom' },
  { type: 'stackedBar', name: 'Stacked Bar Chart', image: '/Column Charts/Stacked Column Chart.png', price: 0, category: 'Custom' },
  { type: 'multiLine', name: 'Multi Line Chart', image: '/Line Charts/Multiple Line Chart.png', price: 0, category: 'Custom' },
  { type: 'ohlc', name: 'OHLC Chart', image: '/OHLC Charts/OHLC Chart.png', price: 0, category: 'Custom' },
  { type: 'candlestick', name: 'Candlestick Chart', image: '/Candlestick Charts/Candlestick Chart.png', price: 0, category: 'Custom' },
  { type: 'heatmap', name: 'Heatmap Chart', image: '/Heatmap Charts/Heatmap Chart.png', price: 0, category: 'Custom' },
  { type: 'cluster', name: 'Cluster Chart', image: '/Cluster Charts/Cluster Chart.png', price: 0, category: 'Custom' },
  { type: 'highlight', name: 'Highlight Chart', image: '/Highlight Charts/Highlight Chart.png', price: 0, category: 'Custom' },
  { type: 'forecast', name: 'Forecast Chart', image: '/Forecast Charts/Forecast Chart.png', price: 0, category: 'Custom' },
  { type: 'trend', name: 'Trend Chart', image: '/Line Charts/TrendlineChart.png', price: 0, category: 'Custom' },
];

interface ChartLibraryDialogProps {
  open: boolean;
  onClose: () => void;
  onChartSelect: (type: ChartType) => void;
  purchasedCharts: ChartType[];
  onPurchase: (newlyPurchasedCharts: ChartType[]) => void;
  availableCharts: ChartType[];
}

const ChartLibraryDialog: React.FC<ChartLibraryDialogProps> = ({
  open,
  onClose,
  onChartSelect,
  purchasedCharts,
  onPurchase,
  availableCharts,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<'All' | 'Basic' | 'Advanced' | 'Custom'>('All');
  const [cart, setCart] = useState<ChartWidget[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  useEffect(() => {
    if (!open) {
      setSearchTerm('');
      setCategory('All');
    }
  }, [open]);

  const filteredCharts = chartWidgets.filter(
    (chart) =>
      chart.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (category === 'All' || chart.category === category)
  );
  
  const handleChartSelect = (chart: ChartWidget) => {
    if (chart.price === 0 || purchasedCharts.includes(chart.type)) {
      onChartSelect(chart.type);
    } else {
      setCart((prevCart) => [...prevCart, chart]);
    }
  };

  const handleRemoveFromCart = (chart: ChartWidget) => {
    setCart(cart.filter((item) => item.type !== chart.type));
  };

  const handleCheckout = async () => {
    const stripe = await stripePromise;

    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: cart.map((item) => ({
          name: item.name,
          price: item.price,
        })),
      }),
    });

    if (!response.ok) {
      console.error('Failed to create checkout session');
      return;
    }

    const { id: sessionId } = await response.json();

    const result = await stripe?.redirectToCheckout({ sessionId });

    if (result?.error) {
      console.error(result.error.message);
    } else {
      const newlyPurchasedCharts = cart.map((item) => item.type);
      onPurchase(newlyPurchasedCharts);
      setCart([]);
      onClose();
    }
  };

  const getCardSize = () => {
    if (isMobile) return 12;
    if (isTablet) return 6;
    return 4;
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price, 0).toFixed(2);
  };

  return (
<Dialog
  open={open}
  onClose={onClose}
  maxWidth={isMobile ? 'md' : 'lg'}
  fullWidth
  sx={{ p: isMobile ? 2 : 4 }}
>
  <DialogTitle
    sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      p: isMobile ? 1 : 2,
    }}
  >
    <Typography variant={isMobile ? 'h6' : 'h5'}>Chart Store</Typography>
    <IconButton onClick={onClose} size="small">
      {/* <CloseIcon /> */}
    </IconButton>
  </DialogTitle>
  <DialogContent sx={{ px: 3, py: isMobile ? 1 : 2 }}>
    <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
      <TextField
        variant="outlined"
        placeholder="Search charts..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
          sx: {
            borderRadius: '8px',
            height: isMobile ? 40 : 48,
          },
        }}
        sx={{ flexGrow: 1 }}
      />
      <Box sx={{ display: 'flex', gap: 2 }}>
        {['All', 'Basic', 'Advanced', 'Custom'].map((cat) => (
          <Chip
            key={cat}
            label={cat}
            onClick={() => setCategory(cat as any)}
            color={category === cat ? 'primary' : 'default'}
            variant={category === cat ? 'filled' : 'outlined'}
            sx={{
              borderRadius: '16px',
              fontWeight: '500',
              padding: isMobile ? '4px 8px' : '8px 16px',
            }}
          />
        ))}
      </Box>
    </Box>
    <Grid container spacing={isMobile ? 1 : 2}>
      {filteredCharts.length > 0 ? (
        filteredCharts.map((chart) => (
          <Grid item xs={getCardSize()} key={chart.type}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                borderRadius: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)',
                },
              }}
            >
              <CardMedia
                component="img"
                image={chart.image}
                alt={chart.name}
                sx={{
                  width: isMobile ? '100%' : '50%',
                  objectFit: 'cover',
                  borderTopLeftRadius: '16px',
                  borderBottomLeftRadius: '16px',
                }}
              />
              <CardContent
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: 2,
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Box>
                  <Typography variant="h6" component="div" sx={{ fontWeight: '600' }}>
                    {chart.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {chart.category}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {chart.price > 0 && !purchasedCharts.includes(chart.type) ? (
                    <Button
                      variant="text"
                      color="primary"
                      onClick={() => handleChartSelect(chart)}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 'bold',
                        fontSize: '1.2em',
                      }}
                    >
                      ${chart.price.toFixed(2)}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleChartSelect(chart)}
                      sx={{
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 'bold',
                        fontSize: isMobile ? '0.9em' : '1em',
                      }}
                      size="small"
                    >
                      {purchasedCharts.includes(chart.type) ? 'Select' : 'Purchase'}
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))
      ) : (
        <Grid item xs={12}>
          <Typography variant="h6" align="center">
            No charts found. Try adjusting your search or filters.
          </Typography>
        </Grid>
      )}
    </Grid>
  </DialogContent>
  <DialogActions
    sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 2, p: 3 }}
  >
    {cart.length > 0 && (
      <>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Typography variant="subtitle1" sx={{ fontWeight: '500' }}>
            Cart ({cart.length} items)
          </Typography>
          <Typography variant="h6" sx={{ mt: 2 }}>
            Total: ${getTotalPrice()}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {cart.map((item) => (
            <Chip
              key={item.type}
              label={`${item.name} ($${item.price.toFixed(2)})`}
              onDelete={() => handleRemoveFromCart(item)}
              size="small"
              sx={{
                borderRadius: '16px',
                fontWeight: '500',
              }}
            />
          ))}
        </Box>
      </>
    )}
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, width: '100%' }}>
      <Button
        onClick={onClose}
        color="inherit"
        sx={{ textTransform: 'none', fontWeight: '500' }}
      >
        Close
      </Button>
      {cart.length > 0 && (
        <Button
          variant="contained"
          color="primary"
          // startIcon={<ShoppingCart/>}
          onClick={handleCheckout}
          sx={{
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 'bold',
          }}
        >
          Checkout
        </Button>
      )}
    </Box>
  </DialogActions>
</Dialog>

  );
};

export default ChartLibraryDialog;
