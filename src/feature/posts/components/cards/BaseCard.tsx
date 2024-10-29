// src/features/posts/components/cards/BaseCard.tsx
import React from 'react';
import { Card, CardHeader, CardActions, IconButton, Avatar, Tooltip } from '@mui/material';
import { Edit, Delete, Public, Lock, People } from '@mui/icons-material';
import { BaseCardProps } from '../factory/types';
import { Visibility } from '../../api/types';

interface EnhancedBaseCardProps extends BaseCardProps {
  children: React.ReactNode;
  metadata?: Record<string, any>;
  visibility: Visibility;
  username: [firstName: string, lastName: string];
  userAvatar?: string;
}

const visibilityIcons = {
  public: <Public fontSize="small" />,
  private: <Lock fontSize="small" />,
  connections: <People fontSize="small" />
};

export const BaseCard: React.FC<EnhancedBaseCardProps> = ({
  id,
  authorId,
  username,
  userAvatar,
  createdAt,
  updatedAt,
  visibility,
  metadata,
  onDelete,
  onEdit,
  children
}) => {
  const isEdited = metadata?.edited || false;
  const formattedDate = new Date(createdAt).toLocaleString();
  const editedDate = isEdited ? new Date(metadata?.lastEditedAt || updatedAt).toLocaleString() : null;

  return (
    <Card className="mb-4 shadow-md">
      <CardHeader
        avatar={
          <Avatar src={userAvatar} alt={`${username[0]} ${username[1]}`}>
            {username[0][0]}
          </Avatar>
        }
        action={
          <CardActions>
            <Tooltip title={`Visibility: ${visibility}`}>
              <IconButton size="small">
                {visibilityIcons[visibility]}
              </IconButton>
            </Tooltip>
            {onEdit && (
              <IconButton onClick={() => onEdit(id)} size="small">
                <Edit />
              </IconButton>
            )}
            {onDelete && (
              <IconButton onClick={() => onDelete(id)} size="small">
                <Delete />
              </IconButton>
            )}
          </CardActions>
        }
        title={`${username[0]} ${username[1]}`}
        subheader={
          <div className="text-sm text-gray-500">
            <div>{formattedDate}</div>
            {isEdited && (
              <div className="text-xs italic">
                Edited {editedDate}
              </div>
            )}
          </div>
        }
      />
      {children}
    </Card>
  );
};