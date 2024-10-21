import React, { useContext, useEffect } from 'react';
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
    FormHelperText
} from '@mui/material';
import { ThemeModeContext } from '../../pages/_app';
import { useSettings } from '../../contexts/SettingsContext';
import { useTheme } from '@mui/material/styles';

interface StyleSettingsProps {
    settings: StyleSettingsType | undefined;
    onUpdate: (newSettings: StyleSettingsType) => void;
}

const fontSizes = [12, 14, 16, 18, 20, 22, 24];
const fonts = ["Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana"];
const colorSchemes = ["Default", "Dark", "Light", "Blue", "Green"];

const StyleSettings: React.FC<StyleSettingsProps> = ({ settings, onUpdate }) => {
    const updateCustomTheme = (newTheme: any) => {
        // Custom logic to update the theme
        // This function should handle the new theme object correctly
        console.log('Updating custom theme:', newTheme);
    };

    const updateThemeObject = (newTheme: any) => {
        // Logic to update the theme object
        console.log('Updating theme object:', newTheme);
    };
    const { updateTheme } = useSettings();
    const { mode, toggleThemeMode } = useContext(ThemeModeContext);
    const theme = useTheme();

    useEffect(() => {
        if (settings && settings.theme !== mode) {
            onUpdate({ ...settings, theme: mode });
        }
    }, [mode, settings, onUpdate]);

    if (!settings) return null;

    const handleSelectChange = (event: SelectChangeEvent) => {
        const { name, value } = event.target;
        onUpdate({ ...settings, [name]: value });

        if (name === 'theme') {
            if (value === 'light' || value === 'dark' || value === 'system') {
                updateTheme(value);
            }
            if (value === 'light' || value === 'dark') {
                toggleThemeMode();
            }
        }

        // Update the theme with new font or fontSize
        if (name === 'font' || name === 'fontSize') {
            const newTheme = {
                ...theme,
                typography: {
                    ...theme.typography,
                    fontFamily: name === 'font' ? value : theme.typography.fontFamily,
                    fontSize: name === 'fontSize' ? Number(value) : theme.typography.fontSize,
                },
            };
            updateCustomTheme(newTheme);
            updateThemeObject(newTheme);
        }
    };

    const handleInputChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        onUpdate({ ...settings, [name]: value });

        if (name === 'theme') {
            if (value === 'light' || value === 'dark' || value === 'system') {
                await updateTheme(value);
            }
            if (value === 'light' || value === 'dark') {
                toggleThemeMode();
            }
        }

        // Update the theme with new font or fontSize
        if (name === 'font' || name === 'fontSize') {
            const newTheme = {
                ...theme,
                typography: {
                    ...theme.typography,
                    fontFamily: name === 'font' ? value : theme.typography.fontFamily,
                    fontSize: name === 'fontSize' ? Number(value) : theme.typography.fontSize,
                },
            };
            updateCustomTheme(newTheme);
            await updateThemeObject(newTheme);
        }
    };

    return (
        <div>
            <Typography variant="h6" gutterBottom>Style Preferences</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel id="theme-label">Theme</InputLabel>
                        <Select
                            labelId="theme-label"
                            value={mode}
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
                    <TextField
                        fullWidth
                        label="Language"
                        name="language"
                        value={settings.language}
                        onChange={handleInputChange}
                        helperText="Enter your preferred language"
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel id="font-label">Font</InputLabel>
                        <Select
                            labelId="font-label"
                            value={settings.font}
                            onChange={handleSelectChange}
                            name="font"
                        >
                            {fonts.map((font) => (
                                <MenuItem key={font} value={font}>{font}</MenuItem>
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
                            value={settings.fontSize.toString()}
                            onChange={handleSelectChange}
                            name="fontSize"
                        >
                            {fontSizes.map((size) => (
                                <MenuItem key={size} value={size}>{size}</MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>Select your preferred font size</FormHelperText>
                    </FormControl>
                </Grid>
                <Grid item xs={12}>
                    <FormControl fullWidth>
                        <InputLabel id="color-scheme-label">Color Scheme</InputLabel>
                        <Select
                            labelId="color-scheme-label"
                            value={settings.colorScheme}
                            onChange={handleSelectChange}
                            name="colorScheme"
                        >
                            {colorSchemes.map((scheme) => (
                                <MenuItem key={scheme} value={scheme}>{scheme}</MenuItem>
                            ))}
                        </Select>
                        <FormHelperText>Select your preferred color scheme</FormHelperText>
                    </FormControl>
                </Grid>
            </Grid>
        </div>
    );
};

export default StyleSettings;