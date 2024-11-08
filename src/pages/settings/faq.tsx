import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { Box, Typography, IconButton, Container } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ArticleCard from '@/components/FAQ/ArticleCard';

// Keep only these styled components for the main page
const GradientHeader = styled(Box)(({ theme }) => ({
  background: theme.palette.mode === 'light' 
    ? 'linear-gradient(135deg, #997CEF 0%, #6E43EB 100%)'
    : 'linear-gradient(135deg, #B49AF3 0%, #8E6BEF 100%)',
  padding: theme.spacing(8, 2),
  borderRadius: '0 0 2rem 2rem',
  marginBottom: theme.spacing(4),
  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
}));

const EnhancedSearchBar = styled(Box)(({ theme }) => ({
  position: 'relative',
  top: '-30px',
  maxWidth: '800px',
  margin: '0 auto',
  padding: theme.spacing(1.5),
  background: theme.palette.background.paper,
  borderRadius: '2rem',
  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  display: 'flex',
  alignItems: 'center',
  transition: 'all 0.3s ease',
  '&:focus-within': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 30px rgba(110, 67, 235, 0.15)',
  },
}));

const SearchInput = styled('input')(({ theme }) => ({
  border: 'none',
  outline: 'none',
  width: '100%',
  fontSize: '1.1rem',
  background: 'transparent',
  color: theme.palette.text.primary,
  '&::placeholder': {
    color: theme.palette.text.secondary,
  },
}));

const CategoryHeader = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  fontWeight: 700,
}));

const FaqContainer = styled(Container)(({ theme }) => ({
  padding: theme.spacing(4, 0),
}));

const faqData = [
  {
    category: 'Account',
    items: [
      {
        question: 'How do I reset my password?',
        answer: 'To reset your password, go to the login page and click on "Forgot Password". Follow the instructions to reset your password.',
        tags: ['account', 'password', 'reset'],
        article: 'Detailed article about resetting your password...'
      },
      {
        question: 'How do I change my email address?',
        answer: 'To change your email address, go to your account settings and update your email information.',
        tags: ['account', 'email', 'change'],
        article: 'Detailed article about changing your email address...'
      },
    ]
  },
  {
    category: 'Billing',
    items: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept various payment methods including credit cards, PayPal, and bank transfers.',
        tags: ['billing', 'payment', 'methods'],
        article: 'Detailed article about accepted payment methods...'
      },
      {
        question: 'How do I view my invoices?',
        answer: 'To view your invoices, go to your billing section in your account settings.',
        tags: ['billing', 'invoices', 'view'],
        article: 'Detailed article about viewing invoices...'
      },
    ]
  },
  // Add more categories here
];

const FaqPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openItems, setOpenItems] = useState(new Set());
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [filteredFaqs, setFilteredFaqs] = useState(faqData);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const toggleQuestion = (id: string, article: string) => {
    setOpenItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
        setExpandedArticle(null);
      } else {
        newSet.add(id);
        setExpandedArticle(article);
      }
      return newSet;
    });
  };

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) {
      return text;
    }
    const regex = new RegExp(`(${highlight})`, 'gi');
    return text.split(regex).map((part, index) =>
      regex.test(part) ? <mark key={index}>{part}</mark> : part
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  return (
    <Box sx={{ overflow: 'hidden' }}>
      <GradientHeader>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography 
            variant="h2" 
            align="center" 
            sx={{ 
              color: '#FFFFFF',
              fontWeight: 700,
              mb: 4
            }}
          >
            How can we help?
          </Typography>
        </motion.div>
        
        <EnhancedSearchBar>
          <SearchIcon sx={{ mx: 2, color: 'primary.main' }} />
          <SearchInput
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <IconButton 
              onClick={clearSearch}
              sx={{ 
                '&:hover': { 
                  background: 'rgba(110, 67, 235, 0.1)' 
                } 
              }}
            >
              <ClearIcon />
            </IconButton>
          )}
        </EnhancedSearchBar>
      </GradientHeader>

      <FaqContainer>
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
          {filteredFaqs.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <CategoryHeader variant="h4">
                {category.category}
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', fontWeight: 'normal' }}>
                  {category.items.length} articles
                </Typography>
              </CategoryHeader>
              
              <AnimatePresence>
                {category.items.map((item, itemIndex) => {
                  const id = `${categoryIndex}-${itemIndex}`;
                  return (
                    <ArticleCard
                      key={id}
                      id={id}
                      question={item.question}
                      answer={item.answer}
                      article={item.article}
                      tags={item.tags}
                      searchTerm={searchTerm}
                      isOpen={openItems.has(id)}
                      onToggle={toggleQuestion}
                      highlightText={highlightText}
                    />
                  );
                })}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      </FaqContainer>
    </Box>
  );
};

export default FaqPage;