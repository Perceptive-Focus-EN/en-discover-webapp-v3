// src/components/Settings/StyleSettings.tsx
import React, { useEffect } from 'react';
import { StyleSettings as StyleSettingsType } from '../../types/Settings/interfaces';
import { 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem, 
    TextField, 
    Typography,
    Grid,
    SelectChangeEvent,
    FormHelperText,
    Box,
    CircularProgress
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import WebFont from 'webfontloader';

interface StyleSettingsProps {
  settings: StyleSettingsType;
  onUpdate: (newSettings: StyleSettingsType) => Promise<void>;
  isLoading?: boolean;
}

const fonts = [
  { name: "Arial", family: "Arial" },
  { name: "Roboto", family: "Roboto" },
  { name: "Open Sans", family: "'Open Sans'" },
  { name: "Lato", family: "Lato" },
  { name: "Montserrat", family: "Montserrat" }
];

const fontSizes = [
  { label: 'Small', value: 14 },
  { label: 'Medium', value: 16 },
  { label: 'Large', value: 18 },
  { label: 'Extra Large', value: 20 }
];

const colorSchemes = ["Default", "Dark", "Light", "Blue", "Green"];

const StyleSettings: React.FC<StyleSettingsProps> = ({
  settings,
  onUpdate,
  isLoading = false
}) => {
    const theme = useTheme();

    // Load custom fonts
    useEffect(() => {
      WebFont.load({
        google: {
          families: ['Roboto', 'Open Sans', 'Lato', 'Montserrat']
        }
      });
    }, []);

    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (!settings) return null;

    const handleSelectChange = async (event: SelectChangeEvent) => {
        const { name, value } = event.target;
        await onUpdate({
            ...settings,
            [name]: value
        });

        // Apply font changes immediately
        if (name === 'font') {
          document.body.style.fontFamily = value;
        }
        if (name === 'fontSize') {
          document.body.style.fontSize = `${value}px`;
        }
    };

    const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        await onUpdate({
            ...settings,
            [name]: value
        });
    };

    return (
        <Box sx={{ maxWidth: 'lg', mx: 'auto', p: 3 }}>
            <Typography variant="h6" gutterBottom>Style Preferences</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel id="theme-label">Theme</InputLabel>
                        <Select
                            labelId="theme-label"
                            value={settings.theme || 'system'}
                            onChange={handleSelectChange}
                            name="theme"
                        >
                            <MenuItem value="light">Light</MenuItem>
                            <MenuItem value="dark">Dark</MenuItem>
                            <MenuItem value="system">System</MenuItem>
                        </Select>
                        <FormHelperText>Select your preferred theme</FormHelperText>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel id="font-label">Font</InputLabel>
                        <Select
                            labelId="font-label"
                            value={settings.font || fonts[0].name}
                            onChange={handleSelectChange}
                            name="font"
                        >
                            {fonts.map((font) => (
                                <MenuItem 
                                    key={font.name} 
                                    value={font.name}
                                    sx={{ fontFamily: font.family }}
                                >
                                    {font.name}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>Select your preferred font</FormHelperText>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel id="font-size-label">Font Size</InputLabel>
                        <Select
                            labelId="font-size-label"
                            value={settings.fontSize?.toString() || fontSizes[1].value.toString()}
                            onChange={handleSelectChange}
                            name="fontSize"
                        >
                            {fontSizes.map((size) => (
                                <MenuItem 
                                    key={size.value} 
                                    value={size.value}
                                    sx={{ fontSize: `${size.value}px` }}
                                >
                                    {size.label} ({size.value}px)
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>Select your preferred font size</FormHelperText>
                    </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Language"
                        name="language"
                        value={settings.language || ''}
                        onChange={handleInputChange}
                        helperText="Enter your preferred language"
                    />
                </Grid>

                <Grid item xs={12}>
                    <FormControl fullWidth>
                        <InputLabel id="color-scheme-label">Color Scheme</InputLabel>
                        <Select
                            labelId="color-scheme-label"
                            value={settings.colorScheme || 'Default'}
                            onChange={handleSelectChange}
                            name="colorScheme"
                        >
                            {colorSchemes.map((scheme) => (
                                <MenuItem key={scheme} value={scheme}>
                                    {scheme}
                                </MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>Select your preferred color scheme</FormHelperText>
                    </FormControl>
                </Grid>
            </Grid>
        </Box>
    );
};

export default StyleSettings;