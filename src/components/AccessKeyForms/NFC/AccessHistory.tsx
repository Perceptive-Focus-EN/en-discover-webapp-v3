import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Chip, TableContainer, Paper, Typography, useMediaQuery, Theme } from '@mui/material';
import { styled } from '@mui/material/styles';

interface AccessAttempt {
    timestamp: string;
    nfcId: string;
    name: string;
    accessGranted: boolean;
}

interface AccessHistoryProps {
    accessHistory: AccessAttempt[];
}

const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:nth-of-type(odd)': {
        backgroundColor: theme.palette.action.hover,
    },
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

const AccessHistory: React.FC<AccessHistoryProps> = ({ accessHistory }) => {
    const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));

    return (
        <TableContainer component={Paper} sx={{ maxHeight: 500, overflow: 'auto' }}>
            <Table stickyHeader aria-label="access history table">
                <TableHead>
                    <TableRow>
                        <TableCell>
                            <Typography variant={isMobile ? "body2" : "body1"}>Time</Typography>
                        </TableCell>
                        <TableCell>
                            <Typography variant={isMobile ? "body2" : "body1"}>Date</Typography>
                        </TableCell>
                        <TableCell>
                            <Typography variant={isMobile ? "body2" : "body1"}>Name</Typography>
                        </TableCell>
                        <TableCell>
                            <Typography variant={isMobile ? "body2" : "body1"}>NFC ID</Typography>
                        </TableCell>
                        <TableCell align="center">
                            <Typography variant={isMobile ? "body2" : "body1"}>Access</Typography>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {accessHistory.map((attempt, index) => (
                        <StyledTableRow key={index}>
                            <TableCell>
                                <Typography variant={isMobile ? "caption" : "body2"}>{new Date(attempt.timestamp).toLocaleTimeString()}</Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant={isMobile ? "caption" : "body2"}>{new Date(attempt.timestamp).toLocaleDateString()}</Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant={isMobile ? "caption" : "body2"}>{attempt.name}</Typography>
                            </TableCell>
                            <TableCell>
                                <Typography variant={isMobile ? "caption" : "body2"}>{attempt.nfcId}</Typography>
                            </TableCell>
                            <TableCell align="center">
                                <Chip 
                                    label={attempt.accessGranted ? 'Granted' : 'Denied'}
                                    color={attempt.accessGranted ? 'success' : 'error'}
                                    size="small"
                                />
                            </TableCell>
                        </StyledTableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default AccessHistory;
