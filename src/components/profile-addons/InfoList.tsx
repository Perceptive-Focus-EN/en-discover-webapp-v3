// src/components/profile-addons/InfoList.tsx

import React from 'react';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
// import { InfoItem } from '../../types/User/interfaces';
import Typography from '@mui/material/Typography';


export interface InfoItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface InfoListProps {
  infoItems: InfoItem[];
}

const InfoList: React.FC<InfoListProps> = ({ infoItems }) => {
  return (
    <List>
      {infoItems.map((item, index) => (
        <ListItem key={index}>
          {item.icon && <ListItemIcon>{item.icon}</ListItemIcon>}
          <ListItemText
            primary={
              <Typography variant="subtitle1" color="textPrimary">
                {item.label}
              </Typography>
            }
            secondary={
              <Typography variant="body2" color="textSecondary">
                {item.value}
              </Typography>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default InfoList;
