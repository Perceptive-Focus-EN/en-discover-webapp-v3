// src/pages/consultation.tsx
import React, { useState, useCallback } from 'react';
import {
  Container, Typography, List, ListItem, ListItemText, Card,
  CardContent, Grid, Button, Box, Chip, Avatar
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, StaticDatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import { format, addDays } from 'date-fns';
import { styled } from '@mui/material/styles';
import { getPlaceholderImage } from '@/components/Resources/imagePlaceholders';

// Interfaces
interface Therapist {
  id: number;
  name: string;
  specialty: string;
  availability: {
    days: string[];
    slots: TimeSlot[];
  };
  image?: string;
  rating?: number;
  experience?: string;
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

interface Appointment {
  therapistId: number;
  date: Date;
  slot: TimeSlot;
}

// Sample data
const timeSlots: TimeSlot[] = [
  { start: '09:00', end: '10:00', available: true },
  { start: '10:00', end: '11:00', available: true },
  { start: '11:00', end: '12:00', available: true },
  { start: '14:00', end: '15:00', available: true },
  { start: '15:00', end: '16:00', available: true },
  { start: '16:00', end: '17:00', available: true },
];

const therapists: Therapist[] = [
  {
    id: 1,
    name: 'Dr. John Doe',
    specialty: 'Psychologist',
    availability: {
      days: ['Monday', 'Wednesday', 'Friday'],
      slots: timeSlots
    },
        // image: '/api/placeholder/100/100',
    image: getPlaceholderImage('avatar'),
    rating: 4.8,
    experience: '15 years'
  },
  {
    id: 2,
    name: 'Dr. Jane Smith',
    specialty: 'Psychiatrist',
    availability: {
      days: ['Tuesday', 'Thursday'],
      slots: timeSlots
    },
      // image: '/api/placeholder/100/100',
    image: getPlaceholderImage('avatar'),
    rating: 4.9,
    experience: '12 years'
  }
];

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[4],
  },
}));

const TimeSlotButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(0.5),
  minWidth: '120px',
}));

const ConsultationPage: React.FC = () => {
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(dayjs());

  const handleSelectTherapist = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    setSelectedSlot(null);
  };

const handleDateChange = (date: dayjs.Dayjs | null) => {
  setSelectedDate(date);
  setSelectedSlot(null);
};
    
  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot);
  };

  const handleBookAppointment = useCallback(() => {
    if (!selectedTherapist || !selectedDate || !selectedSlot) return;

    const newAppointment: Appointment = {
      therapistId: selectedTherapist.id,
      date: selectedDate.toDate(),
      slot: selectedSlot,
    };

    setAppointments(prev => [...prev, newAppointment]);
    alert('Appointment booked successfully!');
    
    // Reset selections
    setSelectedSlot(null);
  }, [selectedTherapist, selectedDate, selectedSlot]);

    
const isDateAvailable = (date: dayjs.Dayjs) => {
  if (!selectedTherapist) return false;
  const dayName = date.format('dddd'); // 'dddd' gets the full weekday name in dayjs
  return selectedTherapist.availability.days.includes(dayName);
};

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" gutterBottom>
        Book a Consultation
      </Typography>

      <Grid container spacing={3}>
        {/* Therapist Selection */}
        <Grid item xs={12} md={4}>
          <StyledCard>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                Choose a Therapist
              </Typography>
              <List>
                {therapists.map((therapist) => (
                  <ListItem
                    button
                    key={therapist.id}
                    selected={selectedTherapist?.id === therapist.id}
                    onClick={() => handleSelectTherapist(therapist)}
                  >
                    <Avatar src={therapist.image} sx={{ mr: 2 }} />
                    <ListItemText
                      primary={therapist.name}
                      secondary={
                        <Box>
                          <Typography variant="body2">{therapist.specialty}</Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip size="small" label={`${therapist.rating}★`} sx={{ mr: 1 }} />
                            <Chip size="small" label={therapist.experience} />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Calendar */}
        {selectedTherapist && (
          <Grid item xs={12} md={4}>
            <StyledCard>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Select Date
                </Typography>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <StaticDatePicker
                    displayStaticWrapperAs="desktop"
                    value={selectedDate}
                    onChange={handleDateChange}
                    shouldDisableDate={(date) => !isDateAvailable(date)}
                    minDate={dayjs()}
                    maxDate={dayjs(addDays(new Date(), 30))}
                  />
                </LocalizationProvider>
              </CardContent>
            </StyledCard>
          </Grid>
        )}

        {/* Time Slots */}
        {selectedTherapist && selectedDate && (
          <Grid item xs={12} md={4}>
            <StyledCard>
              <CardContent>
                <Typography variant="h5" gutterBottom>
                  Available Time Slots
                </Typography>
                <Box display="flex" flexWrap="wrap" justifyContent="center">
                  {selectedTherapist.availability.slots.map((slot, index) => (
                    <TimeSlotButton
                      key={index}
                      variant={selectedSlot === slot ? "contained" : "outlined"}
                      onClick={() => handleSelectSlot(slot)}
                      disabled={!slot.available}
                    >
                      {slot.start} - {slot.end}
                    </TimeSlotButton>
                  ))}
                </Box>
                <Box mt={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleBookAppointment}
                    disabled={!selectedSlot}
                  >
                    Book Appointment
                  </Button>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default ConsultationPage;
