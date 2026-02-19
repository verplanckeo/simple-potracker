import type { JSX } from "react";
import { useMsal } from "@azure/msal-react";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import MicrosoftIcon from "@mui/icons-material/Microsoft";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { loginRequest } from "../authConfig";

export function Login(): JSX.Element {
  const { instance } = useMsal();

  function handleLogin(): void {
    void instance.loginRedirect(loginRequest);
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
      }}
    >
      <Paper elevation={3} sx={{ p: 6, maxWidth: 400, width: "100%", textAlign: "center" }}>
        <Stack spacing={3} alignItems="center">
          <ReceiptLongIcon sx={{ fontSize: 48, color: "primary.main" }} />
          <Typography variant="h5" fontWeight="bold">
            PO Tracker
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to access your purchase orders
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<MicrosoftIcon />}
            onClick={handleLogin}
            fullWidth
          >
            Sign in with Microsoft
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
