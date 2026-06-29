import { Theme } from "@mui/material/styles";

// ----------------------------------------------------------------------

export default function AppBar(_theme: Theme) {
	return {
		MuiAppBar: {
			defaultProps: {
				color: "transparent",
			},

			styleOverrides: {
				root: {
					boxShadow: "none",
				},
			},
		},
	};
}
