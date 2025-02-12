import { createTheme } from '@mui/material/styles'

// https://github.com/rjsf-team/react-jsonschema-form/issues/4466
export function defaultTheme() {
  return createTheme({
    palette: {
      mode: 'dark'
    },
    typography: {
      // In Chinese and Japanese the characters are usually larger,
      // so a smaller fontsize may be appropriate.
      fontSize: 12
    },
    components: {
      MuiGrid2: {
        defaultProps: {
          size: {
            xs: 3,
            xl: 3
          }
        }
      }
    }
  })
}

// TODO fix later to make it configurable via settings
export function setLightOrDarkTheme() {
  return createTheme({
    palette: {
      mode: 'dark'
    },
    typography: {
      // In Chinese and Japanese the characters are usually larger,
      // so a smaller fontsize may be appropriate.
      fontSize: 12
    },
    components: {
      MuiGrid2: {
        defaultProps: {
          size: {
            xs: 3,
            xl: 3
          }
        }
      }
    }
  })
}
