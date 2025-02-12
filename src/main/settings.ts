export type Settings = {
  darkmode: boolean
  paths: PathSettings
}
export type PathSettings = {
  root: string
}

export function initSettings(rootPath: string): Settings {
  let settings: Settings = {
    darkmode: true,
    paths: {
      root: `${rootPath}`
    }
  }

  if (!settings.paths) {
    alert(`Error no relevant Data found in path location; ${rootPath}`)
    return settings
  }

  return settings
}
