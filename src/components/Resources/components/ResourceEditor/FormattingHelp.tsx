// src/components/Resources/components/ResourceEditor/FormattingHelp.tsx
import React from 'react';
import {
  DialogTitle,
  DialogContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Box,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';

const ExampleCell = styled(TableCell)(({ theme }) => ({
  fontFamily: 'monospace',
  backgroundColor: theme.palette.grey[50]
}));

const ResultCell = styled(TableCell)(({ theme }) => ({
  '& code': {
    backgroundColor: theme.palette.grey[100],
    padding: theme.spacing(0.5, 1),
    borderRadius: 4
  },
  '& blockquote': {
    borderLeft: `4px solid ${theme.palette.primary.main}`,
    margin: theme.spacing(1, 0),
    padding: theme.spacing(0.5, 2),
    backgroundColor: theme.palette.primary.light,
    color: theme.palette.primary.dark
  }
}));

export const FormattingHelp: React.FC = () => {
  return (
    <>
      <DialogTitle>
        Markdown Formatting Guide
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1" paragraph>
          This editor uses Markdown syntax for formatting. Here's a quick guide:
        </Typography>

        <Paper variant="outlined" sx={{ mb: 3 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Element</TableCell>
                <TableCell>You Type</TableCell>
                <TableCell>You Get</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Headers</TableCell>
                <ExampleCell>
                  # Header 1<br/>
                  ## Header 2<br/>
                  ### Header 3
                </ExampleCell>
                <ResultCell>
                  <h1 style={{ margin: 0 }}>Header 1</h1>
                  <h2 style={{ margin: 0 }}>Header 2</h2>
                  <h3 style={{ margin: 0 }}>Header 3</h3>
                </ResultCell>
              </TableRow>
              <TableRow>
                <TableCell>Emphasis</TableCell>
                <ExampleCell>
                  **bold**<br/>
                  _italic_
                </ExampleCell>
                <ResultCell>
                  <strong>bold</strong><br/>
                  <em>italic</em>
                </ResultCell>
              </TableRow>
              <TableRow>
                <TableCell>Lists</TableCell>
                <ExampleCell>
                  - Item 1<br/>
                  - Item 2<br/>
                  &nbsp;&nbsp;- Subitem 2.1
                </ExampleCell>
                <ResultCell>
                  <ul style={{ margin: 0 }}>
                    <li>Item 1</li>
                    <li>Item 2
                      <ul>
                        <li>Subitem 2.1</li>
                      </ul>
                    </li>
                  </ul>
                </ResultCell>
              </TableRow>
              <TableRow>
                <TableCell>Links</TableCell>
                <ExampleCell>
                  [Link Text](https://example.com)
                </ExampleCell>
                <ResultCell>
                  <a href="#">Link Text</a>
                </ResultCell>
              </TableRow>
              <TableRow>
                <TableCell>Quotes</TableCell>
                <ExampleCell>
                  {'>'} This is a quote
                </ExampleCell>
                <ResultCell>
                  <blockquote>This is a quote</blockquote>
                </ResultCell>
              </TableRow>
              <TableRow>
                <TableCell>Code</TableCell>
                <ExampleCell>
                  `inline code`<br/>
                  ```<br/>
                  code block<br/>
                  ```
                </ExampleCell>
                <ResultCell>
                  <code>inline code</code>
                  <br/>
                  <pre style={{ margin: '4px 0' }}>
                    <code>code block</code>
                  </pre>
                </ResultCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>

        <Typography variant="h6" gutterBottom>
          Keyboard Shortcuts
        </Typography>
        <Paper variant="outlined">
          <Table>
            <TableBody>
              <TableRow>
                <TableCell>Bold</TableCell>
                <TableCell>Ctrl/⌘ + B</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Italic</TableCell>
                <TableCell>Ctrl/⌘ + I</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Save</TableCell>
                <TableCell>Ctrl/⌘ + S</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Preview</TableCell>
                <TableCell>Ctrl/⌘ + P</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Paper>
      </DialogContent>
    </>
  );
};